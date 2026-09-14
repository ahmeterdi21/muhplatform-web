// Bursa Uludağ Üniversitesi 2026 - 2027 Eğitim-Öğretim Yılı Önlisans ve Lisans Akademik Takvimi
export const ACADEMIC_CALENDAR_EVENTS = [
  // --- GÜZ YARIYILI ---
  {
    id: "acad-guz-1",
    title: "Katkı Payı / Öğrenim Ücreti Yatırma Süresi (Güz)",
    description: "Bursa Uludağ Üniversitesi Güz yarıyılı harç ve katkı payı yatırma dönemi.",
    startTime: new Date(2026, 7, 31, 8, 0),
    endTime: new Date(2026, 8, 25, 23, 59),
    color: "blue",
    category: "Ders Kayıt",
    tags: ["Akademik Takvim", "Önemli"],
    isAcademic: true
  },
  {
    id: "acad-guz-2",
    title: "Ders Kaydı Yenileme Süresi (Güz)",
    description: "Öğrenci otomasyonu üzerinden Güz yarıyılı ders kayıtlarının yenilenmesi.",
    startTime: new Date(2026, 8, 14, 8, 0),
    endTime: new Date(2026, 8, 17, 23, 59),
    color: "blue",
    category: "Ders Kayıt",
    tags: ["Akademik Takvim", "Önemli", "Acil"],
    isAcademic: true
  },
  {
    id: "acad-guz-3",
    title: "Kapanan Seçmeli Derslerin İlanı (Güz)",
    description: "Yeterli kontenjana ulaşamayan seçmeli derslerin ilanı.",
    startTime: new Date(2026, 8, 22, 9, 0),
    endTime: new Date(2026, 8, 22, 17, 0),
    color: "blue",
    category: "Ders Kayıt",
    tags: ["Akademik Takvim"],
    isAcademic: true
  },
  {
    id: "acad-guz-4",
    title: "Kapanan Seçmeli Ders Bırakma / Ekleme (Güz)",
    description: "Kapanan dersler yerine yeni seçmeli derslerin seçilmesi ve ekle-bırak süresi.",
    startTime: new Date(2026, 8, 23, 8, 0),
    endTime: new Date(2026, 8, 25, 23, 59),
    color: "blue",
    category: "Ders Kayıt",
    tags: ["Akademik Takvim"],
    isAcademic: true
  },
  {
    id: "acad-guz-5",
    title: "Güz Yarıyılı Derslerin Başlaması 🚀",
    description: "2026-2027 Güz Yarıyılı derslerinin resmi olarak başlaması.",
    startTime: new Date(2026, 8, 28, 8, 30),
    endTime: new Date(2026, 8, 28, 17, 30),
    color: "green",
    category: "Akademik Dönem",
    tags: ["Akademik Takvim", "Güz Yarıyılı"],
    isAcademic: true
  },
  {
    id: "acad-guz-6",
    title: "29 Ekim Cumhuriyet Bayramı Tatili",
    description: "Resmi tatil (28 Ekim yarım gün).",
    startTime: new Date(2026, 9, 28, 13, 0),
    endTime: new Date(2026, 9, 29, 23, 59),
    color: "pink",
    category: "Resmi Tatil",
    tags: ["Resmi Tatil"],
    isAcademic: true
  },
  {
    id: "acad-guz-7",
    title: "Yılbaşı Tatili",
    description: "1 Ocak Yılbaşı resmi tatili.",
    startTime: new Date(2027, 0, 1, 0, 0),
    endTime: new Date(2027, 0, 1, 23, 59),
    color: "pink",
    category: "Resmi Tatil",
    tags: ["Resmi Tatil"],
    isAcademic: true
  },
  {
    id: "acad-guz-8",
    title: "Güz Yarıyılı Derslerin Sona Ermesi 🏁",
    description: "Güz yarıyılı derslerinin tamamlanması (72 iş günü).",
    startTime: new Date(2027, 0, 8, 17, 0),
    endTime: new Date(2027, 0, 8, 23, 59),
    color: "green",
    category: "Akademik Dönem",
    tags: ["Akademik Takvim", "Güz Yarıyılı"],
    isAcademic: true
  },
  {
    id: "acad-guz-9",
    title: "Güz Yarıyıl Sonu (Final) Sınavları 📝",
    description: "Güz yarıyıl sonu final sınavları haftası.",
    startTime: new Date(2027, 0, 11, 8, 30),
    endTime: new Date(2027, 0, 22, 18, 0),
    color: "red",
    category: "Sınav Dönemi",
    tags: ["Akademik Takvim", "Final", "Acil"],
    isAcademic: true
  },
  {
    id: "acad-guz-10",
    title: "Güz Final Not Girişlerinin Son Günü",
    description: "Öğretim elemanlarının final sınavı notlarını sisteme son giriş tarihi.",
    startTime: new Date(2027, 0, 25, 9, 0),
    endTime: new Date(2027, 0, 25, 23, 59),
    color: "red",
    category: "Sınav Dönemi",
    tags: ["Akademik Takvim"],
    isAcademic: true
  },
  {
    id: "acad-guz-11",
    title: "Güz Dönemi Yarıyıl Tatili (ARA)",
    description: "Güz ve Bahar yarıyılları arası sömestir tatili (7 gün).",
    startTime: new Date(2027, 0, 25, 0, 0),
    endTime: new Date(2027, 0, 31, 23, 59),
    color: "orange",
    category: "Akademik Dönem",
    tags: ["Akademik Takvim", "Tatil"],
    isAcademic: true
  },
  {
    id: "acad-guz-12",
    title: "Güz Bütünleme Sınavları 🚨",
    description: "Güz yarıyılı bütünleme sınavları dönemi.",
    startTime: new Date(2027, 1, 1, 8, 30),
    endTime: new Date(2027, 1, 6, 18, 0),
    color: "red",
    category: "Sınav Dönemi",
    tags: ["Akademik Takvim", "Bütünleme"],
    isAcademic: true
  },
  {
    id: "acad-guz-13",
    title: "Güz Bütünleme Not Girişlerinin Son Günü",
    description: "Bütünleme notlarının sisteme işlenmesi için son gün.",
    startTime: new Date(2027, 1, 8, 9, 0),
    endTime: new Date(2027, 1, 8, 23, 59),
    color: "red",
    category: "Sınav Dönemi",
    tags: ["Akademik Takvim"],
    isAcademic: true
  },

  // --- BAHAR YARIYILI ---
  {
    id: "acad-bah-1",
    title: "Katkı Payı / Öğrenim Ücreti Yatırma Süresi (Bahar)",
    description: "Bahar yarıyılı harç ve katkı payı yatırma dönemi.",
    startTime: new Date(2027, 1, 1, 8, 0),
    endTime: new Date(2027, 1, 19, 23, 59),
    color: "blue",
    category: "Ders Kayıt",
    tags: ["Akademik Takvim", "Önemli"],
    isAcademic: true
  },
  {
    id: "acad-bah-2",
    title: "Ders Kaydı Yenileme Süresi (Bahar)",
    description: "Bahar yarıyılı ders kayıtlarının otomasyondan yenilenmesi.",
    startTime: new Date(2027, 1, 8, 8, 0),
    endTime: new Date(2027, 1, 11, 23, 59),
    color: "blue",
    category: "Ders Kayıt",
    tags: ["Akademik Takvim", "Önemli", "Acil"],
    isAcademic: true
  },
  {
    id: "acad-bah-3",
    title: "Bahar Yarıyılı Derslerin Başlaması 🚀",
    description: "2026-2027 Bahar Yarıyılı derslerinin resmi olarak başlaması.",
    startTime: new Date(2027, 1, 22, 8, 30),
    endTime: new Date(2027, 1, 22, 17, 30),
    color: "green",
    category: "Akademik Dönem",
    tags: ["Akademik Takvim", "Bahar Yarıyılı"],
    isAcademic: true
  },
  {
    id: "acad-bah-4",
    title: "Ramazan Bayramı Tatili 🌙",
    description: "8 Mart Arefe - 12 Mart Ramazan Bayramı tatili.",
    startTime: new Date(2027, 2, 8, 13, 0),
    endTime: new Date(2027, 2, 12, 23, 59),
    color: "purple",
    category: "Dini Bayram",
    tags: ["Resmi Tatil"],
    isAcademic: true
  },
  {
    id: "acad-bah-5",
    title: "23 Nisan Ulusal Egemenlik Bayramı",
    description: "Resmi tatil.",
    startTime: new Date(2027, 3, 23, 0, 0),
    endTime: new Date(2027, 3, 23, 23, 59),
    color: "pink",
    category: "Resmi Tatil",
    tags: ["Resmi Tatil"],
    isAcademic: true
  },
  {
    id: "acad-bah-6",
    title: "1 Mayıs İşçi ve Emekçiler Bayramı",
    description: "Resmi tatil.",
    startTime: new Date(2027, 4, 1, 0, 0),
    endTime: new Date(2027, 4, 1, 23, 59),
    color: "pink",
    category: "Resmi Tatil",
    tags: ["Resmi Tatil"],
    isAcademic: true
  },
  {
    id: "acad-bah-7",
    title: "Kurban Bayramı & 19 Mayıs Tatili 🐑",
    description: "15-19 Mayıs Kurban Bayramı ve Atatürk'ü Anma, Gençlik ve Spor Bayramı tatili.",
    startTime: new Date(2027, 4, 15, 12, 0),
    endTime: new Date(2027, 4, 19, 23, 59),
    color: "purple",
    category: "Dini Bayram",
    tags: ["Resmi Tatil"],
    isAcademic: true
  },
  {
    id: "acad-bah-8",
    title: "Bahar Yarıyılı Derslerin Sona Ermesi 🏁",
    description: "Bahar yarıyılı derslerinin tamamlanması (71 iş günü).",
    startTime: new Date(2027, 5, 11, 17, 0),
    endTime: new Date(2027, 5, 11, 23, 59),
    color: "green",
    category: "Akademik Dönem",
    tags: ["Akademik Takvim", "Bahar Yarıyılı"],
    isAcademic: true
  },
  {
    id: "acad-bah-9",
    title: "Bahar Yarıyıl Sonu (Final) Sınavları 📝",
    description: "Bahar yarıyıl sonu final sınavları haftası.",
    startTime: new Date(2027, 5, 14, 8, 30),
    endTime: new Date(2027, 5, 25, 18, 0),
    color: "red",
    category: "Sınav Dönemi",
    tags: ["Akademik Takvim", "Final", "Acil"],
    isAcademic: true
  },
  {
    id: "acad-bah-10",
    title: "Bahar Final Not Girişlerinin Son Günü",
    description: "Final sınav notlarının sisteme girilmesi için son gün.",
    startTime: new Date(2027, 5, 28, 9, 0),
    endTime: new Date(2027, 5, 28, 23, 59),
    color: "red",
    category: "Sınav Dönemi",
    tags: ["Akademik Takvim"],
    isAcademic: true
  },
  {
    id: "acad-bah-11",
    title: "Bahar Bütünleme Sınavları 🚨",
    description: "Bahar yarıyılı bütünleme sınavları dönemi.",
    startTime: new Date(2027, 6, 5, 8, 30),
    endTime: new Date(2027, 6, 10, 18, 0),
    color: "red",
    category: "Sınav Dönemi",
    tags: ["Akademik Takvim", "Bütünleme"],
    isAcademic: true
  },
  {
    id: "acad-bah-12",
    title: "15 Temmuz Demokrasi ve Milli Birlik Günü",
    description: "Resmi tatil.",
    startTime: new Date(2027, 6, 15, 0, 0),
    endTime: new Date(2027, 6, 15, 23, 59),
    color: "pink",
    category: "Resmi Tatil",
    tags: ["Resmi Tatil"],
    isAcademic: true
  }
];
