import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { rw, rh, rf } from '../theme/responsive'

interface Props {
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function DecisionBubble({ role, content, timestamp }: Props) {
  const isUser = role === 'user'
  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>N</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.content, isUser ? styles.userContent : styles.aiContent]}>
          {content}
        </Text>
        <Text style={[styles.time, isUser ? styles.userTime : styles.aiTime]}>
          {formatTime(timestamp)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rw(8),
    maxWidth: '85%',
  },
  rowLeft: { alignSelf: 'flex-start' },
  rowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiAvatar: {
    width: rw(28),
    height: rw(28),
    borderRadius: rw(14),
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiAvatarText: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.bold,
    color: colors.background,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: rw(14),
    paddingVertical: rh(10),
    gap: rh(4),
    flexShrink: 1,
  },
  userBubble: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: rf(14),
    lineHeight: rh(20),
  },
  userContent: {
    fontFamily: typography.fontFamily.regular,
    color: colors.background,
  },
  aiContent: {
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  time: {
    fontSize: rf(10),
    fontFamily: typography.fontFamily.regular,
    alignSelf: 'flex-end',
  },
  userTime: { color: 'rgba(0,0,0,0.45)' },
  aiTime: { color: colors.textMuted },
})
