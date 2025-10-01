// 8. sınıf LGS konu/kazanım listeleri (özet, örnek set)
export const LGS_TOPICS: Record<string, string[]> = {
  'Türkçe': [
    'Okuduğunu Anlama',
    'Paragraf Anlama ve Çıkarım',
    'Cümlede Anlam İlişkileri',
    'Sözcükte Anlam (Eş, Zıt, Eş Sesli)',
    'Dil Bilgisi (Kelime Türleri)',
    'Dil Bilgisi (Cümle Bilgisi)',
    'Noktalama İşaretleri',
    'Yazım Kuralları',
    'Söz Sanatları ve Anlatım Bozuklukları',
    'Metin Türleri ve Özellikleri',
  ],
  'Matematik': [
    'Çarpanlar ve Katlar',
    'Rasyonel Sayılar',
    'Üslü İfadeler ve Köklü Sayılar',
    'Cebirsel İfadeler',
    'Doğrusal Denklemler',
    'Eşitsizlikler',
    'Oran ve Orantı',
    'Yüzdeler',
    'Basit Eşitlikler',
    'Koordinat Sistemi',
    'Doğrusal Fonksiyonlar',
    'Üçgenler ve Dörtgenler',
    'Eşlik ve Benzerlik',
    'Dönüşüm Geometrisi',
    'Çember ve Daire',
    'Prizmalar',
    'Veri Analizi',
    'Merkezi Eğilim Ölçüleri',
    'Olasılık',
  ],
  'Fen Bilgisi': [
    'Güneş Sistemi ve Tutulmalar',
    'Mevsimler ve İklim',
    'Hücre ve Bölünmeler',
    'DNA ve Genetik Kod',
    'Kalıtım',
    'Ekosistem İlişkileri',
    'İnsan ve Çevre',
    'Maddenin Yapısı ve Özellikleri',
    'Karışımlar',
    'Asit Bazlar ve Tuzlar',
    'Kimyasal Tepkimeler',
    'Madde ve Endüstri',
    'Kuvvet ve Hareket',
    'Basit Makineler',
    'Enerji Dönüşümleri ve Çevre Bilimi',
    'Işık ve Ses',
    'Elektrik Yükleri ve Elektriklenme',
    'Elektrik Enerjisi',
  ],
  'Sosyal Bilgiler': [
    'Anadolu ve Mezopotamya Uygarlıkları',
    'İlk Türk Devletleri',
    'İslamiyet ve Türkler',
    'Beylikten Devlete',
    'Klasik Çağda Osmanlı',
    'Değişim Çağında Osmanlı',
    'Milli Mücadele',
    'Atatürk İlkeleri ve İnkılap Tarihi',
    'Türkiye Cumhuriyeti Tarihi',
    'Coğrafi Konum ve İklim',
    'Türkiye\'nin Fiziki Coğrafyası',
    'Türkiye\'nin Beşeri Coğrafyası',
    'Türkiye\'nin Ekonomik Coğrafyası',
    'Nüfus ve Yerleşme',
    'Ekonomik Faaliyetler',
    'Ülkeler Arası Köprüler',
    'Küresel Bağlantılar',
    'Yaşadığımız Yer',
    'İnsanlar Yerler ve Çevreler',
    'Bilim Teknoloji ve Toplum',
    'Üretim Dağıtım ve Tüketim',
    'Etkin Vatandaşlık',
    'Küresel Bağlantılar',
  ],
  'Din Kültürü': [
    'Kur\'an-ı Kerim',
    'Hz. Muhammed\'in Hayatı',
    'İslam\'ın Şartları',
    'İman Esasları',
    'İbadetler',
    'Ahlak ve Değerler',
    'İslam Tarihi',
    'Dinler ve Hoşgörü',
  ],
  'İngilizce': [
    'Friendship (Arkadaşlık)',
    'Teen Life (Gençlik Hayatı)',
    'In the Kitchen (Mutfakta)',
    'On the Phone (Telefonda)',
    'The Internet (İnternet)',
    'Adventures (Maceralar)',
    'Tourism (Turizm)',
    'Chores (Ev İşleri)',
    'Science (Bilim)',
    'Natural Forces (Doğal Güçler)',
    'Tenses (Zamanlar)',
    'Modal Verbs (Yardımcı Fiiller)',
    'Passive Voice (Edilgen Çatı)',
    'Conditionals (Koşul Cümleleri)',
    'Vocabulary (Kelime Bilgisi)',
    'Reading Comprehension (Okuduğunu Anlama)',
    'Grammar (Dilbilgisi)',
  ],
};

// LGS Puan Hesaplama Fonksiyonları
export const LGS_SUBJECT_WEIGHTS = {
  'Türkçe': 20,
  'Matematik': 20, 
  'Fen Bilgisi': 20,
  'Sosyal Bilgiler': 10,
  'Din Kültürü': 10,
  'İngilizce': 10,
};

