import { UserService } from './user.service';

describe('dream streak transaction', () => {
    it('counts every dream but does not repeat the same-day streak reward', async () => {
        const tx: any = {
            user: {
                updateMany: jest.fn(async () => ({ count: 1 })),
                findUnique: jest.fn(async () => ({ lastDreamDate: new Date(), consecutiveDays: 3 })),
                update: jest.fn()
            },
            pointRecord: { create: jest.fn() }
        };
        const service = new UserService({} as any, {} as any, {} as any, {} as any);
        expect(await service.updateConsecutiveDays('user-1', tx)).toEqual({ consecutiveDays: 3, bonus: 0 });
        expect(tx.user.updateMany).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { totalDreams: { increment: 1 } }
        });
        expect(tx.user.update).not.toHaveBeenCalled();
        expect(tx.pointRecord.create).not.toHaveBeenCalled();
    });

    it('increments points and writes the milestone balance in the same transaction', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const tx: any = {
            user: {
                updateMany: jest.fn(async () => ({ count: 1 })),
                findUnique: jest.fn(async () => ({ lastDreamDate: yesterday, consecutiveDays: 2 })),
                update: jest.fn(async () => ({ luckyPoints: 105 }))
            },
            pointRecord: { create: jest.fn(async () => ({})) }
        };
        const service = new UserService({} as any, {} as any, {} as any, {} as any);
        expect(await service.updateConsecutiveDays('user-1', tx)).toEqual({ consecutiveDays: 3, bonus: 5 });
        expect(tx.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { consecutiveDays: 3, lastDreamDate: expect.any(Date), luckyPoints: { increment: 5 } }
        });
        expect(tx.pointRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ amount: 5, balance: 105 })
        });
    });
});
