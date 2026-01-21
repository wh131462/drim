/**
 * 用户相关类型定义
 */

export interface User {
  id: string
  openId: string
  nickname: string
  avatar: string | null
  gender: number
  isVip: boolean
  vipExpireAt: string | null
  luckyPoints: number
  consecutiveDays: number
  totalDreams: number
  totalTasks: number
  createdAt: string
}

export interface UserStats {
  totalDreams: number
  totalAnalysis: number
  totalTasks: number
  taskCompletionRate: number
  currentStreak: number
  longestStreak: number
  luckyPoints: number
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  icon: string
  unlockedAt: string
}

export interface LoginParams {
  code: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
  userInfo: User
  isNewUser: boolean
}
