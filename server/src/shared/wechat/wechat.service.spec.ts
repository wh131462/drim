import { ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { WechatService } from './wechat.service';

jest.mock('axios');

function config(overrides: Record<string, string> = {}): any {
    const values: Record<string, string> = {
        NODE_ENV: 'production',
        WECHAT_APPID: 'test-app',
        WECHAT_SECRET: 'test-secret',
        ...overrides
    };
    return { get: (key: string, fallback?: string) => values[key] ?? fallback };
}

describe('production content security', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it.each([
        { CONTENT_SECURITY_SKIP: 'true' },
        { CONTENT_SECURITY_FAIL_SAFE: 'true' },
        { WECHAT_APPID: '' },
        { WECHAT_SECRET: '' }
    ] as Array<Record<string, string>>)('rejects unsafe or incomplete production configuration %#', (values) => {
        expect(() => new WechatService(config(values))).toThrow();
    });

    it('rejects a network failure instead of allowing unchecked content', async () => {
        const service = new WechatService(config());
        jest.spyOn(service, 'getAccessToken').mockRejectedValueOnce(new Error('network unavailable'));
        await expect(service.checkTextSecurity('梦境内容', 'openid')).rejects.toBeInstanceOf(
            ServiceUnavailableException
        );
    });

    it.each([{ errcode: 40001, errmsg: 'invalid token' }, { errcode: 0 }])(
        'rejects an unsuccessful or incomplete security response %#',
        async (data) => {
            const service = new WechatService(config());
            jest.spyOn(service, 'getAccessToken').mockResolvedValueOnce('test-access-token');
            jest.mocked(axios.post).mockResolvedValueOnce({ data });
            await expect(service.checkTextSecurity('梦境内容', 'openid')).rejects.toBeInstanceOf(
                ServiceUnavailableException
            );
        }
    );

    it('returns a rejected result when WeChat marks content risky', async () => {
        const service = new WechatService(config());
        jest.spyOn(service, 'getAccessToken').mockResolvedValueOnce('test-access-token');
        jest.mocked(axios.post).mockResolvedValueOnce({
            data: { errcode: 0, result: { suggest: 'risky', label: 200 } }
        });
        expect((await service.checkTextSecurity('梦境内容', 'openid')).safe).toBe(false);
    });
});
