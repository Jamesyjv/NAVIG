import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Feather } from '@expo/vector-icons'

import WelcomeScreen from '../screens/Onboarding/WelcomeScreen'
import GoalCreationScreen from '../screens/Onboarding/GoalCreationScreen'
import AssessmentScreen from '../screens/Onboarding/AssessmentScreen'
import HomeScreen from '../screens/Home/HomeScreen'
import RoadmapScreen from '../screens/Roadmap/RoadmapScreen'
import ProgressScreen from '../screens/Progress/ProgressScreen'
import DecisionScreen from '../screens/Decision/DecisionScreen'

import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { rf } from '../theme/responsive'

export type RootStackParamList = {
  Welcome: undefined
  GoalCreation: undefined
  Assessment: undefined
  MainTabs: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      id="main-tabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: rf(11),
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Feather.glyphMap> = {
            Home: 'home',
            Roadmap: 'map',
            Progress: 'bar-chart-2',
            Decision: 'message-circle',
          }
          return <Feather name={icons[route.name] ?? 'circle'} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Roadmap" component={RoadmapScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Decision" component={DecisionScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.card,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: typography.fontFamily.regular, fontWeight: '400' },
          medium: { fontFamily: typography.fontFamily.medium, fontWeight: '500' },
          bold: { fontFamily: typography.fontFamily.bold, fontWeight: '700' },
          heavy: { fontFamily: typography.fontFamily.bold, fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator
        id="root-stack"
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="GoalCreation" component={GoalCreationScreen} />
        <Stack.Screen name="Assessment" component={AssessmentScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
