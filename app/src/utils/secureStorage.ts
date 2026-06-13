/**
 * secureStorage.ts
 * Wraps expo-secure-store for encrypted token storage on mobile.
 * On web, falls back to localStorage via globalThis (survives page reloads).
 * Uses explicit interface + globalThis bracket notation so TypeScript doesn't
 * require DOM lib types to compile this file.
 */
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'navig_access_token'

// ── Minimal storage interface (no DOM lib types needed) ────────────────────
interface SimpleStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Returns the browser's localStorage if running on web, otherwise null.
 * Uses (globalThis as Record<string, unknown>) to avoid requiring DOM lib types.
 */
function getWebStorage(): SimpleStorage | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ls = (globalThis as Record<string, any>)['localStorage']
    return ls != null ? (ls as SimpleStorage) : null
  } catch {
    return null
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(TOKEN_KEY, token)
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(TOKEN_KEY) ?? null
  }
  return await SecureStore.getItemAsync(TOKEN_KEY)
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(TOKEN_KEY)
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