export function calculateLGSScore(results: { [subject: string]: { dogru: number; yanlis: number; bos: number } }): number {
  let totalScore = 0;
  
  Object.entries(results).forEach(([subject, result]) => {
    const weight = LGS_SUBJECT_WEIGHTS[subject as keyof typeof LGS_SUBJECT_WEIGHTS] || 0;
    const net = result.dogru - (result.yanlis / 4);
    const subjectScore = Math.max(0, net) * (500 / 90) * (weight / 20);
    totalScore += subjectScore;
  });
  
  return Math.round(totalScore);
}

// LGS Başarı Seviyeleri
export const LGS_SUCCESS_LEVELS = {
  EXCELLENT: { min: 450, label: 'Mükemmel', color: '#10b981', description: 'Hedeflediğin okula kesin girersin!' },
  VERY_GOOD: { min: 400, label: 'Çok İyi', color: '#3b82f6', description: 'Çok iyi gidiyorsun, böyle devam!' },
  GOOD: { min: 350, label: 'İyi', color: '#f59e0b', description: 'İyi seviyedesin, biraz daha çalış!' },
  AVERAGE: { min: 300, label: 'Orta', color: '#ef4444', description: 'Daha fazla çalışman gerekiyor!' },
  NEEDS_WORK: { min: 0, label: 'Geliştirilmeli', color: '#dc2626', description: 'Çok çalışman gerekiyor!' },
};

export function getLGSSuccessLevel(score: number) {
  for (const [key, level] of Object.entries(LGS_SUCCESS_LEVELS)) {
    if (score >= level.min) {
      return level;
    }
  }
  return LGS_SUCCESS_LEVELS.NEEDS_WORK;
}

// LGS Hedef Okullar
export const LGS_TARGET_SCHOOLS = [
  { name: 'Fen Lisesi', minScore: 480, type: 'Fen' },
  { name: 'Sosyal Bilimler Lisesi', minScore: 450, type: 'Sosyal' },
  { name: 'Anadolu Lisesi', minScore: 400, type: 'Genel' },
  { name: 'İmam Hatip Lisesi', minScore: 350, type: 'İmam Hatip' },
  { name: 'Meslek Lisesi', minScore: 300, type: 'Meslek' },
];

// Çalışma Önerileri
export const STUDY_RECOMMENDATIONS = {
  WEAK_AREAS: {
    'Türkçe': [
      'Her gün 30 dakika kitap oku',
      'Paragraf sorularını çöz',
      'Kelime hazineni geliştir',
      'Dil bilgisi kurallarını tekrar et'
    ],
    'Matematik': [
      'Temel işlemleri pekiştir',
      'Geometri formüllerini ezberle',
      'Günde 20 soru çöz',
      'Hatalı sorularını tekrar et'
    ],
    'Fen Bilgisi': [
      'Deney videolarını izle',
      'Formülleri ezberle',
      'Kavram haritaları çiz',
      'Güncel bilim haberlerini takip et'
    ],
    'Sosyal Bilgiler': [
      'Tarih kronolojisini öğren',
      'Harita çalışmaları yap',
      'Belgesel izle',
      'Güncel olayları takip et'
    ],
    'Din Kültürü': [
      'Temel kavramları öğren',
      'Ayet ve hadisleri ezberle',
      'İslam tarihi oku',
      'Değerler eğitimi al'
    ],
    'İngilizce': [
      'Günde 10 kelime öğren',
      'İngilizce şarkı dinle',
      'Gramer kurallarını çalış',
      'İngilizce film izle (altyazılı)'
    ]
  }
};

// Motivasyon Mesajları
export const MOTIVATION_MESSAGES = [
  'Başarı, hazırlık fırsatla buluştuğunda ortaya çıkar! 🌟',
  'Her gün biraz daha iyiye gidiyorsun! 💪',
  'Hayalindeki okula giden yoldasın! 🎯',
  'Çalışmak zor ama başarı daha güzel! 🏆',
  'Sen yapabilirsin, kendine inan! ✨',
  'Her hata seni daha güçlü yapıyor! 📚',
  'LGS\'ye hazırlık bir maraton, sen de şampiyonsun! 🏃‍♂️',
  'Bugün çalıştığın her dakika yarın seni gururlandıracak! ⏰'
];

export function getRandomMotivationMessage(): string {
  return MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];
}

// Haftalık Çalışma Planı Önerileri
export const WEEKLY_STUDY_PLAN = {
  MONDAY: { focus: 'Matematik', duration: 90, topics: ['Cebirsel İfadeler', 'Denklemler'] },
  TUESDAY: { focus: 'Türkçe', duration: 60, topics: ['Okuduğunu Anlama', 'Paragraf'] },
  WEDNESDAY: { focus: 'Fen Bilgisi', duration: 90, topics: ['Madde', 'Enerji'] },
  THURSDAY: { focus: 'Sosyal Bilgiler', duration: 60, topics: ['Tarih', 'Coğrafya'] },
  FRIDAY: { focus: 'İngilizce', duration: 45, topics: ['Grammar', 'Vocabulary'] },
  SATURDAY: { focus: 'Din Kültürü', duration: 30, topics: ['İbadetler', 'Ahlak'] },
  SUNDAY: { focus: 'Deneme Sınavı', duration: 120, topics: ['Tüm Konular'] }
};

