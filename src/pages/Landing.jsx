import { useContext } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import CinematicFooter from '../components/CinematicFooter';
import { ThemeContext } from '../App';
import Logo from '../components/Logo';

export default function Landing() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="relative w-full bg-[#070a08] min-h-screen font-sans overflow-x-hidden selection:bg-white/10">

      {/* 
        THE CURTAIN (PERDE) EKRANI
        Kullanıcının ilk gördüğü süper sade, minimal karşılama ekranı.
        min-h-[120vh] sayesinde aşağı kaydırma alanı yaratılıyor.
      */}
      <main className="relative z-10 w-full min-h-[120vh] bg-[#070a08] flex flex-col items-center justify-center text-white border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-b-[40px]">
        
        {/* Çok hafif, performansı hiç yormayan CSS radyal ışık */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.02)_0%,transparent_60%)] pointer-events-none" />
        
        <div className="flex flex-col items-center z-10 relative">
          
          {/* Logo */}
          <Logo className="w-14 h-14" />
          
          {/* Minimalist Yönlendirme Metni */}
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.2em] text-gray-400 mb-8 uppercase text-center px-4">
            Keşfetmek İçin <span className="font-bold text-white">Kaydır</span>
          </h1>
          
          {/* Aşağı Yönlendiren Ok Animasyonu */}
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="mt-2"
          >
            <ArrowDown className="w-6 h-6 text-gray-500 opacity-70" />
          </motion.div>

        </div>
        
        {/* Alt kısma inen şık, incecik degrade çizgi */}
        <div className="absolute bottom-0 w-[1px] h-32 bg-gradient-to-b from-gray-600 to-transparent opacity-40" />
      </main>

      {/* SİNEMATİK FOOTER (Aşağı kaydırınca alttan çıkan asıl etkileşim alanı) */}
      <CinematicFooter />
      
    </div>
  );
}