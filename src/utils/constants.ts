import type { Block } from '../types/lab-config';

/** 所有用到 `records[labId] ?? EMPTY_BLOCKS` 的地方共享同一个引用。 */
export const EMPTY_BLOCKS: Block[] = [];

/** codeLanguages 的兜底常量。 */
export const DEFAULT_CODE_LANGUAGES = ['java', 'text'];