import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Chat, ChannelList, OverlayProvider, Channel, MessageList, MessageInput, Thread } from 'stream-chat-expo'
import { useStream } from '../contexts/StreamContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ChatScreen() {
  const { chatClient, isStreamReady, isDemoMode } = useStream()
  const { user, profile } = useAuth()
  const [assignedCoach, setAssignedCoach] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState<any>(null)

  // Fetch assigned coach (typically one coach per student)
  useEffect(() => {
    const fetchAssignedCoach = async () => {
      if (!user || profile?.role !== 'student') return

      try {
        const { data: assignments, error } = await supabase
          .from('coach_student_assignments')
          .select(`
            coach_id,
            coach:coach_id(
              id,
              full_name,
              email
            )
          `)
          .eq('student_id', user.id)
          .eq('is_active', true)
          .limit(1) // Get the primary assigned coach

        if (error) throw error

        if (assignments && assignments.length > 0) {
          setAssignedCoach(assignments[0].coach)
        }
      } catch (error) {
        console.error('Error fetching assigned coach:', error)
        Alert.alert('Hata', 'Koç bilgileri yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignedCoach()
  }, [user, profile])

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Koç bilgileri yükleniyor...</Text>
      </View>
    )
  }

  // No coach assigned
  if (!assignedCoach) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person-outline" size={64} color="#6B7280" />
        <Text style={styles.emptyTitle}>Atanmış Koç Bulunamadı</Text>
        <Text style={styles.emptyDescription}>
          Henüz size bir koç atanmamış. Lütfen yöneticinizle iletişime geçin.
        </Text>
      </View>
    )
  }

  // Demo mode
  if (isDemoMode) {
    return (
      <View style={styles.container}>
        <View style={styles.demoHeader}>
          <Ionicons name="warning-outline" size={24} color="#F59E0B" />
          <Text style={styles.demoText}>Demo Modu</Text>
        </View>
        
        <View style={styles.demoContent}>
          <Text style={styles.demoDescription}>
            Stream.io API anahtarları yapılandırılmamış. Chat özelliği şu anda demo modunda çalışıyor.
          </Text>
          
          <View style={styles.demoChat}>
            <View style={styles.demoMessage}>
              <Text style={styles.demoMessageUser}>Koçunuz</Text>
              <Text style={styles.demoMessageText}>
                Merhaba! Bu hafta nasıl gidiyor? Matematik konularında ilerleme var mı?
              </Text>
              <Text style={styles.demoMessageTime}>10:30</Text>
            </View>
            
            <View style={[styles.demoMessage, styles.demoMessageSent]}>
              <Text style={styles.demoMessageUser}>Sen</Text>
              <Text style={styles.demoMessageText}>
                İyi gidiyor, matematik konularında ilerleme var. Bu hafta trigonometri çalıştım.
              </Text>
              <Text style={styles.demoMessageTime}>10:35</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // Stream not ready
  if (!isStreamReady || !chatClient) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chat servisi başlatılıyor...</Text>
      </View>
    )
  }



  // Chat interface
  return (
    <View style={styles.container}>
      <OverlayProvider>
        <Chat client={chatClient}>
          {selectedChannel ? (
            // Chat Conversation View
            <Channel channel={selectedChannel}>
              <View style={styles.chatHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedChannel(null)}
                >
                  <Ionicons name="arrow-back-outline" size={24} color="#3B82F6" />
                </TouchableOpacity>
                <View style={styles.chatHeaderInfo}>
                  <Text style={styles.chatHeaderTitle}>{assignedCoach.full_name}</Text>
                  <Text style={styles.chatHeaderSubtitle}>Koçunuz ile sohbet</Text>
                </View>
              </View>
              
              <View style={styles.chatContainer}>
                <MessageList />
                <MessageInput />
              </View>
              
              <Thread />
            </Channel>
          ) : (
            // Channel List View (shows chat channels with the assigned coach)
            <>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderInfo}>
                  <Text style={styles.chatHeaderTitle}>{assignedCoach.full_name}</Text>
                  <Text style={styles.chatHeaderSubtitle}>Mesajlar</Text>
                </View>
              </View>
              
              <ChannelList
                filters={{ members: { $in: [user?.id || ''] } }}
                onSelect={(channel) => {
                  console.log('Chat channel selected:', channel.id)
                  setSelectedChannel(channel)
                }}
              />
            </>
          )}
        </Chat>
      </OverlayProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  coachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  coachEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  demoText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  demoContent: {
    flex: 1,
    padding: 20,
  },
  demoDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  demoChat: {
    flex: 1,
  },
  demoMessage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: 40,
  },
  demoMessageSent: {
    backgroundColor: '#3B82F6',
    marginLeft: 40,
    marginRight: 0,
  },
  demoMessageUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  demoMessageText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  demoMessageTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
}) 