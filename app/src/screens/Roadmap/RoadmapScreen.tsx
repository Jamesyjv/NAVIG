import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { roadmapAPI } from '../../api/client'
import { useUserStore } from '../../store/userStore'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { rw, rh, rf, isTablet } from '../../theme/responsive'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Mission {
  id: string
  title: string
  description: string
  day_of_week: number
  estimated_minutes: number
  completed: boolean
}

interface Milestone {
  id: string
  title: string
  description: string
  week_number: number
  completed: boolean
  missions: Mission[]
}

interface RoadmapData {
  id: string
  goal_title: string
  current_week: number
  total_weeks: number
  milestones: Milestone[]
}

// ─── Day label helper ────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── MilestoneCard ──────────────────────────────────────────────────────────

interface MilestoneCardProps {
  milestone: Milestone
  isCurrent: boolean
}

function MilestoneCard({ milestone, isCurrent }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(isCurrent)

  const completedMissions = milestone.missions.filter((m) => m.completed).length
  const pct =
    milestone.missions.length > 0
      ? Math.round((completedMissions / milestone.missions.length) * 100)
      : 0

  return (
    <View
      style={[
        styles.milestoneCard,
        isCurrent && styles.milestoneCardCurrent,
        milestone.completed && styles.milestoneCardDone,
      ]}
    >
      {/* Card header */}
      <TouchableOpacity
        style={styles.milestoneHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
        accessibilityLabel={`Week ${milestone.week_number}: ${milestone.title}`}
      >
        {/* Week badge */}
        <View style={[styles.weekBadge, isCurrent && styles.weekBadgeCurrent]}>
          <Text style={[styles.weekBadgeText, isCurrent && styles.weekBadgeTextCurrent]}>
            WK {milestone.week_number}
          </Text>
        </View>

        {/* Title + progress */}
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneTitle} numberOfLines={2}>
            {milestone.title}
          </Text>
          {milestone.missions.length > 0 && (
            <Text style={styles.missionCount}>
              {completedMissions}/{milestone.missions.length} missions · {pct}%
            </Text>
          )}
        </View>

        {/* Status icon */}
        <View style={styles.statusIcon}>
          {milestone.completed ? (
            <Feather name="check-circle" size={rf(18)} color={colors.success} />
          ) : isCurrent ? (
            <Feather name="zap" size={rf(18)} color={colors.accent} />
          ) : (
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={rf(18)}
              color={colors.textMuted}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Thin progress bar */}
      {milestone.missions.length > 0 && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      )}

      {/* Expandable body */}
      {expanded && (
        <View style={styles.milestoneBody}>
          {milestone.description ? (
            <Text style={styles.milestoneDesc}>{milestone.description}</Text>
          ) : null}

          {milestone.missions.length > 0 ? (
            <View style={styles.missionList}>
              {milestone.missions.map((mission, idx) => (
                <View key={mission.id} style={styles.missionRow}>
                  {/* Connector dot */}
                  <View style={styles.connectorCol}>
                    <View
                      style={[
                        styles.connectorDot,
                        mission.completed && styles.connectorDotDone,
                      ]}
                    />
                    {idx < milestone.missions.length - 1 && (
                      <View style={styles.connectorLine} />
                    )}
                  </View>

                  {/* Mission content */}
                  <View style={styles.missionContent}>
                    <View style={styles.missionTopRow}>
                      <Text
                        style={[
                          styles.missionTitle,
                          mission.completed && styles.missionTitleDone,
                        ]}
                        numberOfLines={2}
                      >
                        {mission.title}
                      </Text>
                      {mission.completed && (
                        <Feather name="check" size={rf(12)} color={colors.success} />
                      )}
                    </View>
                    {mission.description ? (
                      <Text style={styles.missionDesc} numberOfLines={3}>
                        {mission.description}
                      </Text>
                    ) : null}
                    <View style={styles.missionMeta}>
                      {mission.day_of_week !== undefined && (
                        <Text style={styles.metaChip}>
                          {DAY_LABELS[mission.day_of_week] ?? `Day ${mission.day_of_week}`}
                        </Text>
                      )}
                      {mission.estimated_minutes > 0 && (
                        <Text style={styles.metaChip}>{mission.estimated_minutes} min</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noMissions}>No missions scheduled yet.</Text>
          )}
        </View>
      )}
    </View>
  )
}

// ─── RoadmapScreen ───────────────────────────────────────────────────────────

export default function RoadmapScreen() {
  const { activeGoal } = useUserStore()
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoadmap = useCallback(async () => {
    if (!activeGoal) return
    setError(null)
    try {
      const res = await roadmapAPI.get(activeGoal.id)
      setRoadmap(res.data)
    } catch {
      setError('Could not load roadmap. Pull down to retry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeGoal])

  useEffect(() => {
    fetchRoadmap()
  }, [fetchRoadmap])

  const onRefresh = () => {
    setRefreshing(true)
    fetchRoadmap()
  }

  // Overall progress
  const totalMilestones = roadmap?.milestones.length ?? 0
  const completedMilestones = roadmap?.milestones.filter((m) => m.completed).length ?? 0
  const overallPct =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

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
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Roadmap</Text>
          {roadmap && (
            <Text style={styles.pageSubtitle} numberOfLines={2}>
              {roadmap.goal_title}
            </Text>
          )}
        </View>

        {/* Progress summary card */}
        {roadmap && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{roadmap.current_week}</Text>
                <Text style={styles.summaryLabel}>Current week</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{roadmap.total_weeks}</Text>
                <Text style={styles.summaryLabel}>Total weeks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, styles.summaryValueAccent]}>
                  {overallPct}%
                </Text>
                <Text style={styles.summaryLabel}>Milestones done</Text>
              </View>
            </View>

            {/* Overall bar */}
            <View style={styles.overallTrack}>
              <View style={[styles.overallFill, { width: `${overallPct}%` }]} />
            </View>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !roadmap || roadmap.milestones.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>No roadmap yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete the assessment to generate your personalized roadmap.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {roadmap.milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isCurrent={milestone.week_number === roadmap.current_week}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  inner: {
    paddingHorizontal: rw(16),
    paddingBottom: rh(48),
    gap: rh(16),
  },
  innerTablet: {
    paddingHorizontal: rw(48),
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
  },

  // ── Header
  pageHeader: { paddingTop: rh(16), gap: rh(4) },
  pageTitle: {
    fontSize: rf(28),
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: rf(14),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    lineHeight: rh(20),
  },

  // ── Summary card
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: rh(20),
    paddingHorizontal: rw(16),
    gap: rh(14),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center', gap: rh(4) },
  summaryValue: {
    fontSize: rf(26),
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  summaryValueAccent: { color: colors.accent },
  summaryLabel: {
    fontSize: rf(11),
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: rh(36),
    backgroundColor: colors.border,
  },
  overallTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  overallFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },

  // ── States
  loader: { marginTop: rh(60) },
  errorState: { alignItems: 'center', paddingVertical: rh(48), gap: rh(8) },
  errorEmoji: { fontSize: rf(36) },
  errorText: {
    fontSize: rf(14),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
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

  // ── Timeline
  timeline: { gap: rh(12) },

  // ── Milestone card
  milestoneCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  milestoneCardCurrent: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  milestoneCardDone: {
    opacity: 0.65,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rw(14),
    gap: rw(12),
  },
  weekBadge: {
    paddingHorizontal: rw(8),
    paddingVertical: rh(4),
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: rw(44),
    alignItems: 'center',
  },
  weekBadgeCurrent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  weekBadgeText: {
    fontSize: rf(10),
    fontFamily: typography.fontFamily.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  weekBadgeTextCurrent: {
    color: colors.background,
  },
  milestoneInfo: { flex: 1, gap: rh(2) },
  milestoneTitle: {
    fontSize: rf(14),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    lineHeight: rh(20),
  },
  missionCount: {
    fontSize: rf(11),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  statusIcon: {
    width: rw(28),
    alignItems: 'center',
  },

  // Progress bar inside card
  progressTrack: {
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: rw(14),
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.accent,
  },

  // ── Expanded body
  milestoneBody: {
    padding: rw(14),
    paddingTop: rh(12),
    gap: rh(12),
  },
  milestoneDesc: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    lineHeight: rh(20),
  },

  // ── Mission list (vertical timeline inside milestone)
  missionList: { gap: 0 },
  missionRow: {
    flexDirection: 'row',
    gap: rw(12),
  },

  // Connector column
  connectorCol: {
    width: rw(12),
    alignItems: 'center',
    paddingTop: rh(3),
  },
  connectorDot: {
    width: rw(10),
    height: rw(10),
    borderRadius: rw(5),
    backgroundColor: colors.border,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  connectorDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  connectorLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.border,
    minHeight: rh(16),
    marginTop: rh(4),
  },

  // Mission content
  missionContent: {
    flex: 1,
    paddingBottom: rh(16),
    gap: rh(4),
  },
  missionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: rw(6),
  },
  missionTitle: {
    flex: 1,
    fontSize: rf(13),
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    lineHeight: rh(18),
  },
  missionTitleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  missionDesc: {
    fontSize: rf(12),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    lineHeight: rh(17),
  },
  missionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rw(6),
    marginTop: rh(2),
  },
  metaChip: {
    fontSize: rf(10),
    fontFamily: typography.fontFamily.medium,
    color: colors.accent,
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    borderRadius: 6,
    paddingHorizontal: rw(6),
    paddingVertical: rh(2),
    overflow: 'hidden',
  },
  noMissions: {
    fontSize: rf(13),
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
})
