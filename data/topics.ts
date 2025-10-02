// LGS Branşları ve Konuları
export interface Topic {
  id: string;
  name: string;
  course: string;
}

export const topics: Topic[] = [
  // Türkçe Konuları
  { id: 'tr-1', name: 'Okuduğunu Anlama', course: 'Türkçe' },
  { id: 'tr-2', name: 'Paragraf', course: 'Türkçe' },
  { id: 'tr-3', name: 'Dil Bilgisi', course: 'Türkçe' },
  { id: 'tr-4', name: 'Sözcükte Anlam', course: 'Türkçe' },
  { id: 'tr-5', name: 'Cümlede Anlam', course: 'Türkçe' },
  { id: 'tr-6', name: 'Yazım Kuralları', course: 'Türkçe' },
  { id: 'tr-7', name: 'Noktalama İşaretleri', course: 'Türkçe' },
  { id: 'tr-8', name: 'Fiilimsiler', course: 'Türkçe' },
  { id: 'tr-9', name: 'Cümle Bilgisi', course: 'Türkçe' },
  { id: 'tr-10', name: 'Edebiyat', course: 'Türkçe' },

  // Matematik Konuları
  { id: 'mat-1', name: 'Çarpanlar ve Katlar', course: 'Matematik' },
  { id: 'mat-2', name: 'Tam Sayılar', course: 'Matematik' },
  { id: 'mat-3', name: 'Rasyonel Sayılar', course: 'Matematik' },
  { id: 'mat-4', name: 'Cebirsel İfadeler', course: 'Matematik' },
  { id: 'mat-5', name: 'Eşitlik ve Denklem', course: 'Matematik' },
  { id: 'mat-6', name: 'Oran ve Orantı', course: 'Matematik' },
  { id: 'mat-7', name: 'Yüzdeler', course: 'Matematik' },
  { id: 'mat-8', name: 'Basit Faiz', course: 'Matematik' },
  { id: 'mat-9', name: 'Doğrusal Denklemler', course: 'Matematik' },
  { id: 'mat-10', name: 'Eşitsizlikler', course: 'Matematik' },
  { id: 'mat-11', name: 'Üçgenler', course: 'Matematik' },
  { id: 'mat-12', name: 'Dörtgenler', course: 'Matematik' },
  { id: 'mat-13', name: 'Çember ve Daire', course: 'Matematik' },
  { id: 'mat-14', name: 'Prizmalar', course: 'Matematik' },
  { id: 'mat-15', name: 'Piramitler', course: 'Matematik' },
  { id: 'mat-16', name: 'Silindir, Koni, Küre', course: 'Matematik' },
  { id: 'mat-17', name: 'Veri Analizi', course: 'Matematik' },
  { id: 'mat-18', name: 'Merkezi Eğilim Ölçüleri', course: 'Matematik' },
  { id: 'mat-19', name: 'Olasılık', course: 'Matematik' },

  // Fen Bilimleri Konuları
  { id: 'fen-1', name: 'Hücre ve Bölünmeler', course: 'Fen Bilimleri' },
  { id: 'fen-2', name: 'Kalıtım', course: 'Fen Bilimleri' },
  { id: 'fen-3', name: 'DNA ve Genetik Kod', course: 'Fen Bilimleri' },
  { id: 'fen-4', name: 'Maddenin Yapısı', course: 'Fen Bilimleri' },
  { id: 'fen-5', name: 'Periyodik Sistem', course: 'Fen Bilimleri' },
  { id: 'fen-6', name: 'Kimyasal Türler Arası Etkileşimler', course: 'Fen Bilimleri' },
  { id: 'fen-7', name: 'Asit, Baz ve Tuz', course: 'Fen Bilimleri' },
  { id: 'fen-8', name: 'Elektrik Yükleri ve Elektrik Enerjisi', course: 'Fen Bilimleri' },
  { id: 'fen-9', name: 'Basınç', course: 'Fen Bilimleri' },
  { id: 'fen-10', name: 'Enerji Dönüşümleri', course: 'Fen Bilimleri' },
  { id: 'fen-11', name: 'Işık', course: 'Fen Bilimleri' },
  { id: 'fen-12', name: 'Ses', course: 'Fen Bilimleri' },
  { id: 'fen-13', name: 'Güneş Sistemi ve Ötesi', course: 'Fen Bilimleri' },
  { id: 'fen-14', name: 'Mevsimler ve İklim', course: 'Fen Bilimleri' },
  { id: 'fen-15', name: 'Çevre Bilimi', course: 'Fen Bilimleri' },

  // Sosyal Bilgiler Konuları
  { id: 'sos-1', name: 'İletişim ve İnsan İlişkileri', course: 'Sosyal Bilgiler' },
  { id: 'sos-2', name: 'Türk Tarihinde Yolculuk', course: 'Sosyal Bilgiler' },
  { id: 'sos-3', name: 'İslamiyet\'in Doğuşu', course: 'Sosyal Bilgiler' },
  { id: 'sos-4', name: 'İslam Medeniyetinin Doğuşu', course: 'Sosyal Bilgiler' },
  { id: 'sos-5', name: 'Türklerin İslamiyeti Kabulü', course: 'Sosyal Bilgiler' },
  { id: 'sos-6', name: 'Türklerin Anadolu\'ya Gelişi', course: 'Sosyal Bilgiler' },
  { id: 'sos-7', name: 'Beylikten Devlete', course: 'Sosyal Bilgiler' },
  { id: 'sos-8', name: 'Osmanlı Devleti\'nin Kuruluşu', course: 'Sosyal Bilgiler' },
  { id: 'sos-9', name: 'Osmanlı Devleti\'nin Gelişmesi', course: 'Sosyal Bilgiler' },
  { id: 'sos-10', name: 'Osmanlı Kültür ve Medeniyeti', course: 'Sosyal Bilgiler' },
  { id: 'sos-11', name: 'Zayıflamadan Uyanışa', course: 'Sosyal Bilgiler' },
  { id: 'sos-12', name: 'Milli Mücadele', course: 'Sosyal Bilgiler' },
  { id: 'sos-13', name: 'Atatürk İlkeleri', course: 'Sosyal Bilgiler' },
  { id: 'sos-14', name: 'Demokrasi ve Milli Egemenlik', course: 'Sosyal Bilgiler' },
  { id: 'sos-15', name: 'Ülkemizin Kaynakları', course: 'Sosyal Bilgiler' },
  { id: 'sos-16', name: 'Türkiye\'nin Coğrafi Özellikleri', course: 'Sosyal Bilgiler' },
  { id: 'sos-17', name: 'Ülkemizde Nüfus', course: 'Sosyal Bilgiler' },
  { id: 'sos-18', name: 'Ekonomi ve Sosyal Hayat', course: 'Sosyal Bilgiler' },
  { id: 'sos-19', name: 'Ülkeler Arası Köprüler', course: 'Sosyal Bilgiler' },
  { id: 'sos-20', name: 'Küresel Bağlantılar', course: 'Sosyal Bilgiler' },
  { id: 'sos-21', name: 'Çevre ve Toplum', course: 'Sosyal Bilgiler' },
  { id: 'sos-22', name: 'Bilim, Teknoloji ve Toplum', course: 'Sosyal Bilgiler' },
  { id: 'sos-23', name: 'Yaşadığımız Dünya', course: 'Sosyal Bilgiler' },

  // Din Kültürü ve Ahlak Bilgisi Konuları
  { id: 'din-1', name: 'Kur\'an-ı Kerim', course: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'din-2', name: 'Hz. Muhammed\'in Hayatı', course: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'din-3', name: 'İbadetler', course: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'din-4', name: 'İslam\'ın Şartları', course: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'din-5', name: 'İmanın Şartları', course: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'din-6', name: 'Ahlak ve Değerler', course: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'din-7', name: 'İslam Tarihi', course: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'din-8', name: 'Dinler Tarihi', course: 'Din Kültürü ve Ahlak Bilgisi' },

  // İngilizce Konuları
  { id: 'ing-1', name: 'Present Tense', course: 'İngilizce' },
  { id: 'ing-2', name: 'Past Tense', course: 'İngilizce' },
  { id: 'ing-3', name: 'Future Tense', course: 'İngilizce' },
  { id: 'ing-4', name: 'Modal Verbs', course: 'İngilizce' },
  { id: 'ing-5', name: 'Passive Voice', course: 'İngilizce' },
  { id: 'ing-6', name: 'Conditionals', course: 'İngilizce' },
  { id: 'ing-7', name: 'Question Forms', course: 'İngilizce' },
  { id: 'ing-8', name: 'Adjectives and Adverbs', course: 'İngilizce' },
  { id: 'ing-9', name: 'Prepositions', course: 'İngilizce' },
  { id: 'ing-10', name: 'Vocabulary', course: 'İngilizce' },
  { id: 'ing-11', name: 'Reading Comprehension', course: 'İngilizce' },
  { id: 'ing-12', name: 'Dialogue Completion', course: 'İngilizce' },
  { id: 'ing-13', name: 'Cloze Test', course: 'İngilizce' },
  { id: 'ing-14', name: 'Translation', course: 'İngilizce' },
  { id: 'ing-15', name: 'Sentence Completion', course: 'İngilizce' },
  { id: 'ing-16', name: 'Grammar Rules', course: 'İngilizce' },
  { id: 'ing-17', name: 'Text Analysis', course: 'İngilizce' }
];

export function getCourseTopics(course: string): Topic[] {
  return topics.filter(topic => topic.course === course);
}

export function getAllTopics(): Topic[] {
  return topics;
}

export function getTopicById(id: string): Topic | undefined {
  return topics.find(topic => topic.id === id);
}

export const courses = [
  'Türkçe',
  'Matematik', 
  'Fen Bilimleri',
  'Sosyal Bilgiler',
  'Din Kültürü ve Ahlak Bilgisi',
  'İngilizce'
];