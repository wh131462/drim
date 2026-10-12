import { createPinia, setActivePinia } from 'pinia';
import { userApi } from '@/api';
import { useUserStore } from './user';

jest.mock('@/api', () => ({ userApi: { getUserInfo: jest.fn(), login: jest.fn() } }));

describe('VIP cache and expiration', () => {
    let cache: Record<string, any>;
    let store: ReturnType<typeof useUserStore>;
    const now = Date.parse('2026-10-10T00:00:00.000Z');
    const user = (expireAt: number): any => ({
        id: 'user-1',
        isVip: true,
        vipExpireAt: new Date(expireAt).toISOString(),
        nickname: '梦游者'
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(now);
        cache = { token: 'token-1' };
        (globalThis as any).uni = {
            getStorageSync: jest.fn((key: string) => cache[key]),
            setStorageSync: jest.fn((key: string, value: any) => {
                cache[key] = value;
            }),
            removeStorageSync: jest.fn((key: string) => {
                delete cache[key];
            })
        };
        setActivePinia(createPinia());
        jest.clearAllMocks();
    });

    afterEach(() => {
        store?.logout();
        jest.useRealTimers();
        delete (globalThis as any).uni;
    });

    it('clears expired cached status before any refresh request', () => {
        cache.userInfo = user(now - 1);
        store = useUserStore();
        store.checkLogin();
        expect(store.isVip).toBe(false);
        expect(store.userInfo?.isVip).toBe(false);
        expect(cache.userInfo.isVip).toBe(false);
    });

    it('updates cached and reactive status at expiration while the page stays open', () => {
        store = useUserStore();
        store.setUserInfo(user(now + 1000));
        expect(store.isVip).toBe(true);
        jest.advanceTimersByTime(1000);
        expect(store.isVip).toBe(false);
        expect(store.userInfo?.isVip).toBe(false);
        expect(cache.userInfo.isVip).toBe(false);
        expect(store.infoFetchedAt).toBe(0);
    });

    it('does not overflow the timer for a yearly privilege', () => {
        store = useUserStore();
        store.setUserInfo(user(now + 365 * 24 * 60 * 60 * 1000));
        jest.advanceTimersByTime(2_147_483_647);
        expect(store.isVip).toBe(true);
        expect(jest.getTimerCount()).toBe(1);
    });

    it('keeps login on a network error while expiring old VIP data', async () => {
        store = useUserStore();
        store.setUserInfo(user(now + 1000));
        store.checkLogin();
        jest.setSystemTime(now + 1000);
        jest.mocked(userApi.getUserInfo).mockRejectedValueOnce(new Error('network unavailable'));
        await expect(store.fetchUserInfo()).rejects.toThrow('network unavailable');
        expect(store.token).toBe('token-1');
        expect(store.isLoggedIn).toBe(true);
        expect(store.isVip).toBe(false);
        expect(cache.userInfo.isVip).toBe(false);
    });

    it('normalizes an expired response from an older server', async () => {
        store = useUserStore();
        jest.mocked(userApi.getUserInfo).mockResolvedValueOnce(user(now));
        await store.fetchUserInfo();
        expect(store.isVip).toBe(false);
        expect(cache.userInfo.isVip).toBe(false);
    });
});
