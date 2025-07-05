import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function ToolsScreen() {
  const [activeTab, setActiveTab] = useState('pomodoro')

  const renderPomodoro = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="timer-outline" size={48} color="#6B7280" />
        <Text style={styles.placeholderTitle}>Pomodoro Timer</Text>
        <Text style={styles.placeholderDescription}>
          Çalışma süresi takibi ve pomodoro tekniği burada uygulanacak
        </Text>
      </View>
    </ScrollView>
  )

  const renderProgress = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="bar-chart-outline" size={48} color="#6B7280" />
        <Text style={styles.placeholderTitle}>İlerleme Takibi</Text>
        <Text style={styles.placeholderDescription}>
          Öğrenci ilerlemesi ve istatistikler burada gösterilecek
        </Text>
      </View>
    </ScrollView>
  )

  const renderGrades = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="school-outline" size={48} color="#6B7280" />
        <Text style={styles.placeholderTitle}>Sınav Sonuçları</Text>
        <Text style={styles.placeholderDescription}>
          Sınav notları ve değerlendirmeler burada listelenecek
        </Text>
      </View>
    </ScrollView>
  )

  const renderSettings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="settings-outline" size={48} color="#6B7280" />
        <Text style={styles.placeholderTitle}>Ayarlar</Text>
        <Text style={styles.placeholderDescription}>
          Uygulama ayarları ve kullanıcı tercihleri burada düzenlenecek
        </Text>
      </View>
    </ScrollView>
  )

  const tabs = [
    { id: 'pomodoro', label: 'Pomodoro', icon: 'timer-outline' },
    { id: 'progress', label: 'İlerleme', icon: 'bar-chart-outline' },
    { id: 'grades', label: 'Notlar', icon: 'school-outline' },
    { id: 'settings', label: 'Ayarlar', icon: 'settings-outline' },
  ]

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'pomodoro' && renderPomodoro()}
      {activeTab === 'progress' && renderProgress()}
      {activeTab === 'grades' && renderGrades()}
      {activeTab === 'settings' && renderSettings()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabLabel: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#3B82F6',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
}) 