import { isVipActive } from './vip';

describe('isVipActive', () => {
    const now = Date.parse('2026-10-10T00:00:00.000Z');

    it('accepts a VIP expiration after now', () => {
        expect(isVipActive({ isVip: true, vipExpireAt: '2026-10-10T00:00:01.000Z' }, now)).toBe(true);
    });

    it.each([
        { isVip: true, vipExpireAt: '2026-10-09T23:59:59.999Z' },
        { isVip: true, vipExpireAt: '2026-10-10T00:00:00.000Z' },
        { isVip: true, vipExpireAt: new Date('2026-10-10T00:00:00.000Z') },
        { isVip: true, vipExpireAt: 'invalid' },
        { isVip: true, vipExpireAt: null },
        { isVip: false, vipExpireAt: '2026-10-11T00:00:00.000Z' }
    ])('rejects inactive or invalid expiration %#', (user) => {
        expect(isVipActive(user, now)).toBe(false);
    });
});
