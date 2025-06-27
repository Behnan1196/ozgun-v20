-- Corrected Bulk Insert Topics Script with Order Index
-- This script matches the actual subject names in the database (Title Case)
-- and converts topic names to Title Case for consistency
-- Each topic now has an order_index for proper sequencing within subjects

-- First, delete all existing topics
DELETE FROM topics;

-- Reset the sequence (if using auto-increment)
-- ALTER SEQUENCE topics_id_seq RESTART WITH 1;

-- Insert topics for Türkçe (21 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Sözcükte Anlam', 1),
    ('Cümlede Anlam', 2),
    ('Anlatım Biçimleri', 3),
    ('Düşünceyi Geliştirme Yolları', 4),
    ('Paragrafta Anlam', 5),
    ('Ses Bilgisi', 6),
    ('Yazım Kuralları', 7),
    ('Noktalama İşaretleri', 8),
    ('Sözcük Yapısı Ve Ekler', 9),
    ('İsimler', 10),
    ('Sıfatlar', 11),
    ('Zamirler', 12),
    ('Zarflar', 13),
    ('Edat - Bağlaç - Ünlem', 14),
    ('Fiilde Yapı', 15),
    ('Fiil Kipleri', 16),
    ('Fiilimsi', 17),
    ('Fiilde Çatı', 18),
    ('Cümlenin Ögeleri', 19),
    ('Cümle Türleri', 20),
    ('Anlatım Bozuklukları', 21)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Türkçe';

-- Insert topics for Geometri (27 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Doğruda Açılar', 1),
    ('Üçgende Açılar', 2),
    ('Açı - Kenar Bağıntıları', 3),
    ('Dik Üçgen Ve Öklid', 4),
    ('İkizkenar Üçgen', 5),
    ('Eşkenar Üçgen', 6),
    ('Açıortay', 7),
    ('Kenarortay', 8),
    ('Üçgende Merkezler', 9),
    ('Eşlik - Benzerlik', 10),
    ('Üçgende Alan', 11),
    ('Çokgenler', 12),
    ('Dörtgenler', 13),
    ('Yamuk', 14),
    ('Paralelkenar', 15),
    ('Eşkenar Dörtgen', 16),
    ('Deltoid', 17),
    ('Dikdörtgen', 18),
    ('Kare', 19),
    ('Çemberde Açılar', 20),
    ('Çemberde Uzunluk', 21),
    ('Dairede Alan', 22),
    ('Katı Cisimler', 23),
    ('Noktanın Analitiği', 24),
    ('Doğrunun Analitiği', 25),
    ('Çemberin Analitiği', 26),
    ('Dönüşümler', 27)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Geometri';

-- Insert topics for Fizik (41 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Fizik Bilimine Giriş', 1),
    ('Madde Ve Özellikleri', 2),
    ('Kuvvet Ve Hareket', 3),
    ('İş - Güç - Enerji', 4),
    ('Isı - Sıcaklık - Genleşme', 5),
    ('Elektrostatik - Elektrik', 6),
    ('Manyetizma', 7),
    ('Basınç', 8),
    ('Kaldırma Kuvveti', 9),
    ('Dalgalar', 10),
    ('Optik', 11),
    ('Vektörler - Bağıl Hareket', 12),
    ('Newton''un Hareket Yasaları', 13),
    ('Bir Boyutta Sabit İvmeli Hareket', 14),
    ('Serbest Düşme - Atışlar', 15),
    ('Enerji - İş - Hareket', 16),
    ('İtme Ve Çizgisel Momentum', 17),
    ('Tork - Denge', 18),
    ('Ağırlık Merkezi', 19),
    ('Basit Makineler', 20),
    ('Elektriksel Kuvvet - Elektriksel Alan', 21),
    ('Elektrik Potansiyel - Potansiyel Enerji', 22),
    ('Elektriksel İş - Paralel Levhalar', 23),
    ('Sığa - Sığaçlar', 24),
    ('Manyetik Kuvvet - Manyetik Alan', 25),
    ('Manyetik Akı - Elektromotor Kuvveti', 26),
    ('İndüksiyon Akımı - Öz İndüksiyon Akımı', 27),
    ('Alternatif Akım - Transformatörler', 28),
    ('Düzgün Çembersel Hareket', 29),
    ('Dönme Ve Öteleme Hareketi - Açısal Momentum', 30),
    ('Kütle Çekimi - Kepler Kanunları', 31),
    ('Basit Harmonik Hareket', 32),
    ('Su Dalgalarının Kırınımı Ve Girişimi', 33),
    ('Işığın Kırını Ve Girişimi', 34),
    ('Doppler - Elektromanyetik Dalgalar', 35),
    ('Atom Fiziği', 36),
    ('Radyoaktivite', 37),
    ('Özel Görelilik', 38),
    ('Fotoelektrik Olay', 39),
    ('Compton Saçılması - De Broglie Dalga Boyu', 40),
    ('Modern Fiziğin Teknolojideki Uygulamaları', 41)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Fizik';

-- Insert topics for Kimya (53 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Simya - Kimya Bilimi - İş Güvenliği', 1),
    ('Atomun Yapısı - Atom Modelleri', 2),
    ('Periyodik Sistem - Periyodik Özellikler', 3),
    ('Kimyasal Türler - Etkileşimler', 4),
    ('Kimyasal Ve Fiziksel Değişimler', 5),
    ('Maddenin Fiziksel Halleri', 6),
    ('Su Ve Hayat - Çevre Kimyası', 7),
    ('Kimyanın Temel Kanunları', 8),
    ('Mol Kavramı', 9),
    ('Kimyasal Tepkimeler - Denklemler', 10),
    ('Tepkimelerde Hesaplamalar', 11),
    ('Karışımlar', 12),
    ('Ayrıştırma Teknikleri', 13),
    ('Asitler - Bazlar Ve Tepkimeleri', 14),
    ('Hayatımızda Asitler Ve Bazlar', 15),
    ('Tuzlar', 16),
    ('Hayatımızda Kimya', 17),
    ('Atomun Kuantum Modeli', 18),
    ('Periyodik Sistem - Elektron Dizilimleri', 19),
    ('Periyodik Özellikler', 20),
    ('Gazların Özellikleri - Gaz Yasaları', 21),
    ('İdeal Gazlar - Kinetik Teori', 22),
    ('Gaz Karışımları - Gerçek Gazlar', 23),
    ('Çözeltiler - Çözücü Ve Çözünen Etkileşimleri', 24),
    ('Derişim Birimleri', 25),
    ('Koligatif Özellikler', 26),
    ('Çözünürlük - Çözünürlüğe Etki Eden Faktörler', 27),
    ('Tepkimelerde Isı Değişimi - Oluşum Entalpisi', 28),
    ('Bağ Enerjileri - Hess Yasası', 29),
    ('Tepkime Hızları', 30),
    ('Tepkime Hızına Etki Eden Faktörler', 31),
    ('Kimyasal Denge - Dengeye Etki Eden Faktörler', 32),
    ('Asit Ve Baz Tanımı - Suyun Otoiyonizasyonu', 33),
    ('Kuvvetli - Zayıf Asitlerde Ve Bazlarda Ph', 34),
    ('Tampon Çözeltiler', 35),
    ('Tuz Çözeltilerinde Asitlik - Bazlık', 36),
    ('Nötrleşme - Titrasyon', 37),
    ('Çözünme - Çökelme Dengesi', 38),
    ('Çözünürlüğe Etki Eden Faktörler', 39),
    ('İndirgeme - Yükseltgeme Tepkimeleri', 40),
    ('Aktiflik - Elektrokimyasal Hücreler', 41),
    ('Elektroliz', 42),
    ('Karbon Kimyası - Lewis - Hibritleşme - Mol. Geo.', 43),
    ('Alkanlar', 44),
    ('Alkenler', 45),
    ('Alkinler', 46),
    ('Aromatik Bileşikler', 47),
    ('Fonksiyonel Gruplar', 48),
    ('Alkoller - Eterler', 49),
    ('Aldehitler - Ketonlar', 50),
    ('Karboksilik Asitler', 51),
    ('Esterler', 52),
    ('Enerji Kaynakları - Bilimsel Gelişmeler', 53)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Kimya';

-- Insert topics for Biyoloji (29 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Biyoloji - Canlıların Ortak Özel.', 1),
    ('Canlıların Temel Bileşenleri', 2),
    ('Hücre Organelleri', 3),
    ('Hücre Zarından Madde Geçişleri', 4),
    ('Canlıların Sınıflandırılması', 5),
    ('Mitoz Bölünme - Eşeysiz Üreme', 6),
    ('Mayoz Bölünme - Eşeyli Üreme', 7),
    ('Kalıtım - Biyolojik Çeşitlilik', 8),
    ('Ekosistem Ekolojisi', 9),
    ('Güncel Çevre Sorunları - Doğa', 10),
    ('Sinir Sistemi', 11),
    ('Endokrin Sistem', 12),
    ('Duyu Organları', 13),
    ('Destek Ve Hareket Sistemi', 14),
    ('Dolaşım - Bağışıklık Sistemleri', 15),
    ('Solunum Sistemi', 16),
    ('Sindirim Sistemi', 17),
    ('Üriner Sistem', 18),
    ('Üreme Sistemi - Gelişim', 19),
    ('Komünite - Popülasyon Ekolojisi', 20),
    ('Genden Proteine', 21),
    ('Biyoteknoloji - Gen Mühendisliği', 22),
    ('Fotosentez - Kemosentez', 23),
    ('Solunum', 24),
    ('Bitkilerin Yapısı', 25),
    ('Bitkilerde Büyüme - Hareket', 26),
    ('Bitkilerde Madde Taşınması', 27),
    ('Bitkilerde Üreme', 28),
    ('Canlılar Ve Çevre', 29)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Biyoloji';

-- Insert topics for Matematik (37 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Sayılar', 1),
    ('Sayı Basamakları', 2),
    ('Bölme - Bölünebilme', 3),
    ('Asal Çarpanlara Ayırma', 4),
    ('Ebob - Ekok', 5),
    ('Rasyonel Sayılar', 6),
    ('Basit Eşitsizlikler', 7),
    ('Mutlak Değer', 8),
    ('Üslü Sayılar', 9),
    ('Köklü Sayılar', 10),
    ('Çarpanlara Ayırma', 11),
    ('Oran - Orantı', 12),
    ('Birinci Derece Denklemler', 13),
    ('Sayı - Kesir Problemleri', 14),
    ('Yaş Problemleri', 15),
    ('Yüzde Problemleri', 16),
    ('Karışım Problemleri', 17),
    ('Hareket Problemleri', 18),
    ('Diğer Problemler', 19),
    ('Mantık', 20),
    ('Kümeler - Kartezyen Çarpım', 21),
    ('Veri - İstatistik', 22),
    ('Permütasyon', 23),
    ('Kombinasyon', 24),
    ('Binom Açılımı', 25),
    ('Olasılık', 26),
    ('Fonksiyonlar', 27),
    ('Polinomlar', 28),
    ('2.Dereceden Denklemler', 29),
    ('Fonksiyon Uygulamaları', 30),
    ('Denklem - Eşitsizlik Sistemleri', 31),
    ('Logaritma', 32),
    ('Diziler', 33),
    ('Trigonometri', 34),
    ('Limit - Süreklilik', 35),
    ('Türev', 36),
    ('İntegral', 37)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Matematik';

-- Insert topics for Tarih (22 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Tarih Bilimi', 1),
    ('İlk Uygarlıklar', 2),
    ('İlk Türk Devletleri', 3),
    ('İslam Tarihi Ve Uyg.', 4),
    ('Türk - İslam Devletleri', 5),
    ('Orta Çağ''da Avrupa', 6),
    ('Türkiye Tarihi', 7),
    ('Beylikten Devlete', 8),
    ('Dünya Gücü Osmanlı', 9),
    ('Osmanlı Kültür Ve Med.', 10),
    ('Yeni Çağ''da Avrupa', 11),
    ('Arayış Yılları', 12),
    ('18.Yy Değişim,Diplomasi', 13),
    ('Yakın Çağ Avrupası', 14),
    ('En Uzun Yüzyıl', 15),
    ('1881-1919 Mustafa Kemal', 16),
    ('Milli Mücadeleye Hazırlık Dönemi', 17),
    ('Kurtuluş Savaşında Cepheler', 18),
    ('Türk İnkılapları', 19),
    ('Atatürk İlkeleri', 20),
    ('Atatürk Döneminde Dış Politika', 21),
    ('Atatürk''ün Ölümü', 22)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Tarih';

-- Insert topics for Coğrafya (17 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Doğa Ve İnsan', 1),
    ('Dünya''nın Şekli Ve Hareketleri', 2),
    ('Coğrafi Konum', 3),
    ('Harita Bilgisi', 4),
    ('Atmosfer Ve İklim', 5),
    ('Sıcaklık', 6),
    ('Basınç Ve Rüzgarlar', 7),
    ('Nemlilik Ve Yağış', 8),
    ('İklim Tipleri Ve Bitki Örtüsü', 9),
    ('Türkiye''nin İklimi', 10),
    ('Yerin Şekillenmesi', 11),
    ('İç Kuvvetler', 12),
    ('Dış Kuvvetler', 13),
    ('Su Kaynakları', 14),
    ('Topraklar', 15),
    ('Bitkiler', 16),
    ('Nüfus Ve Göç', 17)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Coğrafya';

-- Insert topics for Felsefe (9 topics)
INSERT INTO topics (name, subject_id, order_index) 
SELECT topic_name, s.id, topic_order
FROM (VALUES 
    ('Felsefeyi Tanıma', 1),
    ('Felsefe İle Düşünme', 2),
    ('Varlık Felsefesi', 3),
    ('Bilgi Felsefesi', 4),
    ('Bilim Felsefesi', 5),
    ('Ahlak Felsefesi', 6),
    ('Din Felsefesi', 7),
    ('Siyaset Felsefesi', 8),
    ('Sanat Felsefesi', 9)
) AS t(topic_name, topic_order)
CROSS JOIN subjects s 
WHERE s.name = 'Felsefe';

-- Show summary of inserted topics with order information
SELECT 
    s.name as subject_name,
    COUNT(t.id) as topic_count,
    MIN(t.order_index) as min_order,
    MAX(t.order_index) as max_order
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id
GROUP BY s.id, s.name
ORDER BY s.name; 