-- Bulk Insert Topics Script
-- This script will delete all existing topics and insert new ones based on subject names

-- First, delete all existing topics
DELETE FROM topics;

-- Reset the sequence (if using auto-increment)
-- ALTER SEQUENCE topics_id_seq RESTART WITH 1;

-- Insert topics for TÜRKÇE
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('SÖZCÜKTE ANLAM'),
    ('CÜMLEDE ANLAM'),
    ('ANLATIM BİÇİMLERİ'),
    ('DÜŞÜNCEYİ GELİŞTİRME YOLLARI'),
    ('PARAGRAFTA ANLAM'),
    ('SES BİLGİSİ'),
    ('YAZIM KURALLARI'),
    ('NOKTALAMA İŞARETLERİ'),
    ('SÖZCÜK YAPISI VE EKLER'),
    ('İSİMLER'),
    ('SIFATLAR'),
    ('ZAMİRLER'),
    ('ZARFLAR'),
    ('EDAT - BAĞLAÇ - ÜNLEM'),
    ('FİİLDE YAPI'),
    ('FİİL KİPLERİ'),
    ('FİİLİMSİ'),
    ('FİİLDE ÇATI'),
    ('CÜMLENİN ÖGELERİ'),
    ('CÜMLE TÜRLERİ'),
    ('ANLATIM BOZUKLUKLARI')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'TÜRKÇE';

-- Insert topics for GEOMETRİ
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('DOĞRUDA AÇILAR'),
    ('ÜÇGENDE AÇILAR'),
    ('AÇI - KENAR BAĞINTILARI'),
    ('DİK ÜÇGEN VE ÖKLİD'),
    ('İKİZKENAR ÜÇGEN'),
    ('EŞKENAR ÜÇGEN'),
    ('AÇIORTAY'),
    ('KENARORTAY'),
    ('ÜÇGENDE MERKEZLER'),
    ('EŞLİK - BENZERLİK'),
    ('ÜÇGENDE ALAN'),
    ('ÇOKGENLER'),
    ('DÖRTGENLER'),
    ('YAMUK'),
    ('PARALELKENAR'),
    ('EŞKENAR DÖRTGEN'),
    ('DELTOİD'),
    ('DİKDÖRTGEN'),
    ('KARE'),
    ('ÇEMBERDE AÇILAR'),
    ('ÇEMBERDE UZUNLUK'),
    ('DAİREDE ALAN'),
    ('KATI CİSİMLER'),
    ('NOKTANIN ANALİTİĞİ'),
    ('DOĞRUNUN ANALİTİĞİ'),
    ('ÇEMBERİN ANALİTİĞİ'),
    ('DÖNÜŞÜMLER')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'GEOMETRİ';

-- Insert topics for FİZİK
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('FİZİK BİLİMİNE GİRİŞ'),
    ('MADDE VE ÖZELLİKLERİ'),
    ('KUVVET VE HAREKET'),
    ('İŞ - GÜÇ - ENERJİ'),
    ('ISI - SICAKLIK - GENLEŞME'),
    ('ELEKTROSTATİK - ELEKTRİK'),
    ('MANYETİZMA'),
    ('BASINÇ'),
    ('KALDIRMA KUVVETİ'),
    ('DALGALAR'),
    ('OPTİK'),
    ('VEKTÖRLER - BAĞIL HAREKET'),
    ('NEWTON''UN HAREKET YASALARI'),
    ('BİR BOYUTTA SABİT İVMELİ HAREKET'),
    ('SERBEST DÜŞME - ATIŞLAR'),
    ('ENERJİ - İŞ - HAREKET'),
    ('İTME VE ÇİZGİSEL MOMENTUM'),
    ('TORK - DENGE'),
    ('AĞIRLIK MERKEZİ'),
    ('BASİT MAKİNELER'),
    ('ELEKTRİKSEL KUVVET - ELEKTRİKSEL ALAN'),
    ('ELEKTRİK POTANSİYEL - POTANSİYEL ENERJİ'),
    ('ELEKTRİKSEL İŞ - PARALEL LEVHALAR'),
    ('SIĞA - SIĞAÇLAR'),
    ('MANYETİK KUVVET - MANYETİK ALAN'),
    ('MANYETİK AKI - ELEKTROMOTOR KUVVETİ'),
    ('İNDÜKSİYON AKIMI - ÖZ İNDÜKSİYON AKIMI'),
    ('ALTERNATİF AKIM - TRANSFORMATÖRLER'),
    ('DÜZGÜN ÇEMBERSEL HAREKET'),
    ('DÖNME VE ÖTELEME HAREKETİ - AÇISAL MOMENTUM'),
    ('KÜTLE ÇEKİMİ - KEPLER KANUNLARI'),
    ('BASİT HARMONİK HAREKET'),
    ('SU DALGALARININ KIRINIMI VE GİRİŞİMİ'),
    ('IŞIĞIN KIRINI VE GİRİŞİMİ'),
    ('DOPPLER - ELEKTROMANYETİK DALGALAR'),
    ('ATOM FİZİĞİ'),
    ('RADYOAKTİVİTE'),
    ('ÖZEL GÖRELİLİK'),
    ('FOTOELEKTRİK OLAY'),
    ('COMPTON SAÇILMASI - DE BROGLIE DALGA BOYU'),
    ('MODERN FİZİĞİN TEKNOLOJİDEKİ UYGULAMALARI')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'FİZİK';

