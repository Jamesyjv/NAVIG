import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { missionsAPI } from '../../api/client'
import { useUserStore } from '../../store/userStore'
import MissionCard from '../../components/MissionCard'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { rw, rh, rf, isTablet } from '../../theme/responsive'

interface Mission {
  id: string
  task: string
  why: string | null
  estimated_minutes: number | null
  priority: string
  completed: boolean
}

interface Props {
  navigation: {
    navigate: (screen: string) => void
  }
}

export default function HomeScreen({ navigation }: Props) {
  const { user, activeGoal, logout } = useUserStore()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchMissions = useCallback(async () => {
    try {
      const res = await missionsAPI.getToday()
      setMissions(res.data)
    } catch {
      // fallback — show empty state
      setMissions([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  const handleComplete = async (id: string) => {
    setCompleting(id)
    try {
      await missionsAPI.complete(id)
      setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, completed: true } : m)))
    } catch {
      Alert.alert('Error', 'Could not mark mission complete. Try again.')
    } finally {
      setCompleting(null)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchMissions()
  }

  const completedCount = missions.filter((m) => m.completed).length
  const greeting = getGreeting()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.inner, isTablet && styles.innerTablet]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user?.name ?? 'Navigator'} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Log out?', '', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: logout },
              ])
            }
            style={styles.avatarBtn}
            accessibilityLabel="Open profile menu"
          >
            <Text style={styles.avatarText}>{(user?.name?.[0] ?? 'N').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Goal pill */}
        {activeGoal && (
          <View style={styles.goalPill}>
            <Text style={styles.goalPillLabel}>Active goal</Text>
            <Text style={styles.goalPillTitle} numberOfLines={1}>
              {activeGoal.title}
            </Text>
          </View>
        )}

        {/* Mission progress summary */}
        {missions.length > 0 && (
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {completedCount} / {missions.length} missions today
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(completedCount / missions.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Section title */}
        <Text style={styles.sectionTitle}>Today's Mission</Text>

        {/* Content */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : missions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No missions yet</Text>
            <Text style={styles.emptySubtitle}>
              Pull down to refresh — your AI coach is preparing today's tasks.
            </Text>
          </View>
        ) : (
          missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onComplete={() => handleComplete(mission.id)}
              loading={completing === mission.id}
            />
          ))
        )}

        {/* Quick navigation */}
        <View style={styles.quickNav}>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => navigation.navigate('Progress')}
            accessibilityLabel="View progress"
          >
            <Text style={styles.quickNavIcon}>📈</Text>
            <Text style={styles.quickNavLabel}>Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => navigation.navigate('Decision')}
            accessibilityLabel="Ask AI decision assistant"
          >
            <Text style={styles.quickNavIcon}>🤖</Text>
            <Text style={styles.quickNavLabel}>Ask AI</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  inner: {
    paddingHorizontal: rw(16),
    paddingBottom: rh(40),
    gap: rh(16),
  },
  innerTablet: {
    paddingHorizontal: rw(48),
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rh(16),
  },
  headerLeft: { gap: 2 },
  greeting: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  name: {
    fontSize: rf(22),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  avatarBtn: {
    width: rw(40),
    height: rw(40),
    borderRadius: rw(20),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: rf(16),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.accent,
  },
  goalPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: rw(14),
    paddingVertical: rh(10),
    gap: 3,
  },
  goalPillLabel: {
    fontSize: rf(11),
    fontFamily: typography.fontFamily.medium,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  goalPillTitle: {
    fontSize: rf(15),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  progressRow: {
    gap: rh(6),
  },
  progressText: {
    fontSize: rf(12),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: rf(18),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  loader: { marginTop: rh(60) },
  emptyState: {
    alignItems: 'center',
    paddingVertical: rh(48),
    gap: rh(8),
  },
  emptyEmoji: { fontSize: rf(40) },
  emptyTitle: {
    fontSize: rf(18),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: rf(14),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: rh(20),
    paddingHorizontal: rw(20),
  },
  quickNav: {
    flexDirection: 'row',
    gap: rw(12),
    marginTop: rh(8),
  },
  quickNavBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: rh(16),
    alignItems: 'center',
    gap: rh(6),
  },
  quickNavIcon: { fontSize: rf(22) },
  quickNavLabel: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
  },
})
