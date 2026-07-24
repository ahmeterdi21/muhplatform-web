import { useState, useEffect, useRef, useContext } from 'react';
import { Send, MessageSquare, Paperclip, ShieldAlert, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';

export default function Lobby() {
  const { theme } = useContext(ThemeContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profilesMap, setProfilesMap] = useState({});
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initLobby = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
        if (me?.is_admin) setIsAdmin(true);
      }

      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, class_level, is_admin, score');
      if (profiles) {
        const map = {};
        profiles.forEach(p => { map[p.id] = p; });
        setProfilesMap(map);
      }

      const { data: chatData } = await supabase.from('lobby_messages').select('*').order('created_at', { ascending: true }).limit(100);
      if (chatData) setMessages(chatData);
    };

    initLobby();

    const channel = supabase
      .channel('public:lobby_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages' }, (payload) => {
        const newMsg = payload.new;
        setProfilesMap(prevMap => {
          if (!prevMap[newMsg.sender_id]) fetchMissingProfile(newMsg.sender_id);
          return prevMap;
        });
        setMessages(prev => [...prev, newMsg]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'lobby_messages' }, (payload) => {
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMissingProfile = async (userId) => {
    const { data: newProfile } = await supabase.from('profiles').select('id, full_name, avatar_url, class_level, is_admin, score').eq('id', userId).single();
    if (newProfile) setProfilesMap(prev => ({ ...prev, [userId]: newProfile }));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]); // (veya roomMessages)

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    let senderId = currentUser?.id;
    if (!senderId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return alert("Oturum hatası, lütfen yenileyin.");
      senderId = session.user.id;
      setCurrentUser(session.user);
    }

    try {
      const { error } = await supabase.from('lobby_messages').insert([{ sender_id: senderId, message: newMessage }]);
      if (error) throw error;
      setNewMessage('');
    } catch (err) {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const myProfile = profilesMap[currentUser?.id];
    if (!myProfile?.is_admin && (myProfile?.score || 0) < 50) {
      alert("Kampüs odasına dosya veya görsel yükleyebilmek için profil puanınızın en az 50 olması gerekmektedir.");
      return;
    }

    let senderId = currentUser?.id;
    if (!senderId) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `lobby-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('support_files').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('support_files').getPublicUrl(fileName);
      await supabase.from('lobby_messages').insert([{ sender_id: senderId, message: "Bir görsel paylaştı.", file_url: data.publicUrl }]);
    } catch (err) {}
  };

  const handleAdminDelete = async (msgId) => {
    if (!isAdmin) return;
    try {
      await supabase.from('lobby_messages').delete().eq('id', msgId);
    } catch (err) {}
  };

  const goToProfile = (userId) => window.location.href = `/profile?id=${userId}`;

  const isImageFile = (url) => {
    if (!url) return false;
    return Boolean(url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/));
  };

  const getBubbleStyle = (score = 0, isMe) => {
    if (score >= 50) return isMe ? 'bg-purple-500/10 border-purple-500/30 rounded-tr-none' : 'bg-white/[0.03] border-purple-500/30 rounded-tl-none';
    if (score >= 30) return isMe ? 'bg-blue-500/10 border-blue-500/30 rounded-tr-none' : 'bg-white/[0.03] border-blue-500/30 rounded-tl-none';
    if (score >= 10) return isMe ? 'bg-cyan-500/10 border-cyan-500/30 rounded-tr-none' : 'bg-white/[0.03] border-cyan-500/30 rounded-tl-none';
    return isMe ? `${theme.bgLight} ${theme.border} rounded-tr-none` : 'bg-white/[0.03] border-white/10 rounded-tl-none';
  };

  return (
    <div className="flex-1 flex flex-col h-screen p-6 md:p-10 font-sans relative overflow-hidden">
      
      {/* EVRENSEL UZAY/YILDIZ ARKA PLANI */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <Particles
          particleColors={['#ffffff', theme.hex]}
          particleCount={250}
          particleSpread={10}
          speed={0.1}
          moveParticlesOnHover={true}
          particleHoverFactor={1.5}
          alphaParticles={true}
          particleBaseSize={100}
        />
      </div>
      
      {/* LOBİ PANELİ SPOTLIGHT KARTINA ÇEVRİLDİ */}
      <SpotlightCard 
        className="flex-1 flex flex-col shadow-2xl relative z-10 overflow-hidden"
        particleCount={20}
        enableTilt={false}
      >
        <header className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.01] relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${theme.bgLight} ${theme.border} flex items-center justify-center ${theme.text} ${theme.glow}`}>
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Ortak Kampüs Sohbet Odası</h1>
              <p className="text-xs text-gray-300 font-semibold mt-1">Tüm mühendislik öğrencileriyle anlık fikir alışverişi yap.</p>
            </div>
          </div>
          <div className={`px-5 py-2.5 rounded-full ${theme.bgLight} ${theme.border} ${theme.text} text-xs font-bold flex items-center gap-2.5 shadow-lg`}>
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme.hex }}></span> Canlı Akış
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-5 p-6 custom-scrollbar relative z-10">
          {messages.map((msg) => {
            const sender = profilesMap[msg.sender_id] || { full_name: 'Bilinmeyen Kullanıcı', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown', class_level: 'Öğrenci', score: 0, is_admin: false };
            const isMe = msg.sender_id === currentUser?.id;
            const bubbleStyle = getBubbleStyle(sender.score, isMe);

            return (
              <div key={msg.id} className={`flex items-start gap-4 group ${isMe ? 'flex-row-reverse' : ''}`}>
                
                <div className="relative flex-shrink-0 cursor-pointer group/avatar" onClick={() => goToProfile(msg.sender_id)}>
                  <div className={`w-11 h-11 rounded-2xl overflow-hidden shadow-md transition-all ${sender.is_admin ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#121212]' : `border border-white/10 hover:${theme.border}`}`}>
                    <img src={sender.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  
                  {sender.is_admin && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-[#121212] z-10" title="Kişi Yöneticidir">
                      <ShieldAlert className="w-3 h-3 text-black" />
                    </div>
                  )}

                  {sender.is_admin && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/avatar:opacity-100 bg-[#121212] text-amber-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-20 border border-amber-500/30 transition-all shadow-xl">
                      Kişi Yöneticidir
                    </div>
                  )}
                </div>

                {isAdmin && !isMe && (
                  <button onClick={() => handleAdminDelete(msg.id)} className="opacity-0 group-hover:opacity-100 mt-2 p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer" title="Admin Olarak Kaldır">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className={`max-w-[75%] rounded-3xl p-5 border shadow-lg ${bubbleStyle}`}>
                  <div className={`flex flex-wrap items-center gap-2 mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span onClick={() => goToProfile(msg.sender_id)} className="text-sm font-bold text-white cursor-pointer hover:underline">
                      {sender.full_name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">• {sender.class_level}</span>
                  </div>

                  <p className={`text-sm font-medium leading-relaxed ${isMe ? 'text-gray-100' : 'text-gray-200'}`}>
                    {msg.message}
                  </p>

                  {msg.file_url && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 max-w-xs bg-black/40">
                      <a href={msg.file_url} target="_blank" rel="noreferrer">
                        {isImageFile(msg.file_url) ? (
                          <img src={msg.file_url} alt="Görsel" className="w-full object-cover max-h-56 hover:opacity-90 transition-opacity" />
                        ) : (
                          <div className={`p-4 text-xs font-bold ${theme.text} flex items-center justify-center ${theme.bgLight} hover:${theme.bgActive} transition-colors`}>
                            Dosyayı İncele
                          </div>
                        )}
                      </a>
                    </div>
                  )}
                </div>

                {isAdmin && isMe && (
                  <button onClick={() => handleAdminDelete(msg.id)} className="opacity-0 group-hover:opacity-100 mt-2 p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer" title="Mesajı Kaldır">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 flex gap-3 relative bg-black/20 z-10">
          <input type="file" ref={fileInputRef} hidden accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className={`w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-400 hover:${theme.text} ${theme.borderHover} hover:${theme.bgLight} transition-colors cursor-pointer shadow-sm relative group`}
          >
            <Paperclip className="w-5 h-5" />
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-[#121212] border border-white/10 text-xs font-bold px-2 py-1 rounded text-gray-300 pointer-events-none whitespace-nowrap transition-opacity">
              Min 50 Puan
            </div>
          </button>

          <div className="flex-1 relative">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Kampüs odasında bir şeyler yaz..." 
              className="w-full h-14 bg-black/60 border border-white/10 rounded-2xl pl-5 pr-16 text-white text-sm font-bold focus:outline-none focus:border-white/30 transition-all shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()} 
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl ${theme.bg} text-black flex items-center justify-center ${theme.glowStrong} disabled:opacity-50 disabled:shadow-none cursor-pointer opacity-90 hover:opacity-100`}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>

      </SpotlightCard>
    </div>
  );
}