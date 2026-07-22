import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Trophy, ArrowRight, ShieldCheck, Cog, Wrench, Layers, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [isPaused, setIsPaused] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (e.clientX / innerWidth - 0.5) * 30,
        y: (e.clientY / innerHeight - 0.5) * 30
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <BookOpen className={`w-7 h-7 ${theme.text}`} />,
      title: "Geniş Not Arşivi",
      description: "Vize ve finaller için admin onaylı geçmiş sınav soruları, özetler ve çalışma kağıtları tek bir yerde."
    },
    {
      icon: <Users className={`w-7 h-7 ${theme.text}`} />,
      title: "Canlı Odak Odaları",
      description: "Arkadaşlarınla senkronize çalış, molalarını planla ve sesli/görüntülü lobilerde sınavlara birlikte hazırlan."
    },
    {
      icon: <Trophy className={`w-7 h-7 ${theme.text}`} />,
      title: "Profil ve Katkı Puanı",
      description: "Platforma materyal yükledikçe puan kazan, seviyeni yükselt ve dijital kampüsün saygın üyelerinden biri ol."
    },
    {
      icon: <ShieldCheck className={`w-7 h-7 ${theme.text}`} />,
      title: "Güvenli ve Doğrulanmış",
      description: "Yalnızca Uludağ Üniversitesi öğrencilerine özel, şifreli ve güvenli akademik topluluk alanı."
    }
  ];

  const duplicatedFeatures = [...features, ...features, ...features];

  return (
    <div className="min-h-screen bg-[#070a08] text-white flex flex-col justify-between overflow-x-hidden relative font-sans">
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .marquee-track.paused {
          animation-play-state: paused !important;
        }

        @keyframes spinCw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinCcw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .spin-cw-slow {
          animation: spinCw 55s linear infinite;
        }
        .spin-ccw-slow {
          animation: spinCcw 60s linear infinite;
        }
        .spin-cw-fast {
          animation: spinCw 30s linear infinite;
        }
      `}</style>

      {/* ARKA PLAN */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <motion.div 
          animate={{ x: mousePos.x * 1.2, y: mousePos.y * 1.2 }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
          className={`absolute -top-20 -left-20 ${theme.text500} opacity-15`}
        >
          <div className="spin-cw-slow">
            <Cog className="w-[450px] h-[450px]" strokeWidth={0.7} />
          </div>
        </motion.div>

        <motion.div 
          animate={{ x: -mousePos.x * 1.5, y: -mousePos.y * 1.5 }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
          className={`absolute -bottom-32 -right-32 ${theme.text500} opacity-15`}
        >
          <div className="spin-ccw-slow">
            <Cog className="w-[550px] h-[550px]" strokeWidth={0.5} />
          </div>
        </motion.div>

        <motion.div 
          animate={{ x: mousePos.x * 1.0, y: -mousePos.y * 1.2 }}
          transition={{ type: "spring", stiffness: 35, damping: 20 }}
          className="absolute top-1/4 right-10 text-white opacity-[0.03]"
        >
          <div className="spin-cw-fast">
            <Wrench className="w-80 h-80" strokeWidth={0.6} />
          </div>
        </motion.div>

        <motion.div 
          animate={{ x: -mousePos.x * 1.0, y: mousePos.y * 1.0 }}
          transition={{ type: "spring", stiffness: 35, damping: 20 }}
          className={`absolute top-1/2 left-10 ${theme.text500} opacity-10`}
        >
          <div className="spin-ccw-slow">
            <Layers className="w-72 h-72" strokeWidth={0.6} />
          </div>
        </motion.div>

        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${theme.bg} opacity-5 blur-[160px] rounded-full`}></div>
      </div>

      <header className="w-full max-w-7xl mx-auto px-8 py-10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${theme.bg} flex items-center justify-center font-black text-black text-xl ${theme.glowStrong}`}>
            M
          </div>
          {/* Güncellenen Logo Kısmı */}
          <span className="text-xl font-bold tracking-wider text-white">
            MÜH<span className={theme.text}>PLATFORM V2</span>
          </span>
        </div>

        <div>
          <button 
            onClick={() => navigate('/auth')}
            className={`px-7 py-3 rounded-2xl ${theme.bg} text-black text-sm font-bold transition-all ${theme.glowStrong} cursor-pointer flex items-center gap-2 opacity-90 hover:opacity-100`}
          >
            Giriş Yap <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 my-auto py-12">
        <div className="max-w-7xl mx-auto px-8 mb-16 text-center">
          <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full ${theme.bgLight} ${theme.border} ${theme.text} text-xs font-mono font-extrabold mb-6 tracking-widest uppercase ${theme.glow}`}>
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: theme.hex }}></span>
            ULUDAĞ ÜNİVERSİTESİ MÜHENDİSLİK PLATFORMU V2.0
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.15] text-white">
            Mühendislik Eğitimi Artık <span className={`${theme.text} underline decoration-4 underline-offset-8`} style={{ textDecorationColor: theme.hex + '66' }}>Daha Güçlü ve Senkronize.</span>
          </h1>
          <p className="text-gray-300 mt-6 max-w-2xl mx-auto text-lg leading-relaxed font-semibold">
            Ders notlarını paylaş, ortak projeler geliştir ve kampüs arkadaşlarınla canlı çalışma odalarında buluş.
          </p>

          <div className="mt-8 flex justify-center">
            <motion.button 
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/auth')}
              className={`px-9 py-4 rounded-2xl ${theme.bg} text-black font-extrabold text-base transition-all ${theme.glowStrong} flex items-center gap-3 cursor-pointer group opacity-90 hover:opacity-100`}
            >
              Aramıza Katıl 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </motion.button>
          </div>
        </div>

        <div 
          className="w-full overflow-hidden py-10 relative cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="absolute left-0 inset-y-0 w-32 bg-gradient-to-r from-[#070a08] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute right-0 inset-y-0 w-32 bg-gradient-to-l from-[#070a08] to-transparent z-20 pointer-events-none"></div>

          <div className={`marquee-track ${isPaused ? 'paused' : ''} gap-8 px-8`}>
            {duplicatedFeatures.map((item, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.04, y: -6 }}
                transition={{ duration: 0.2 }}
                className={`w-[380px] bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.6)] ${theme.borderHover} transition-colors flex-shrink-0 group`}
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl ${theme.bgLight} ${theme.border} flex items-center justify-center mb-6 transition-all group-hover:${theme.glow}`}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed font-medium">{item.description}</p>
                </div>
                
                <div className={`mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs ${theme.text} font-mono font-extrabold tracking-wider`}>
                  <span className="opacity-90">MODÜL AKTİF</span>
                  <ArrowRight className="w-4 h-4 font-bold" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-8 py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 text-xs text-gray-300 font-semibold">
        <p>© 2026 Mühplattmon. Uludağ Üniversitesi Mühendislik Fakültesi.</p>
        <div className="flex items-center gap-6 font-mono font-bold">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme.hex }}></span> Güvenli Bağlantı
          </span>
          <span>•</span>
          <span>Sistem Durumu: Çevrim İçi</span>
        </div>
      </footer>

    </div>
  );
}