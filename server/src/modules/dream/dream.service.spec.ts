import { BadRequestException, ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DreamService } from './dream.service';
import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';

const original = '梦里我沿着湖边慢慢散步，看见一座小屋，窗外有一只白色的鸟在清晨飞过。';
const polished = '清晨的梦里，我独自沿着静谧的湖岸散步。一座小屋映入眼帘，白鸟掠过窗外。';
const fixture = {
    id: 'dream-1',
    userId: 'user-1',
    content: original,
    originalContent: original,
    currentVersionId: 'version-1',
    tags: '["nature"]',
    emotion: 'happy',
    status: 'analyzed',
    isPublic: false,
    wordCount: original.length,
    createdAt: new Date('2026-10-10T00:00:00.000Z'),
    updatedAt: new Date('2026-10-10T00:00:00.000Z'),
    analysis: { id: 'analysis-1', status: 'completed' }
};

function setup() {
    let state: any = {
        dream: { ...fixture, analysis: { ...fixture.analysis } },
        versions: [],
        points: 80,
        pointRecords: [],
        analysisDeleted: false
    };
    const tx: any = {
        dream: {
            findUnique: jest.fn(async () => state.dream),
            create: jest.fn(async ({ data }) => (state.dream = { ...fixture, ...data, analysis: null })),
            updateMany: jest.fn(async () => ({ count: 1 })),
            update: jest.fn(async ({ data }) => (state.dream = { ...state.dream, ...data }))
        },
        dreamVersion: {
            findFirst: jest.fn(async () => ({ id: 'version-1', versionNumber: 1 })),
            updateMany: jest.fn(async () => ({ count: 1 })),
            create: jest.fn(async ({ data }) => {
                const version = { id: `version-${state.versions.length + 2}`, ...data };
                state.versions.push(version);
                return version;
            })
        },
        user: {
            updateMany: jest.fn(async ({ where, data }) => {
                if (state.points < where.luckyPoints.gte) return { count: 0 };
                state.points -= data.luckyPoints.decrement;
                return { count: 1 };
            }),
            findUnique: jest.fn(async () => ({ luckyPoints: state.points, openId: 'openid-1' })),
            update: jest.fn(async ({ data }) => {
                state.points += data.luckyPoints.increment;
                return { luckyPoints: state.points };
            })
        },
        pointRecord: { create: jest.fn(async ({ data }) => state.pointRecords.push(data)) },
        analysis: {
            delete: jest.fn(async () => {
                state.analysisDeleted = true;
            })
        },
        task: { deleteMany: jest.fn(async () => ({ count: 1 })) }
    };
    const prisma: any = {
        dream: { findUnique: jest.fn(async () => state.dream) },
        user: { findUnique: jest.fn(async () => ({ openId: 'openid-1' })) },
        $transaction: jest.fn(async (run) => {
            const snapshot = JSON.parse(JSON.stringify(state));
            try {
                return await run(tx);
            } catch (error) {
                state = snapshot;
                throw error;
            }
        })
    };
    const userService: any = { updateConsecutiveDays: jest.fn(async () => ({ consecutiveDays: 1, bonus: 0 })) };
    const achievement: any = { checkAndUnlockAchievements: jest.fn(async () => []) };
    const settings: any = { getPrivacySettings: jest.fn(async () => ({ defaultDreamPublic: false })) };
    const wechat: any = { checkTextSecurity: jest.fn(async () => ({ safe: true })) };
    return {
        service: new DreamService(prisma, userService, achievement, settings, wechat),
        tx,
        prisma,
        wechat,
        state: () => state,
        userService
    };
}

