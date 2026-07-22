import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, ArrowRight, Clock, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';

export default function Dashboard({ totalSeconds }) {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [recentCourses, setRecentCourses] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('course_materials')
        .select('id, title')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setRecentCourses(data);
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setProfile(data);
        }
      } catch (err) {}
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, class_level')
          .ilike('full_name', `%${searchQuery}%`)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {} finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatStudyTime = (seconds) => {
    if (seconds < 60) {
      return { val: seconds, unit: 'sn' };
    } else if (seconds < 3600) {
      return { val: Math.floor(seconds / 60), unit: 'dk' };
    } else {
      return { val: (seconds / 3600).toFixed(1), unit: 'saat' };
    }
  };

  const timeData = formatStudyTime(totalSeconds || 0);

  return (
    <div className="flex-1 p-10 overflow-y-auto relative font-sans">
      
      <header className="mb-10 relative z-50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
            Sistem <span className={`font-bold ${theme.text}`}>Aktif</span>
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme.hex, boxShadow: `0 0 10px ${theme.hex}` }}></div>
          </h1>
          <p className="text-gray-300 text-sm font-semibold mt-1">Ders materyalleri ve canlı lobiler senkronize edildi.</p>
        </div>

        <div className="relative w-full lg:w-[450px]">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrenci veya Mühendis Ara..."
              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:border-white/30 transition-all backdrop-blur-xl shadow-lg"
            />
          </div>

          <AnimatePresence>
            {searchQuery.trim() && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-3 bg-[#121212] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[60] backdrop-blur-3xl"
              >
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 font-bold">
                    {isSearching ? 'Aranıyor...' : 'Eşleşen mühendis bulunamadı.'}
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div 
                      key={user.id}
                      onClick={() => navigate(`/profile?id=${user.id}`)}
                      className="p-3 rounded-xl hover:bg-white/[0.05] flex items-center gap-3 cursor-pointer transition-colors group"
                    >
                      <img src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown'} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold text-white group-hover:${theme.text} transition-colors truncate`}>{user.full_name || 'İsimsiz Mühendis'}</p>
                        <p className="text-[11px] text-gray-400 font-semibold">{user.class_level || 'Öğrenci'}</p>
                      </div>
                      <ExternalLink className={`w-4 h-4 text-gray-500 group-hover:${theme.text} transition-colors`} />
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-3 bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-md text-xs font-semibold text-gray-200 shadow-lg">
          Hoş geldin, <span className={`${theme.text} font-bold text-sm ml-1`}>{profile?.full_name || 'Mühendis'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between shadow-xl">
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white tracking-tight">
              <BookOpen className={`w-5 h-5 ${theme.text}`} /> Son Eklenen Dersler
            </h2>

            <div className="space-y-4">
              {recentCourses.length === 0 ? (
                <p className="text-xs text-gray-500 font-bold p-4 bg-black/20 rounded-2xl border border-white/5 text-center">Henüz onaylı dosya yok.</p>
              ) : (
                recentCourses.map((course) => (
                  <div 
                    key={course.id} 
                    onClick={() => navigate('/courses')}
                    className={`p-5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between ${theme.borderHover} hover:bg-white/[0.04] transition-all cursor-pointer group shadow-md`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.hex, boxShadow: `0 0 8px ${theme.hex}` }}></div>
                      <span className="font-bold text-gray-100 group-hover:text-white transition-colors text-base truncate">{course.title}</span>
                    </div>
                    
                    <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 ${theme.text} group-hover:${theme.bg} group-hover:text-black transition-all shadow-sm`}>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <button 
              onClick={() => navigate('/courses')}
              className={`px-7 py-3.5 rounded-2xl bg-white/5 hover:${theme.bg} hover:text-black border border-white/10 ${theme.borderHover} text-sm font-bold transition-all flex items-center gap-2.5 group cursor-pointer shadow-md`}
            >
              Tüm Arşivi Gör
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="space-y-8">
          
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group shadow-xl">
            <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bgLight} blur-[50px] rounded-full pointer-events-none`}></div>
            
            <p className={`text-xs uppercase tracking-widest ${theme.text} font-bold mb-3 flex items-center gap-2`}>
              <Clock className="w-4 h-4" /> Aktif Çalışma Süresi
            </p>
            <div className="flex items-baseline gap-2.5">
              <span className="text-6xl font-bold text-white tracking-tight">
                {timeData.val}
              </span>
              <span className={`${theme.text} font-bold text-xl`}>{timeData.unit}</span>
            </div>
            <p className="text-xs text-gray-300 font-semibold mt-4 leading-relaxed">
              Platformda geçirdiğin toplam odak süresi anlık olarak kaydediliyor.
            </p>
          </div>

          <div 
            onClick={() => navigate('/lobby')} 
            className={`bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md ${theme.borderHover} hover:bg-white/[0.04] transition-all cursor-pointer group shadow-xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5 leading-snug">
                <Users className={`w-5 h-5 ${theme.text} flex-shrink-0`} /> Diğer öğrencilerle anlık sohbete katıl
              </h3>
              <div className="w-2.5 h-2.5 rounded-full animate-ping flex-shrink-0" style={{ backgroundColor: theme.hex }}></div>
            </div>
            <p className="text-xs text-gray-300 font-semibold mb-6 leading-relaxed">
              Mühendislik kampüsündeki diğer öğrencilerle canlı ortak sohbet odasında anında buluş.
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className={`w-8 h-8 rounded-full ${theme.bgLight} border ${theme.border} flex items-center justify-center text-[10px] ${theme.text} font-bold`}>ME</div>
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-400 font-bold">AE</div>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[10px] text-purple-400 font-bold">+</div>
              </div>
              <span className={`text-xs ${theme.text} group-hover:translate-x-1 transition-transform flex items-center gap-1.5 font-bold`}>
                Sohbete Git <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}