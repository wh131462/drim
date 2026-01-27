import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [uni()],
    // 环境变量目录
    envDir: resolve(__dirname, 'src'),
    // CSS 预处理器配置
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern', // 使用现代 Sass API
                silenceDeprecations: ['legacy-js-api'] // 静默 legacy-js-api 警告
            }
        }
    },
    // 服务器配置
    server: {
        port: 5173,
        proxy: {
            // 开发环境代理 API 请求
            '/api': {
                target: 'http://localhost:3333',
                changeOrigin: true
            }
        }
    }
});
