
export interface DivinationInput {
  itemName: string;
  lostLocation: string;
  direction: string;
  lostTime: string;
}

export interface DivinationResult {
  meihua: string;
  xiaoliuren: string;
  liuyao: string;
  summary: string;
  locationAnalysis: string;
  // 英文版本
  meihuaEn: string;
  xiaoliurenEn: string;
  liuyaoEn: string;
  summaryEn: string;
  locationAnalysisEn: string;
  probability: number; // Percentage of finding luck
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: DivinationInput;
  result: DivinationResult;
}

export enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
  NORTHEAST = 'NORTHEAST',
  NORTHWEST = 'NORTHWEST',
  SOUTHEAST = 'SOUTHEAST',
  SOUTHWEST = 'SOUTHWEST',
  CENTER = 'CENTER'
}

export type Language = 'zh' | 'en';
