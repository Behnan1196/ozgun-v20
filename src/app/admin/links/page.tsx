'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Save,
  X,
  Link as LinkIcon
} from 'lucide-react'

interface EducationalLink {
  id: string
  title: string
  description?: string
  url: string
  category: string
  icon_letter?: string
  icon_color: string
  display_order: number
  is_active: boolean
  target_audience: string
  created_at: string
  updated_at: string
}

export default function AdminLinksPage() {
  const [links, setLinks] = useState<EducationalLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState<EducationalLink | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category: 'general',
    icon_letter: '',
    icon_color: 'blue',
    display_order: 0,
    target_audience: 'all'
  })

  const supabase = createClient()

  const colorOptions = [
    { value: 'blue', label: 'Mavi' },
    { value: 'green', label: 'Yeşil' },
    { value: 'red', label: 'Kırmızı' },
    { value: 'purple', label: 'Mor' },
    { value: 'orange', label: 'Turuncu' },
    { value: 'indigo', label: 'İndigo' }
  ]

  const categoryOptions = [
    { value: 'general', label: 'Genel' },
    { value: 'official', label: 'Resmi' },
    { value: 'educational', label: 'Eğitim' },
    { value: 'video', label: 'Video' },
    { value: 'practice', label: 'Pratik' }
  ]

  const audienceOptions = [
    { value: 'all', label: 'Herkese' },
    { value: 'coaches', label: 'Sadece Koçlar' },
    { value: 'students', label: 'Sadece Öğrenciler' }
  ]

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('educational_links')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setLinks(data || [])
    } catch (error) {
      console.error('Error loading links:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (link?: EducationalLink) => {
    if (link) {
      setEditingLink(link)
      setFormData({
        title: link.title,
        description: link.description || '',
        url: link.url,
        category: link.category,
        icon_letter: link.icon_letter || '',
        icon_color: link.icon_color,
        display_order: link.display_order,
        target_audience: link.target_audience
      })
    } else {
      setEditingLink(null)
      setFormData({
        title: '',
        description: '',
        url: '',
        category: 'general',
        icon_letter: '',
        icon_color: 'blue',
        display_order: links.length + 1,
        target_audience: 'all'
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingLink(null)
  }

  const saveLink = async () => {
    try {
      if (editingLink) {
        const { error } = await supabase
          .from('educational_links')
          .update({
            title: formData.title,
            description: formData.description,
            url: formData.url,
            category: formData.category,
            icon_letter: formData.icon_letter,
            icon_color: formData.icon_color,
            display_order: formData.display_order,
            target_audience: formData.target_audience
          })
          .eq('id', editingLink.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('educational_links')
          .insert([{
            title: formData.title,
            description: formData.description,
            url: formData.url,
            category: formData.category,
            icon_letter: formData.icon_letter,
            icon_color: formData.icon_color,
            display_order: formData.display_order,
            target_audience: formData.target_audience
          }])

        if (error) throw error
      }

      await loadLinks()
      closeModal()
    } catch (error) {
      console.error('Error saving link:', error)
    }
  }

  const deleteLink = async (link: EducationalLink) => {
    if (!confirm(`"${link.title}" linkini silmek istediğinizden emin misiniz?`)) return

    try {
      const { error } = await supabase
        .from('educational_links')
        .delete()
        .eq('id', link.id)

      if (error) throw error
      await loadLinks()
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout currentPage="links">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Linkler yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="links">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <LinkIcon className="h-6 w-6 mr-2" />
              Linkler
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Eğitim linklerini yönetin
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Link
          </button>
        </div>

        <div className="bg-white rounded-lg border">
          {links.length === 0 ? (
            <div className="p-8 text-center">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Link Yok</h3>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                İlk Linki Ekle
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {links.map((link) => (
                <div key={link.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${link.icon_color}-100 text-${link.icon_color}-800`}>
                        <span className="font-bold text-sm">
                          {link.icon_letter || link.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{link.title}</h4>
                        {link.description && (
                          <p className="text-sm text-gray-600">{link.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            link.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {link.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {categoryOptions.find(c => c.value === link.category)?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openModal(link)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteLink(link)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingLink ? 'Link Düzenle' : 'Yeni Link Ekle'}
                </h3>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hedef Kitle
                    </label>
                    <select
                      value={formData.target_audience}
                      onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {audienceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İkon Harfi
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={formData.icon_letter}
                      onChange={(e) => setFormData({ ...formData, icon_letter: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Renk
                    </label>
                    <select
                      value={formData.icon_color}
                      onChange={(e) => setFormData({ ...formData, icon_color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıra
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={saveLink}
                  disabled={!formData.title || !formData.url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {editingLink ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
} 