'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  School,
  Notifications,
  Security,
  Palette,
  Extension,
  Save,
  Restore,
} from '@mui/icons-material'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Settings states
  const [systemSettings, setSystemSettings] = useState({
    app_name: 'TYT AYT Koçluk Sistemi',
    academic_year: '2024-2025',
    tyt_exam_date: '2024-06-15',
    ayt_exam_date: '2024-06-16',
    maintenance_mode: false,
    allow_registration: true,
    session_timeout: 30,
    max_students_per_coach: 15,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    announcement_auto_send: true,
    daily_progress_emails: true,
    exam_reminders: true,
    assignment_notifications: true,
  })

  const [securitySettings, setSecuritySettings] = useState({
    min_password_length: 8,
    require_special_chars: true,
    session_duration: 24,
    two_factor_enabled: false,
    login_attempts_limit: 5,
  })

  useEffect(() => {
    checkAuthAndLoadSettings()
  }, [])

  const checkAuthAndLoadSettings = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      redirect('/login')
      return
    }

    loadSettings()
    setLoading(false)
  }

  const loadSettings = () => {
    const savedSystemSettings = localStorage.getItem('system_settings')
    const savedNotificationSettings = localStorage.getItem('notification_settings')
    const savedSecuritySettings = localStorage.getItem('security_settings')

    if (savedSystemSettings) {
      setSystemSettings(JSON.parse(savedSystemSettings))
    }
    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings))
    }
    if (savedSecuritySettings) {
      setSecuritySettings(JSON.parse(savedSecuritySettings))
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setSaveMessage(null)

    try {
      localStorage.setItem('system_settings', JSON.stringify(systemSettings))
      localStorage.setItem('notification_settings', JSON.stringify(notificationSettings))
      localStorage.setItem('security_settings', JSON.stringify(securitySettings))

      setSaveMessage('Ayarlar başarıyla kaydedildi!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage('Ayarlar kaydedilirken hata oluştu!')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/settings">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="/admin/settings">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Sistem Ayarları</Typography>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </Button>
        </Box>

        {saveMessage && (
          <Alert 
            severity={saveMessage.includes('başarıyla') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
          >
            {saveMessage}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab icon={<SettingsIcon />} label="Genel" />
              <Tab icon={<School />} label="Akademik" />
              <Tab icon={<Notifications />} label="Bildirimler" />
              <Tab icon={<Security />} label="Güvenlik" />
              <Tab icon={<Extension />} label="Entegrasyonlar" />
              <Tab icon={<Palette />} label="Görünüm" />
            </Tabs>
          </Box>

          {/* Genel Ayarlar */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Uygulama Ayarları" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Uygulama Adı"
                      value={systemSettings.app_name}
                      onChange={(e) => setSystemSettings({...systemSettings, app_name: e.target.value})}
                      margin="normal"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.maintenance_mode}
                          onChange={(e) => setSystemSettings({...systemSettings, maintenance_mode: e.target.checked})}
                        />
                      }
                      label="Bakım Modu"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.allow_registration}
                          onChange={(e) => setSystemSettings({...systemSettings, allow_registration: e.target.checked})}
                        />
                      }
                      label="Yeni Kayıta İzin Ver"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Koçluk Sistemi Ayarları" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Oturum Zaman Aşımı (dakika)"
                      type="number"
                      value={systemSettings.session_timeout}
                      onChange={(e) => setSystemSettings({...systemSettings, session_timeout: parseInt(e.target.value)})}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Koç Başına Maksimum Öğrenci"
                      type="number"
                      value={systemSettings.max_students_per_coach}
                      onChange={(e) => setSystemSettings({...systemSettings, max_students_per_coach: parseInt(e.target.value)})}
                      margin="normal"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Akademik Ayarlar */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Akademik Dönem" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Akademik Yıl"
                      value={systemSettings.academic_year}
                      onChange={(e) => setSystemSettings({...systemSettings, academic_year: e.target.value})}
                      margin="normal"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="YKS Sınav Tarihleri" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="TYT Sınav Tarihi"
                      type="date"
                      value={systemSettings.tyt_exam_date}
                      onChange={(e) => setSystemSettings({...systemSettings, tyt_exam_date: e.target.value})}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="AYT Sınav Tarihi"
                      type="date"
                      value={systemSettings.ayt_exam_date}
                      onChange={(e) => setSystemSettings({...systemSettings, ayt_exam_date: e.target.value})}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Değerlendirme Sistemи" />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      TYT ve AYT sınavları için puan hesaplama ağırlıkları
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      <Chip label="TYT Ağırlığı: %40" variant="outlined" color="primary" />
                      <Chip label="AYT Ağırlığı: %60" variant="outlined" color="primary" />
                      <Chip label="Performans Bonusu: %10" variant="outlined" color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Bildirim Ayarları */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="E-posta Bildirimleri" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.email_notifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, email_notifications: e.target.checked})}
                        />
                      }
                      label="E-posta Bildirimleri Aktif"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.daily_progress_emails}
                          onChange={(e) => setNotificationSettings({...notificationSettings, daily_progress_emails: e.target.checked})}
                        />
                      }
                      label="Günlük İlerleme Raporları"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.exam_reminders}
                          onChange={(e) => setNotificationSettings({...notificationSettings, exam_reminders: e.target.checked})}
                        />
                      }
                      label="Sınav Hatırlatmaları"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Sistem Bildirimleri" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.announcement_auto_send}
                          onChange={(e) => setNotificationSettings({...notificationSettings, announcement_auto_send: e.target.checked})}
                        />
                      }
                      label="Otomatik Duyuru Gönderimi"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.assignment_notifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, assignment_notifications: e.target.checked})}
                        />
                      }
                      label="Ödev Bildirimleri"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.sms_notifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, sms_notifications: e.target.checked})}
                        />
                      }
                      label="SMS Bildirimleri"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Güvenlik Ayarları */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Şifre Güvenliği" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Minimum Şifre Uzunluğu"
                      type="number"
                      value={securitySettings.min_password_length}
                      onChange={(e) => setSecuritySettings({...securitySettings, min_password_length: parseInt(e.target.value)})}
                      margin="normal"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.require_special_chars}
                          onChange={(e) => setSecuritySettings({...securitySettings, require_special_chars: e.target.checked})}
                        />
                      }
                      label="Özel Karakter Zorunluluğu"
                    />
                    <TextField
                      fullWidth
                      label="Maksimum Giriş Denemesi"
                      type="number"
                      value={securitySettings.login_attempts_limit}
                      onChange={(e) => setSecuritySettings({...securitySettings, login_attempts_limit: parseInt(e.target.value)})}
                      margin="normal"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Oturum Güvenliği" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Oturum Süresi (saat)"
                      type="number"
                      value={securitySettings.session_duration}
                      onChange={(e) => setSecuritySettings({...securitySettings, session_duration: parseInt(e.target.value)})}
                      margin="normal"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.two_factor_enabled}
                          onChange={(e) => setSecuritySettings({...securitySettings, two_factor_enabled: e.target.checked})}
                        />
                      }
                      label="İki Faktörlü Kimlik Doğrulama"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Entegrasyon Ayarları */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Stream.io Entegrasyonu" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Stream API Key"
                      type="password"
                      placeholder="API anahtarınızı girin"
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="App ID"
                      placeholder="Uygulama ID'nizi girin"
                      margin="normal"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Canlı Sohbet Etkin"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Video Görüşme Etkin"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="E-posta Servisi" />
                  <CardContent>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Posta Sağlayıcısı</InputLabel>
                      <Select defaultValue="gmail">
                        <MenuItem value="gmail">Gmail SMTP</MenuItem>
                        <MenuItem value="outlook">Outlook SMTP</MenuItem>
                        <MenuItem value="sendgrid">SendGrid</MenuItem>
                        <MenuItem value="custom">Özel SMTP</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="SMTP Sunucusu"
                      placeholder="smtp.gmail.com"
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Port"
                      placeholder="587"
                      margin="normal"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Görünüm Ayarları */}
          <TabPanel value={tabValue} index={5}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Tema ve Renkler" />
                  <CardContent>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Tema Seçimi</InputLabel>
                      <Select defaultValue="light">
                        <MenuItem value="light">Açık Tema</MenuItem>
                        <MenuItem value="dark">Koyu Tema</MenuItem>
                        <MenuItem value="auto">Otomatik</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Ana Renk Paleti</InputLabel>
                      <Select defaultValue="blue">
                        <MenuItem value="blue">Mavi</MenuItem>
                        <MenuItem value="green">Yeşil</MenuItem>
                        <MenuItem value="purple">Mor</MenuItem>
                        <MenuItem value="orange">Turuncu</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Kurum Kimliği" />
                  <CardContent>
                    <Button variant="outlined" fullWidth sx={{ mb: 2, height: 56 }}>
                      Kurum Logosu Yükle
                    </Button>
                    <TextField
                      fullWidth
                      label="Kurum/Okul Adı"
                      defaultValue="YKS Hazırlık Akademisi"
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Slogan"
                      defaultValue="Hedefinize Emin Adımlarla"
                      margin="normal"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </AdminLayout>
  )
} 