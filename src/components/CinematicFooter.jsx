import React, { useEffect, useRef, useContext, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, ArrowUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../App";

// GSAP Eklentisini Kaydet
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Basit class birleştirici
const cn = (...classes) => classes.filter(Boolean).join(" ");

// -------------------------------------------------------------------------
// MANYETİK BUTON BİLEŞENİ
// -------------------------------------------------------------------------
const MagneticButton = React.forwardRef(({ className, children, as: Component = "button", ...props }, forwardedRef) => {
  const localRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const element = localRef.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      const handleMouseMove = (e) => {
        const rect = element.getBoundingClientRect();
        const h = rect.width / 2;
        const w = rect.height / 2;
        const x = e.clientX - rect.left - h;
        const y = e.clientY - rect.top - w;

        gsap.to(element, {
          x: x * 0.4, y: y * 0.4, rotationX: -y * 0.15, rotationY: x * 0.15,
          scale: 1.05, ease: "power2.out", duration: 0.4,
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          x: 0, y: 0, rotationX: 0, rotationY: 0,
          scale: 1, ease: "elastic.out(1, 0.3)", duration: 1.2,
        });
      };

      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, element);

    return () => ctx.revert();
  }, []);

  return (
    <Component
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </Component>
  );
});
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// KAYAN YAZILAR (MARQUEE)
// -------------------------------------------------------------------------
const MarqueeItem = ({ theme }) => (
  <div className="flex items-center space-x-12 px-6">
    <span>Geniş Not Arşivi</span> <span style={{ color: theme.hex }} className="opacity-60">✦</span>
    <span>Canlı Odak Odaları</span> <span className="text-gray-500 opacity-60">✦</span>
    <span>Senkronize Çalışma</span> <span style={{ color: theme.hex }} className="opacity-60">✦</span>
    <span>Güvenli Topluluk</span> <span className="text-gray-500 opacity-60">✦</span>
    <span>Sınavlara Hazırlık</span> <span style={{ color: theme.hex }} className="opacity-60">✦</span>
  </div>
);

