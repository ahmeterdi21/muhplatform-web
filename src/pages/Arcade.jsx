import React, { useState, useEffect, useContext } from 'react';
import { Gamepad2, Keyboard, Crown, Activity } from 'lucide-react';
import { ThemeContext } from '../App';
import { supabase } from '../supabase';
import Game2048 from '../components/Game2048';
import GameTyping from '../components/GameTyping';
import GameSnake from '../components/GameSnake';

export default function Arcade() {
  const { theme } = useContext(ThemeContext);
  const [activeGame, setActiveGame] = useState('2048'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Oturumu ve puan tablosunu getir
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('game_scores')
      .select('score, game_name, profiles ( full_name )')
      .order('score', { ascending: false })
      .limit(10); // En yüksek 10 skoru getir

    if (data && !error) {
      const formatted = data.map((item, index) => ({
        rank: index + 1,
        name: item.profiles?.full_name || 'İsimsiz Oyuncu',
        score: item.score,
        game: item.game_name
      }));
      setLeaderboard(formatted);
    }
  };

  // Oyun bittiğinde veritabanına skoru yollayan fonksiyon
  const handleGameOver = async (gameName, score) => {
    if (!session) return;
    await supabase.from('game_scores').insert([
      { user_id: session.user.id, game_name: gameName, score: score }
    ]);
    fetchLeaderboard(); // Skor kaydedilince tabloyu hemen yenile
  };

  return (
    <div className="min-h-screen bg-[#070a08] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Gamepad2 className="w-8 h-8" style={{ color: theme.hex }} />
            MÜH<span style={{ color: theme.hex }}>ARCADE</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Sistemi yormayan, saf mühendislik rekabeti.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL VE ORTA: Oyun Seçimi ve Oyun Alanı */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm overflow-x-auto">
            <button onClick={() => setActiveGame('2048')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeGame === '2048' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} style={{ color: activeGame === '2048' ? theme.hex : '' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center bg-white/10 text-[10px]">2K</div> 2048 (Müh. Sürümü)
            </button>
            <button onClick={() => setActiveGame('typing')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeGame === 'typing' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} style={{ color: activeGame === 'typing' ? theme.hex : '' }}>
              <Keyboard className="w-5 h-5" /> Yazım Hızı Testi
            </button>
            <button onClick={() => setActiveGame('snake')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeGame === 'snake' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} style={{ color: activeGame === 'snake' ? theme.hex : '' }}>
              <Activity className="w-5 h-5" /> Nostaljik Yılan
            </button>
          </div>

          <div className="w-full min-h-[550px] py-10 bg-[#0c100e] border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden" style={{ boxShadow: `0 0 40px -10px ${theme.hex}20` }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />
            
            {/* OYUNLAR (onGameOver prop'u ile skorları Arcade.jsx'e iletiyorlar) */}
            {activeGame === '2048' && <Game2048 onGameOver={(score) => handleGameOver('2048', score)} />}
            {activeGame === 'typing' && <GameTyping onGameOver={(score) => handleGameOver('Hız Testi (WPM)', score)} />}
            {activeGame === 'snake' && <GameSnake onGameOver={(score) => handleGameOver('Yılan', score)} />}
          </div>
        </div>

        {/* SAĞ: Canlı Liderlik Tablosu */}
        <div className="bg-[#0c100e] border border-white/10 rounded-3xl p-6 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: theme.hex }} />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/5 rounded-lg">
              <Crown className="w-5 h-5" style={{ color: theme.hex }} />
            </div>
            <h3 className="text-xl font-black">Kampüs Sıralaması</h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm font-bold text-center mt-10">Henüz skor kaydedilmedi. İlk giren sen ol!</p>
            ) : (
              leaderboard.map((user, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-gray-300/20 text-gray-300' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-white/5 text-gray-400'}`}>
                      #{user.rank}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{user.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase">{user.game}</div>
                    </div>
                  </div>
                  <div className="font-black font-mono text-base" style={{ color: theme.hex }}>
                    {user.score.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}