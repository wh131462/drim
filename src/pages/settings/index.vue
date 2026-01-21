<template>
  <view class="page settings-page">
    <!-- 用户信息 -->
    <view class="user-section card">
      <view class="user-avatar">
        <image
          :src="userInfo?.avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
          class="avatar-img"
        />
        <view class="avatar-edit" @tap="handleChangeAvatar">
          <text>📷</text>
        </view>
      </view>
      <view class="user-info">
        <input
          class="nickname-input"
          v-model="editNickname"
          :placeholder="userInfo?.nickname || '点击设置昵称'"
          @blur="handleSaveNickname"
          maxlength="12"
        />
        <text class="user-id">ID: {{ userInfo?.id?.slice(0, 8) || '未登录' }}</text>
      </view>
    </view>

    <!-- 设置列表 -->
    <view class="settings-group card">
      <view class="group-title">通知设置</view>
      <view class="settings-item">
        <view class="item-left">
          <text class="item-icon">🔔</text>
          <text class="item-label">接收推送通知</text>
        </view>
        <switch
          :checked="settings.notification"
          color="#7c3aed"
          @change="handleNotificationChange"
        />
      </view>
      <view class="settings-item">
        <view class="item-left">
          <text class="item-icon">📅</text>
          <text class="item-label">每日记梦提醒</text>
        </view>
        <switch
          :checked="settings.dailyReminder"
          color="#7c3aed"
          @change="handleDailyReminderChange"
        />
      </view>
    </view>

    <view class="settings-group card">
      <view class="group-title">隐私设置</view>
      <view class="settings-item" @tap="handleClearCache">
        <view class="item-left">
          <text class="item-icon">🗑️</text>
          <text class="item-label">清除缓存</text>
        </view>
        <view class="item-right">
          <text class="item-value">{{ cacheSize }}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      <view class="settings-item" @tap="handleExportData">
        <view class="item-left">
          <text class="item-icon">📤</text>
          <text class="item-label">导出我的数据</text>
        </view>
        <view class="item-right">
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="settings-group card">
      <view class="group-title">关于</view>
      <view class="settings-item" @tap="handleFeedback">
        <view class="item-left">
          <text class="item-icon">💬</text>
          <text class="item-label">意见反馈</text>
        </view>
        <view class="item-right">
          <text class="item-arrow">›</text>
        </view>
      </view>
      <view class="settings-item" @tap="handlePrivacy">
        <view class="item-left">
          <text class="item-icon">🔒</text>
          <text class="item-label">隐私政策</text>
        </view>
        <view class="item-right">
          <text class="item-arrow">›</text>
        </view>
      </view>
      <view class="settings-item" @tap="handleAgreement">
        <view class="item-left">
          <text class="item-icon">📄</text>
          <text class="item-label">用户协议</text>
        </view>
        <view class="item-right">
          <text class="item-arrow">›</text>
        </view>
      </view>
      <view class="settings-item">
        <view class="item-left">
          <text class="item-icon">ℹ️</text>
          <text class="item-label">版本号</text>
        </view>
        <view class="item-right">
          <text class="item-value">v1.0.0</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLoggedIn">
      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>

    <!-- 版权信息 -->
    <view class="copyright">
      <text>© 2024 梦见 · 用心解读每一个梦</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { userApi } from '@/api'

// Store
const userStore = useUserStore()

// 状态
const editNickname = ref('')
const cacheSize = ref('0KB')
const settings = reactive({
  notification: true,
  dailyReminder: true
})

// 计算属性
const userInfo = computed(() => userStore.userInfo)
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 方法
async function loadSettings() {
  // 从本地存储加载设置
  try {
    const savedSettings = uni.getStorageSync('app_settings')
    if (savedSettings) {
      Object.assign(settings, JSON.parse(savedSettings))
    }
    editNickname.value = userInfo.value?.nickname || ''

    // 计算缓存大小
    calculateCacheSize()
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

function calculateCacheSize() {
  try {
    const info = uni.getStorageInfoSync()
    const size = info.currentSize || 0
    if (size < 1024) {
      cacheSize.value = `${size}KB`
    } else {
      cacheSize.value = `${(size / 1024).toFixed(1)}MB`
    }
  } catch (error) {
    cacheSize.value = '0KB'
  }
}

function saveSettings() {
  try {
    uni.setStorageSync('app_settings', JSON.stringify(settings))
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

function handleChangeAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      // TODO: 上传头像到服务器
      uni.showToast({ title: '头像更新成功', icon: 'success' })
    }
  })
}