// -------------------------------------------------------------------------
// ANA FOOTER BİLEŞENİ
// -------------------------------------------------------------------------
export default function CinematicFooter() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); // Pop-up durumu için State
  
  const wrapperRef = useRef(null);
  const giantTextRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

    .cinematic-footer-wrapper {
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      
      --background: #070a08;
      --foreground: #ffffff;
      --primary: ${theme.hex};
      --destructive: #ef4444;

      --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
      --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
      --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
      --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
      --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
      --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
      
      --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
      --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
      --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
      --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
      --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
    }

    @keyframes footer-breathe {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
      100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
    }

    @keyframes footer-scroll-marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }

    @keyframes footer-heartbeat {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--primary) 50%, transparent)); }
      15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--primary) 80%, transparent)); }
      30% { transform: scale(1); }
    }

    .animate-footer-breathe { animation: footer-breathe 8s ease-in-out infinite alternate; }
    .animate-footer-scroll-marquee { animation: footer-scroll-marquee 40s linear infinite; }
    .animate-footer-heartbeat { animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite; }

    .footer-bg-grid {
      background-size: 60px 60px;
      background-image: 
        linear-gradient(to right, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
      mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
    }

    .footer-aurora {
      background: radial-gradient(
        circle at 50% 50%, 
        color-mix(in oklch, var(--primary) 20%, transparent) 0%, 
        color-mix(in oklch, transparent 5%, transparent) 40%, 
        transparent 70%
      );
    }

    .footer-glass-pill {
      background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
      box-shadow: 
          0 10px 30px -10px var(--pill-shadow), 
          inset 0 1px 1px var(--pill-highlight), 
          inset 0 -1px 2px var(--pill-inset-shadow);
      border: 1px solid var(--pill-border);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .footer-glass-pill:hover {
      background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
      border-color: var(--pill-border-hover);
      box-shadow: 
          0 20px 40px -10px var(--pill-shadow-hover), 
          inset 0 1px 1px var(--pill-highlight-hover);
      color: var(--foreground);
    }

    .footer-giant-bg-text {
      font-size: 22vw;
      line-height: 0.75;
      font-weight: 900;
      letter-spacing: -0.05em;
      color: transparent;
      -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
      background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
      -webkit-background-clip: text;
      background-clip: text;
    }

    .footer-text-glow {
      background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
    }
  `;

  useEffect(() => {
    if (typeof window === "undefined" || !wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh", scale: 1, opacity: 1, ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%", end: "bottom bottom", scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.15, ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%", end: "bottom bottom", scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      {/* =========================================
          1. ANA FOOTER (PERDE ARKASI) ALANI 
          ========================================= */}
      <div ref={wrapperRef} className="relative h-screen w-full" style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[#070a08] text-white cinematic-footer-wrapper">
          
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          <div ref={giantTextRef} className="footer-giant-bg-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none font-black">
            MÜHENDİSLİK
          </div>

          <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-white/10 bg-black/40 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.3em] text-gray-400 uppercase">
              <MarqueeItem theme={theme} />
              <MarqueeItem theme={theme} />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
            <h2 ref={headingRef} className="text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-12 text-center">
              MühPlatform
            </h2>

            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton as="button" onClick={() => navigate('/auth')} className="footer-glass-pill px-10 py-5 rounded-full text-white font-bold text-sm md:text-base flex items-center gap-3 group">
                  <LogIn className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  Giriş Yap
                </MagneticButton>
                
                <MagneticButton as="button" onClick={() => navigate('/auth')} className="footer-glass-pill px-10 py-5 rounded-full text-white font-bold text-sm md:text-base flex items-center gap-3 group">
                  <UserPlus className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  Aramıza Katıl
                </MagneticButton>
              </div>

              <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-2">
                {/* YENİ POP-UP TETİKLEYİCİ BUTON (href kalktı, onClick geldi) */}
                <MagneticButton 
                  as="button" 
                  onClick={() => setIsModalOpen(true)} 
                  className="footer-glass-pill px-6 py-3 rounded-full text-gray-400 font-medium text-xs md:text-sm hover:text-white"
                >
                  Kullanım Şartları
                </MagneticButton>
              </div>
            </div>
          </div>

          <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-gray-500 text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              © 2026 MühPlatform. Tüm Hakları Saklıdır.
            </div>

            <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border-white/10">
              <span className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Powered by</span>
              <span className="animate-footer-heartbeat text-sm md:text-base" style={{ color: theme.hex }}>⚡</span>
              <span className="text-white font-black text-xs md:text-sm tracking-normal ml-1">erd23</span>
            </div>

            <MagneticButton as="button" onClick={scrollToTop} className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-gray-400 hover:text-white group order-3">
              <ArrowUp className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" />
            </MagneticButton>
          </div>
        </footer>
      </div>

      {/* =========================================
          2. KULLANIM ŞARTLARI MODALI (POP-UP)
          ========================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
            onClick={() => setIsModalOpen(false)} // Dışarı tıklayınca kapansın
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-[#0c100e] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-y-auto flex flex-col"
              style={{
                boxShadow: `0 0 40px -10px ${theme.hex}30, inset 0 1px 1px rgba(255,255,255,0.1)`
              }}
              onClick={(e) => e.stopPropagation()} // İçeri tıklayınca kapanmayı engelle
            >
              {/* Kapat Butonu */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Başlık */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black text-lg" style={{ backgroundColor: theme.hex }}>
                  M
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Kullanım Şartları</h3>
              </div>

              {/* Metin İçeriği (Özel kaydırma çubuğu ile) */}
              <div className="space-y-6 text-sm text-gray-300 leading-relaxed pr-2 custom-scrollbar">
                
                <section>
                  <h4 className="text-white font-bold text-base mb-2">1. Amaç ve Kapsam</h4>
                  <p>MühPlatform, mühendislik öğrencileri için geliştirilmiş yeni nesil, bağımsız ve senkronize bir dijital kampüs ortamıdır. Temel amacımız; akademik not arşivini güvenle korumak, öğrencilerin geçmiş sınav materyallerinden faydalanmasını sağlamak ve "Canlı Odak Odaları" gibi araçlarla interaktif bir eğitim/çalışma ekosistemi yaratmaktır.</p>
                </section>

                <section>
                  <h4 className="text-white font-bold text-base mb-2">2. Etik Kurallar ve Ortam Düzeni</h4>
                  <p>Bu sistem, öğrencilerin gelişimi için büyük bir özveriyle tasarlanmıştır. Platform içerisinde sunulan sohbet kanallarında, odak odalarında ve dosya paylaşım ağlarında akademik saygı çerçevesinde hareket edilmesi zorunludur. Düzgün ortamın bozulmasına yönelik; hakaret, spam, yanıltıcı içerik paylaşımı veya sistemi sabote etmeye yönelik teknik müdahaleler (hesabın kalıcı olarak uzaklaştırılmasıyla) sonuçlanacaktır.</p>
                </section>

                <section>
                  <h4 className="text-white font-bold text-base mb-2">3. Not Paylaşımı ve Arşiv Kullanımı</h4>
                  <p>MühPlatform'un omurgası olan "Ders Notu Arşivi", öğrencilerin ortak mirasıdır. Sisteme yüklenen dosyalar, admin onayından geçerek topluluğa sunulur. Yanlış, virüslü veya telif hakkı ihlali barındıran ticari dosyaların sisteme yüklenmesi yasaktır. İndirilen sınav kağıtları ve materyaller tamamen eğitim amaçlı kullanılmalıdır.</p>
                </section>

                <section>
                  <h4 className="text-white font-bold text-base mb-2">4. Sistem Araçları ve Güncellemeler</h4>
                  <p>MühPlatform statik bir web sitesi değil, sürekli evrilen bir yapıdır. Satranç, mesajlaşma, pomodoro araçları ve gelecekte eklenecek mühendislik eklentileri (3D modelleme vb.) sistemi canlı tutmak içindir. Kullanıcılar, sistem açıklarını kötüye kullanmamayı peşinen kabul eder.</p>
                </section>

                <section>
                  <h4 className="text-white font-bold text-base mb-2">5. Gizlilik ve Veri Güvenliği</h4>
                  <p>Öğrenci bilgileriniz, mesajlarınız ve notlarınız en güncel şifreleme teknolojileri ile sunucularımızda korunmaktadır. Verileriniz hiçbir şekilde üçüncü şahıs şirketlere pazarlanmaz. Güvenli topluluk prensibimiz gereği, platform sadece bu ailenin üyelerine aittir.</p>
                </section>
                
                <p className="pt-4 text-xs text-gray-500 italic border-t border-white/10">
                  Platforma giriş yapan her kullanıcı bu kuralları kabul etmiş sayılır. MühPlatform - Eğitimin Siber Hali.
                </p>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}