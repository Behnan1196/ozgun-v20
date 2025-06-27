-- Sample announcements for TYT AYT Coaching System
INSERT INTO announcements (title, content, created_by, is_active) VALUES
(
  'TYT Matematik Eğitimi Başlıyor',
  'Sayın öğrenciler, 15 Ocak tarihinden itibaren TYT Matematik eğitimlerimiz başlayacaktır. Eğitimler hafta içi her gün saat 10:00-12:00 arasında olacaktır. Katılım için lütfen koçunuzla iletişime geçiniz.',
  (SELECT id FROM user_profiles WHERE email = 'admin@example.com'),
  true
),
(
  'AYT Fizik Laboratuvar Dersleri',
  'AYT Fizik öğrencilerimiz için laboratuvar dersleri hafta sonları düzenlenecektir. Bu dersler teorik bilgilerin pratikle pekiştirilmesi için oldukça önemlidir. Detaylar için koçunuzla görüşünüz.',
  (SELECT id FROM user_profiles WHERE email = 'admin@example.com'),
  true
),
(
  'YKS Başvuru Tarihleri Açıklandı',
  '2024 YKS başvuru tarihleri ÖSYM tarafından açıklandı. Başvurular 15-28 Şubat tarihleri arasında yapılacaktır. Başvuru işlemlerinizde yardım almak için danışmanlarımızla iletişime geçebilirsiniz.',
  (SELECT id FROM user_profiles WHERE email = 'admin@example.com'),
  true
),
(
  'Deneme Sınavları Takvimi',
  'Bu ay içerisinde 3 adet TYT ve 2 adet AYT deneme sınavı düzenlenecektir. Sınav tarihleri ve konuları için lütfen duyuru panosunu takip ediniz. Sınavlara katılım zorunludur.',
  (SELECT id FROM user_profiles WHERE email = 'admin@example.com'),
  false
),
(
  'Online Ödev Sistemi Aktif',
  'Öğrencilerimizin ödevlerini takip edebilmesi için online ödev sistemi aktif hale getirilmiştir. Sisteme giriş bilgilerinizi koçlarınızdan alabilirsiniz.',
  (SELECT id FROM user_profiles WHERE email = 'admin@example.com'),
  true
); 