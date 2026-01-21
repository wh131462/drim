/**
 * 情绪选项常量
 */

import type { EmotionOption, Emotion } from '@/types/dream'

export const EMOTION_OPTIONS: EmotionOption[] = [
  { id: 'happy', name: '开心', icon: '' },
  { id: 'fear', name: '恐惧', icon: '' },
  { id: 'confused', name: '困惑', icon: '' },
  { id: 'sad', name: '悲伤', icon: '' }
]

/**
 * 根据 ID 获取情绪
 */
export function getEmotionById(id: Emotion): EmotionOption | undefined {
  return EMOTION_OPTIONS.find((emotion) => emotion.id === id)
}
