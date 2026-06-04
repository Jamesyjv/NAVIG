import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { spacing } from '../theme/spacing'

interface Milestone {
  id: string
  title: string
  week_number: number
  completed: boolean
}

interface Props {
  milestone: Milestone
  onToggle: (id: string) => void
}

export default function MilestoneRow({ milestone, onToggle }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.week}>WK {milestone.week_number}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {milestone.title}
      </Text>
      <TouchableOpacity
        onPress={() => onToggle(milestone.id)}
        style={styles.toggle}
        activeOpacity={0.7}
      >
        {milestone.completed ? (
          <View style={styles.completedCircle}>
            <Feather name="check" size={12} color={colors.background} />
          </View>
        ) : (
          <View style={styles.incompleteCircle} />
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  week: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.accent,
    width: 36,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  toggle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompleteCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  completedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
