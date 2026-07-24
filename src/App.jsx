import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Home, BookOpen, MessageSquare, Settings as SettingsIcon, LogOut, 
  Settings, Cpu, ShieldAlert, Users, Circle, User, LayoutGrid, 
  Calculator as CalculatorIcon, Crown, MonitorPlay 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap'; // GSAP eklendi
import { supabase } from './supabase';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import SettingsPage from './pages/Settings';
import Lobby from './pages/Lobby';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Calculator from './pages/Calculator';
import Chess from './pages/Chess';
import PrivateRooms from './pages/PrivateRooms';

// --- TEMA KONFİGÜRASYONU (GLOBAL) ---
export const ThemeContext = createContext();

export const themeConfig = {
  green: { id: 'green', name: 'Zümrüt Yeşili', text: 'text-emerald-400', text500: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', bgActive: 'bg-emerald-500/15', border: 'border-emerald-500/30', borderHover: 'hover:border-emerald-500/40', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]', fill: 'fill-emerald-500', selectionBg: 'selection:bg-emerald-500/30', hex: '#10b981' },
  red: { id: 'red', name: 'Yakut Kırmızısı', text: 'text-red-400', text500: 'text-red-500', bg: 'bg-red-500', bgLight: 'bg-red-500/10', bgActive: 'bg-red-500/15', border: 'border-red-500/30', borderHover: 'hover:border-red-500/40', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', fill: 'fill-red-500', selectionBg: 'selection:bg-red-500/30', hex: '#ef4444' },
  blue: { id: 'blue', name: 'Okyanus Mavisi', text: 'text-blue-400', text500: 'text-blue-500', bg: 'bg-blue-500', bgLight: 'bg-blue-500/10', bgActive: 'bg-blue-500/15', border: 'border-blue-500/30', borderHover: 'hover:border-blue-500/40', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]', fill: 'fill-blue-500', selectionBg: 'selection:bg-blue-500/30', hex: '#3b82f6' },
  pink: { id: 'pink', name: 'Neon Pembe', text: 'text-pink-400', text500: 'text-pink-500', bg: 'bg-pink-500', bgLight: 'bg-pink-500/10', bgActive: 'bg-pink-500/15', border: 'border-pink-500/30', borderHover: 'hover:border-pink-500/40', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(236,72,153,0.4)]', fill: 'fill-pink-500', selectionBg: 'selection:bg-pink-500/30', hex: '#ec4899' },
  purple: { id: 'purple', name: 'Ametist Moru', text: 'text-purple-400', text500: 'text-purple-500', bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', bgActive: 'bg-purple-500/15', border: 'border-purple-500/30', borderHover: 'hover:border-purple-500/40', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', fill: 'fill-purple-500', selectionBg: 'selection:bg-purple-500/30', hex: '#a855f7' }
};

// --- YENİ EKLENEN GSAP ANİMASYONLU MENÜ BUTONU (PILL ITEM) ---
function PillNavItem({ to, icon: Icon, isActive, onClick, theme, title, isDanger = false }) {
  const circleRef = useRef(null);
  const iconNormalRef = useRef(null);
  const iconHoverRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const circle = circleRef.current;
    const iconNormal = iconNormalRef.current;
    const iconHover = iconHoverRef.current;

    // Animasyon Başlangıç Durumları
    gsap.set(circle, { scale: 0, xPercent: -50, yPercent: -50, left: "50%", top: "100%" });
    gsap.set(iconNormal, { y: 0, opacity: 1 });
    gsap.set(iconHover, { y: 40, opacity: 0 });

    // Timeline Oluşturma
    const tl = gsap.timeline({ paused: true });
    
    tl.to(circle, { scale: 3, duration: 0.35, ease: "power2.out" }, 0);
    tl.to(iconNormal, { y: -40, opacity: 0, duration: 0.25, ease: "power2.out" }, 0);
    tl.to(iconHover, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" }, 0);

    tlRef.current = tl;

    return () => tl.kill();
  }, []);

  const handleEnter = () => tlRef.current?.play();
  const handleLeave = () => tlRef.current?.reverse();

  const content = (
    <div 
      className={`relative w-12 h-12 flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${isActive ? `${theme.bgLight} ${theme.border} ${theme.glow}` : 'hover:bg-white/[0.02]'}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
      title={title}
    >
      <span 
        ref={circleRef} 
        className="absolute rounded-full w-12 h-12 pointer-events-none z-0" 
        style={{ backgroundColor: isDanger ? '#ef4444' : theme.hex }}
      ></span>
      
      {/* Normal Durumdaki İkon */}
      <div ref={iconNormalRef} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <Icon className={`w-6 h-6 ${isActive ? theme.text : isDanger ? 'text-red-400' : 'text-gray-500'}`} />
      </div>
      
      {/* Hover Durumunda Alttan Gelen Siyah (veya beyaz) İkon */}
      <div ref={iconHoverRef} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <Icon className={`w-6 h-6 ${isDanger ? 'text-white' : 'text-[#121212]'}`} />
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }
  return content;
}

function SidebarNav({ isAdmin }) {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const currentPath = location.pathname;
  const [showHub, setShowHub] = useState(false);
  const hubRef = useRef(null);
  const logoRef = useRef(null);

  // Logo Spin Animasyonu
  const handleLogoEnter = () => {
    gsap.fromTo(logoRef.current, { rotate: 0 }, { rotate: 360, duration: 0.5, ease: "power3.out", overwrite: "auto" });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (hubRef.current && !hubRef.current.contains(event.target)) setShowHub(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-24 border-r border-white/5 flex flex-col items-center py-8 justify-between backdrop-blur-xl bg-[#0a0a0a]/80 z-50 relative flex-shrink-0 h-screen sticky top-0 font-sans shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
      
      <div className="flex flex-col items-center gap-5 w-full">
        {/* LOGO */}
        <div 
          ref={logoRef}
          onMouseEnter={handleLogoEnter}
          className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center font-black text-black text-xl mb-6 cursor-pointer ${theme.glowStrong}`}
        >
          M
        </div>
        
        {/* MENÜ LİNKLERİ (PILL NAV EFEKTİYLE) */}
        <PillNavItem to="/" icon={Home} isActive={currentPath === '/'} theme={theme} title="Ana Panel" />
        <PillNavItem to="/courses" icon={BookOpen} isActive={currentPath === '/courses'} theme={theme} title="Ders Notları" />
        <PillNavItem to="/lobby" icon={MessageSquare} isActive={currentPath === '/lobby'} theme={theme} title="Ortak Lobi" />
        <PillNavItem to="/profile" icon={User} isActive={currentPath === '/profile'} theme={theme} title="Profilim" />

        {/* SİSTEM ARAÇLARI HUB */}
        <div className="relative mt-2" ref={hubRef}>
          <PillNavItem 
            icon={LayoutGrid} 
            onClick={() => setShowHub(!showHub)}
            isActive={showHub || currentPath === '/calculator' || currentPath === '/chess' || currentPath === '/private-rooms' || currentPath === '/admin'} 
            theme={theme} 
            title="Sistem Araçları" 
          />

          <AnimatePresence>
            {showHub && (
              <motion.div initial={{ opacity: 0, x: -10, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute left-[calc(100%+1.5rem)] top-1/2 -translate-y-1/2 w-64 bg-[#121212] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 backdrop-blur-xl">
                <div className="px-3 py-2 mb-1 border-b border-white/5"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sistem Araçları</p></div>
                
                <Link to="/private-rooms" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentPath === '/private-rooms' ? `${theme.bgLight} ${theme.text}` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                  <MonitorPlay className="w-5 h-5" />
                  <span className="text-sm font-bold">Özel Odalar</span>
                </Link>

                <Link to="/calculator" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentPath === '/calculator' ? `${theme.bgLight} ${theme.text}` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                  <CalculatorIcon className="w-5 h-5" />
                  <span className="text-sm font-bold">Not Hesaplayıcı</span>
                </Link>
                
                <Link to="/chess" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentPath === '/chess' ? `${theme.bgLight} ${theme.text}` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-bold">Satranç Kulübü</span>
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all mt-1 ${currentPath === '/admin' ? `bg-amber-500/20 text-amber-400` : 'text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-400'}`}>
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-sm font-bold">Yönetici Paneli</span>
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex flex-col gap-5 items-center w-full">
        <PillNavItem to="/settings" icon={SettingsIcon} isActive={currentPath === '/settings'} theme={theme} title="Ayarlar" />
        <PillNavItem onClick={async () => await supabase.auth.signOut()} icon={LogOut} theme={theme} title="Çıkış Yap" isDanger={true} />
      </div>
    </nav>
  );
}

function AppContent() {
  const { theme } = useContext(ThemeContext);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);
  const studySecondsRef = useRef(0);
  const awardedHoursRef = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
        updateHeartbeat(session.user.id);
        fetchInitialStudyTime(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
        updateHeartbeat(session.user.id);
        fetchInitialStudyTime(session.user.id);
      } else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchInitialStudyTime = async (userId) => {
    const { data } = await supabase.from('profiles').select('study_seconds').eq('id', userId).single();
    if (data && data.study_seconds) {
      setStudySeconds(data.study_seconds);
      studySecondsRef.current = data.study_seconds;
      awardedHoursRef.current = Math.floor(data.study_seconds / 3600);
    }
  };

  useEffect(() => {
    if (!session) return;
    const timerInterval = setInterval(() => {
      setStudySeconds(prev => {
        const next = prev + 1;
        studySecondsRef.current = next;
        const hoursSpent = Math.floor(next / 3600);
        if (hoursSpent > awardedHoursRef.current) {
          awardedHoursRef.current = hoursSpent;
          supabase.rpc('add_user_points', { target_user_id: session.user.id, points_to_add: 10 }).catch(err => console.error(err));
        }
        return next;
      });
    }, 1000);

    const dbInterval = setInterval(async () => {
      await supabase.from('profiles').update({ study_seconds: studySecondsRef.current }).eq('id', session.user.id);
    }, 15000);

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') await supabase.from('profiles').update({ study_seconds: studySecondsRef.current }).eq('id', session.user.id);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => { clearInterval(timerInterval); clearInterval(dbInterval); document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    updateHeartbeat(session.user.id);
    fetchActiveUsers();
    const interval = setInterval(() => { updateHeartbeat(session.user.id); fetchActiveUsers(); }, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const updateHeartbeat = async (userId) => { await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId); };
  const fetchActiveUsers = async () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { data } = await supabase.from('profiles').select('*').gt('last_seen', threeMinutesAgo);
    if (data) setActiveUsers(data);
  };

  const checkAdminStatus = async (userId) => {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single();
    if (data && data.is_admin) setIsAdmin(true); else setIsAdmin(false);
  };

  if (loading) return <div className={`min-h-screen bg-[#0a0a0a] flex items-center justify-center ${theme.text500} font-sans font-bold`}>Sistem Yükleniyor...</div>;

  return (
    <>
      {!session ? (
        <Routes><Route path="/" element={<Landing />} /><Route path="/auth" element={<Auth />} /><Route path="*" element={<Navigate to="/" />} /></Routes>
      ) : (
        <div className={`min-h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans ${theme.selectionBg} relative w-full`}>
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }} className={`absolute -top-32 -left-32 ${theme.text500} opacity-5`}><Settings className="w-[500px] h-[500px]" strokeWidth={0.5} /></motion.div>
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute -bottom-32 -right-32 text-white opacity-[0.02]"><Cpu className="w-[600px] h-[600px]" strokeWidth={0.5} /></motion.div>
          </div>
          
          {/* YENİ GSAP ANİMASYONLU SIDEBAR */}
          <SidebarNav isAdmin={isAdmin} />

          <div className="flex-1 relative z-10 overflow-y-auto h-screen custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard totalSeconds={studySeconds} />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/chess" element={<Chess />} />
              <Route path="/private-rooms" element={<PrivateRooms />} />
              {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>

          <div className="fixed bottom-6 right-6 z-50">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowActiveModal(true)} className={`px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${theme.borderHover} transition-all cursor-pointer group`}>
              <div className="relative flex items-center justify-center"><div className={`w-2.5 h-2.5 rounded-full ${theme.bg} animate-ping absolute`}></div><Circle className={`w-3 h-3 ${theme.fill} ${theme.text500} relative`} /></div>
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors"><strong className={`${theme.text} font-bold`}>{activeUsers.length}</strong> Öğrenci Aktif</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {showActiveModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl ${theme.bgLight} ${theme.border} flex items-center justify-center ${theme.text}`}><Users className="w-5 h-5" /></div><div><h3 className="text-lg font-bold text-white">Çevrim İçi Öğrenciler</h3><p className="text-xs text-gray-400 font-medium">Şu anda platformda gezinen kampüs üyeleri</p></div></div>
                    <button onClick={() => setShowActiveModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {activeUsers.map((user) => (
                      <div key={user.id} onClick={() => { setShowActiveModal(false); window.location.href = `/profile?id=${user.id}`; }} className={`p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 ${theme.borderHover} transition-colors cursor-pointer`}>
                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10 flex-shrink-0 relative"><img src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown'} alt="Avatar" className="w-full h-full object-cover" /><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${theme.bg} border-2 border-[#121212]`}></div></div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{user.full_name || 'İsimsiz Öğrenci'}</p><div className="flex items-center gap-2 mt-1"><span className={`text-[10px] px-2 py-0.5 rounded-full ${theme.bgLight} ${theme.text} font-bold ${theme.border}`}>Seviye {user.level || 1}</span><span className={`text-[10px] font-bold ${theme.text500}`}>{user.score || 0} Puan</span></div></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 text-center"><button onClick={() => setShowActiveModal(false)} className={`w-full py-3 rounded-xl ${theme.bg} text-black font-bold text-sm transition-colors ${theme.glowStrong} cursor-pointer opacity-90 hover:opacity-100`}>Kapat</button></div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [currentTheme, setCurrentTheme] = useState(() => { const savedTheme = localStorage.getItem('app_theme'); return savedTheme ? savedTheme : 'green'; });
  useEffect(() => { localStorage.setItem('app_theme', currentTheme); }, [currentTheme]);
  AppContent.displayName = 'AppContent';
  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, theme: themeConfig[currentTheme], themeConfig }}>
      <Router><AppContent /></Router>
    </ThemeContext.Provider>
  );
}