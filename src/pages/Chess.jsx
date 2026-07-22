import { useState, useEffect, useContext } from 'react';
import { Chess as ChessJS } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import { Crown, Trophy, Plus, LogOut, ArrowRight, X, PlayCircle } from 'lucide-react';

export default function Chess() {
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [currentGame, setCurrentGame] = useState(null);
  const [gameLogic, setGameLogic] = useState(new ChessJS());
  
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      fetchRooms();
      fetchLeaderboard();
    };
    init();

    const roomSub = supabase.channel('chess_lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_rooms' }, () => {
        fetchRooms();
      }).subscribe();

    return () => supabase.removeChannel(roomSub);
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('chess_rooms')
      .select('*, host:host_id(full_name, avatar_url, chess_elo), guest:guest_id(full_name, avatar_url, chess_elo)')
      .in('status', ['waiting', 'playing']) // Oynanan maçları da izleyici olarak görmek istersen diye 'playing' eklenebilir ama şu anlık ana odağı waiting tutuyoruz
      .eq('status', 'waiting') 
      .order('created_at', { ascending: false });
    
    if (data) setRooms(data);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, chess_elo')
      .order('chess_elo', { ascending: false })
      .limit(5);
      
    if (data) setLeaderboard(data);
  };

  const createRoom = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('chess_rooms').insert([{ host_id: user.id }]).select().single();
    if (!error && data) {
      joinRoom(data);
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      const { error } = await supabase.from('chess_rooms').delete().eq('id', roomId);
      if (error) throw error;
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (err) {
      console.error("Oda silinirken hata:", err);
    }
  };

  const joinRoom = async (room) => {
    // Eğer odaya giren kişi odanın kurucusu DEĞİLSE ve odada misafir yoksa, onu misafir olarak kaydet
    if (room.host_id !== user.id && !room.guest_id) {
      await supabase.from('chess_rooms').update({ guest_id: user.id, status: 'playing' }).eq('id', room.id);
    }
    
    // Anlık hamleleri dinlemek için odaya abone ol
    const gameSub = supabase.channel(`room_${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chess_rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const updatedRoom = payload.new;
        setCurrentGame(updatedRoom);
        const newLogic = new ChessJS(updatedRoom.fen);
        setGameLogic(newLogic);

        if (newLogic.isGameOver() && updatedRoom.status === 'playing') {
          handleGameOver(updatedRoom, newLogic);
        }
      }).subscribe();

    // Odanın en güncel verisini çek
    const { data } = await supabase
      .from('chess_rooms')
      .select('*, host:host_id(full_name, chess_elo, avatar_url), guest:guest_id(full_name, chess_elo, avatar_url)')
      .eq('id', room.id)
      .single();
      
    setCurrentGame(data);
    setGameLogic(new ChessJS(data.fen));
  };

  const handleGameOver = async (room, logic) => {
    if (room.host_id !== user.id) return; // Çift puanlamayı önlemek için sadece host hesaplar
    
    let winnerId = null;
    let loserId = null;
    
    if (logic.isCheckmate()) {
      winnerId = logic.turn() === 'w' ? room.guest_id : room.host_id;
      loserId = winnerId === room.host_id ? room.guest_id : room.host_id;
    }

    await supabase.from('chess_rooms').update({ status: 'finished', winner_id: winnerId }).eq('id', room.id);

    if (winnerId && loserId) {
      const { data: wProfile } = await supabase.from('profiles').select('chess_elo').eq('id', winnerId).single();
      const { data: lProfile } = await supabase.from('profiles').select('chess_elo').eq('id', loserId).single();
      
      await supabase.from('profiles').update({ chess_elo: (wProfile.chess_elo || 800) + 15 }).eq('id', winnerId);
      await supabase.from('profiles').update({ chess_elo: Math.max(0, (lProfile.chess_elo || 800) - 15) }).eq('id', loserId);
    }
    fetchLeaderboard();
  };

  // HAMLE YAPILDIĞINDA TETİKLENEN FONKSİYON
  const onDrop = async (sourceSquare, targetSquare, piece) => {
    // 1. Oyun beklemedeyse veya bitmişse hamle yapılamaz
    if (!currentGame || currentGame.status !== 'playing') return false;
    
    const isWhite = currentGame.host_id === user.id;
    const isBlack = currentGame.guest_id === user.id;
    const isPieceWhite = piece[0] === 'w'; // Tutulan taşın rengi w/b
    const isPieceBlack = piece[0] === 'b';

    // 2. Kendi taşı değilse elleyemez
    if (isWhite && !isPieceWhite) return false;
    if (isBlack && !isPieceBlack) return false;
    // İzleyiciyse elleyemez
    if (!isWhite && !isBlack) return false;

    // 3. Sıra onda değilse oynayamaz
    if ((isWhite && gameLogic.turn() === 'b') || (isBlack && gameLogic.turn() === 'w')) return false;

    try {
      const move = gameLogic.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (move === null) return false;

      const newFen = gameLogic.fen();
      await supabase.from('chess_rooms').update({ fen: newFen, turn: gameLogic.turn() }).eq('id', currentGame.id);
      
      return true;
    } catch (e) {
      return false;
    }
  };

  const leaveGame = () => {
    // Odadan çıkıldığında artık odayı silmiyoruz. Sadece arayüzü lobiye döndürüyoruz.
    setCurrentGame(null);
    fetchRooms();
    fetchLeaderboard();
  };

  if (currentGame) {
    const isHost = currentGame.host_id === user?.id;
    const isGuest = currentGame.guest_id === user?.id;
    const playerColor = isHost ? 'white' : isGuest ? 'black' : 'white';

    return (
      <div className="flex-1 flex flex-col h-screen p-6 font-sans overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className={theme.text} /> Satranç Masası
          </h2>
          <button 
            onClick={leaveGame} 
            className="px-4 py-2 bg-white/10 hover:bg-red-500 rounded-xl text-white font-bold transition-colors flex items-center gap-2 text-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4"/> Odadan Çık
          </button>
        </div>

        {/* SATRANÇ TAHTASI ALANI (İDEAL BOYUTA KISITLANDI) */}
        <div className="flex-1 flex flex-col items-center justify-center">
          
          <div className="w-full max-w-[450px] mx-auto bg-white/[0.02] border border-white/10 p-5 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center">
            
            {/* Üst Oyuncu Bilgisi */}
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 overflow-hidden border border-white/10 shadow-sm">
                  <img src={currentGame.guest?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest'} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-bold text-gray-300">{currentGame.guest?.full_name || 'Rakip Bekleniyor...'}</span>
              </div>
              <span className={`text-sm font-black ${theme.text} bg-black/40 px-3 py-1 rounded-lg border border-white/5`}>
                {currentGame.guest?.chess_elo || 800} ELO
              </span>
            </div>

            {/* KÜÇÜLTÜLMÜŞ VE SABİTLENMİŞ SATRANÇ TAHTASI */}
            <div className="w-full max-w-[380px] aspect-square rounded-xl overflow-hidden border-[6px] border-[#2c2c2c] shadow-[0_15px_50px_rgba(0,0,0,0.6)] relative">
              {currentGame.status === 'waiting' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center">
                  <Crown className={`w-12 h-12 ${theme.text} animate-bounce mb-3 drop-shadow-xl`} />
                  <p className="text-base font-bold text-white">Rakip Bekleniyor...</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Lobi ekranındaki bir oyuncunun katılması bekleniyor.</p>
                </div>
              )}

              <Chessboard 
                position={gameLogic.fen()} 
                onPieceDrop={onDrop} 
                boardOrientation={playerColor} 
                customDarkSquareStyle={{ backgroundColor: theme.hex }} 
                customLightSquareStyle={{ backgroundColor: '#e5e5e5' }}
              />
            </div>

            {/* Alt Oyuncu (Senin) Bilgin */}
            <div className="w-full flex items-center justify-between mt-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 overflow-hidden border border-white/10 shadow-sm">
                  <img src={currentGame.host?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Host'} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-bold text-white">{currentGame.host?.full_name} {isHost ? '(Sen)' : ''}</span>
              </div>
              <span className={`text-sm font-black ${theme.text} bg-black/40 px-3 py-1 rounded-lg border border-white/5`}>
                {currentGame.host?.chess_elo || 800} ELO
              </span>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto font-sans relative min-h-screen">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${theme.bgLight} ${theme.border} ${theme.text}`}>
              <Crown className="w-6 h-6"/>
            </div> 
            Satranç <span className={theme.text}>Kulübü</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-2">Zekanı konuştur, puan topla ve liderlik tablosuna adını yazdır.</p>
        </div>
        <div className="text-left md:text-right bg-white/[0.02] border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Senin Puanın (Elo)</p>
          <p className={`text-4xl font-black ${theme.text}`}>{profile?.chess_elo || 800}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* LOBİ (Açık Odalar) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Açık Masalar</h2>
            <button 
              onClick={createRoom} 
              className={`px-5 py-2.5 rounded-xl ${theme.bg} text-black font-bold text-sm transition-all flex items-center gap-2 ${theme.glowStrong} hover:opacity-90 cursor-pointer`}
            >
              <Plus className="w-4 h-4"/> Masa Aç
            </button>
          </div>
          
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="py-16 bg-white/[0.02] border border-white/5 rounded-3xl text-center text-gray-500 font-bold text-sm shadow-inner">
                <Crown className="w-12 h-12 mx-auto mb-4 opacity-20"/>
                Şu an açık masa yok. Hemen bir masa açıp rakibini bekle!
              </div>
            ) : (
              rooms.map(room => (
                <div key={room.id} className={`p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${theme.borderHover} transition-all group shadow-lg`}>
                  <div className="flex items-center gap-4">
                    <img src={room.host?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown'} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt="Host"/>
                    <div>
                      <h3 className="text-white font-bold text-lg">{room.host?.full_name}</h3>
                      <p className={`text-xs ${theme.text} font-bold mt-0.5`}>Elo: {room.host?.chess_elo || 800}</p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex items-center gap-3">
                    {/* EĞER ODA BENİMSE: Hem Masaya Dön Hem İptal Et */}
                    {room.host_id === user?.id ? (
                      <>
                        <button 
                          onClick={() => deleteRoom(room.id)} 
                          className="flex-1 md:flex-none px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4"/> İptal Et
                        </button>
                        <button 
                          onClick={() => joinRoom(room)} 
                          className={`flex-1 md:flex-none px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:${theme.bg} hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md`}
                        >
                          <PlayCircle className="w-4 h-4"/> Masaya Dön
                        </button>
                      </>
                    ) : (
                      // EĞER ODA BAŞKASININSA: Sadece Katıl butonu
                      <button 
                        onClick={() => joinRoom(room)} 
                        className={`w-full md:w-auto px-8 py-3 rounded-xl ${theme.bg} text-black font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 ${theme.glowStrong} cursor-pointer`}
                      >
                        Katıl <ArrowRight className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LİDERLİK TABLOSU */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400"/> Kampüs Sıralaması
          </h2>
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <div className="text-center text-xs text-gray-500 font-bold py-4">Sıralama yükleniyor...</div>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 text-center font-black ${index === 0 ? 'text-amber-400 text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : index === 1 ? 'text-gray-300 text-lg' : index === 2 ? 'text-amber-700 text-lg' : 'text-gray-600'}`}>
                        #{index + 1}
                      </div>
                      <img src={player.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown'} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="Player"/>
                      <p className="text-sm font-bold text-white truncate max-w-[120px]">{player.full_name}</p>
                    </div>
                    <div className={`text-sm font-black ${theme.text} bg-black/40 px-2.5 py-1 rounded-lg border border-white/5`}>
                      {player.chess_elo || 800}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}