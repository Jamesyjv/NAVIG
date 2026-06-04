import React, { useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { spacing, borderRadius } from '../theme/spacing'
import PrimaryButton from './PrimaryButton'

interface Mission {
  id: string
  task: string
  why: string | null
  estimated_minutes: number | null
  priority: string
  completed: boolean
}

interface Props {
  mission: Mission
  onComplete: () => void
  loading?: boolean
}

export default function MissionCard({ mission, onComplete, loading = false }: Props) {
  const borderColorAnim = useRef(new Animated.Value(0)).current

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.success],
  })

  const handleComplete = () => {
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start()
    onComplete()
  }

  return (
    <Animated.View
      style={[styles.card, { borderColor: mission.completed ? colors.success : borderColor }]}
    >
      <Text style={styles.task}>{mission.task}</Text>

      <View style={styles.badgeRow}>
        {mission.estimated_minutes != null && (
          <View style={styles.badge}>
            <Feather name="clock" size={10} color={colors.textMuted} />
            <Text style={styles.badgeText}> {mission.estimated_minutes} min</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Feather name="zap" size={10} color={colors.textMuted} />
          <Text style={styles.badgeText}> {mission.priority}</Text>
        </View>
      </View>

      {mission.why ? <Text style={styles.why}>{mission.why}</Text> : null}

      <View style={styles.divider} />

      {mission.completed ? (
        <View style={styles.completedRow}>
          <Feather name="check-circle" size={18} color={colors.success} />
          <Text style={styles.completedText}>Mission complete!</Text>
        </View>
      ) : (
        <PrimaryButton label="Mark Complete" onPress={handleComplete} loading={loading} />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 0.5,
    borderRadius: borderRadius.cards,
    padding: spacing.md,
    gap: spacing.sm,
  },
  task: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badges,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  why: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  completedText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.success,
  },
})
