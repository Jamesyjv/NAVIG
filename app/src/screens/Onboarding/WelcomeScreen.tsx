import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { authAPI, goalsAPI } from '../../api/client'
import { useUserStore } from '../../store/userStore'
import PrimaryButton from '../../components/PrimaryButton'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { spacing, borderRadius } from '../../theme/spacing'

interface Props {
  navigation: {
    replace: (screen: string) => void
  }
}

export default function WelcomeScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { setUser, setToken, setActiveGoal } = useUserStore()

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields.')
      return
    }
    setLoading(true)
    try {
      await authAPI.register(email.trim(), name.trim(), password)
      const loginRes = await authAPI.login(email.trim(), password)
      setToken(loginRes.data.access_token)
      const meRes = await authAPI.me()
      setUser(meRes.data)
      navigation.replace('GoalCreation')
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      Alert.alert('Error', err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields.')
      return
    }
    setLoading(true)
    try {
      const loginRes = await authAPI.login(email.trim(), password)
      setToken(loginRes.data.access_token)
      const meRes = await authAPI.me()
      setUser(meRes.data)
      // Try to fetch active goal
      try {
        const goalRes = await goalsAPI.getActive()
        setActiveGoal(goalRes.data)
        navigation.replace('MainTabs')
      } catch {
        navigation.replace('GoalCreation')
      }
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      Alert.alert('Error', err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'welcome') {
    return (
      <View style={styles.screen}>
        <View style={styles.hero}>
          <Text style={styles.logo}>NAVIG</Text>
          <Text style={styles.tagline}>The AI that always knows{'\n'}your next best step.</Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="Get Started" onPress={() => setMode('register')} />
          <PrimaryButton
            label="I already have an account"
            onPress={() => setMode('login')}
            variant="outline"
          />
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.formTitle}>
          {mode === 'register' ? 'Create account' : 'Welcome back'}
        </Text>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <PrimaryButton
          label={mode === 'register' ? 'Create Account' : 'Log In'}
          onPress={mode === 'register' ? handleRegister : handleLogin}
          loading={loading}
        />
        <PrimaryButton
          label={
            mode === 'register' ? 'Already have an account? Log in' : 'New here? Create account'
          }
          onPress={() => setMode(mode === 'register' ? 'login' : 'register')}
          variant="outline"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  logo: {
    fontSize: 48,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  form: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  formTitle: {
    fontSize: typography.fontSize.title,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.inputs,
    height: 52,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
})
