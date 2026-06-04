import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

interface Props {
  /** 0–100 */
  percentage: number
  /** Outer diameter in dp. Default: 120 */
  size?: number
  /** Stroke ring width in dp. Default: 10 */
  strokeWidth?: number
  /** Accent colour for the filled arc. Default: colors.accent */
  color?: string
  /** Whether to show the percentage label inside the ring. Default: true */
  showLabel?: boolean
}

export default function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = colors.accent,
  showLabel = true,
}: Props) {
  const clampedPct = Math.min(Math.max(percentage, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference
  const center = size / 2

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress fill */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {showLabel && (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.labelContainer}>
            <Text style={[styles.percent, { fontSize: size > 100 ? 22 : 16, color }]}>
              {clampedPct}%
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
})
