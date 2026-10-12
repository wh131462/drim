import { BadRequestException, ConflictException } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

function setup(options: { analysisStatus?: 'processing' | 'completed' | 'failed'; points?: number } = {}) {
    const state: any = {
        points: options.points ?? 100,
        dream: {
            id: 'dream-1',
            userId: 'user-1',
            content: '梦境内容',
            tags: '[]',
            emotion: 'happy',
            status: 'analyzed'
        },
        analysis: options.analysisStatus
            ? { id: 'analysis-1', dreamId: 'dream-1', userId: 'user-1', status: options.analysisStatus }
            : null,
        pointRecords: []
    };
    const tx: any = {
        dream: {
            updateMany: jest.fn(async ({ data }) => {
                state.dream = { ...state.dream, ...data };
                return { count: 1 };
            }),
            findUnique: jest.fn(async () => state.dream),
            update: jest.fn(async ({ data }) => (state.dream = { ...state.dream, ...data }))
        },
        analysis: {
            findUnique: jest.fn(async () => state.analysis),
            create: jest.fn(async ({ data }) => (state.analysis = { id: 'analysis-new', ...data })),
            update: jest.fn(async ({ data }) => (state.analysis = { ...state.analysis, ...data })),
            deleteMany: jest.fn(async () => {
                state.analysis = null;
            })
        },
        user: {
            updateMany: jest.fn(async ({ where, data }) => {
                if (state.points < where.luckyPoints.gte) return { count: 0 };
                state.points -= data.luckyPoints.decrement;
                return { count: 1 };
            }),
            findUnique: jest.fn(async () => ({ luckyPoints: state.points }))
        },
        pointRecord: { create: jest.fn(async ({ data }) => state.pointRecords.push(data)) },
        task: { deleteMany: jest.fn(async () => ({ count: 1 })) }
    };
    let transactionQueue = Promise.resolve();
    const prisma: any = {
        $transaction: jest.fn((callback) => {
            const transaction = transactionQueue.then(() => callback(tx));
            transactionQueue = transaction.catch(() => undefined);
            return transaction;
        })
    };
    const service = new AnalysisService(prisma, {} as any, {} as any, {} as any);
    const processAnalysis = jest.spyOn(service as any, 'processAnalysis').mockResolvedValue(undefined);
    return { service, prisma, tx, state, processAnalysis };
}

describe('AnalysisService request lifecycle', () => {
    it('starts one processing job for a new request', async () => {
        const test = setup();
        await expect(test.service.requestAnalysis('user-1', { dreamId: 'dream-1' })).resolves.toEqual({
            analysisId: 'analysis-new',
            status: 'processing'
        });
        expect(test.processAnalysis).toHaveBeenCalledTimes(1);
        expect(test.processAnalysis).toHaveBeenCalledWith('analysis-new', expect.objectContaining({ id: 'dream-1' }));
    });

    it.each(['processing', 'completed'] as const)(
        'reuses an existing %s analysis without starting another job',
        async (status) => {
            const test = setup({ analysisStatus: status });
            await expect(test.service.requestAnalysis('user-1', { dreamId: 'dream-1' })).resolves.toEqual({
                analysisId: 'analysis-1',
                status
            });
            expect(test.processAnalysis).not.toHaveBeenCalled();
            expect(test.tx.analysis.create).not.toHaveBeenCalled();
        }
    );

    it('serializes duplicate requests so only the first creates processing work', async () => {
        const test = setup();
        const results = await Promise.all([
            test.service.requestAnalysis('user-1', { dreamId: 'dream-1' }),
            test.service.requestAnalysis('user-1', { dreamId: 'dream-1' })
        ]);
        expect(results.map((result) => result.analysisId)).toEqual(['analysis-new', 'analysis-new']);
        expect(test.tx.analysis.create).toHaveBeenCalledTimes(1);
        expect(test.processAnalysis).toHaveBeenCalledTimes(1);
    });
});

describe('AnalysisService retry billing and concurrency', () => {
    it('deducts points and records the post-charge balance atomically', async () => {
        const test = setup({ analysisStatus: 'completed', points: 100 });
        await expect(test.service.retry('user-1', 'dream-1')).resolves.toEqual({
            analysisId: 'analysis-new',
            status: 'processing',
            pointsConsumed: 50,
            remainingPoints: 50
        });
        expect(test.state.points).toBe(50);
        expect(test.tx.dream.updateMany).toHaveBeenCalledWith({
            where: { id: 'dream-1', userId: 'user-1', status: { not: 'deleted' } },
            data: { updatedAt: expect.any(Date), status: 'pending' }
        });
        expect(test.state.pointRecords).toEqual([
            expect.objectContaining({ amount: 50, balance: 50, source: 'dream_reanalyze' })
        ]);
        expect(test.processAnalysis).toHaveBeenCalledTimes(1);
    });

    it('does not charge when points are insufficient', async () => {
        const test = setup({ analysisStatus: 'completed', points: 49 });
        await expect(test.service.retry('user-1', 'dream-1')).rejects.toBeInstanceOf(BadRequestException);
        expect(test.state.points).toBe(49);
        expect(test.tx.pointRecord.create).not.toHaveBeenCalled();
        expect(test.processAnalysis).not.toHaveBeenCalled();
    });

    it('rejects retry while processing before charging', async () => {
        const test = setup({ analysisStatus: 'processing', points: 100 });
        await expect(test.service.retry('user-1', 'dream-1')).rejects.toBeInstanceOf(ConflictException);
        expect(test.state.points).toBe(100);
        expect(test.tx.user.updateMany).not.toHaveBeenCalled();
    });

    it('charges only one of concurrent retries', async () => {
        const test = setup({ analysisStatus: 'completed', points: 100 });
        const results = await Promise.allSettled([
            test.service.retry('user-1', 'dream-1'),
            test.service.retry('user-1', 'dream-1')
        ]);
        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
        expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
        expect(test.state.points).toBe(50);
        expect(test.tx.pointRecord.create).toHaveBeenCalledTimes(1);
        expect(test.processAnalysis).toHaveBeenCalledTimes(1);
    });
});