-- Insert topics for KİMYA
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('SİMYA - KİMYA BİLİMİ - İŞ GÜVENLİĞİ'),
    ('ATOMUN YAPISI - ATOM MODELLERİ'),
    ('PERİYODİK SİSTEM - PERİYODİK ÖZELLİKLER'),
    ('KİMYASAL TÜRLER - ETKİLEŞİMLER'),
    ('KİMYASAL VE FİZİKSEL DEĞİŞİMLER'),
    ('MADDENİN FİZİKSEL HALLERİ'),
    ('SU VE HAYAT - ÇEVRE KİMYASI'),
    ('KİMYANIN TEMEL KANUNLARI'),
    ('MOL KAVRAMI'),
    ('KİMYASAL TEPKİMELER - DENKLEMLER'),
    ('TEPKİMELERDE HESAPLAMALAR'),
    ('KARIŞIMLAR'),
    ('AYRIŞTIRMA TEKNİKLERİ'),
    ('ASİTLER - BAZLAR VE TEPKİMELERİ'),
    ('HAYATIMIZDA ASİTLER VE BAZLAR'),
    ('TUZLAR'),
    ('HAYATIMIZDA KİMYA'),
    ('ATOMUN KUANTUM MODELİ'),
    ('PERİYODİK SİSTEM - ELEKTRON DİZİLİMLERİ'),
    ('PERİYODİK ÖZELLİKLER'),
    ('GAZLARIN ÖZELLİKLERİ - GAZ YASALARI'),
    ('İDEAL GAZLAR  - KİNETİK TEORİ'),
    ('GAZ KARIŞIMLARI - GERÇEK GAZLAR'),
    ('ÇÖZELTİLER - ÇÖZÜCÜ VE ÇÖZÜNEN ETKİLEŞİMLERİ'),
    ('DERİŞİM BİRİMLERİ'),
    ('KOLİGATİF ÖZELLİKLER'),
    ('ÇÖZÜNÜRLÜK - ÇÖZÜNÜRLÜĞE ETKİ EDEN FAKTÖRLER'),
    ('TEPKİMELERDE ISI DEĞİŞİMİ - OLUŞUM ENTALPİSİ'),
    ('BAĞ ENERJİLERİ - HESS YASASI'),
    ('TEPKİME HIZLARI'),
    ('TEPKİME HIZINA ETKİ EDEN FAKTÖRLER'),
    ('KİMYASAL DENGE - DENGEYE ETKİ EDEN FAKTÖRLER'),
    ('ASİT VE BAZ TANIMI - SUYUN OTOİYONİZASYONU'),
    ('KUVVETLİ - ZAYIF ASİTLERDE VE BAZLARDA PH'),
    ('TAMPON ÇÖZELTİLER'),
    ('TUZ ÇÖZELTİLERİNDE ASİTLİK - BAZLIK'),
    ('NOTRLEŞME - TİTRASYON'),
    ('ÇÖZÜNME - ÇÖKELME DENGESİ'),
    ('ÇÖZÜNÜRLÜĞE ETKİ EDEN FAKTÖRLER'),
    ('İNDİRGENME - YÜKSELTGENME TEPKİMELERİ'),
    ('AKTİFLİK - ELEKTROKİMYASAL HÜCRELER'),
    ('ELEKTROLİZ'),
    ('KARBON KİMYASI - LEWİS - HİBRİTLEŞME - MOL. GEO.'),
    ('ALKANLAR'),
    ('ALKENLER'),
    ('ALKİNLER'),
    ('AROMATİK BİLEŞİKLER'),
    ('FONKSİYONEL GRUPLAR'),
    ('ALKOLLER - ETERLER'),
    ('ALDEHİTLER - KETONLAR'),
    ('KARBOKSİLİK ASİTLER'),
    ('ESTERLER'),
    ('ENERJİ KAYNAKLARI - BİLİMSEL GELİŞMELER')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'KİMYA';

