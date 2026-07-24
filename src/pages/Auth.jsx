import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import PixelBlast from '../components/PixelBlast';

export default function Auth() {
  const { theme } = useContext(ThemeContext);
  const [isLogin, setIsLogin] = useState(true);
  const [isAgreed, setIsAgreed] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!isAgreed) {
          alert("Lütfen platform kurallarını onaylayın.");
          setLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, full_name: fullName }]);
          if (profileError) throw profileError;
        }
      }
    } catch (error) {
      alert("Bir hata oluştu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const themeColor = theme?.hex || '#10b981';
  const themeBg = theme?.bg || 'bg-emerald-500';
  const themeText = theme?.text || 'text-emerald-400';
  const themeGlow = theme?.glowStrong || 'shadow-[0_0_20px_rgba(16,185,129,0.4)]';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans relative">
      
      {/* PIXELBLAST İNTERAKTİF ARKA PLAN */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          color={themeColor} 
          pixelSize={4}
          patternScale={2}
          patternDensity={1}
          liquid={true} 
          enableRipples={true}
          transparent={true}
          speed={0.4}
        />
      </div>

      {/* SOL TARAF - TAMAMEN SAYDAM (Opaklık Kaldırıldı) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 z-10">
        <button onClick={() => navigate('/')} className="cursor-target relative z-20 flex items-center gap-2 text-gray-300 hover:text-white transition-colors w-fit group cursor-pointer bg-black/60 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Ana Sayfaya Dön
        </button>

        <div className="relative z-10 my-auto drop-shadow-2xl">
          <div className={`w-12 h-12 rounded-2xl ${themeBg} flex items-center justify-center font-bold text-black mb-8 ${themeGlow}`}>
            M
          </div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-light tracking-tight leading-tight mb-6 drop-shadow-lg">
            Makine Mühendisliği <br/>
            <span className={`font-bold ${themeText}`}>Sistem Girişi</span>
          </motion.h1>
          <p className="text-gray-200 text-lg max-w-md font-medium leading-relaxed drop-shadow-md">
            Hesabına giriş yap veya yeni bir profil oluşturarak makine mühendisliği topluluğunun bir parçası ol.
          </p>
        </div>
      </div>

      {/* SAĞ TARAF - FORM - OPAK (Karanlık ve Bulanık Arka Plan Buraya Taşındı) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 bg-black/50 backdrop-blur-md border-l border-white/10 shadow-2xl">
        
        <button onClick={() => navigate('/')} className="cursor-target lg:hidden absolute top-8 left-8 z-20 flex items-center gap-2 text-gray-300 hover:text-white transition-colors group cursor-pointer bg-black/60 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Geri
        </button>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
          <div className="bg-[#121212]/90 border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-3xl font-semibold mb-2">{isLogin ? 'Tekrar Hoş Geldin' : 'Aramıza Katıl'}</h2>
            <p className="text-gray-400 text-sm mb-8 font-medium">
              {isLogin ? 'Öğrenci hesabınla platforma giriş yap.' : 'Kendi dijital profilini oluştur ve puan toplamaya başla.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors`} />
                  <input type="text" placeholder="Ad Soyad" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all" />
                </div>
              )}
              
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors`} />
                <input type="email" placeholder="Öğrenci E-posta Adresi" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all" />
              </div>

              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors`} />
                <input type="password" placeholder="Şifre" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all" />
              </div>

              {!isLogin && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3 hover:bg-red-500/10 transition-colors">
                  <input type="checkbox" id="rules" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="cursor-target mt-1 w-4 h-4 rounded border-white/20 bg-black/50 focus:ring-0 cursor-pointer" style={{ accentColor: themeColor }} />
                  <label htmlFor="rules" className="cursor-target text-xs text-gray-400 leading-relaxed cursor-pointer select-none font-medium">
                    Platformun yardımlaşma amacını anladığımı; içerikleri kötüye kullanmam durumunda sistemden kalıcı olarak uzaklaştırılacağımı kabul ediyorum.
                  </label>
                </div>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading}
                className={`cursor-target relative overflow-hidden w-full ${themeBg} disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-all ${themeGlow} flex items-center justify-center gap-2 group mt-6 cursor-pointer opacity-90 hover:opacity-100`}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-in-out z-0"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? 'İşleniyor...' : (isLogin ? 'Sisteme Gir' : 'Hesabımı Oluştur')}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="cursor-target text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">
                {isLogin ? 'Hesabın yok mu? Hemen oluştur.' : 'Zaten bir hesabın var mı? Giriş yap.'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}