# Cron Job Kurulumu

Bu proje için harici cron servisi kullanıyoruz çünkü Vercel Hobby planı saatlik cron job'lara izin vermiyor.

## cron-job.org Kurulumu

### 1. Hesap Oluştur
- https://cron-job.org adresine git
- Ücretsiz hesap oluştur

### 2. Yeni Cron Job Ekle

#### Programlı Bildirimler ve Otomatik Hatırlatıcılar
- **Title:** Ozgun Notifications
- **URL:** `https://ozgun-v20.vercel.app/api/cron/send-scheduled`
- **Schedule:** `0 * * * *` (her saat başı)
- **Request Method:** GET
- **Authentication:**
  - Type: Bearer Token
  - Token: `[CRON_SECRET değerini .env.local'dan kopyala]`

### 3. Test Et
- "Run now" butonuna tıkla
- Response 200 OK olmalı
- Vercel logs'da çalıştığını görebilirsin

## Nasıl Çalışır?

### Programlı Bildirimler
- Kullanıcı UI'dan bildirim programlar (tarih + saat)
- `notification_campaigns` tablosuna kaydedilir
- Cron job her saat çalışır
- Zamanı gelen bildirimleri gönderir

### Otomatik Görev Hatırlatıcıları
- Kullanıcı UI'dan saat ayarlar (örn: 20:00)
- `automated_notification_rules` tablosunda `trigger_conditions.time` güncellenir
- Cron job her saat çalışır
- Kod saati kontrol eder (±5 dakika pencere)
- Eğer saat uyuşuyorsa bildirim gönderir

## Güvenlik

- `CRON_SECRET` environment variable ile korunuyor
- Sadece doğru token ile çalışır
- Vercel logs'da tüm istekler görünür

## Test Modu

Şu an test modu aktif:
- Sadece Ozan kullanıcısına bildirim gönderir
- `process-automated/route.ts` dosyasında `test_mode = true`
- Test modunu kapatmak için: `test_mode = false` yap

## Kullanıcı Saati Değiştirme

1. Coordinator paneline git
2. Bildirim ikonuna tıkla
3. "Özel Bildirimler" → "Görev Kontrol"
4. Saati değiştir (örn: 22:00)
5. "Ayarları Kaydet"
6. Cron job her saat çalışır, 22:00 ±5 dakika içinde bildirim gönderir

## Sorun Giderme

### Bildirim gönderilmiyor
1. cron-job.org'da "Execution log" kontrol et
2. Vercel logs'da hata var mı bak
3. `automated_notification_rules` tablosunda `last_executed_at` kontrol et
4. 23 saat cooldown var, günde 1 kez çalışır

### Yanlış saatte gönderiyor
1. `automated_notification_rules` tablosunda `trigger_conditions.time` kontrol et
2. Saat UTC mi yoksa local mi kontrol et
3. ±5 dakika pencere var, tam saatte olmayabilir

## Environment Variables

`.env.local` dosyasında olması gerekenler:
```
CRON_SECRET=your-secret-here
NEXT_PUBLIC_SITE_URL=https://ozgun-v20.vercel.app
```
