import { Injectable } from '@nestjs/common';

interface PromptInput {
  content: string;
  tags: string[];
  emotion: string | null;
}

@Injectable()
export class PromptService {
  /**
   * 构建解析Prompt
   */
  buildAnalysisPrompt(input: PromptInput): string {
    const tagsText = input.tags.length > 0 ? input.tags.join('、') : '无';
    const emotionText = input.emotion || '未指定';

    return `你是一位专业的梦境解析师，精通心理学和中国传统解梦文化。请根据用户的梦境进行分析。

## 用户梦境
内容：${input.content}
标签：${tagsText}
情绪：${emotionText}

## 输出要求
请以JSON格式返回分析结果，包含以下字段：

{
  "theme": "一句话概括梦境主题（不超过15字）",
  "interpretation": "心理解读（3-5句话，需要专业但易懂，给予积极正面的引导）",
  "fortuneScore": 数字(60-95之间的运势评分),
  "fortuneTips": {
    "career": "事业运势提示（一句话）",
    "love": "感情运势提示（一句话）",
    "health": "健康运势提示（一句话）"
  },
  "task": {
    "type": "任务类型(wear/food/action三选一)",
    "content": "具体任务内容（简单有趣，容易完成）"
  }
}

## 任务类型说明
- wear: 穿戴类，如"今天戴红色饰品"
- food: 饮食类，如"喝咖啡时加一勺糖"
- action: 行动类，如"对陌生人微笑"

## 注意事项
1. 解读内容必须积极正面，给人希望和力量
2. 运势评分在60-95之间，不要过低打击用户
3. 任务要简单有趣，10分钟内能完成
4. 绝对避免使用"算命""预测未来"等敏感词
5. 语言要温暖亲切，像朋友间的交流

请直接返回JSON格式，不要有任何其他内容。`;
  }

  /**
   * 构建特定主题Prompt
   */
  buildThemePrompt(theme: string, input: PromptInput): string {
    const basePrompt = this.buildAnalysisPrompt(input);

    const themeGuides: Record<string, string> = {
      love: '请特别关注梦境中与感情、爱情、人际关系相关的元素进行深入分析。',
      career: '请特别关注梦境中与事业、工作、成就相关的元素进行深入分析。',
      wealth: '请特别关注梦境中与财富、金钱、机遇相关的元素进行深入分析。',
    };

    const themeGuide = themeGuides[theme];
    if (themeGuide) {
      return basePrompt.replace(
        '## 注意事项',
        `## 主题指引\n${themeGuide}\n\n## 注意事项`,
      );
    }

    return basePrompt;
  }
}
