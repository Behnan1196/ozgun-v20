'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Send, Users, Clock, Settings, Plus, Eye, Trash2 } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  announcement_type: string
  target_audience: string
  priority: string
  is_active: boolean
  is_pinned: boolean
  show_on_login: boolean
  starts_at: string
  ends_at?: string
  view_count: number
  created_at: string
  created_by_profile: { full_name: string }
}

interface Campaign {
  id: string
  name: string
  title: string
  body: string
  target_audience: string
  status: string
  scheduled_for: string
  total_recipients: number
  successful_sends: number
  failed_sends: number
  created_at: string
}

export const NotificationManager: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'announcements' | 'campaigns' | 'automated'>('announcements')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  
  // Announcement form
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    target_audience: 'all',
    priority: 'normal',
    starts_at: '',
    ends_at: '',
    is_pinned: false,
    show_on_login: false
  })

  // Campaign form
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    title: '',
    body: '',
    target_audience: 'all',
    scheduled_for: '',
    is_urgent: false,
    include_sound: true
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'announcements') {
        await loadAnnouncements()
      } else if (activeTab === 'campaigns') {
        await loadCampaigns()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnnouncements = async () => {
    try {
      const response = await fetch('/api/notifications/announcements?include_viewed=true')
      const data = await response.json()
      
      if (response.ok) {
        setAnnouncements(data.announcements || [])
      } else {
        console.error('Error loading announcements:', data.error)
      }
    } catch (error) {
      console.error('Error loading announcements:', error)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/notifications/campaigns')
      const data = await response.json()
      
      if (response.ok) {
        setCampaigns(data.campaigns || [])
      } else {
        console.error('Error loading campaigns:', data.error)
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    }
  }

  const createAnnouncement = async () => {
    try {
      const response = await fetch('/api/notifications/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      })

      const data = await response.json()

      if (response.ok) {
        setShowAnnouncementModal(false)
        setAnnouncementForm({
          title: '',
          content: '',
          announcement_type: 'general',
          target_audience: 'all',
          priority: 'normal',
          starts_at: '',
          ends_at: '',
          is_pinned: false,
          show_on_login: false
        })
        loadAnnouncements()
        alert('Duyuru başarıyla oluşturuldu!')
      } else {
        alert('Duyuru oluşturulurken hata: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('Duyuru oluşturulurken hata oluştu')
    }
  }

  const createCampaign = async () => {
    try {
      const response = await fetch('/api/notifications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      })

      const data = await response.json()

      if (response.ok) {
        setShowCampaignModal(false)
        setCampaignForm({
          name: '',
          title: '',
          body: '',
          target_audience: 'all',
          scheduled_for: '',
          is_urgent: false,
          include_sound: true
        })
        loadCampaigns()
        alert('Bildirim kampanyası başarıyla oluşturuldu!')
      } else {
        alert('Kampanya oluşturulurken hata: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Kampanya oluşturulurken hata oluştu')
    }
  }

  const processPushNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.successful} bildirim gönderildi, ${result.failed} hata`)
      } else {
        alert('Bildirimler gönderilirken hata oluştu')
      }
    } catch (error) {
      console.error('Error processing notifications:', error)
      alert('Bildirimler gönderilirken hata oluştu')
    }
  }

  const sendViaStream = async () => {
    const title = prompt('Bildirim başlığı:')
    const message = prompt('Bildirim mesajı:')
    const audience = prompt('Hedef kitle (student/coach/both):', 'both')
    
    if (!title || !message) {
      alert('Başlık ve mesaj gerekli!')
      return
    }

    try {
      // Use broadcast API for better delivery
      const response = await fetch('/api/notifications/broadcast-via-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          target_audience: audience
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Broadcast ile ${result.stats.total_recipients} kişiye bildirim gönderildi!`)
        loadCampaigns()
      } else {
        const error = await response.json()
        alert('Hata: ' + error.error)
      }
    } catch (error) {
      console.error('Error sending broadcast:', error)
      alert('Broadcast gönderim hatası')
    }
  }

  const debugUsers = async () => {
    try {
      const [usersResponse, tokensResponse] = await Promise.all([
        fetch('/api/debug/users'),
        fetch('/api/debug/push-tokens')
      ])
      
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json()
        console.log('👥 Users in database:', usersResult)
        
        let message = `Veritabanında ${usersResult.total_users} kullanıcı var. Roller: ${JSON.stringify(usersResult.role_stats)}\n\n`
        
        if (tokensResponse.ok) {
          const tokensResult = await tokensResponse.json()
          console.log('📱 Push tokens:', tokensResult)
          message += `Push Token'lar: ${tokensResult.total_tokens} adet. ${tokensResult.message}`
        } else {
          message += 'Push token bilgisi alınamadı - Mobile app henüz token kaydetmemiş olabilir'
        }
        
        alert(message)
      } else {
        alert('Debug bilgisi alınamadı')
      }
    } catch (error) {
      console.error('Error debugging:', error)
      alert('Debug hatası')
    }
  }

  const processAutomatedRules = async (ruleType?: string) => {
    try {
      const response = await fetch('/api/notifications/process-automated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_type: ruleType, force: true })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${data.processed_rules} kural işlendi!`)
      } else {
        alert('Otomatik kurallar işlenirken hata: ' + data.error)
      }
    } catch (error) {
      console.error('Error processing automated rules:', error)
      alert('Otomatik kurallar işlenirken hata oluştu')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white rounded-full hover:bg-slate-700 transition-colors"
        title="Bildirim Yönetimi"
      >
        <Bell className="h-5 w-5" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-4">
              {[
                { id: 'announcements', label: 'Duyurular', icon: Bell },
                { id: 'campaigns', label: 'Kampanyalar', icon: Send },
                { id: 'automated', label: 'Otomatik', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-2 border-b-2 font-medium text-xs flex items-center space-x-1 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'announcements' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Duyuru Yönetimi</h3>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Yeni</span>
                  </button>
                </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Duyurular yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{announcement.title}</h4>
                          {announcement.is_pinned && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Sabitlenmiş</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{announcement.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Hedef: {announcement.target_audience}</span>
                          <span className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{announcement.view_count} görüntüleme</span>
                          </span>
                          <span>{new Date(announcement.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Henüz duyuru bulunmuyor.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold">Bildirim Kampanyaları</h3>
              <div className="flex space-x-1">
                <button
                  onClick={debugUsers}
                  className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 flex items-center space-x-1"
                  title="Kullanıcıları kontrol et"
                >
                  <Eye className="h-3 w-3" />
                  <span>Debug</span>
                </button>
                <button
                  onClick={sendViaStream}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center space-x-1"
                  title="Broadcast kanalı ile tüm kullanıcılara bildirim gönder"
                >
                  <Send className="h-3 w-3" />
                  <span>Broadcast</span>
                </button>
                <button
                  onClick={processPushNotifications}
                  className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 flex items-center space-x-1"
                  title="Bekleyen bildirimleri gönder"
                >
                  <Send className="h-3 w-3" />
                  <span>Kuyruk</span>
                </button>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Yeni</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Kampanyalar yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{campaign.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{campaign.title}</p>
                        <p className="text-xs text-gray-500 mb-2">{campaign.body}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Hedef: {campaign.target_audience}</span>
                          <span>Durum: {campaign.status}</span>
                          <span>{campaign.successful_sends}/{campaign.total_recipients} başarılı</span>
                          <span>{new Date(campaign.scheduled_for).toLocaleString('tr-TR', { 
                            timeZone: 'Europe/Istanbul',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Henüz kampanya bulunmuyor.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'automated' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Otomatik Bildirim Kuralları</h3>
              <button
                onClick={() => processAutomatedRules()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Kuralları Çalıştır</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Günlük Görev Hatırlatması</h4>
                <p className="text-sm text-gray-600 mb-3">Her gün saat 18:00'da tamamlanmamış görevler için hatırlatma gönderir.</p>
                <button
                  onClick={() => processAutomatedRules('daily_task_reminder')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Şimdi Çalıştır
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Görev Tamamlama Teşekkürü</h4>
                <p className="text-sm text-gray-600 mb-3">Tüm günlük görevlerini tamamlayan öğrencilere teşekkür mesajı gönderir.</p>
                <button
                  onClick={() => processAutomatedRules('task_completion_thanks')}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Şimdi Çalıştır
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Haftalık Özet</h4>
                <p className="text-sm text-gray-600 mb-3">Her Pazar akşamı haftalık performans özeti gönderir.</p>
                <button
                  onClick={() => processAutomatedRules('weekly_summary')}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Şimdi Çalıştır
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Sınav Hatırlatması</h4>
                <p className="text-sm text-gray-600 mb-3">Yaklaşan sınavlar için bir gün önceden hatırlatma gönderir.</p>
                <button
                  onClick={() => processAutomatedRules('exam_reminder')}
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  Şimdi Çalıştır
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Yeni Duyuru Oluştur</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Duyuru başlığı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik *</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Duyuru içeriği"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select
                    value={announcementForm.announcement_type}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, announcement_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">Genel</option>
                    <option value="urgent">Acil</option>
                    <option value="maintenance">Bakım</option>
                    <option value="feature">Yeni Özellik</option>
                    <option value="exam">Sınav</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Kitle</label>
                  <select
                    value={announcementForm.target_audience}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target_audience: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Herkes</option>
                    <option value="students">Öğrenciler</option>
                    <option value="coaches">Koçlar</option>
                    <option value="coordinators">Koordinatörler</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={announcementForm.is_pinned}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sabitle</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={announcementForm.show_on_login}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, show_on_login: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Girişte Göster</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={createAnnouncement}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Yeni Bildirim Kampanyası</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Adı *</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Kampanya adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bildirim Başlığı *</label>
                <input
                  type="text"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Bildirim başlığı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj *</label>
                <textarea
                  value={campaignForm.body}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Bildirim mesajı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Kitle</label>
                <select
                  value={campaignForm.target_audience}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, target_audience: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Herkes</option>
                  <option value="students">Öğrenciler</option>
                  <option value="coaches">Koçlar</option>
                  <option value="coordinators">Koordinatörler</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={campaignForm.is_urgent}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, is_urgent: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Acil</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={campaignForm.include_sound}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, include_sound: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ses Çal</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCampaignModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={createCampaign}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}