import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'
import * as SplashScreen from 'expo-splash-screen'
import AppNavigator from './src/navigation/AppNavigator'
import { useUserStore } from './src/store/userStore'
import { colors } from './src/theme/colors'

// Prevent the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
  const { hydrateToken } = useUserStore()
  const [appReady, setAppReady] = useState(false)

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  })

  // Hydrate stored token from SecureStore on first launch
  useEffect(() => {
    hydrateToken()
      .catch(() => {})
      .finally(() => setAppReady(true))
  }, [])

  // Hide splash when both fonts and async init are done
  useEffect(() => {
    if ((fontsLoaded || fontError) && appReady) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError, appReady])

  if ((!fontsLoaded && !fontError) || !appReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
