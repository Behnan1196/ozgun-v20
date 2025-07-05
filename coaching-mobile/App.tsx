import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { StreamProvider } from './src/contexts/StreamContext'
import AppNavigator from './src/navigation/AppNavigator'
import LoginScreen from './src/screens/LoginScreen'
import { View, Text, StyleSheet } from 'react-native'
import NotificationService from './src/services/NotificationService'

function AppContent() {
  const { session, loading, profile } = useAuth()

  // Set up notification listeners when user is authenticated
  useEffect(() => {
    if (session && profile?.role === 'student') {
      const cleanupListeners = NotificationService.setupListeners()
      
      return () => {
        if (cleanupListeners) {
          cleanupListeners()
        }
      }
    }
  }, [session, profile])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    )
  }

  if (!session || !profile) {
    return <LoginScreen />
  }

  if (profile.role !== 'student') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erişim Engellendi</Text>
        <Text style={styles.errorMessage}>
          Bu uygulama sadece öğrenciler için tasarlanmıştır.
        </Text>
      </View>
    )
  }

  return (
    <StreamProvider>
      <AppNavigator />
    </StreamProvider>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthProvider>
            <AppContent />
            <StatusBar style="auto" />
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
})
