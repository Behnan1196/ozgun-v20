'use client'

import React, { useState } from 'react'
import { Bell, Send, Clock, CheckSquare, Calendar, Repeat } from 'lucide-react'

export const NotificationManagerV2: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'special' | 'history'>('general')
  const [specialTab, setSpecialTab] = useState<'task-check' | 'birthday' | 'periodic'>('task-check')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // General notification form (instant + scheduled combined)
  const [generalForm, setGeneralForm] = useState({
    title: '',
    message: '',
    target_audience: 'both',
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
        alert('Programlı bildirim özelliği yakında eklenecek!')
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
        title="Bildirim Yönetimi"
      >
        <Bell className="w-6 h-6 text-gray-700" />
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
                    <option value="both">Herkes</option>
                    <option value="student">Sadece Öğrenciler</option>
                    <option value="coach">Sadece Koçlar</option>
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
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Bildirim geçmişi yakında eklenecek</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