-- Insert topics for BİYOLOJİ
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('BİYOLOJİ - CANLILARIN ORTAK ÖZEL.'),
    ('CANLILARIN TEMEL BİLEŞENLERİ'),
    ('HÜCRE ORGANELLERİ'),
    ('HÜCRE ZARINDAN MADDE GEÇİŞLERİ'),
    ('CANLILARIN SINIFLANDIRILMASI'),
    ('MİTOZ BÖLÜNME - EŞEYSİZ ÜREME'),
    ('MAYOZ BÖLÜNME - EŞEYLİ ÜREME'),
    ('KALITIM - BİYOLOJİK ÇEŞİTLİLİK'),
    ('EKOSİSTEM EKOLOJİSİ'),
    ('GÜNCEL ÇEVRE SORUNLARI - DOĞA'),
    ('SİNİR SİSTEMİ'),
    ('ENDOKRİN SİSTEM'),
    ('DUYU ORGANLARI'),
    ('DESTEK VE HAREKET SİSTEMİ'),
    ('DOLAŞIM - BAĞIŞIKLIK SİSTEMLERİ'),
    ('SOLUNUM SİSTEMİ'),
    ('SİNDİRİM SİSTEMİ'),
    ('ÜRİNER SİSTEM'),
    ('ÜREME SİSTEMİ - GELİŞİM'),
    ('KOMÜNİTE - POPÜLASYON EKOLOJİSİ'),
    ('GENDEN PROTEİNE'),
    ('BİYOTEKNOLOJİ - GEN MÜHENDİSLİĞİ'),
    ('FOTOSENTEZ - KEMOSENTEZ'),
    ('SOLUNUM'),
    ('BİTKİLERİN YAPISI'),
    ('BİTKİLERDE BÜYÜME - HAREKET'),
    ('BİTKİLERDE MADDE TAŞINMASI'),
    ('BİTKİLERDE ÜREME'),
    ('CANLILAR VE ÇEVRE')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'BİYOLOJİ';

-- Insert topics for MATEMATİK
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('SAYILAR'),
    ('SAYI BASAMAKLARI'),
    ('BÖLME - BÖLÜNEBİLME'),
    ('ASAL ÇARPANLARA AYIRMA'),
    ('EBOB - EKOK'),
    ('RASYONEL SAYILAR'),
    ('BASİT EŞİTSİZLİKLER'),
    ('MUTLAK DEĞER'),
    ('ÜSLÜ SAYILAR'),
    ('KÖKLÜ SAYILAR'),
    ('ÇARPANLARA AYIRMA'),
    ('ORAN - ORANTI'),
    ('BİRİNCİ DERECE DENKLEMLER'),
    ('SAYI - KESİR PROBLEMLERİ'),
    ('YAŞ PROBLEMLERİ'),
    ('YÜZDE PROBLEMLERİ'),
    ('KARIŞIM PROBLEMLERİ'),
    ('HAREKET PROBLEMLERİ'),
    ('DİĞER PROBLEMLER'),
    ('MANTIK'),
    ('KÜMELER - KARTEZYEN ÇARPIM'),
    ('VERİ - İSTATİSTİK'),
    ('PERMÜTASYON'),
    ('KOMBİNASYON'),
    ('BİNOM AÇILIMI'),
    ('OLASILIK'),
    ('FONKSİYONLAR'),
    ('POLİNOMLAR'),
    ('2.DERECEDEN DENKLEMLER'),
    ('FONKSİYON UYGULAMALARI'),
    ('DENKLEM - EŞİTSİZLİK SİSTEMLERİ'),
    ('LOGARİTMA'),
    ('DİZİLER'),
    ('TRİGONOMETRİ'),
    ('LİMİT - SÜREKLİLİK'),
    ('TÜREV'),
    ('İNTEGRAL')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'MATEMATİK';

