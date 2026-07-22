import { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator as CalcIcon, AlertTriangle, CheckCircle2, XCircle, Info, Plus, Target, Book, Trash2, ChevronRight } from 'lucide-react';
import { ThemeContext } from '../App';

export default function Calculator() {
  const { theme } = useContext(ThemeContext);
  
  // ÜST KISIM: Hızlı Hesaplayıcı State'leri
  const [vize, setVize] = useState(50);
  const [final, setFinal] = useState(50);
  const [average, setAverage] = useState(50);
  const [status, setStatus] = useState('pass');

  // ALT KISIM: Kişisel Ders Takibi State'leri
  const [savedCourses, setSavedCourses] = useState(() => {
    const saved = localStorage.getItem('muehplattmon_grades');
    return saved ? JSON.parse(saved) : [];
  });
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseVize, setNewCourseVize] = useState('');

  // Hızlı Hesaplayıcı Mantığı (Geçme notu 50)
  useEffect(() => {
    const calcAvg = (vize * 0.4) + (final * 0.6);
    setAverage(calcAvg.toFixed(1));

    if (final < 50) {
      setStatus('fail_limit'); 
    } else if (calcAvg < 50) {
      setStatus('fail_avg'); 
    } else {
      setStatus('pass'); 
    }
  }, [vize, final]);

  // Kişisel Dersleri Belleğe Kaydetme
  useEffect(() => {
    localStorage.setItem('muehplattmon_grades', JSON.stringify(savedCourses));
  }, [savedCourses]);

  // Final Hedefi Hesaplama Formülü (Hedef 50)
  const calculateTargetFinal = (v) => {
    const target = (50 - (v * 0.4)) / 0.6;
    if (target > 100) return 'imkansiz';
    return Math.max(50, Math.ceil(target)); // Baraj 50
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourseName.trim() || newCourseVize === '') return;

    const v = Number(newCourseVize);
    const target = calculateTargetFinal(v);

    const newCourse = {
      id: crypto.randomUUID(),
      name: newCourseName,
      vize: v,
      final: '',
      targetFinal: target
    };

    setSavedCourses([newCourse, ...savedCourses]);
    setNewCourseName('');
    setNewCourseVize('');
  };

  const handleUpdateFinal = (id, finalValue) => {
    if (finalValue === '') return;
    setSavedCourses(savedCourses.map(course => 
      course.id === id ? { ...course, final: finalValue } : course
    ));
  };

  const handleDeleteCourse = (id) => {
    setSavedCourses(savedCourses.filter(c => c.id !== id));
  };

  const getCourseStatus = (v, f) => {
    if (f === '') return 'pending';
    const vNum = Number(v);
    const fNum = Number(f);
    const avg = (vNum * 0.4) + (fNum * 0.6);
    if (fNum < 50) return { state: 'fail_limit', avg: avg.toFixed(1) };
    if (avg < 50) return { state: 'fail_avg', avg: avg.toFixed(1) };
    return { state: 'pass', avg: avg.toFixed(1) };
  };

  return (
    <div className="flex-1 p-6 md:p-10 relative overflow-y-auto font-sans min-h-screen">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <header className="mb-10 relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${theme.bgLight} ${theme.border} flex items-center justify-center ${theme.text} ${theme.glow}`}>
            <CalcIcon className="w-6 h-6" />
          </div>
          Not <span className={theme.text}>Merkezi</span>
        </h1>
        <p className="text-gray-400 mt-2 font-medium text-sm flex items-center gap-2">
          <Info className="w-4 h-4" /> Uludağ Üniversitesi sistemi: Geçme notu 50, Final barajı 50.
        </p>
      </header>

      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        
        {/* HIZLI HESAPLAYICI BÖLÜMÜ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">Hızlı Simülasyon</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bgLight} blur-[50px] rounded-full pointer-events-none opacity-30`}></div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white tracking-widest">VİZE <span className="text-gray-500 text-xs">(%40)</span></h3>
                  <span className={`text-4xl font-black ${theme.text}`}>{vize}</span>
                </div>
                <div className="relative w-full h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                  <motion.div className={`absolute top-0 left-0 h-full ${theme.bg}`} initial={{ width: 0 }} animate={{ width: `${vize}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  <input type="range" min="0" max="100" value={vize} onChange={(e) => setVize(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 ${final < 50 ? 'bg-red-500/10' : theme.bgLight} blur-[50px] rounded-full pointer-events-none opacity-30 transition-colors`}></div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white tracking-widest">FİNAL <span className="text-gray-500 text-xs">(%60)</span></h3>
                  <span className={`text-4xl font-black ${final < 50 ? 'text-red-400' : theme.text} transition-colors`}>{final}</span>
                </div>
                <div className="relative w-full h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                  <motion.div className={`absolute top-0 left-0 h-full ${final < 50 ? 'bg-red-500' : theme.bg} transition-colors`} initial={{ width: 0 }} animate={{ width: `${final}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  <input type="range" min="0" max="100" value={final} onChange={(e) => setFinal(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className={`h-full bg-white/[0.02] border ${status === 'pass' ? theme.border : 'border-red-500/30'} rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-center items-center text-center transition-all duration-500 relative overflow-hidden`}>
              <div className={`absolute inset-0 ${status === 'pass' ? theme.bgLight : 'bg-red-500/10'} blur-[100px] opacity-40 pointer-events-none`}></div>
              <p className="text-gray-400 text-xs font-bold tracking-[0.2em] uppercase mb-2 relative z-10">Dönem Sonu Ortalaması</p>
              <motion.div key={average} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10">
                <span className={`text-7xl font-black tracking-tighter ${status === 'pass' ? 'text-white' : 'text-red-400'} drop-shadow-2xl`}>{average}</span>
              </motion.div>
              <div className="mt-6 relative z-10 w-full max-w-sm">
                {status === 'pass' && <div className={`p-3 rounded-xl bg-white/5 border ${theme.border} flex items-center gap-3`}><div className={`w-8 h-8 rounded-full ${theme.bg} flex items-center justify-center text-black`}><CheckCircle2 className="w-4 h-4" /></div><div className="text-left"><h4 className="text-white font-bold text-sm">Geçtiniz!</h4></div></div>}
                {status === 'fail_limit' && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-black"><XCircle className="w-4 h-4" /></div><div className="text-left"><h4 className="text-red-400 font-bold text-sm">Kaldınız (Final Barajı)</h4></div></div>}
                {status === 'fail_avg' && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-black"><AlertTriangle className="w-4 h-4" /></div><div className="text-left"><h4 className="text-red-400 font-bold text-sm">Kaldınız (Ortalama Altı)</h4></div></div>}
              </div>
            </div>
          </div>
        </section>

        {/* KİŞİSEL DERS TAKİBİ BÖLÜMÜ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">Kişisel Ders Takibim</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Yeni Ders Ekleme Formu */}
            <form onSubmit={handleAddCourse} className="lg:col-span-1 bg-black/40 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Book className={`w-5 h-5 ${theme.text}`} />
                  <h3 className="text-base font-bold text-white">Yeni Ders Hedefi Ekle</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 font-bold mb-1.5 uppercase tracking-wider">Dersin Adı</label>
                    <input type="text" required value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="Örn: Termodinamik" className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold mb-1.5 uppercase tracking-wider">Vize Notun</label>
                    <input type="number" required min="0" max="100" value={newCourseVize} onChange={(e) => setNewCourseVize(e.target.value)} placeholder="Aldığın Not (Örn: 45)" className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30 transition-all" />
                  </div>
                </div>
              </div>
              
              <button type="submit" className={`mt-6 w-full py-3.5 rounded-xl ${theme.bg} text-black font-bold text-sm transition-all flex items-center justify-center gap-2 ${theme.glowStrong} hover:opacity-90 cursor-pointer`}>
                <Plus className="w-4 h-4 stroke-[3]" /> Kaydet ve Hedef Belirle
              </button>
            </form>

            {/* Kayıtlı Dersler Listesi */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
              <AnimatePresence>
                {savedCourses.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sm:col-span-2 py-12 flex flex-col items-center justify-center text-gray-500 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Target className="w-10 h-10 mb-3 opacity-50" />
                    <p className="font-bold text-sm">Henüz bir ders eklemedin.</p>
                  </motion.div>
                ) : (
                  savedCourses.map((course) => {
                    const statusInfo = getCourseStatus(course.vize, course.final);
                    
                    return (
                      <motion.div key={course.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} layout className={`bg-white/[0.03] border ${course.final !== '' ? (statusInfo.state === 'pass' ? theme.border : 'border-red-500/30') : 'border-white/10'} rounded-3xl p-5 shadow-lg relative flex flex-col transition-colors`}>
                        
                        {/* KONFETİ EFEKTİ VE ROZET (SADECE GEÇTİĞİNDE ÇIKAR) */}
                        <AnimatePresence>
                          {statusInfo.state === 'pass' && (
                            <>
                              <motion.div 
                                initial={{ scale: 0, opacity: 0, rotate: -15 }} 
                                animate={{ scale: 1, opacity: 1, rotate: 0 }} 
                                className={`absolute -top-3 -right-3 ${theme.bg} text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20 flex items-center gap-1`}
                              >
                                🎉 GEÇTİN
                              </motion.div>
                              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
                                {[...Array(6)].map((_, i) => (
                                  <motion.span
                                    key={i}
                                    initial={{ opacity: 1, y: 50, x: 0, scale: 0 }}
                                    animate={{ opacity: 0, y: -80, x: (Math.random() - 0.5) * 80, scale: Math.random() * 1.5 + 0.5, rotate: Math.random() * 360 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="absolute bottom-4 left-1/2 text-2xl"
                                  >
                                    🎉
                                  </motion.span>
                                ))}
                              </div>
                            </>
                          )}
                        </AnimatePresence>

                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-white text-base truncate pr-2 relative z-20">{course.name}</h4>
                          <button onClick={() => handleDeleteCourse(course.id)} className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer relative z-20"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="flex items-center justify-between mb-4 bg-black/40 p-3 rounded-xl border border-white/5 relative z-20">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Vize</p>
                            <p className="text-lg font-black text-white">{course.vize}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Hedef Final</p>
                            {course.targetFinal === 'imkansiz' ? (
                              <p className="text-sm font-black text-red-400 mt-1">Geçilemez</p>
                            ) : (
                              <p className={`text-lg font-black ${theme.text}`}>{course.targetFinal}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto relative z-20">
                          {course.final === '' ? (
                            <div className="flex gap-2">
                              {/* YENİ GÜVENLİ İNPUT MANTIĞI: onChange kaldırıldı, onay butonu eklendi */}
                              <input 
                                id={`final-input-${course.id}`}
                                type="number" min="0" max="100" 
                                placeholder="Final Notun?" 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.target.value !== '') {
                                    handleUpdateFinal(course.id, e.target.value);
                                  }
                                }}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-white/30 text-center" 
                              />
                              <button 
                                onClick={() => {
                                  const val = document.getElementById(`final-input-${course.id}`).value;
                                  handleUpdateFinal(course.id, val);
                                }}
                                className={`px-4 rounded-xl ${theme.bg} text-black font-bold hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer`}
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className={`p-3 rounded-xl flex items-center justify-between ${statusInfo.state === 'pass' ? 'bg-white/5' : 'bg-red-500/10'} border ${statusInfo.state === 'pass' ? theme.border : 'border-red-500/30'}`}>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Ortalaman</p>
                                <p className={`text-xl font-black ${statusInfo.state === 'pass' ? 'text-white' : 'text-red-400'}`}>{statusInfo.avg}</p>
                              </div>
                              <div className="text-right">
                                {statusInfo.state === 'pass' ? (
                                  <span className={`text-xs font-bold ${theme.text} flex items-center gap-1`}><CheckCircle2 className="w-4 h-4" /> Geçtin</span>
                                ) : (
                                  <span className="text-xs font-bold text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Kaldın</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}