// LGS Geri Sayım
export function getDaysUntilLGS(): number {
  const lgsDate = new Date('2024-06-02'); // LGS tarihi (örnek)
  const today = new Date();
  const diffTime = lgsDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Başarı Rozetleri
export const LGS_BADGES = {
  FIRST_EXAM: { name: 'İlk Deneme', icon: '🏁', description: 'İlk deneme sınavını tamamladın!' },
  FIVE_EXAMS: { name: '5 Deneme', icon: '🎯', description: '5 deneme sınavı tamamladın!' },
  TEN_EXAMS: { name: '10 Deneme', icon: '🏆', description: '10 deneme sınavı tamamladın!' },
  MATH_MASTER: { name: 'Matematik Ustası', icon: '🧮', description: 'Matematikte 18+ net yaptın!' },
  TURKISH_EXPERT: { name: 'Türkçe Uzmanı', icon: '📚', description: 'Türkçede 18+ net yaptın!' },
  SCIENCE_GENIUS: { name: 'Fen Dahisi', icon: '🔬', description: 'Fen Bilgisinde 18+ net yaptın!' },
  SOCIAL_SCHOLAR: { name: 'Sosyal Bilimci', icon: '🌍', description: 'Sosyal Bilgilerde 9+ net yaptın!' },
  ENGLISH_SPEAKER: { name: 'İngilizce Konuşmacısı', icon: '🇬🇧', description: 'İngilizcede 9+ net yaptın!' },
  RELIGIOUS_SCHOLAR: { name: 'Din Bilgini', icon: '📿', description: 'Din Kültüründe 9+ net yaptın!' },
  CONSISTENT_STUDENT: { name: 'Düzenli Öğrenci', icon: '📅', description: '7 gün üst üste çalıştın!' },
  IMPROVEMENT_CHAMPION: { name: 'Gelişim Şampiyonu', icon: '📈', description: 'Son 5 denemede sürekli arttın!' },
  TARGET_ACHIEVER: { name: 'Hedef Avcısı', icon: '🎯', description: 'Hedef puanına ulaştın!' }
};

export function checkEarnedBadges(userResults: any[]): string[] {
  const badges: string[] = [];
  
  if (userResults.length >= 1) badges.push('FIRST_EXAM');
  if (userResults.length >= 5) badges.push('FIVE_EXAMS');
  if (userResults.length >= 10) badges.push('TEN_EXAMS');
  
  // Branş bazlı rozetler için kontrol
  const subjectNets = {
    'Türkçe': 0,
    'Matematik': 0,
    'Fen Bilgisi': 0,
    'Sosyal Bilgiler': 0,
    'İngilizce': 0,
    'Din Kültürü': 0
  };
  
  userResults.forEach(result => {
    const net = result.dogruSayisi - (result.yanlisSayisi / 4);
    if (subjectNets[result.dersAdi] !== undefined) {
      subjectNets[result.dersAdi] = Math.max(subjectNets[result.dersAdi], net);
    }
  });
  
  if (subjectNets['Matematik'] >= 18) badges.push('MATH_MASTER');
  if (subjectNets['Türkçe'] >= 18) badges.push('TURKISH_EXPERT');
  if (subjectNets['Fen Bilgisi'] >= 18) badges.push('SCIENCE_GENIUS');
  if (subjectNets['Sosyal Bilgiler'] >= 9) badges.push('SOCIAL_SCHOLAR');
  if (subjectNets['İngilizce'] >= 9) badges.push('ENGLISH_SPEAKER');
  if (subjectNets['Din Kültürü'] >= 9) badges.push('RELIGIOUS_SCHOLAR');
  
  return badges;
}
    'Enerji Dönüşümleri',
  ],
  'Sosyal Bilgiler': [
    'İnkılap Tarihi',
    'Kurtuluş Savaşı',
    'Atatürk İlkeleri',
    'Türk Dış Politikası',
    'Harita Bilgisi',
  ],
  'Din Kültürü': [
    'Kader ve Kaza',
    'Hz. Muhammed’in Hayatı',
    'Kur’an ve Yorumu',
    'İslam ve İbadet',
  ],
  'İngilizce': [
    'Friendship',
    'Teen Life',
    'In the Kitchen',
    'On the Phone',
    'The Internet',
    'Adventures',
    'Tourism',
    'Chores',
    'Science',
  ],
};

export function getCourseTopics(course: string): string[] {
  return LGS_TOPICS[course] || [];
}
