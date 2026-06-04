import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { goalsAPI } from '../../api/client'
import { useUserStore } from '../../store/userStore'
import PrimaryButton from '../../components/PrimaryButton'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { spacing, borderRadius } from '../../theme/spacing'

const EXAMPLE_GOALS = [
  'Become a backend developer',
  'Lose 15kg',
  'Start an online business',
  'Learn a new language',
]

interface Props {
  navigation: {
    replace: (screen: string) => void
  }
}

export default function GoalCreationScreen({ navigation }: Props) {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const { setActiveGoal } = useUserStore()

  const handleSetGoal = async () => {
    if (!goal.trim()) {
      Alert.alert('Error', 'Please enter your goal.')
      return
    }
    setLoading(true)
    try {
      const res = await goalsAPI.create(goal.trim())
      setActiveGoal(res.data)
      navigation.replace('Assessment')
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>What do you want{'\n'}to achieve?</Text>

        <TextInput
          style={styles.input}
          placeholder="What do you want to achieve?"
          placeholderTextColor={colors.textMuted}
          value={goal}
          onChangeText={setGoal}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          autoFocus
        />

        <View style={styles.chips}>
          {EXAMPLE_GOALS.map((eg) => (
            <TouchableOpacity
              key={eg}
              style={styles.chip}
              onPress={() => setGoal(eg)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{eg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton
          label="Set this goal"
          onPress={handleSetGoal}
          loading={loading}
          disabled={!goal.trim()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.inputs,
    padding: spacing.md,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    minHeight: 100,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.badges,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
})
