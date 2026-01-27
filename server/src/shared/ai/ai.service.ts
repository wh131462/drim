import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * AI API 格式类型
 * - openai: OpenAI 兼容格式 (大多数第三方 API 使用)
 * - dashscope: 阿里云 DashScope 格式
 * - anthropic: Anthropic Claude 格式
 */
type ApiFormat = 'openai' | 'dashscope' | 'anthropic';

@Injectable()
export class AiService implements OnModuleInit {
    private readonly logger = new Logger(AiService.name);
    private readonly apiKey: string;
    private readonly apiBaseUrl: string;
    private readonly model: string;
    private readonly apiFormat: ApiFormat;
    private readonly systemPrompt: string;

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get('AI_API_KEY', '');
        this.apiBaseUrl = this.configService.get('AI_API_URL', 'https://api.openai.com/v1');
        this.model = this.configService.get('AI_MODEL', 'gpt-3.5-turbo');
        this.apiFormat = this.configService.get<ApiFormat>('AI_API_FORMAT', 'openai');
        this.systemPrompt = this.configService.get(
            'AI_SYSTEM_PROMPT',
            '你是一个专业的梦境解析师，擅长心理学和传统解梦文化。'
        );
    }

    /**
     * 模块初始化时执行健康检测
     */
    async onModuleInit(): Promise<void> {
        const config = this.getConfig();
        this.logger.log(`AI Service initializing: ${config.format} | ${config.model} | ${config.apiUrl}`);

        if (!config.hasApiKey) {
            this.logger.warn('AI API key not configured, AI features will be unavailable');
            return;
        }

        // 异步执行健康检测，不阻塞启动
        this.healthCheck().then((result) => {
            if (result.status === 'healthy') {
                this.logger.log(`AI Service ready (${result.latency}ms)`);
            } else {
                this.logger.error(`AI Service unhealthy: ${result.error}`);
            }
        });
    }

    /**
     * 获取完整的 API endpoint
     */
    private getEndpoint(): string {
        const baseUrl = this.apiBaseUrl.replace(/\/+$/, '');

        if (this.apiFormat === 'dashscope') {
            // DashScope 使用完整 URL
            if (baseUrl.includes('/services/aigc/')) {
                return baseUrl;
            }
            return `${baseUrl}/services/aigc/text-generation/generation`;
        }

        if (this.apiFormat === 'anthropic') {
            // Anthropic Claude 格式
            if (baseUrl.endsWith('/messages')) {
                return baseUrl;
            }
            return `${baseUrl}/messages`;
        }

        // OpenAI 格式
        if (baseUrl.endsWith('/chat/completions')) {
            return baseUrl;
        }
        return `${baseUrl}/chat/completions`;
    }

    /**
     * 构建请求体
     */
    private buildRequestBody(prompt: string): Record<string, unknown> {
        if (this.apiFormat === 'anthropic') {
            // Anthropic Claude 格式: system 是顶层字段
            return {
                model: this.model,
                system: this.systemPrompt,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1500,
                temperature: 0.7
            };
        }

        const messages = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
        ];

        if (this.apiFormat === 'dashscope') {
            return {
                model: this.model,
                input: { messages },
                parameters: {
                    result_format: 'message',
                    temperature: 0.7,
                    max_tokens: 1500
                }
            };
        }

        // OpenAI 兼容格式
        return {
            model: this.model,
            messages,
            temperature: 0.7,
            max_tokens: 1500
        };
    }

    /**
     * 解析响应内容
     */
    private parseResponse(data: Record<string, unknown>): string {
        // Anthropic Claude 格式: data.content[0].text
        const content = data.content as Array<{ type?: string; text?: string }>;
        if (content?.[0]?.text) {
            return content[0].text;
        }

        // OpenAI 格式: data.choices[0].message.content
        const choices = data.choices as Array<{
            message?: { content?: string };
            text?: string;
        }>;
        if (choices?.[0]?.message?.content) {
            return choices[0].message.content;
        }

        // DashScope 格式: data.output.choices[0].message.content
        const output = data.output as {
            choices?: Array<{ message?: { content?: string } }>;
            text?: string;
        };
        if (output?.choices?.[0]?.message?.content) {
            return output.choices[0].message.content;
        }

        // DashScope 旧格式: data.output.text
        if (output?.text) {
            return output.text;
        }

        this.logger.warn('AI response format unexpected:', JSON.stringify(data));
        throw new Error('AI响应格式异常');
    }

    /**
     * 构建请求头
     */
    private buildHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (this.apiFormat === 'anthropic') {
            // Anthropic 使用 x-api-key 认证
            headers['x-api-key'] = this.apiKey;
            headers['anthropic-version'] = '2023-06-01';
        } else {
            // OpenAI 和其他格式使用 Bearer token
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        return headers;
    }

    /**
     * 调用AI对话
     */
    async chat(prompt: string): Promise<string> {
        const endpoint = this.getEndpoint();
        const body = this.buildRequestBody(prompt);
        const headers = this.buildHeaders();

        this.logger.debug(`AI request to: ${endpoint}`);
        this.logger.debug(`AI model: ${this.model}, format: ${this.apiFormat}`);

        try {
            const response = await axios.post(endpoint, body, {
                headers,
                timeout: 30000
            });

            return this.parseResponse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.error(`AI chat failed: ${error.message}, status: ${error.response?.status}`);
                this.logger.error(`Response: ${JSON.stringify(error.response?.data)}`);
            } else {
                this.logger.error('AI chat failed:', error);
            }
            throw error;
        }
    }

    /**
     * 获取当前配置信息（不含敏感数据）
     */
    getConfig(): {
        apiUrl: string;
        model: string;
        format: ApiFormat;
        hasApiKey: boolean;
    } {
        return {
            apiUrl: this.apiBaseUrl,
            model: this.model,
            format: this.apiFormat,
            hasApiKey: !!this.apiKey
        };
    }

    /**
     * AI 服务健康检测
     * 发送简单请求验证 API 配置和服务可用性
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        config: ReturnType<typeof this.getConfig>;
        latency?: number;
        error?: string;
    }> {
        const config = this.getConfig();
        const startTime = Date.now();

        if (!config.hasApiKey) {
            return {
                status: 'unhealthy',
                config,
                error: 'API key not configured'
            };
        }

        try {
            // 发送一个简单的测试请求
            await this.chat('ping');
            const latency = Date.now() - startTime;

            this.logger.log(`AI health check passed, latency: ${latency}ms`);
            return {
                status: 'healthy',
                config,
                latency
            };
        } catch (error) {
            const latency = Date.now() - startTime;
            const errorMessage = axios.isAxiosError(error)
                ? `${error.message} (status: ${error.response?.status})`
                : error instanceof Error
                  ? error.message
                  : 'Unknown error';

            this.logger.warn(`AI health check failed: ${errorMessage}`);
            return {
                status: 'unhealthy',
                config,
                latency,
                error: errorMessage
            };
        }
    }
}
