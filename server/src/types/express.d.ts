/**
 * Express Request 类型扩展
 */

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                openId: string;
            };
        }
    }
}

export {};
