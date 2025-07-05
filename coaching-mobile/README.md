# ÖZGÜN Koçluk - Öğrenci Mobil Uygulaması

Bu, ÖZGÜN Koçluk sisteminin öğrenciler için tasarlanmış React Native/Expo mobil uygulamasıdır.

## 🎯 Özellikler (Faz 1)

### ✅ Tamamlanan Özellikler
- **Kimlik Doğrulama**: Öğrenci girişi (sadece öğrenci rolü kabul edilir)
- **Bottom Tab Navigasyon**: Ana Sayfa, Sohbet, Araçlar
- **Ana Sayfa**: Öğrenci dashboard'u (placeholder)
- **Araçlar**: Gelecekteki özellikler için placeholder'lar
- **Chat Tab**: Mesajlar ve Video Arama alt sekmeleri
- **Chat**: Stream.io ile coach-student mesajlaşma (demo modu destekli)
- **Video Placeholder**: EAS Build sonrası aktif edilecek

### 🚧 Geliştirme Aşamasında
- **Video Arama**: EAS Build ile test edilecek
- **Görev Yönetimi**: Ana sayfa entegrasyonu
- **Push Notifications**: Mesaj bildirimleri
- **Offline Support**: Senkronizasyon

## 🚀 Başlangıç

### Gereksinimler
- Node.js 18+
- Expo CLI
- Android/iOS cihaz veya emülatör
- Web uygulamasının çalışır durumda olması (chat için)

### Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Çevre değişkenlerini ayarlayın:**
   ```bash
   cp .env.example .env.local
   # .env.local dosyasını düzenleyin
   ```

3. **Web uygulaması zaten çalışıyor:**
   ```bash
   # Production web app: https://ozgun-v13.vercel.app/
   # Chat token API otomatik olarak kullanılacak
   ```

4. **Mobil uygulamayı başlatın:**
   ```bash
   npm start
   ```

### Expo Go ile Test

1. Expo Go uygulamasını indirin
2. QR kodu tarayın
3. Öğrenci hesabıyla giriş yapın

**Not:** Video arama özelliği Expo Go ile çalışmaz, EAS Build gerektirir.

## 🔧 Yapılandırma

### Çevre Değişkenleri (.env.local)

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STREAM_API_KEY=your_stream_api_key
```

### Demo Modu

Stream.io API anahtarları yoksa uygulama demo modunda çalışır:
- Chat arayüzü gösterilir
- Örnek mesajlar görüntülenir
- Gerçek mesajlaşma devre dışıdır

## 📱 Test Kullanıcıları

Web uygulamasından öğrenci hesapları oluşturun ve test edin:

```sql
-- Örnek öğrenci hesabı
INSERT INTO user_profiles (email, full_name, role) 
VALUES ('student@test.com', 'Test Öğrenci', 'student');
```

## 🏗️ Mimari

```
src/
├── contexts/          # React Context'ler
│   ├── AuthContext.tsx    # Kimlik doğrulama
│   └── StreamContext.tsx  # Stream.io chat
├── lib/              # Yardımcı kütüphaneler
│   ├── supabase.ts       # Supabase istemci
│   └── stream.ts         # Stream.io yapılandırması
├── navigation/       # Navigasyon
│   └── AppNavigator.tsx  # Ana navigasyon
├── screens/          # Ekranlar
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ChatScreen.tsx
│   ├── VideoScreen.tsx
│   └── ToolsScreen.tsx
└── types/            # TypeScript tipleri
    └── database.ts       # Veritabanı tipleri
```

## 📖 Kullanım

### 1. Giriş
- Öğrenci e-posta ve şifresi ile giriş yapın
- Sadece 'student' rolüne sahip kullanıcılar kabul edilir

### 2. Ana Sayfa
- Öğrenci dashboard'u
- Günlük görevler, ilerleme, duyurular (placeholder)

### 3. Sohbet
- Atanmış koçlarla mesajlaşma
- Stream.io ile gerçek zamanlı chat
- Demo modu destekli

### 4. Araçlar
- Gelecekteki özellikler için placeholder'lar
- Pomodoro, not defteri, kaynaklar vb.

## 🔄 Web App ile Entegrasyon

Bu mobil uygulama web uygulamasıyla aynı:
- **Supabase veritabanını** kullanır
- **Stream.io token API'sini** kullanır
- **Kullanıcı verilerini** paylaşır
- **Chat kanallarını** paylaşır

## 🚦 Gelecek Adımlar

### Faz 2: Video Arama
```bash
# EAS Build için
npx eas build --platform android
npx eas build --platform ios
```

### Faz 3: Gelişmiş Özellikler
- Push notifications
- Offline sync
- Görev yönetimi
- File sharing
- Calendar entegrasyonu

## 🐛 Hata Ayıklama

### Chat Sorunları
1. Web uygulamasının çalıştığından emin olun
2. Stream.io API anahtarlarını kontrol edin
3. Network connectivity'yi kontrol edin

### Build Sorunları
```bash
# Cache temizleme
npx expo start --clear

# Dependencies yeniden yükleme
rm -rf node_modules
npm install
```

## 📄 Lisans

Bu proje ÖZGÜN Koçluk Sistemi'nin bir parçasıdır. 