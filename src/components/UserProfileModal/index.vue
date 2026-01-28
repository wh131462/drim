<template>
    <view
        class="modal-overlay"
        v-if="visible"
        @tap="handleOverlayClick"
    >
        <view
            class="modal-content"
            @tap.stop
        >
            <view class="modal-header">
                <text class="modal-title">完善个人资料</text>
                <text class="modal-subtitle">设置头像和昵称，让梦境更有归属感</text>
            </view>

            <view class="form-section">
                <!-- 头像选择 -->
                <view class="avatar-section">
                    <button
                        class="avatar-btn"
                        open-type="chooseAvatar"
                        @chooseavatar="onChooseAvatar"
                    >
                        <image
                            v-if="avatarUrl"
                            class="avatar-preview"
                            :src="avatarUrl"
                            mode="aspectFill"
                        />
                        <view
                            v-else
                            class="avatar-placeholder"
                        >
                            <image
                                class="avatar-icon"
                                src="/static/icons/user.svg"
                                mode="aspectFit"
                            />
                        </view>
                        <view class="avatar-edit-badge">
                            <image
                                class="edit-icon"
                                src="/static/icons/edit.svg"
                                mode="aspectFit"
                            />
                        </view>
                    </button>
                    <text class="avatar-hint">点击选择头像</text>
                </view>

                <!-- 昵称输入 -->
                <view class="nickname-section">
                    <view class="input-wrapper">
                        <input
                            class="nickname-input"
                            type="nickname"
                            v-model="nickname"
                            placeholder="点击输入昵称"
                            @blur="onNicknameBlur"
                        />
                    </view>
                </view>
            </view>

            <view class="modal-actions">
                <button
                    class="btn-skip"
                    @tap="handleSkip"
                    v-if="allowSkip"
                >
                    稍后设置
                </button>
                <button
                    class="btn-confirm"
                    :disabled="!canSubmit"
                    @tap="handleConfirm"
                >
                    {{ loading ? '保存中...' : '完成设置' }}
                </button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores';
import { userApi } from '@/api';

const props = withDefaults(
    defineProps<{
        visible: boolean;
        allowSkip?: boolean;
        initialAvatar?: string;
        initialNickname?: string;
    }>(),
    {
        allowSkip: true,
        initialAvatar: '',
        initialNickname: ''
    }
);

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'complete', data: { avatar: string; nickname: string }): void;
    (e: 'skip'): void;
}>();

const userStore = useUserStore();
const avatarUrl = ref(props.initialAvatar);
const avatarTempFile = ref('');
const nickname = ref(props.initialNickname);
const loading = ref(false);

// 监听初始值变化
watch(
    () => props.initialAvatar,
    (val) => {
        if (val) avatarUrl.value = val;
    }
);

watch(
    () => props.initialNickname,
    (val) => {
        if (val) nickname.value = val;
    }
);

const canSubmit = computed(() => {
    return (avatarUrl.value || avatarTempFile.value) && nickname.value.trim();
});

// 选择头像
function onChooseAvatar(e: any) {
    const { avatarUrl: tempUrl } = e.detail;
    if (tempUrl) {
        avatarTempFile.value = tempUrl;
        avatarUrl.value = tempUrl;
    }
}

// 昵称输入失焦
function onNicknameBlur(e: any) {
    const value = e.detail.value?.trim();
    if (value) {
        nickname.value = value;
    }
}

// 上传头像到服务器
async function uploadAvatar(): Promise<string> {
    if (!avatarTempFile.value) {
        return avatarUrl.value;
    }

    return new Promise((resolve, reject) => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/v1';
        const token = uni.getStorageSync('token');

        uni.uploadFile({
            url: `${baseUrl}/user/avatar`,
            filePath: avatarTempFile.value,
            name: 'file',
            header: {
                Authorization: `Bearer ${token}`
            },
            success: (res) => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    try {
                        const data = JSON.parse(res.data);
                        if (data.code === 0 && data.data?.url) {
                            resolve(data.data.url);
                        } else {
                            // 如果上传失败，使用临时URL（后端可能不支持上传）
                            console.warn('头像上传接口返回异常，使用临时URL');
                            resolve(avatarTempFile.value);
                        }
                    } catch {
                        resolve(avatarTempFile.value);
                    }
                } else {
                    console.warn('头像上传失败，使用临时URL');
                    resolve(avatarTempFile.value);
                }
            },
            fail: () => {
                // 上传失败时使用临时URL
                console.warn('头像上传失败，使用临时URL');
                resolve(avatarTempFile.value);
            }
        });
    });
}

