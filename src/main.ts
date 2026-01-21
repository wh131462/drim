import { createSSRApp } from 'vue'
import { pinia } from './stores'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 使用 Pinia 状态管理
  app.use(pinia)

  return {
    app
  }
}
