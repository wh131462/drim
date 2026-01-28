import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '@/shared/cache/redis.service';

interface Code2SessionResponse {
    openid?: string;
    session_key?: string;
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}

interface AccessTokenResponse {
    access_token?: string;
    expires_in?: number;
    errcode?: number;
    errmsg?: string;
}

interface SubscribeMessageResponse {
    errcode?: number;
    errmsg?: string;
}

interface MsgSecCheckResponse {
    errcode: number;
    errmsg: string;
    result?: {
        suggest: 'pass' | 'review' | 'risky';
        label: number;
    };
    detail?: Array<{
        strategy: string;
        errcode: number;
        suggest: string;
        label: number;
        keyword?: string;
    }>;
}

export interface ContentSecurityResult {
    safe: boolean;
    suggest: 'pass' | 'review' | 'risky';
    label: number;
    keyword?: string;
    message?: string;
}

@Injectable()
export class WechatService {
    private readonly logger = new Logger(WechatService.name);
    private readonly appId: string;
    private readonly appSecret: string;
    private readonly reminderTemplateId: string;

    constructor(
        private readonly configService: ConfigService,
        @Optional() private readonly redisService?: RedisService
    ) {
        this.appId = this.configService.get('WECHAT_APPID', '');
        this.appSecret = this.configService.get('WECHAT_SECRET', '');
        this.reminderTemplateId = this.configService.get('WECHAT_REMINDER_TEMPLATE_ID', '');
    }

    /**
     * 通过code获取openId和session_key
     */
    async code2Session(code: string): Promise<{ openid: string; unionid?: string }> {
        const url = 'https://api.weixin.qq.com/sns/jscode2session';

        try {
            const response = await axios.get<Code2SessionResponse>(url, {
                params: {
                    appid: this.appId,
                    secret: this.appSecret,
                    js_code: code,
                    grant_type: 'authorization_code'
                }
            });

            const data = response.data;

            if (data.errcode) {
                this.logger.error(`code2Session error: ${data.errcode} - ${data.errmsg}`);
                throw new Error(`微信登录失败: ${data.errmsg}`);
            }

            return {
                openid: data.openid!,
                unionid: data.unionid
            };
        } catch (error) {
            this.logger.error('code2Session request failed', error);
            throw error;
        }
    }

    /**
     * 获取 Access Token
     */
    async getAccessToken(): Promise<string> {
        const cacheKey = 'wechat:access_token';

        // 先从缓存获取
        if (this.redisService) {
            const cached = await this.redisService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const url = 'https://api.weixin.qq.com/cgi-bin/token';

        try {
            const response = await axios.get<AccessTokenResponse>(url, {
                params: {
                    grant_type: 'client_credential',
                    appid: this.appId,
                    secret: this.appSecret
                }
            });

            const data = response.data;

            if (data.errcode) {
                this.logger.error(`getAccessToken error: ${data.errcode} - ${data.errmsg}`);
                throw new Error(`获取 access_token 失败: ${data.errmsg}`);
            }

            const accessToken = data.access_token!;
            const expiresIn = data.expires_in || 7200;

            // 缓存 token，提前 5 分钟过期
            if (this.redisService) {
                await this.redisService.set(cacheKey, accessToken, expiresIn - 300);
            }

            return accessToken;
        } catch (error) {
            this.logger.error('getAccessToken request failed', error);
            throw error;
        }
    }

    /**
     * 文本内容安全检测
     * @param content 待检测文本
     * @param openId 用户 openId
     * @param scene 场景值: 1-资料 2-评论 3-论坛 4-社交日志
     * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/sec-center/sec-check/msgSecCheck.html
     */
    async checkTextSecurity(content: string, openId: string, scene: 1 | 2 | 3 | 4 = 4): Promise<ContentSecurityResult> {
        // 开发环境可跳过检测
        const skipCheck = this.configService.get('CONTENT_SECURITY_SKIP', 'false') === 'true';
        if (skipCheck) {
            this.logger.warn('内容安全检测已跳过 (CONTENT_SECURITY_SKIP=true)');
            return { safe: true, suggest: 'pass', label: 100 };
        }

        try {
            const accessToken = await this.getAccessToken();
            const url = `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`;

            const response = await axios.post<MsgSecCheckResponse>(url, {
                content,
                version: 2,
                scene,
                openid: openId
            });

            const data = response.data;

            if (data.errcode !== 0) {
                this.logger.error(`checkTextSecurity error: ${data.errcode} - ${data.errmsg}`);
                // 接口调用失败时，根据配置决定是否放行
                const failSafe = this.configService.get('CONTENT_SECURITY_FAIL_SAFE', 'true') === 'true';
                if (failSafe) {
                    this.logger.warn('内容安全检测接口异常，启用 fail-safe 放行');
                    return { safe: true, suggest: 'pass', label: 100, message: '检测服务暂时不可用' };
                }
                return { safe: false, suggest: 'risky', label: 0, message: `检测服务异常: ${data.errmsg}` };
            }

            const result = data.result;
            const safe = result?.suggest === 'pass';

            // 提取违规关键词
            let keyword: string | undefined;
            if (data.detail && data.detail.length > 0) {
                const riskyDetail = data.detail.find((d) => d.suggest === 'risky');
                keyword = riskyDetail?.keyword;
            }

            this.logger.log(`内容安全检测: suggest=${result?.suggest}, label=${result?.label}, safe=${safe}`);

            return {
                safe,
                suggest: result?.suggest || 'pass',
                label: result?.label || 100,
                keyword,
                message: safe ? undefined : '内容包含违规信息'
            };
        } catch (error) {
            this.logger.error('checkTextSecurity request failed', error);
            // 网络异常时的 fail-safe 处理
            const failSafe = this.configService.get('CONTENT_SECURITY_FAIL_SAFE', 'true') === 'true';
            if (failSafe) {
                this.logger.warn('内容安全检测网络异常，启用 fail-safe 放行');
                return { safe: true, suggest: 'pass', label: 100, message: '检测服务暂时不可用' };
            }
            throw error;
        }
    }

    /**
     * 发送订阅消息 - 每日记梦提醒
     */
    async sendDreamReminder(openId: string, reminderTime: string): Promise<boolean> {
        if (!this.reminderTemplateId) {
            this.logger.warn('未配置提醒模板ID (WECHAT_REMINDER_TEMPLATE_ID)');
            return false;
        }

        try {
            const accessToken = await this.getAccessToken();
            const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

            const response = await axios.post<SubscribeMessageResponse>(url, {
                touser: openId,
                template_id: this.reminderTemplateId,
                page: '/pages/record/index',
                data: {
                    thing1: { value: '记录今天的梦境' },
                    time2: { value: reminderTime },
                    thing3: { value: '记录梦境，探索内心世界' }
                }
            });

            const data = response.data;

            if (data.errcode && data.errcode !== 0) {
                this.logger.error(`sendDreamReminder error: ${data.errcode} - ${data.errmsg}`);
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error('sendDreamReminder request failed', error);
            return false;
        }
    }
}