-- Insert topics for TARİH
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('TARİH BİLİMİ'),
    ('İLK UYGARLIKLAR'),
    ('İLK TÜRK DEVLETLERİ'),
    ('İSLAM TARİHİ VE UYG.'),
    ('TÜRK - İSLAM DEVLETLERİ'),
    ('ORTA ÇAĞ''DA AVRUPA'),
    ('TÜRKİYE TARİHİ'),
    ('BEYLİKTEN DEVLETE'),
    ('DÜNYA GÜCÜ OSMANLI'),
    ('OSMANLI KÜLTÜR VE MED.'),
    ('YENİ ÇAĞ''DA AVRUPA'),
    ('ARAYIŞ YILLARI'),
    ('18.YY DEĞİŞİM,DİPLOMASİ'),
    ('YAKIN ÇAĞ AVRUPASI'),
    ('EN UZUN YÜZYIL'),
    ('1881-1919 MUSTAFA KEMAL'),
    ('MİLLİ MÜCADELEYE HAZIRLIK DÖNEMİ'),
    ('KURTULUŞ SAVAŞINDA CEPHELER'),
    ('TÜRK İNKILAPLARI'),
    ('ATATÜRK İLKELERİ'),
    ('ATATÜRK DÖNEMİNDE DIŞ POLİTİKA'),
    ('ATATÜRK''ÜN ÖLÜMÜ')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'TARİH';

-- Insert topics for COĞRAFYA
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('DOĞA VE İNSAN'),
    ('DÜNYA''NIN ŞEKLİ VE HAREKETLERİ'),
    ('COĞRAFİ KONUM'),
    ('HARİTA BİLGİSİ'),
    ('ATMOSFER VE İKLİM'),
    ('SICAKLIK'),
    ('BASINÇ VE RÜZGARLAR'),
    ('NEMLİLİK VE YAĞIŞ'),
    ('İKLİM TİPLERİ VE BİTKİ ÖRTÜSÜ'),
    ('TÜRKİYE''NİN İKLİMİ'),
    ('YERİN ŞEKİLLENMESİ'),
    ('İÇ KUVVETLER'),
    ('DIŞ KUVVETLER'),
    ('SU KAYNAKLARI'),
    ('TOPRAKLAR'),
    ('BİTKİLER'),
    ('NÜFUS VE GÖÇ')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'COĞRAFYA';

-- Insert topics for FELSEFE
INSERT INTO topics (name, subject_id) 
SELECT topic_name, s.id 
FROM (VALUES 
    ('FELSEFEYİ TANIMA'),
    ('FELSEFE İLE DÜŞÜNME'),
    ('VARLIK FELSEFESİ'),
    ('BİLGİ FELSEFESİ'),
    ('BİLİM FELSEFESİ'),
    ('AHLAK FELSEFESİ'),
    ('DİN FELSEFESİ'),
    ('SİYASET FELSEFESİ'),
    ('SANAT FELSEFESİ')
) AS t(topic_name)
CROSS JOIN subjects s 
WHERE s.name = 'FELSEFE';

-- Show summary of inserted topics
SELECT 
    s.name as subject_name,
    COUNT(t.id) as topic_count
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id
GROUP BY s.id, s.name
ORDER BY s.name; 