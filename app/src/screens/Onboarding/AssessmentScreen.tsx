import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { goalsAPI, roadmapAPI } from '../../api/client'
import { useUserStore } from '../../store/userStore'
import AssessmentCard from '../../components/AssessmentCard'
import PrimaryButton from '../../components/PrimaryButton'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { spacing } from '../../theme/spacing'

const QUESTIONS = [
  {
    key: 'experience_level',
    question: 'What is your current experience level?',
    options: [
      { label: "None — I'm starting from zero", value: 'none' },
      { label: "Beginner — I've tried a few things", value: 'beginner' },
      { label: 'Intermediate — I have some foundation', value: 'intermediate' },
    ],
  },
  {
    key: 'hours_per_week',
    question: 'How many hours can you dedicate per week?',
    options: [
      { label: '1–3 hours (low commitment)', value: 3 },
      { label: '4–7 hours (moderate commitment)', value: 7 },
      { label: '8–14 hours (high commitment)', value: 14 },
      { label: '15–20 hours (full focus)', value: 20 },
    ],
  },
  {
    key: 'budget_usd',
    question: 'What is your budget for resources?',
    options: [
      { label: '$0 — Free resources only', value: 0 },
      { label: 'Under $50 — A little to invest', value: 50 },
      { label: '$50–$200 — Willing to invest', value: 200 },
      { label: "No limit — I'll invest what it takes", value: 1000 },
    ],
  },
  {
    key: 'deadline_weeks',
    question: 'What is your target deadline?',
    options: [
      { label: '1 month — Fast track', value: 4 },
      { label: '3 months — Standard pace', value: 12 },
      { label: '6 months — Comfortable pace', value: 24 },
      { label: '1 year — Long game', value: 48 },
    ],
  },
]

interface Props {
  navigation: {
    replace: (screen: string) => void
  }
}

export default function AssessmentScreen({ navigation }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [selected, setSelected] = useState<string | number | null>(null)
  const [loading, setLoading] = useState(false)
  const { updateActiveGoal } = useUserStore()

  const currentQ = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  const handleContinue = async () => {
    if (selected === null) return

    const newAnswers = { ...answers, [currentQ.key]: selected }
    setAnswers(newAnswers)
    setSelected(null)

    if (!isLast) {
      setStep(step + 1)
      return
    }

    // Last step — save assessment + generate roadmap
    setLoading(true)
    try {
      await goalsAPI.updateActive(newAnswers)
      updateActiveGoal(newAnswers)
      await roadmapAPI.generate()
      navigation.replace('MainTabs')
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      Alert.alert('Error', err.response?.data?.detail || 'Failed to generate roadmap')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Building your personalized roadmap…</Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${((step + 1) / QUESTIONS.length) * 100}%` }]}
        />
      </View>
      <Text style={styles.stepLabel}>
        {step + 1} of {QUESTIONS.length}
      </Text>

      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{currentQ.question}</Text>

        <View style={styles.options}>
          {currentQ.options.map((opt) => (
            <AssessmentCard
              key={String(opt.value)}
              label={opt.label}
              selected={selected === opt.value}
              onPress={() => setSelected(opt.value)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isLast ? 'Generate My Roadmap' : 'Continue'}
          onPress={handleContinue}
          disabled={selected === null}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
  },
  stepLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  question: {
    fontSize: typography.fontSize.title,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 32,
  },
  options: {
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
})
