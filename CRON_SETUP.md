# Cron Job Kurulumu (cron-job.org)

## 1. Hesap Oluştur
- https://cron-job.org adresine git
- Ücretsiz hesap oluştur

## 2. Yeni Cron Job Ekle

### Programlı Bildirimler İçin (Her Dakika)
```
Title: Send Scheduled Notifications
URL: https://your-domain.vercel.app/api/cron/send-scheduled
Schedule: */1 * * * * (Her dakika)
Request Method: GET
Headers:
  Authorization: Bearer cron_8f9a2b4c6d1e3f5a7b9c0d2e4f6a8b0c
```

### Günlük Görev Kontrolleri İçin (Sabah 9:00)
```
Title: Daily Task Check
URL: https://your-domain.vercel.app/api/cron/daily-tasks
Schedule: 0 9 * * * (Her gün 09:00)
Request Method: GET
Headers:
  Authorization: Bearer cron_8f9a2b4c6d1e3f5a7b9c0d2e4f6a8b0c
```

## 3. Test Et
- cron-job.org panelinden "Execute now" butonuna tıkla
- Execution history'den sonucu kontrol et
- Status 200 OK görmelisin

## 4. Monitoring
- cron-job.org otomatik olarak başarısız çalışmaları e-posta ile bildirir
- Execution history'den tüm çalışmaları görebilirsin

## Güvenlik Notu
- CRON_SECRET'i asla paylaşma
- Vercel environment variables'a da ekle
- Production'da farklı bir secret kullan

## Alternatif Schedule Örnekleri
- Her 5 dakika: */5 * * * *
- Her saat: 0 * * * *
- Her gün saat 14:00: 0 14 * * *
- Sadece hafta içi 09:00: 0 9 * * 1-5
