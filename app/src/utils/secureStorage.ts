/**
 * secureStorage.ts
 * Wraps expo-secure-store for encrypted token storage on mobile.
 * Falls back to localStorage on web (survives page reloads; tokens are
 * not sensitive in the same way on a controlled web build).
 */
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'navig_access_token'

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* localStorage unavailable (SSR/private mode) — no-op */
    }
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  }
  return await SecureStore.getItemAsync(TOKEN_KEY)
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* no-op */
    }
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
