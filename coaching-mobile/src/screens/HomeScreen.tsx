import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import NotificationService from '../services/NotificationService'

export default function HomeScreen() {
  const { profile, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Hoş Geldin, {profile?.full_name || 'Öğrenci'}!
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="book-outline" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>Günlük Görevler</Text>
          </View>
          <Text style={styles.cardDescription}>
            Bugün tamamlamanız gereken görevleriniz burada görünecek.
          </Text>
          <Text style={styles.placeholderText}>🚧 Geliştirme aşamasında...</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up-outline" size={24} color="#10B981" />
            <Text style={styles.cardTitle}>İlerleme Durumu</Text>
          </View>
          <Text style={styles.cardDescription}>
            Haftalık ilerleme durumunuz ve başarı istatistikleriniz.
          </Text>
          <Text style={styles.placeholderText}>🚧 Geliştirme aşamasında...</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
            <Text style={styles.cardTitle}>Yaklaşan Dersler</Text>
          </View>
          <Text style={styles.cardDescription}>
            Planlanmış dersleriniz ve etkinlikleriniz.
          </Text>
          <Text style={styles.placeholderText}>🚧 Geliştirme aşamasında...</Text>
        </View>

        <TouchableOpacity 
          style={[styles.card, styles.testCard]}
          onPress={() => NotificationService.sendTestNotification()}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Test Notification 🔔</Text>
          </View>
          <Text style={styles.cardDescription}>
            Tap here to test LOCAL notifications (works in Expo Go). For full push notifications, you need a development build.
          </Text>
          <Text style={styles.testText}>💡 Touch to send test notification in 2 seconds</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="megaphone-outline" size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Duyurular</Text>
          </View>
          <Text style={styles.cardDescription}>
            Önemli duyurular ve güncellemeler.
          </Text>
          <Text style={styles.placeholderText}>🚧 Geliştirme aşamasında...</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#F59E0B',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
  },
  testCard: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  testText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
}) 