async function handleSaveNickname() {
  if (!editNickname.value || editNickname.value === userInfo.value?.nickname) {
    return
  }

  try {
    await userApi.updateUserInfo({ nickname: editNickname.value })
    userStore.setUserInfo({ ...userInfo.value!, nickname: editNickname.value })
    uni.showToast({ title: '昵称已更新', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '更新失败', icon: 'none' })
    editNickname.value = userInfo.value?.nickname || ''
  }
}

function handleNotificationChange(e: any) {
  settings.notification = e.detail.value
  saveSettings()

  if (e.detail.value) {
    // 请求通知权限
    uni.requestSubscribeMessage({
      tmplIds: ['template-id-1', 'template-id-2'],
      success: () => {
        uni.showToast({ title: '已开启通知', icon: 'success' })
      },
      fail: () => {
        settings.notification = false
        saveSettings()
        uni.showToast({ title: '请在设置中允许通知', icon: 'none' })
      }
    })
  }
}

function handleDailyReminderChange(e: any) {
  settings.dailyReminder = e.detail.value
  saveSettings()
  uni.showToast({
    title: e.detail.value ? '已开启提醒' : '已关闭提醒',
    icon: 'success'
  })
}

function handleClearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除所有缓存数据吗？',
    success: (res) => {
      if (res.confirm) {
        try {
          // 保留登录信息
          const token = uni.getStorageSync('token')
          const userInfo = uni.getStorageSync('userInfo')

          uni.clearStorageSync()

          // 恢复登录信息
          if (token) uni.setStorageSync('token', token)
          if (userInfo) uni.setStorageSync('userInfo', userInfo)

          cacheSize.value = '0KB'
          uni.showToast({ title: '缓存已清除', icon: 'success' })
        } catch (error) {
          uni.showToast({ title: '清除失败', icon: 'none' })
        }
      }
    }
  })
}

function handleExportData() {
  uni.showModal({
    title: '导出数据',
    content: '将为您导出所有梦境记录，确定继续吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '导出中...' })
        // TODO: 调用导出接口
        setTimeout(() => {
          uni.hideLoading()
          uni.showToast({ title: '导出成功，请查看微信文件', icon: 'success' })
        }, 1500)
      }
    }
  })
}

function handleFeedback() {
  // 打开客服会话
  // 小程序需要配置客服
  uni.showToast({ title: '请联系客服反馈', icon: 'none' })
}

function handlePrivacy() {
  uni.navigateTo({
    url: '/pages/webview/index?url=https://example.com/privacy&title=隐私政策'
  })
}

function handleAgreement() {
  uni.navigateTo({
    url: '/pages/webview/index?url=https://example.com/agreement&title=用户协议'
  })
}

function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'success' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1500)
      }
    }
  })
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.settings-page {
  min-height: 100vh;
  background: $bg-page;
  padding: $spacing-base;
  padding-bottom: calc(env(safe-area-inset-bottom) + 40rpx);
}

.card {
  background: #fff;
  border-radius: $radius-lg;
  margin-bottom: $spacing-base;
  overflow: hidden;
}

.user-section {
  display: flex;
  align-items: center;
  padding: $spacing-lg;
}

.user-avatar {
  position: relative;
  margin-right: $spacing-base;
}

.avatar-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: $bg-secondary;
}

.avatar-edit {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 40rpx;
  height: 40rpx;
  background: $primary-color;
  border-radius: 50%;
  @include flex-center;
  font-size: 24rpx;
  border: 4rpx solid #fff;
}

.user-info {
  flex: 1;
}

.nickname-input {
  font-size: $font-size-lg;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8rpx;
  padding: 0;
}

.user-id {
  font-size: $font-size-sm;
  color: $text-placeholder;
}

.settings-group {
  padding: $spacing-sm 0;
}

.group-title {
  font-size: $font-size-sm;
  color: $text-placeholder;
  padding: $spacing-xs $spacing-base;
  padding-bottom: $spacing-sm;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-base;
  background: #fff;

  &:active {
    background: $bg-secondary;
  }
}

.item-left {
  display: flex;
  align-items: center;
}

.item-icon {
  font-size: $font-size-lg;
  margin-right: $spacing-sm;
}

.item-label {
  font-size: $font-size-base;
  color: $text-primary;
}

.item-right {
  display: flex;
  align-items: center;
}

.item-value {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-right: $spacing-xs;
}

.item-arrow {
  font-size: $font-size-lg;
  color: $text-placeholder;
}

.logout-section {
  padding: $spacing-lg $spacing-base;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  background: #fff;
  color: $error-color;
  font-size: $font-size-base;
  border-radius: $radius-lg;
  @include flex-center;
  border: 2rpx solid rgba($error-color, 0.3);

  &:active {
    background: rgba($error-color, 0.05);
  }
}

.copyright {
  text-align: center;
  padding: $spacing-lg 0;

  text {
    font-size: $font-size-xs;
    color: $text-placeholder;
  }
}
</style>
