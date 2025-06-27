-- TYT AYT Ders ve Konuları
-- Bu veriler Türk eğitim sistemindeki TYT ve AYT derslerini kapsar

-- TYT Dersleri
INSERT INTO subjects (name, description, is_active) VALUES
('Türkçe', 'Temel Yeterlilik Testi - Türkçe dersi', true),
('Matematik', 'Temel Yeterlilik Testi - Matematik dersi', true),
('Fen Bilimleri', 'Temel Yeterlilik Testi - Fen Bilimleri (Fizik, Kimya, Biyoloji)', true),
('Sosyal Bilimler', 'Temel Yeterlilik Testi - Sosyal Bilimler (Tarih, Coğrafya, Felsefe)', true);

-- AYT Dersleri
INSERT INTO subjects (name, description, is_active) VALUES
('AYT Matematik', 'Alan Yeterlilik Testi - İleri Matematik', true),
('Fizik', 'Alan Yeterlilik Testi - Fizik dersi', true),
('Kimya', 'Alan Yeterlilik Testi - Kimya dersi', true),
('Biyoloji', 'Alan Yeterlilik Testi - Biyoloji dersi', true),
('Tarih', 'Alan Yeterlilik Testi - Tarih dersi', true),
('Coğrafya', 'Alan Yeterlilik Testi - Coğrafya dersi', true),
('Edebiyat', 'Alan Yeterlilik Testi - Türk Dili ve Edebiyatı', true),
('Felsefe', 'Alan Yeterlilik Testi - Felsefe dersi', true);

-- TYT Türkçe Konuları
INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Sözcükte Anlam', 'Gerçek anlam, mecaz anlam, terim anlam', 1, true
FROM subjects s WHERE s.name = 'Türkçe';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Cümlede Anlam', 'Düşünce yapısı, anlatım bozuklukları', 2, true
FROM subjects s WHERE s.name = 'Türkçe';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Paragrafta Anlam', 'Ana düşünce, yardımcı düşünce, paragraf türleri', 3, true
FROM subjects s WHERE s.name = 'Türkçe';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Yazım Kuralları', 'Büyük harflerin kullanımı, noktalama işaretleri', 4, true
FROM subjects s WHERE s.name = 'Türkçe';

-- TYT Matematik Konuları
INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Temel Kavramlar', 'Sayı kümeleri, işlemler, üslü sayılar', 1, true
FROM subjects s WHERE s.name = 'Matematik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Denklemler', 'Birinci dereceden denklemler, eşitsizlikler', 2, true
FROM subjects s WHERE s.name = 'Matematik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Fonksiyonlar', 'Fonksiyon kavramı, grafik çizimi', 3, true
FROM subjects s WHERE s.name = 'Matematik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Geometri', 'Temel geometrik şekiller, alan ve hacim', 4, true
FROM subjects s WHERE s.name = 'Matematik';

-- TYT Fen Bilimleri Konuları
INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Fizik - Hareket', 'Düzgün hareket, ivmeli hareket', 1, true
FROM subjects s WHERE s.name = 'Fen Bilimleri';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Kimya - Atom', 'Atom yapısı, periyodik tablo', 2, true
FROM subjects s WHERE s.name = 'Fen Bilimleri';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Biyoloji - Hücre', 'Hücre yapısı, hücre bölünmesi', 3, true
FROM subjects s WHERE s.name = 'Fen Bilimleri';

-- AYT Fizik Konuları
INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Kuvvet ve Hareket', 'Newton yasaları, momentum', 1, true
FROM subjects s WHERE s.name = 'Fizik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Enerji', 'Kinetik enerji, potansiyel enerji, iş-güç', 2, true
FROM subjects s WHERE s.name = 'Fizik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Elektrik', 'Elektrik akımı, direnç, güç', 3, true
FROM subjects s WHERE s.name = 'Fizik';

-- AYT Kimya Konuları
INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Kimyasal Bağlar', 'İyonik bağ, kovalent bağ, metalik bağ', 1, true
FROM subjects s WHERE s.name = 'Kimya';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Asit-Baz', 'pH kavramı, nötrleşme reaksiyonları', 2, true
FROM subjects s WHERE s.name = 'Kimya';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Organik Kimya', 'Hidrokarbonlar, fonksiyonel gruplar', 3, true
FROM subjects s WHERE s.name = 'Kimya';

-- AYT Matematik Konuları
INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Limit ve Süreklilik', 'Limit kavramı, süreklilik', 1, true
FROM subjects s WHERE s.name = 'AYT Matematik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Türev', 'Türev kavramı, türev kuralları', 2, true
FROM subjects s WHERE s.name = 'AYT Matematik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'İntegral', 'Belirsiz integral, belirli integral', 3, true
FROM subjects s WHERE s.name = 'AYT Matematik';

INSERT INTO topics (subject_id, name, description, order_index, is_active)
SELECT s.id, 'Analitik Geometri', 'Doğru denklemi, çember denklemi', 4, true
FROM subjects s WHERE s.name = 'AYT Matematik'; 