// 确认提交
async function handleConfirm() {
    if (!canSubmit.value || loading.value) return;

    loading.value = true;
    try {
        // 上传头像获取永久URL
        const finalAvatarUrl = await uploadAvatar();

        // 更新用户信息到后端
        const updatedUserInfo = await userApi.updateUserInfo({
            nickname: nickname.value.trim(),
            avatar: finalAvatarUrl
        });

        // 更新本地状态
        userStore.setUserInfo(updatedUserInfo);

        uni.showToast({
            title: '设置成功',
            icon: 'success'
        });

        emit('complete', {
            avatar: finalAvatarUrl,
            nickname: nickname.value.trim()
        });
        emit('update:visible', false);
    } catch (error: any) {
        console.error('保存用户信息失败:', error);
        uni.showToast({
            title: error.message || '保存失败',
            icon: 'none'
        });
    } finally {
        loading.value = false;
    }
}

// 跳过
function handleSkip() {
    emit('skip');
    emit('update:visible', false);
}

// 点击遮罩
function handleOverlayClick() {
    if (props.allowSkip) {
        handleSkip();
    }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 48rpx;
}

.modal-content {
    width: 100%;
    max-width: 600rpx;
    background: #fff;
    border-radius: 40rpx;
    padding: 60rpx 48rpx;
    animation: modalIn 0.3s ease;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.modal-header {
    text-align: center;
    margin-bottom: 48rpx;
}

.modal-title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 16rpx;
}

.modal-subtitle {
    display: block;
    font-size: 26rpx;
    color: $text-secondary;
}

.form-section {
    margin-bottom: 48rpx;
}

// 头像选择
.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40rpx;
}

.avatar-btn {
    width: 180rpx;
    height: 180rpx;
    padding: 6rpx;
    margin: 0;
    background: transparent;
    border: none;
    position: relative;

    &::after {
        display: none;
    }
}

.avatar-preview {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1rpx solid #fff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 6rpx solid #fff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.avatar-icon {
    width: 80rpx;
    height: 80rpx;
    opacity: 0.4;
    filter: brightness(0) saturate(100%) invert(50%);
}

.avatar-edit-badge {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 48rpx;
    height: 48rpx;
    background: $primary-color;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid #fff;
}

.edit-icon {
    width: 24rpx;
    height: 24rpx;
    filter: brightness(0) invert(1);
}

.avatar-hint {
    font-size: 24rpx;
    color: $text-placeholder;
    margin-top: 20rpx;
    pointer-events: none;
}

// 昵称输入
.nickname-section {
    padding: 0 20rpx;
}

.input-wrapper {
    background: #f7f8fa;
    border-radius: 24rpx;
    padding: 0 32rpx;
    height: 96rpx;
    display: flex;
    align-items: center;
}

.nickname-input {
    flex: 1;
    height: 100%;
    font-size: 32rpx;
    color: $text-primary;

    &::placeholder {
        color: $text-placeholder;
    }
}

// 操作按钮
.modal-actions {
    display: flex;
    gap: 24rpx;
}

.btn-skip,
.btn-confirm {
    flex: 1;
    height: 96rpx;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    margin: 0;
    padding: 0;

    &::after {
        display: none;
    }
}

.btn-skip {
    background: #f5f5f5;
    color: $text-secondary;

    &:active {
        background: #ebebeb;
    }
}

.btn-confirm {
    background: $primary-gradient;
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba(107, 78, 255, 0.3);

    &:active {
        opacity: 0.9;
    }

    &[disabled] {
        opacity: 0.5;
        box-shadow: none;
    }
}
</style>
