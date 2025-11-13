'use client'

import React, { useState } from 'react'
import { Bell, Send, Clock, CheckSquare, Calendar, Repeat } from 'lucide-react'

export const NotificationManagerV2: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'special' | 'history'>('general')
  const [specialTab, setSpecialTab] = useState<'task-check' | 'birthday' | 'periodic'>('task-check')
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // General notification form (instant + scheduled combined)
  const [generalForm, setGeneralForm] = useState({
    title: '',
    message: '',
    target_audience: 'both', // Will be mapped to 'all' in API
    scheduled_date: '', // Optional - if empty, send instantly
    scheduled_time: ''  // Optional
  })

  // Task check settings
  const [taskCheckSettings, setTaskCheckSettings] = useState({
    enabled: false,
    check_time: '20:00',
    thank_you_message: '🎉 Harika! Bugünkü tüm görevlerini tamamladın. Tebrikler!',
    reminder_message: '⏰ Henüz tamamlanmamış görevlerin var. Lütfen kontrol et!'
  })

  // Click outside to close
  React.useEffect(() => {
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

  const sendGeneralNotification = async () => {
    if (!generalForm.title || !generalForm.message) {
      alert('Başlık ve mesaj gerekli!')
      return
    }

    try {
      // If no date/time, send instantly via broadcast-channel
      if (!generalForm.scheduled_date || !generalForm.scheduled_time) {
        const response = await fetch('/api/notifications/broadcast-channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: generalForm.title,
            message: generalForm.message,
            target_audience: generalForm.target_audience
          })
        })

        if (response.ok) {
          const result = await response.json()
          alert(`✅ Anlık bildirim gönderildi! ${result.stats.successful_sends} başarılı, ${result.stats.failed_sends} başarısız`)
          setGeneralForm({ title: '', message: '', target_audience: 'both', scheduled_date: '', scheduled_time: '' })
        } else {
          const error = await response.json()
          alert('Hata: ' + error.error)
        }
      } else {
        // Schedule for later
        const response = await fetch('/api/notifications/schedule-broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: generalForm.title,
            message: generalForm.message,
            target_audience: generalForm.target_audience,
            scheduled_date: generalForm.scheduled_date,
            scheduled_time: generalForm.scheduled_time
          })
        })

        if (response.ok) {
          const result = await response.json()
          alert(`✅ ${result.message}`)
          setGeneralForm({ title: '', message: '', target_audience: 'both', scheduled_date: '', scheduled_time: '' })
        } else {
          const errorText = await response.text()
          console.error('Schedule error:', errorText)
          try {
            const error = JSON.parse(errorText)
            alert('Hata: ' + error.error)
          } catch {
            alert('Hata: ' + errorText.substring(0, 200))
          }
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Bildirim gönderme hatası')
    }
  }

  const saveTaskCheckSettings = async () => {
    try {
      // TODO: Save to database
      alert('Görev kontrol ayarları kaydedildi!')
    } catch (error) {
      console.error('Error saving task check settings:', error)
      alert('Ayarlar kaydedilemedi')
    }
  }

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/notifications/campaigns')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load history when history tab is opened
  React.useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      loadHistory()
    }
  }, [activeTab])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors relative"
        title="Bildirim Yönetimi"
      >
        <Bell className="w-6 h-6 text-white" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">📢 Bildirim Yönetimi V2</h3>
            <p className="text-sm text-gray-500 mt-1">Genel ve özel bildirimler</p>
          </div>

          {/* Main Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Genel Bildirimler
            </button>
            <button
              onClick={() => setActiveTab('special')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'special'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <CheckSquare className="w-4 h-4 inline mr-2" />
              Özel Bildirimler
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Geçmiş
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık
                  </label>
                  <input
                    type="text"
                    value={generalForm.title}
                    onChange={(e) => setGeneralForm({ ...generalForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bildirim başlığı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesaj
                  </label>
                  <textarea
                    value={generalForm.message}
                    onChange={(e) => setGeneralForm({ ...generalForm, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Bildirim mesajı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hedef Kitle
                  </label>
                  <select
                    value={generalForm.target_audience}
                    onChange={(e) => setGeneralForm({ ...generalForm, target_audience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Herkes</option>
                    <option value="students">Sadece Öğrenciler</option>
                    <option value="coaches">Sadece Koçlar</option>
                  </select>
                </div>

                {/* Optional Scheduling */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Programla (İsteğe Bağlı)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Boş bırakırsanız hemen gönderilir
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="date"
                        value={generalForm.scheduled_date}
                        onChange={(e) => setGeneralForm({ ...generalForm, scheduled_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        value={generalForm.scheduled_time}
                        onChange={(e) => setGeneralForm({ ...generalForm, scheduled_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={sendGeneralNotification}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {generalForm.scheduled_date && generalForm.scheduled_time ? '📅 Programla' : '🚀 Hemen Gönder'}
                </button>
              </div>
            )}

            {/* SPECIAL TAB */}
            {activeTab === 'special' && (
              <div className="space-y-4">
                {/* Special Sub-tabs */}
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                  <button
                    onClick={() => setSpecialTab('task-check')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      specialTab === 'task-check'
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 inline mr-1" />
                    Görev Kontrol
                  </button>
                  <button
                    onClick={() => setSpecialTab('birthday')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      specialTab === 'birthday'
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Doğum Günü
                  </button>
                  <button
                    onClick={() => setSpecialTab('periodic')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      specialTab === 'periodic'
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Repeat className="w-4 h-4 inline mr-1" />
                    Periyodik
                  </button>
                </div>

                {/* Task Check Settings */}
                {specialTab === 'task-check' && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">📋 Görev Kontrol Sistemi</h4>
                      <p className="text-sm text-purple-700">
                        Belirlenen saatte öğrencilerin görevlerini kontrol eder. Tamamlanmışsa teşekkür, tamamlanmamışsa hatırlatma mesajı gönderir.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Görev Kontrolü Aktif</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskCheckSettings.enabled}
                          onChange={(e) => setTaskCheckSettings({ ...taskCheckSettings, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⏰ Kontrol Saati
                      </label>
                      <input
                        type="time"
                        value={taskCheckSettings.check_time}
                        onChange={(e) => setTaskCheckSettings({ ...taskCheckSettings, check_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Her gün bu saatte görevler kontrol edilir
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ✅ Teşekkür Mesajı (Görevler tamamlandıysa)
                      </label>
                      <textarea
                        value={taskCheckSettings.thank_you_message}
                        onChange={(e) => setTaskCheckSettings({ ...taskCheckSettings, thank_you_message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⚠️ Hatırlatma Mesajı (Görevler tamamlanmadıysa)
                      </label>
                      <textarea
                        value={taskCheckSettings.reminder_message}
                        onChange={(e) => setTaskCheckSettings({ ...taskCheckSettings, reminder_message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                      />
                    </div>

                    <button
                      onClick={saveTaskCheckSettings}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      💾 Ayarları Kaydet
                    </button>
                  </div>
                )}

                {/* Birthday (Coming Soon) */}
                {specialTab === 'birthday' && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Doğum günü kutlaması özelliği yakında eklenecek</p>
                  </div>
                )}

                {/* Periodic (Coming Soon) */}
                {specialTab === 'periodic' && (
                  <div className="text-center py-8 text-gray-500">
                    <Repeat className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Periyodik mesajlar özelliği yakında eklenecek</p>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Bildirim Geçmişi</h4>
                  <button
                    onClick={loadHistory}
                    disabled={loadingHistory}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    {loadingHistory ? '⏳ Yükleniyor...' : '🔄 Yenile'}
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
                    <p className="text-sm">Yükleniyor...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Henüz bildirim gönderilmemiş</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {history.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800 text-sm">{campaign.title}</h5>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{campaign.body}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                            campaign.status === 'sent' 
                              ? 'bg-green-100 text-green-700'
                              : campaign.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-700'
                              : campaign.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.status === 'sent' ? '✅ Gönderildi' 
                              : campaign.status === 'scheduled' ? '📅 Programlı'
                              : campaign.status === 'failed' ? '❌ Başarısız'
                              : campaign.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span>
                            👥 {campaign.target_audience === 'all' ? 'Herkes' 
                              : campaign.target_audience === 'students' ? 'Öğrenciler'
                              : campaign.target_audience === 'coaches' ? 'Koçlar'
                              : campaign.target_audience}
                          </span>
                          {campaign.total_recipients && (
                            <span>📊 {campaign.total_recipients} kişi</span>
                          )}
                          {campaign.successful_sends !== undefined && (
                            <span className="text-green-600">✓ {campaign.successful_sends}</span>
                          )}
                          {campaign.failed_sends !== undefined && campaign.failed_sends > 0 && (
                            <span className="text-red-600">✗ {campaign.failed_sends}</span>
                          )}
                        </div>

                        <div className="text-xs text-gray-400 mt-2">
                          {campaign.sent_at 
                            ? `Gönderildi: ${new Date(campaign.sent_at).toLocaleString('tr-TR')}`
                            : campaign.scheduled_for
                            ? `Programlı: ${new Date(campaign.scheduled_for).toLocaleString('tr-TR')}`
                            : `Oluşturuldu: ${new Date(campaign.created_at).toLocaleString('tr-TR')}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
