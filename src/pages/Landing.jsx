import { useContext } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GradientText from '../components/GradientText';
import StarBorder from '../components/StarBorder';
import Lightfall from '../components/Lightfall';
import Carousel from '../components/Carousel';
import { ThemeContext } from '../App';

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  // Carousel'in içine aktaracağımız özellik kartları verisi
  const features = [
    {
      id: 1,
      icon: <BookOpen className={`w-6 h-6 ${theme.text}`} />,
      title: "Geniş Not Arşivi",
      description: "Vize ve finaller için admin onaylı geçmiş sınav soruları ve çalışma kağıtları tek bir yerde."
    },
    {
      id: 2,
      icon: <Users className={`w-6 h-6 ${theme.text}`} />,
      title: "Canlı Odak Odaları",
      description: "Arkadaşlarınla senkronize çalış, molalarını planla ve sesli lobilerde sınavlara hazırlan."
    },
    {
      id: 3,
      icon: <Trophy className={`w-6 h-6 ${theme.text}`} />,
      title: "Katkı Puanı Sistemi",
      description: "Platforma materyal yükledikçe puan kazan ve dijital kampüsün saygın üyelerinden ol."
    },
    {
      id: 4,
      icon: <ShieldCheck className={`w-6 h-6 ${theme.text}`} />,
      title: "Güvenli Topluluk",
      description: "Yalnızca öğrencilere özel, şifreli, onaylı ve %100 güvenli akademik topluluk alanı."
    }
  ];

  return (
    <div className="min-h-screen bg-[#070a08] text-white flex flex-col justify-between overflow-x-hidden relative font-sans">
      
      {/* HAREKETLİ IŞIK ŞELALESİ (LIGHTFALL) ARKA PLANI */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <Lightfall
          colors={['#ffffff', theme.hex, '#120F17']}
          backgroundColor="#070a08"
          speed={0.6}
          streakCount={3}
          density={0.7}
          mouseInteraction={true}
        />
      </div>

      {/* MERKEZİ PARLAMA EFEKTİ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${theme.bg} opacity-[0.03] blur-[160px] rounded-full`}></div>
      </div>

      {/* HEADER */}
      <header className="w-full max-w-7xl mx-auto px-8 py-10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${theme.bg} flex items-center justify-center font-black text-black text-xl ${theme.glowStrong}`}>
            M
          </div>
          <span className="text-xl font-bold tracking-wider text-white">
            MÜH<span className={theme.text}>PLATFORM V2</span>
          </span>
        </div>

        <div>
          <StarBorder
            onClick={() => navigate('/auth')}
            color="white"
            speed="3s"
            thickness={2}
            className={`rounded-2xl ${theme.glowStrong} opacity-90 hover:opacity-100 transition-opacity cursor-pointer`}
            innerClassName={`px-7 py-3 rounded-[14px] ${theme.bg} text-black text-sm font-bold flex items-center gap-2`}
          >
            Giriş Yap <ArrowRight className="w-4 h-4" />
          </StarBorder>
        </div>
      </header>

      {/* ANA İÇERİK (HERO) */}
      <main className="relative z-10 my-auto py-12 flex flex-col items-center">
        <div className="max-w-7xl mx-auto px-8 mb-12 text-center">
          <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full ${theme.bgLight} ${theme.border} ${theme.text} text-xs font-mono font-extrabold mb-6 tracking-widest uppercase ${theme.glow}`}>
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: theme.hex }}></span>
            ULUDAĞ ÜNİVERSİTESİ MÜHENDİSLİK PLATFORMU V2.0
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
            <GradientText
              colors={["#ffffff", theme.hex, "#ffffff"]}
              animationSpeed={6}
              showBorder={false}
            >
              Mühendislik Eğitimi Artık Daha Güçlü ve Senkronize.
            </GradientText>
          </h1>
          
          <div className="mt-8 flex justify-center">
            <StarBorder
              as={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/auth')}
              color="white"
              speed="4s"
              thickness={3}
              className={`rounded-2xl ${theme.glowStrong} opacity-90 hover:opacity-100 group cursor-pointer`}
              innerClassName={`px-9 py-4 rounded-[13px] ${theme.bg} text-black font-extrabold text-base flex items-center gap-3`}
            >
              Aramıza Katıl 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </StarBorder>
          </div>
        </div>

        {/* YENİ 3D CAROUSEL ÖZELLİK KARTLARI */}
        <div className="w-full max-w-7xl mx-auto flex justify-center py-4 relative z-20">
          <Carousel 
            items={features} 
            baseWidth={340} 
            autoplay={true} 
            autoplayDelay={4000} 
            pauseOnHover={true} 
            loop={true} 
            round={false} 
          />
        </div>
      </main>

      {/* FOOTER */}
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