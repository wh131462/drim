/**
 * 校验工具
 */

/**
 * 梦境内容最小长度
 */
export const DREAM_MIN_LENGTH = 50

/**
 * 梦境内容最大长度
 */
export const DREAM_MAX_LENGTH = 500

/**
 * 校验梦境内容
 */
export function validateDreamContent(content: string): { valid: boolean; message: string } {
  const trimmed = content.trim()

  if (!trimmed) {
    return { valid: false, message: '请输入梦境内容' }
  }

  if (trimmed.length < DREAM_MIN_LENGTH) {
    return { valid: false, message: `梦境内容至少需要${DREAM_MIN_LENGTH}字` }
  }

  if (trimmed.length > DREAM_MAX_LENGTH) {
    return { valid: false, message: `梦境内容不能超过${DREAM_MAX_LENGTH}字` }
  }

  return { valid: true, message: '' }
}

/**
 * 校验标签数量
 */
export function validateTags(tags: string[]): { valid: boolean; message: string } {
  if (tags.length > 3) {
    return { valid: false, message: '最多选择3个标签' }
  }
  return { valid: true, message: '' }
}

/**
 * 判断是否为空
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 判断是否为有效 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
