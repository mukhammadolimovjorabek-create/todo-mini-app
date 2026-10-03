import { ieltsExamConfig } from './ielts';
import { multilevelExamConfig } from './multilevel';
import type { ExamConfig, ExamType } from '../types';

export const EXAM_REGISTRY: Record<ExamType, ExamConfig> = {
  ielts: ieltsExamConfig,
  multilevel: multilevelExamConfig,
};

export const getExamConfig = (type: ExamType): ExamConfig => {
  return EXAM_REGISTRY[type] || ieltsExamConfig;
};
