import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface Code2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get('WECHAT_APPID', '');
    this.appSecret = this.configService.get('WECHAT_SECRET', '');
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
          grant_type: 'authorization_code',
        },
      });

      const data = response.data;

      if (data.errcode) {
        this.logger.error(`code2Session error: ${data.errcode} - ${data.errmsg}`);
        throw new Error(`微信登录失败: ${data.errmsg}`);
      }

      return {
        openid: data.openid!,
        unionid: data.unionid,
      };
    } catch (error) {
      this.logger.error('code2Session request failed', error);
      throw error;
    }
  }
}
