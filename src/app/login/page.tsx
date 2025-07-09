'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material'
import { School } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (data.user) {
        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          throw new Error('Kullanıcı profili bulunamadı')
        }

        // Redirect based on role
        let redirectPath = '/coach' // Default path
        switch (profile.role) {
          case 'admin':
            redirectPath = '/admin'
            break
          case 'coach':
          case 'student':
          case 'coordinator':
            redirectPath = '/coach'
            break
          default:
            throw new Error('Geçersiz kullanıcı rolü')
        }

        // Wait for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use window.location for a full page load, but with a session check
        const sessionCheck = await supabase.auth.getSession()
        if (sessionCheck.data.session) {
          window.location.href = redirectPath
        } else {
          throw new Error('Oturum başlatılamadı, lütfen tekrar deneyin')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <School sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              ÖZGÜN Koçluk
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistemi V1.3
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              placeholder="E-posta adresinizi girin"
              autoComplete="email"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              placeholder="Şifrenizi girin"
              autoComplete="current-password"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              © 2024 ÖZGÜN Koçluk Sistemi. Tüm hakları saklıdır.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
} 