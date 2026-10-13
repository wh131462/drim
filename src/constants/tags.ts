/**
 * 梦境标签常量和工具函数
 */

import type { DreamTag } from '@/types/dream';

/**
 * 预设标签列表（带图标）
 */
export const DREAM_TAGS: DreamTag[] = [
    { id: 'running', name: '追逐', icon: '/static/icons/running.svg' },
    { id: 'flying', name: '飞行', icon: '/static/icons/plane.svg' },
    { id: 'falling', name: '坠落', icon: '/static/icons/falling.svg' },
    { id: 'exam', name: '考试', icon: '/static/icons/exam.svg' },
    { id: 'family', name: '家人', icon: '/static/icons/family.svg' },
    { id: 'water', name: '水', icon: '/static/icons/water.svg' },
    { id: 'animal', name: '动物', icon: '/static/icons/animal.svg' },
    { id: 'lost', name: '迷路', icon: '/static/icons/map.svg' },
    { id: 'death', name: '死亡', icon: '/static/icons/death.svg' },
    { id: 'work', name: '工作', icon: '/static/icons/work.svg' },
    { id: 'love', name: '爱情', icon: '/static/icons/heart.svg' },
    { id: 'teeth', name: '牙齿', icon: '/static/icons/teeth.svg' },
    // 兼容旧数据
    { id: 'chase', name: '追逐', icon: '/static/icons/running.svg' },
    { id: 'chased', name: '被追', icon: '/static/icons/running.svg' }
];

/**
 * 根据 ID 获取标签
 */
export function getTagById(id: string): DreamTag | undefined {
    return DREAM_TAGS.find((tag) => tag.id === id);
}

/**
 * 根据 ID 列表获取标签
 */
export function getTagsByIds(ids: string[]): DreamTag[] {
    return ids.map((id) => getTagById(id)).filter(Boolean) as DreamTag[];
}

/**
 * 获取标签的显示名称，图标由页面单独渲染
 */
export function getTagDisplayName(tagId: string): string {
    return getTagName(tagId);
}

export function getTagIcon(tagId: string): string {
    const tag = getTagById(tagId) || DREAM_TAGS.find((item) => item.name === tagId);
    return tag?.icon || '/static/icons/sparkle.svg';
}

/**
 * 获取标签的简短显示名称（不带图标）
 */
export function getTagName(tagId: string): string {
    const presetTag = getTagById(tagId);
    if (presetTag) {
        return presetTag.name;
    }
    // 处理旧格式的自定义标签（custom_timestamp）
    if (tagId.startsWith('custom_')) {
        return '自定义';
    }
    // 新格式自定义标签：ID 就是名称
    return tagId;
}

/**
 * 判断是否为预设标签
 */
export function isPresetTag(tagId: string): boolean {
    return DREAM_TAGS.some((tag) => tag.id === tagId);
}

/**
 * 获取用于筛选显示的标签列表
 */
export function getFilterTags(): Array<{ id: string; name: string; icon: string }> {
    // 返回主要的预设标签（去除兼容标签）
    return [
        { id: 'running', name: '追逐', icon: '/static/icons/running.svg' },
        { id: 'flying', name: '飞行', icon: '/static/icons/plane.svg' },
        { id: 'falling', name: '坠落', icon: '/static/icons/falling.svg' },
        { id: 'exam', name: '考试', icon: '/static/icons/exam.svg' },
        { id: 'family', name: '家人', icon: '/static/icons/family.svg' },
        { id: 'water', name: '水', icon: '/static/icons/water.svg' },
        { id: 'animal', name: '动物', icon: '/static/icons/animal.svg' },
        { id: 'lost', name: '迷路', icon: '/static/icons/map.svg' },
        { id: 'death', name: '死亡', icon: '/static/icons/death.svg' },
        { id: 'work', name: '工作', icon: '/static/icons/work.svg' },
        { id: 'love', name: '爱情', icon: '/static/icons/heart.svg' }
    ];
}
