/**
 * 解析相关类型定义
 */

export interface Analysis {
  id: string
  dreamId: string
  status: AnalysisStatus
  theme: string
  interpretation: string
  fortuneScore: number
  fortuneTips: FortuneTips
  task: TaskSummary
  disclaimer: string
  createdAt: string
}

export interface FortuneTips {
  career: string
  love: string
  health: string
}

export interface TaskSummary {
  id: string
  type: TaskType
  content: string
  rewardPoints: number
}

export interface AnalysisRequest {
  dreamId: string
  adToken?: string
}

export interface AnalysisResponse {
  analysisId: string
  status: AnalysisStatus
}

export type AnalysisStatus = 'processing' | 'completed' | 'failed'
export type TaskType = 'wear' | 'food' | 'action'
