import React, { useRef } from 'react'
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { spacing, borderRadius } from '../theme/spacing'

interface Props {
  label: string
  selected: boolean
  onPress: () => void
}

export default function AssessmentCard({ label, selected, onPress }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start()
    onPress()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, selected && styles.selected]}
      >
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.buttons,
    padding: spacing.md,
    alignItems: 'center',
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}14`, // 8% opacity
  },
  label: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.textPrimary,
  },
})
