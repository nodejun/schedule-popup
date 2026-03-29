/**
 * chrome.storage 추상화 계층
 * sync/local에 대한 제네릭 래퍼
 * 모든 함수는 Promise 기반
 */

type StorageArea = 'sync' | 'local'

const getArea = (area: StorageArea): chrome.storage.StorageArea =>
  area === 'sync' ? chrome.storage.sync : chrome.storage.local

export const storageGet = async <T>(
  key: string,
  area: StorageArea = 'sync'
): Promise<T | undefined> => {
  try {
    const result = await getArea(area).get(key)
    return result[key] as T | undefined
  } catch (error) {
    throw new Error(
      `Storage get failed for key "${key}": ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const storageSet = async (
  key: string,
  value: unknown,
  area: StorageArea = 'sync'
): Promise<void> => {
  try {
    await getArea(area).set({ [key]: value })
  } catch (error) {
    throw new Error(
      `Storage set failed for key "${key}": ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const storageRemove = async (
  key: string,
  area: StorageArea = 'sync'
): Promise<void> => {
  try {
    await getArea(area).remove(key)
  } catch (error) {
    throw new Error(
      `Storage remove failed for key "${key}": ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const storageGetMultiple = async <T>(
  keys: ReadonlyArray<string>,
  area: StorageArea = 'sync'
): Promise<Record<string, T>> => {
  try {
    const result = await getArea(area).get([...keys])
    return result as Record<string, T>
  } catch (error) {
    throw new Error(
      `Storage get multiple failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const onStorageChanged = (
  callback: (changes: Record<string, chrome.storage.StorageChange>) => void,
  area: StorageArea = 'sync'
): (() => void) => {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ): void => {
    if (areaName === area) {
      callback(changes)
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
