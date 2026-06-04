import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { borderRadius } from '../theme/spacing'

interface Props {
  label: string
  onPress: () => void
  variant?: 'filled' | 'outline'
  disabled?: boolean
  loading?: boolean
}

export default function PrimaryButton({
  label,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.button,
        variant === 'filled' ? styles.filled : styles.outline,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'filled' ? colors.background : colors.accent}
          size="small"
        />
      ) : (
        <Text style={[styles.label, variant === 'outline' && styles.labelOutline]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: borderRadius.buttons,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filled: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.38,
  },
  label: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.background,
  },
  labelOutline: {
    color: colors.accent,
  },
})
