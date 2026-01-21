import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('AI_API_KEY', '');
    this.apiUrl = this.configService.get(
      'AI_API_URL',
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    );
    this.model = this.configService.get('AI_MODEL', 'qwen-turbo');
  }

  /**
   * 调用AI对话
   */
  async chat(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一个专业的梦境解析师，擅长心理学和传统解梦文化。',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
          },
          parameters: {
            result_format: 'message',
            temperature: 0.7,
            max_tokens: 1500,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      const data = response.data;

      if (data.output?.choices?.[0]?.message?.content) {
        return data.output.choices[0].message.content;
      }

      if (data.output?.text) {
        return data.output.text;
      }

      this.logger.warn('AI response format unexpected:', data);
      throw new Error('AI响应格式异常');
    } catch (error) {
      this.logger.error('AI chat failed:', error);
      throw error;
    }
  }
}