describe('dream create and update', () => {
    it('keeps both contents and points at the applied polished version', async () => {
        const test = setup();
        const result = await test.service.create('user-1', { content: polished, originalContent: original });
        expect(test.state().versions).toEqual([
            expect.objectContaining({ type: 'original', content: original, isCurrent: false }),
            expect.objectContaining({ type: 'polished', content: polished, isCurrent: true })
        ]);
        expect(test.state().versions[1].polishedFrom).toBe(test.state().versions[0].id);
        expect(result.currentVersionId).toBe(test.state().versions[1].id);
        expect(result.originalContent).toBe(original);
        expect(result.currentVersionType).toBe('polished');
        expect(test.wechat.checkTextSecurity).toHaveBeenCalledTimes(2);
        expect(test.userService.updateConsecutiveDays).toHaveBeenCalledWith('user-1', test.tx);
        expect(test.state().points).toBe(85);
    });

    it('creates one original version when no polish is applied', async () => {
        const test = setup();
        const result = await test.service.create('user-1', { content: original });
        expect(test.state().versions).toHaveLength(1);
        expect(test.state().versions[0].isCurrent).toBe(true);
        expect(result.currentVersionId).toBe(test.state().versions[0].id);
        expect(result.currentVersionType).toBe('original');
    });

    it('rejects unsafe original content before storing a polished dream', async () => {
        const test = setup();
        test.wechat.checkTextSecurity.mockResolvedValueOnce({ safe: true }).mockResolvedValueOnce({ safe: false });
        await expect(
            test.service.create('user-1', { content: polished, originalContent: original })
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(test.prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rolls back the dream and versions when its reward cannot be written', async () => {
        const test = setup();
        test.tx.pointRecord.create.mockRejectedValueOnce(new Error('database unavailable'));
        await expect(test.service.create('user-1', { content: original })).rejects.toThrow('database unavailable');
        expect(test.state().versions).toHaveLength(0);
        expect(test.state().points).toBe(80);
        expect(test.state().dream.currentVersionId).toBe('version-1');
    });

    it('rejects insufficient points without changing content or old analysis', async () => {
        const test = setup();
        test.state().points = 49;
        await expect(
            test.service.update('user-1', 'dream-1', { content: polished, reAnalyze: true })
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(test.tx.dream.update).not.toHaveBeenCalled();
        expect(test.tx.dreamVersion.create).not.toHaveBeenCalled();
        expect(test.tx.analysis.delete).not.toHaveBeenCalled();
        expect(test.state().dream.content).toBe(original);
        expect(test.state().points).toBe(49);
    });

    it('saves selected metadata and current version while preserving original content', async () => {
        const test = setup();
        const result = await test.service.update('user-1', 'dream-1', {
            content: polished,
            tags: ['flying'],
            emotion: null,
            isPublic: true,
            versionType: 'polished'
        });
        expect(result.tags).toEqual(['flying']);
        expect(result.emotion).toBeNull();
        expect(result.isPublic).toBe(true);
        expect(result.originalContent).toBe(original);
        expect(result.currentVersionId).toBe(test.state().versions[0].id);
        expect(test.state().versions[0].polishedFrom).toBe('version-1');
        expect(test.tx.user.updateMany).not.toHaveBeenCalled();
    });

    it('deducts points conditionally and resets analysis together with the edit', async () => {
        const test = setup();
        const result = await test.service.update('user-1', 'dream-1', { content: polished, reAnalyze: true });
        expect(test.tx.user.updateMany).toHaveBeenCalledWith({
            where: { id: 'user-1', luckyPoints: { gte: 50 } },
            data: { luckyPoints: { decrement: 50 } }
        });
        expect(result.status).toBe('pending');
        expect(result.pointsConsumed).toBe(50);
        expect(result.remainingPoints).toBe(30);
        expect(test.state().analysisDeleted).toBe(true);
        expect(test.tx.task.deleteMany).toHaveBeenCalledWith({ where: { dreamId: 'dream-1' } });
    });

    it('rejects simultaneous edits before deducting points', async () => {
        const test = setup();
        test.tx.dream.updateMany.mockResolvedValueOnce({ count: 0 });
        await expect(
            test.service.update('user-1', 'dream-1', { content: polished, reAnalyze: true })
        ).rejects.toBeInstanceOf(ConflictException);
        expect(test.tx.user.updateMany).not.toHaveBeenCalled();
    });

    it('rejects edits while an analysis is processing', async () => {
        const test = setup();
        test.state().dream.analysis.status = 'processing';
        await expect(
            test.service.update('user-1', 'dream-1', { content: polished, reAnalyze: true })
        ).rejects.toBeInstanceOf(ConflictException);
        expect(test.tx.user.updateMany).not.toHaveBeenCalled();
    });
});

describe('dream DTO contract', () => {
    it('accepts 25-character edits and nullable metadata', async () => {
        const dto = plainToInstance(UpdateDreamDto, {
            content: original.slice(0, 25),
            emotion: null,
            tags: null,
            reAnalyze: false
        });
        expect(await validate(dto)).toHaveLength(0);
    });

    it.each([
        { reAnalyze: 'false' },
        { reAnalyze: null },
        { versionType: 'unknown' },
        { isPublic: null },
        { emotion: 'unknown' }
    ])('rejects invalid optional input %#', async (input) => {
        const dto = plainToInstance(UpdateDreamDto, { content: original, ...input });
        expect((await validate(dto)).length).toBeGreaterThan(0);
    });

    it('enforces the original text boundary and disallows overwriting it in edits', async () => {
        const create = plainToInstance(CreateDreamDto, { content: polished, originalContent: 'too short' });
        expect((await validate(create)).map((error) => error.property)).toContain('originalContent');
        const edit = plainToInstance(UpdateDreamDto, { content: polished, originalContent: original });
        expect(
            (await validate(edit, { whitelist: true, forbidNonWhitelisted: true })).map((error) => error.property)
        ).toContain('originalContent');
    });
});

describe('dream production security', () => {
    const initialEnvironment = process.env.NODE_ENV;
    afterEach(() => {
        process.env.NODE_ENV = initialEnvironment;
    });

    it('rejects a missing security service at startup', () => {
        process.env.NODE_ENV = 'production';
        expect(() => new DreamService({} as any, {} as any, {} as any, {} as any)).toThrow('WechatService');
    });

    it('rejects a user without OpenID before creating a dream', async () => {
        process.env.NODE_ENV = 'production';
        const test = setup();
        test.prisma.user.findUnique.mockResolvedValueOnce({ openId: null });
        await expect(test.service.create('user-1', { content: original })).rejects.toBeInstanceOf(BadRequestException);
        expect(test.prisma.$transaction).not.toHaveBeenCalled();
    });
});
