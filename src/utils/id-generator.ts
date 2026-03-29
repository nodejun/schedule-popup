/**
 * UUID 생성 유틸리티
 * nanoid 없이 네이티브 crypto API 사용
 */
export const generateId = (): string => crypto.randomUUID()
