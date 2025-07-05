import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { Ionicons } from '@expo/vector-icons'
import { View, Text, StyleSheet } from 'react-native'

import HomeScreen from '../screens/HomeScreen'
import StudyScreen from '../screens/StudyScreen'
import ToolsScreen from '../screens/ToolsScreen'
import ChatScreen from '../screens/ChatScreen'
import VideoScreen from '../screens/VideoScreen'

const Tab = createBottomTabNavigator()
const ChatTab = createMaterialTopTabNavigator()

function ChatNavigator() {
  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatHeaderTitle}>İletişim</Text>
      </View>
      <ChatTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#6B7280',
          tabBarIndicatorStyle: { backgroundColor: '#3B82F6' },
          tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
          tabBarStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <ChatTab.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ title: 'Mesajlar' }}
        />
        <ChatTab.Screen 
          name="Video" 
          component={VideoScreen} 
          options={{ title: 'Video Arama' }}
        />
      </ChatTab.Navigator>
    </View>
  )
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Study') {
            iconName = focused ? 'calendar' : 'calendar-outline'
          } else if (route.name === 'ChatNav') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Tools') {
            iconName = focused ? 'construct' : 'construct-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Ana Sayfa',
          headerTitle: 'ÖZGÜN Koçluk - Öğrenci Paneli'
        }} 
      />
      <Tab.Screen 
        name="Study" 
        component={StudyScreen} 
        options={{ 
          title: 'Çalışma Planı',
          headerTitle: 'Çalışma Planı'
        }} 
      />
      <Tab.Screen 
        name="ChatNav" 
        component={ChatNavigator} 
        options={{ 
          title: 'Sohbet',
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="Tools" 
        component={ToolsScreen} 
        options={{ 
          title: 'Araçlar',
          headerTitle: 'Öğrenci Araçları'
        }} 
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  chatHeader: {
    backgroundColor: '#3B82F6',
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  chatHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}) 