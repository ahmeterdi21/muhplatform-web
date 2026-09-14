import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, MessageSquare, Settings as SettingsIcon, LogOut, 
  Settings, Cpu, ShieldAlert, Users, Circle, User, LayoutGrid, 
  Calculator as CalculatorIcon, MonitorPlay, MessageCircle, Gamepad2, Calendar 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
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
import PrivateRooms from './pages/PrivateRooms';
import PrivateChat from './pages/PrivateChat';
import Arcade from './pages/Arcade';
import Events from './pages/Events';
import Logo from './components/Logo';
import { Dock, DockIcon, DockItem, DockLabel } from './components/ui/dock';

// --- TEMA KONFİGÜRASYONU ---
export const ThemeContext = createContext();

export const themeConfig = {
  green: { id: 'green', name: 'Zümrüt Yeşili', text: 'text-emerald-400', text500: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', bgActive: 'bg-emerald-500/15', border: 'border-emerald-500/30', borderHover: 'hover:border-emerald-500/40', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]', fill: 'fill-emerald-500', selectionBg: 'selection:bg-emerald-500/30', hex: '#10b981' },
  red: { id: 'red', name: 'Yakut Kırmızısı', text: 'text-red-400', text500: 'text-red-500', bg: 'bg-red-500', bgLight: 'bg-red-500/10', bgActive: 'bg-red-500/15', border: 'border-red-500/30', borderHover: 'hover:border-red-500/40', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', fill: 'fill-red-500', selectionBg: 'selection:bg-red-500/30', hex: '#ef4444' },
  blue: { id: 'blue', name: 'Okyanus Mavisi', text: 'text-blue-400', text500: 'text-blue-500', bg: 'bg-blue-500', bgLight: 'bg-blue-500/10', bgActive: 'bg-blue-500/15', border: 'border-blue-500/30', borderHover: 'hover:border-blue-500/40', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]', fill: 'fill-blue-500', selectionBg: 'selection:bg-blue-500/30', hex: '#3b82f6' },
  pink: { id: 'pink', name: 'Neon Pembe', text: 'text-pink-400', text500: 'text-pink-500', bg: 'bg-pink-500', bgLight: 'bg-pink-500/10', bgActive: 'bg-pink-500/15', border: 'border-pink-500/30', borderHover: 'hover:border-pink-500/40', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(236,72,153,0.4)]', fill: 'fill-pink-500', selectionBg: 'selection:bg-pink-500/30', hex: '#ec4899' },
  purple: { id: 'purple', name: 'Ametist Moru', text: 'text-purple-400', text500: 'text-purple-500', bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', bgActive: 'bg-purple-500/15', border: 'border-purple-500/30', borderHover: 'hover:border-purple-500/40', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]', glowStrong: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', fill: 'fill-purple-500', selectionBg: 'selection:bg-purple-500/30', hex: '#a855f7' }
};

// --- MENÜ BUTONU ---
function PillNavItem({ to, icon: Icon, isActive, onClick, theme, title, isDanger = false, notificationCount = 0 }) {
  const circleRef = useRef(null);
  const iconNormalRef = useRef(null);
  const iconHoverRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const circle = circleRef.current;
    const iconNormal = iconNormalRef.current;
    const iconHover = iconHoverRef.current;

    gsap.set(circle, { scale: 0, xPercent: -50, yPercent: -50, left: "50%", top: "100%" });
    gsap.set(iconNormal, { y: 0, opacity: 1 });
    gsap.set(iconHover, { y: 40, opacity: 0 });

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
      className={`relative w-12 h-12 flex items-center justify-center rounded-2xl overflow-visible cursor-pointer transition-all duration-300 ${isActive ? `${theme.bgLight} ${theme.border} ${theme.glow}` : 'hover:bg-white/[0.02]'}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
      title={title}
    >
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 z-50">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-[#0a0a0a] items-center justify-center text-[9px] font-black text-white shadow-lg">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        </span>
      )}

      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <span ref={circleRef} className="absolute rounded-full w-12 h-12 pointer-events-none z-0" style={{ backgroundColor: isDanger ? '#ef4444' : theme.hex }}></span>
      </div>
      
      <div ref={iconNormalRef} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <Icon className={`w-6 h-6 ${isActive ? theme.text : isDanger ? 'text-red-400' : 'text-gray-500'}`} />
      </div>
      
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

// APPLE STYLE BOTTOM DOCK NAVİGASYON
function BottomDockNav({ isAdmin, unreadLobbyCount, unreadPrivateCount }) {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [showHub, setShowHub] = useState(false);
  const hubRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (hubRef.current && !hubRef.current.contains(event.target)) setShowHub(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { title: "Ana Panel", icon: Home, path: "/", isActive: currentPath === '/' },
    { title: "Ders Notları", icon: BookOpen, path: "/courses", isActive: currentPath === '/courses' },
    { title: "Ortak Lobi", icon: MessageSquare, path: "/lobby", isActive: currentPath === '/lobby', count: unreadLobbyCount },
    { title: "Profilim", icon: User, path: "/profile", isActive: currentPath === '/profile' },
    { title: "Etkinlik Takvimi", icon: Calendar, path: "/events", isActive: currentPath === '/events' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-full font-sans">
      {/* Sistem Araçları Pop-up Menu */}
      <AnimatePresence>
        {showHub && (
          <div ref={hubRef} className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-72 bg-[#121212]/95 border border-white/15 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            >
              <div className="px-3 py-2 mb-2 border-b border-white/10 flex items-center justify-between">
                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5" /> Sistem Araçları
                </p>
                <button onClick={() => setShowHub(false)} className="text-gray-500 hover:text-white text-xs cursor-pointer">✕</button>
              </div>

              <Link to="/chat" onClick={() => setShowHub(false)} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${currentPath === '/chat' ? `${theme.bgLight} ${theme.text}` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">Özel Mesajlar</span>
                </div>
                {unreadPrivateCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">{unreadPrivateCount}</span>
                )}
              </Link>

              <Link to="/private-rooms" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${currentPath === '/private-rooms' ? `${theme.bgLight} ${theme.text}` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <MonitorPlay className="w-5 h-5" />
                <span className="text-sm font-bold">Özel Odalar</span>
              </Link>

              <Link to="/calculator" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${currentPath === '/calculator' ? `${theme.bgLight} ${theme.text}` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <CalculatorIcon className="w-5 h-5" />
                <span className="text-sm font-bold">Not Hesaplayıcı</span>
              </Link>

              <Link to="/arcade" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${currentPath === '/arcade' ? `${theme.bgLight} ${theme.text}` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <Gamepad2 className="w-5 h-5" />
                <span className="text-sm font-bold">Eğlence Odası</span>
              </Link>

              {isAdmin && (
                <Link to="/admin" onClick={() => setShowHub(false)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all mt-1 ${currentPath === '/admin' ? `bg-amber-500/20 text-amber-400` : 'text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-400'}`}>
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-sm font-bold">Yönetici Paneli</span>
                </Link>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Apple Dock */}
      <Dock className="items-center pb-0">
        {navItems.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <DockItem key={idx} onClick={() => navigate(item.path)} className="relative">
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>
                <div className={`w-full h-full rounded-2xl flex items-center justify-center transition-all ${
                  item.isActive 
                    ? `${theme.bg} text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)]` 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </DockIcon>
              {item.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {item.count}
                </span>
              )}
            </DockItem>
          );
        })}

        <div className="w-[1px] h-6 bg-white/15 my-auto mx-1"></div>

        <DockItem onClick={() => setShowHub(!showHub)} className="relative">
          <DockLabel>Sistem Araçları</DockLabel>
          <DockIcon>
            <div className={`w-full h-full rounded-2xl flex items-center justify-center transition-all ${
              showHub || currentPath === '/calculator' || currentPath === '/arcade' || currentPath === '/private-rooms' || currentPath === '/admin' || currentPath === '/chat'
                ? `${theme.bgLight} ${theme.text} border ${theme.border}` 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
          </DockIcon>
          {unreadPrivateCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {unreadPrivateCount}
            </span>
          )}
        </DockItem>

        <DockItem onClick={() => navigate('/settings')}>
          <DockLabel>Ayarlar</DockLabel>
          <DockIcon>
            <div className={`w-full h-full rounded-2xl flex items-center justify-center transition-all ${
              currentPath === '/settings' 
                ? `${theme.bg} text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)]` 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}>
              <SettingsIcon className="w-5 h-5" />
            </div>
          </DockIcon>
        </DockItem>

        <DockItem onClick={async () => await supabase.auth.signOut()}>
          <DockLabel>Çıkış Yap</DockLabel>
          <DockIcon>
            <div className="w-full h-full rounded-2xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all">
              <LogOut className="w-5 h-5" />
            </div>
          </DockIcon>
        </DockItem>
      </Dock>
    </div>
  );
}

function AppContent() {
  const { theme } = useContext(ThemeContext);
  const location = useLocation(); 
  const currentPathRef = useRef(location.pathname);

  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showActiveModal, setShowActiveModal] = useState(false);
  
  const [studySeconds, setStudySeconds] = useState(0);
  const studySecondsRef = useRef(0);
  const awardedHoursRef = useRef(0);

  // BİLDİRİM STATE'LERİ
  const [unreadLobbyCount, setUnreadLobbyCount] = useState(0);
  const [unreadPrivateCount, setUnreadPrivateCount] = useState(0);

  useEffect(() => {
    currentPathRef.current = location.pathname;
    if (location.pathname === '/lobby') setUnreadLobbyCount(0);
  }, [location.pathname]);

  const fetchTotalUnreadPrivate = async (userId) => {
    const { count } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    setUnreadPrivateCount(count || 0);
  };

  useEffect(() => {
    if (!session) return;
    
    fetchTotalUnreadPrivate(session.user.id);

    const globalLobbyChannel = supabase
      .channel('global_lobby_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages' }, (payload) => {
        if (currentPathRef.current !== '/lobby' && payload.new.sender_id !== session.user.id) {
          setUnreadLobbyCount(prev => prev + 1);
        }
      })
      .subscribe();

    const privateChannel = supabase
      .channel('global_private_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `receiver_id=eq.${session.user.id}` }, () => {
         fetchTotalUnreadPrivate(session.user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalLobbyChannel);
      supabase.removeChannel(privateChannel);
    };
  }, [session]);

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
          
          <BottomDockNav isAdmin={isAdmin} unreadLobbyCount={unreadLobbyCount} unreadPrivateCount={unreadPrivateCount} />

          <div className="flex-1 relative z-10 overflow-y-auto min-h-screen pb-28 custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard totalSeconds={studySeconds} />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/chat" element={<PrivateChat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/events" element={<Events />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/calculator" element={<Calculator />} />
              
              {/* SATRANÇ KALKTI, YERİNE ARCADE EKLENDİ */}
              <Route path="/arcade" element={<Arcade />} />
              
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
                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10 flex-shrink-0 relative"><img src={user.avatar_url || 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Unknown'} alt="Avatar" className="w-full h-full object-cover" /><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${theme.bg} border-2 border-[#121212]`}></div></div>
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