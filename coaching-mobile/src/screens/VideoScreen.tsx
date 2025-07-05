import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function VideoScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="videocam-outline" size={64} color="#6B7280" />
        </View>
        
        <Text style={styles.title}>Video Arama</Text>
        <Text style={styles.description}>
          Video arama özelliği EAS Build ile test edildikten sonra aktif edilecektir.
        </Text>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Video arama özelliği Expo Go ile test edilemez. Bu özellik EAS Build servisi kullanılarak native build alındıktan sonra test edilecektir.
          </Text>
        </View>
        
        <TouchableOpacity style={styles.placeholderButton} disabled>
          <Ionicons name="videocam-outline" size={20} color="#9CA3AF" />
          <Text style={styles.placeholderButtonText}>Video Arama Başlat</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxWidth: 300,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  placeholderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  placeholderButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
}) 