import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { decisionAPI } from '../../api/client'
import { useUserStore } from '../../store/userStore'
import DecisionBubble from '../../components/DecisionBubble'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { rw, rh, rf, isTablet } from '../../theme/responsive'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

const QUICK_QUESTIONS = [
  'What should I focus on this week?',
  'Am I on track for my deadline?',
  'What should I do tomorrow?',
  'How can I speed up my progress?',
]

export default function DecisionScreen() {
  const { activeGoal } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await decisionAPI.history()
        const history: Message[] = []
        res.data.forEach(
          (d: { id: string | number; question: string; answer: string; created_at: string }) => {
            history.push({
              id: `q-${d.id}`,
              role: 'user',
              content: d.question,
              timestamp: d.created_at,
            })
            history.push({
              id: `a-${d.id}`,
              role: 'ai',
              content: d.answer,
              timestamp: d.created_at,
            })
          }
        )
        setMessages(history)
      } catch {
        setMessages([])
      } finally {
        setHistoryLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const sendMessage = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || !activeGoal) return
    setInput('')
    setLoading(true)

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const res = await decisionAPI.ask(activeGoal.id, q)
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'ai',
        content: res.data.answer,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: 'ai',
        content: 'I had trouble connecting. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>AI Advisor</Text>
          <Text style={styles.pageSubtitle}>Ask anything about your goal</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageArea}
          contentContainerStyle={[styles.messageInner, isTablet && styles.messageInnerTablet]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {historyLoading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🤖</Text>
              <Text style={styles.emptyTitle}>Ask your AI advisor</Text>
              <Text style={styles.emptySubtitle}>
                I know your goal, timeline, budget, and current progress. I'll give you exact,
                personalised advice.
              </Text>
              {/* Quick question chips */}
              <View style={styles.chips}>
                {QUICK_QUESTIONS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.chip}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg) => (
              <DecisionBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))
          )}

          {/* AI typing indicator */}
          {loading && (
            <View style={styles.typingRow}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotMid]} />
              <View style={styles.typingDot} />
            </View>
          )}
        </ScrollView>

        {/* Quick chips when messages exist */}
        {messages.length > 0 && !loading && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsHScroll}
            style={styles.chipsHWrapper}
          >
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.chip}
                onPress={() => sendMessage(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, isTablet && styles.inputBarTablet]}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask anything…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: rw(16),
    paddingTop: rh(16),
    paddingBottom: rh(8),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontSize: rf(22),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  messageArea: { flex: 1 },
  messageInner: {
    paddingHorizontal: rw(16),
    paddingVertical: rh(16),
    gap: rh(12),
    flexGrow: 1,
  },
  messageInnerTablet: {
    paddingHorizontal: rw(48),
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  loader: { marginTop: rh(40) },
  emptyState: {
    alignItems: 'center',
    paddingTop: rh(32),
    gap: rh(8),
  },
  emptyEmoji: { fontSize: rf(44) },
  emptyTitle: {
    fontSize: rf(20),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: rf(14),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: rh(20),
    paddingHorizontal: rw(16),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: rw(8),
    marginTop: rh(8),
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: rw(14),
    paddingVertical: rh(8),
  },
  chipText: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  typingRow: {
    flexDirection: 'row',
    gap: rw(5),
    paddingLeft: rw(16),
    paddingVertical: rh(12),
  },
  typingDot: {
    width: rw(7),
    height: rw(7),
    borderRadius: rw(4),
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  typingDotMid: { opacity: 0.85 },
  chipsHWrapper: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingVertical: rh(10),
    flexGrow: 0,
  },
  chipsHScroll: {
    paddingHorizontal: rw(16),
    gap: rw(8),
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rw(10),
    paddingHorizontal: rw(16),
    paddingVertical: rh(12),
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputBarTablet: { paddingHorizontal: rw(48) },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: rw(16),
    paddingVertical: rh(10),
    fontSize: rf(14),
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    maxHeight: rh(120),
  },
  sendBtn: {
    width: rw(42),
    height: rw(42),
    borderRadius: rw(21),
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendBtnText: {
    fontSize: rf(18),
    color: colors.background,
    fontFamily: typography.fontFamily.bold,
  },
})
