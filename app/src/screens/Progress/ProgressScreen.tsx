import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { progressAPI } from '../../api/client'
import { useUserStore } from '../../store/userStore'
import ProgressRing from '../../components/ProgressRing'
import MilestoneRow from '../../components/MilestoneRow'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { rw, rh, rf, isTablet } from '../../theme/responsive'

interface Milestone {
  id: string
  title: string
  week_number: number
  completed: boolean
}

interface ProgressData {
  completed_milestones: number
  total_milestones: number
  completed_missions: number
  total_missions: number
  current_week: number
  milestones: Milestone[]
}

export default function ProgressScreen() {
  const { activeGoal } = useUserStore()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchProgress = useCallback(async () => {
    if (!activeGoal) return
    try {
      const res = await progressAPI.get(activeGoal.id)
      setData(res.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeGoal])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const handleToggleMilestone = async (id: string) => {
    try {
      await progressAPI.completeMilestone(id)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          milestones: prev.milestones.map((m) =>
            m.id === id ? { ...m, completed: !m.completed } : m
          ),
          completed_milestones: prev.milestones.find((m) => m.id === id)?.completed
            ? prev.completed_milestones - 1
            : prev.completed_milestones + 1,
        }
      })
    } catch {
      /* ignore toggle errors */
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchProgress()
  }

  const milestonePct =
    data && data.total_milestones > 0 ? data.completed_milestones / data.total_milestones : 0

  const missionPct =
    data && data.total_missions > 0 ? data.completed_missions / data.total_missions : 0

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
        <Text style={styles.pageTitle}>Progress</Text>
        {activeGoal && (
          <Text style={styles.goalName} numberOfLines={2}>
            {activeGoal.title}
          </Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : !data ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No progress data yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete your first mission to see progress here.
            </Text>
          </View>
        ) : (
          <>
            {/* Ring stats */}
            <View style={styles.ringsRow}>
              <View style={styles.ringItem}>
                <ProgressRing
                  percentage={Math.round(milestonePct * 100)}
                  size={110}
                  strokeWidth={8}
                  color={colors.accent}
                />
                <Text style={styles.ringLabel}>Milestones</Text>
                <Text style={styles.ringSubLabel}>
                  {data.completed_milestones} / {data.total_milestones}
                </Text>
              </View>
              <View style={styles.ringItem}>
                <ProgressRing
                  percentage={Math.round(missionPct * 100)}
                  size={110}
                  strokeWidth={8}
                  color={colors.success}
                />
                <Text style={styles.ringLabel}>Missions</Text>
                <Text style={styles.ringSubLabel}>
                  {data.completed_missions} / {data.total_missions}
                </Text>
              </View>
            </View>

            {/* Week badge */}
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeLabel}>CURRENT WEEK</Text>
              <Text style={styles.weekBadgeValue}>Week {data.current_week}</Text>
            </View>

            {/* Milestones list */}
            <Text style={styles.sectionTitle}>All Milestones</Text>
            <View style={styles.milestoneList}>
              {data.milestones.map((m) => (
                <MilestoneRow key={m.id} milestone={m} onToggle={handleToggleMilestone} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
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
  pageTitle: {
    fontSize: rf(28),
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: rh(16),
  },
  goalName: {
    fontSize: rf(14),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    lineHeight: rh(20),
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
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: rh(24),
  },
  ringItem: { alignItems: 'center', gap: rh(8) },
  ringLabel: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
  },
  ringSubLabel: {
    fontSize: rf(12),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  weekBadge: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: rw(16),
    paddingVertical: rh(12),
  },
  weekBadgeLabel: {
    fontSize: rf(10),
    fontFamily: typography.fontFamily.medium,
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  weekBadgeValue: {
    fontSize: rf(20),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: rf(17),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  milestoneList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
})
