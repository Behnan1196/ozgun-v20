'use client'

import React, { useState } from 'react'
import { Bell, Send, Clock, Eye } from 'lucide-react'

export const SimpleNotificationManager: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'instant' | 'scheduled'>('instant')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Instant notification form
  const [instantForm, setInstantForm] = useState({
    title: '',
    message: '',
    target_audience: 'both'
  })

  // Scheduled notification form
  const [scheduledForm, setScheduledForm] = useState({
    title: '',
    message: '',
    target_audience: 'both',
    scheduled_date: '',
    scheduled_time: ''
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

  const sendInstantNotification = async () => {
    if (!instantForm.title || !instantForm.message) {
      alert('Başlık ve mesaj gerekli!')
      return
    }

    try {
      const response = await fetch('/api/notifications/broadcast-via-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: instantForm.title,
          message: instantForm.message,
          target_audience: instantForm.target_audience
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.stats.total_recipients} kişiye anlık bildirim gönderildi!`)
        setInstantForm({ title: '', message: '', target_audience: 'both' })
      } else {
        const error = await response.json()
        alert('Hata: ' + error.error)
      }
    } catch (error) {
      console.error('Error sending instant notification:', error)
      alert('Anlık bildirim gönderim hatası')
    }
  }

  const scheduleNotification = async () => {
    if (!scheduledForm.title || !scheduledForm.message || !scheduledForm.scheduled_date || !scheduledForm.scheduled_time) {
      alert('Tüm alanları doldurun!')
      return
    }

    try {
      const scheduledFor = `${scheduledForm.scheduled_date}T${scheduledForm.scheduled_time}:00.000Z`
      
      const response = await fetch('/api/notifications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Programlı - ${scheduledForm.title}`,
          title: scheduledForm.title,
          body: scheduledForm.message,
          target_audience: scheduledForm.target_audience,
          scheduled_for: scheduledFor,
          is_urgent: false,
          include_sound: true
        })
      })

      if (response.ok) {
        alert('✅ Programlı bildirim oluşturuldu!')
        setScheduledForm({ title: '', message: '', target_audience: 'both', scheduled_date: '', scheduled_time: '' })
      } else {
        const error = await response.json()
        alert('Hata: ' + error.error)
      }
    } catch (error) {
      console.error('Error scheduling notification:', error)
      alert('Programlı bildirim oluşturma hatası')
    }
  }

  const debugUsers = async () => {
    try {
      const response = await fetch('/api/debug/users')
      if (response.ok) {
        const result = await response.json()
        console.log('👥 Users in database:', result)
        alert(`Veritabanında ${result.total_users} kullanıcı var. Roller: ${JSON.stringify(result.role_stats)}`)
      } else {
        alert('Debug bilgisi alınamadı')
      }
    } catch (error) {
      console.error('Error debugging users:', error)
      alert('Debug hatası')
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
                { id: 'instant', label: 'Anlık Bildirim', icon: Send },
                { id: 'scheduled', label: 'Programlı Bildirim', icon: Clock }
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
            {activeTab === 'instant' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Anlık Bildirim Gönder</h3>
                  <button
                    onClick={debugUsers}
                    className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 flex items-center space-x-1"
                    title="Kullanıcıları kontrol et"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Debug</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Başlık</label>
                    <input
                      type="text"
                      value={instantForm.title}
                      onChange={(e) => setInstantForm({...instantForm, title: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="Bildirim başlığı"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mesaj</label>
                    <textarea
                      value={instantForm.message}
                      onChange={(e) => setInstantForm({...instantForm, message: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      rows={3}
                      placeholder="Bildirim mesajı"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hedef Kitle</label>
                    <select
                      value={instantForm.target_audience}
                      onChange={(e) => setInstantForm({...instantForm, target_audience: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="both">Herkese (Öğrenci + Koç)</option>
                      <option value="student">Sadece Öğrenciler</option>
                      <option value="coach">Sadece Koçlar</option>
                    </select>
                  </div>

                  <button
                    onClick={sendInstantNotification}
                    className="w-full bg-blue-600 text-white py-2 rounded text-xs hover:bg-blue-700 flex items-center justify-center space-x-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Hemen Gönder</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'scheduled' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">Programlı Bildirim Oluştur</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Başlık</label>
                    <input
                      type="text"
                      value={scheduledForm.title}
                      onChange={(e) => setScheduledForm({...scheduledForm, title: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="Bildirim başlığı"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mesaj</label>
                    <textarea
                      value={scheduledForm.message}
                      onChange={(e) => setScheduledForm({...scheduledForm, message: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      rows={3}
                      placeholder="Bildirim mesajı"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hedef Kitle</label>
                    <select
                      value={scheduledForm.target_audience}
                      onChange={(e) => setScheduledForm({...scheduledForm, target_audience: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="both">Herkese (Öğrenci + Koç)</option>
                      <option value="student">Sadece Öğrenciler</option>
                      <option value="coach">Sadece Koçlar</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tarih</label>
                      <input
                        type="date"
                        value={scheduledForm.scheduled_date}
                        onChange={(e) => setScheduledForm({...scheduledForm, scheduled_date: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Saat</label>
                      <input
                        type="time"
                        value={scheduledForm.scheduled_time}
                        onChange={(e) => setScheduledForm({...scheduledForm, scheduled_time: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={scheduleNotification}
                    className="w-full bg-green-600 text-white py-2 rounded text-xs hover:bg-green-700 flex items-center justify-center space-x-1"
                  >
                    <Clock className="h-3 w-3" />
                    <span>Programla</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}