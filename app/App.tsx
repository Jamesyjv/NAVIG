import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native'
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

// Only prevent splash auto-hide on native — on web it blocks the entire render
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {})
}

export default function App() {
  const { hydrateToken } = useUserStore()
  const [appReady, setAppReady] = useState(false)

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  })

  // Hydrate stored token on first launch.
  // Safety timeout ensures the app renders even if something unexpected hangs.
  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 3000)
    hydrateToken()
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer)
        setAppReady(true)
      })
  }, [])

  // Hide splash when both fonts and async init are done (native only)
  useEffect(() => {
    if ((fontsLoaded || fontError) && appReady && Platform.OS !== 'web') {
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
