/**
 * secureStorage.ts
 * Wraps expo-secure-store for encrypted token storage.
 * Falls back to in-memory storage if SecureStore is unavailable (web/simulator).
 */
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'navig_access_token'

// In-memory fallback for web / environments without Secure Store
const memStore: Record<string, string> = {}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    memStore[TOKEN_KEY] = token
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memStore[TOKEN_KEY] ?? null
  }
  return await SecureStore.getItemAsync(TOKEN_KEY)
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    delete memStore[TOKEN_KEY]
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
