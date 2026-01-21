/**
 * 梦境标签常量
 */

import type { DreamTag } from '@/types/dream'

export const DREAM_TAGS: DreamTag[] = [
  { id: 'chase', name: '追逐', icon: '' },
  { id: 'flying', name: '飞行', icon: '' },
  { id: 'exam', name: '考试', icon: '' },
  { id: 'family', name: '亲人', icon: '' },
  { id: 'water', name: '水', icon: '' },
  { id: 'animal', name: '动物', icon: '' },
  { id: 'lost', name: '迷路', icon: '' },
  { id: 'death', name: '死亡', icon: '' },
  { id: 'teeth', name: '牙齿', icon: '' },
  { id: 'naked', name: '裸体', icon: '' }
]

/**
 * 根据 ID 获取标签
 */
export function getTagById(id: string): DreamTag | undefined {
  return DREAM_TAGS.find((tag) => tag.id === id)
}

/**
 * 根据 ID 列表获取标签
 */
export function getTagsByIds(ids: string[]): DreamTag[] {
  return ids.map((id) => getTagById(id)).filter(Boolean) as DreamTag[]
}
