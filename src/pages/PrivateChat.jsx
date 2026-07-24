import { useState, useEffect, useRef, useContext } from 'react';
import { Send, Search, Paperclip, Trash2, ArrowLeft, MessageSquare, User, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrivateChat() {
  const { theme } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Arama ve Kullanıcı Listesi
  const [searchQuery, setSearchQuery] = useState('');
  const [chatPartners, setChatPartners] = useState([]);
  const [searchResults, setSearchResults] = useState([]); 
  const [unreadCounts, setUnreadCounts] = useState({}); // Kişilere göre okunmamış mesaj sayıları
  
  // Aktif Sohbet State'leri
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        fetchChatHistory(user.id);
        fetchUnreadCounts(user.id);
      }
    };
    init();

    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('user');
    if (targetUserId) {
      loadSpecificUser(targetUserId);
    }
  }, []);

  // Realtime Dinleyici (Anlık mesaj ve görüldü bilgisi için)
  useEffect(() => {
    if (!currentUser) return;
    
    const channel = supabase
      .channel('direct_messages_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
        if (payload.new?.receiver_id === currentUser.id || payload.new?.sender_id === currentUser.id || 
            payload.old?.receiver_id === currentUser.id || payload.old?.sender_id === currentUser.id) {
          
          fetchChatHistory(currentUser.id);
          fetchUnreadCounts(currentUser.id);
          
          if (selectedUser) {
            loadMessages(currentUser.id, selectedUser.id);
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, selectedUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Okunmamış mesaj sayılarını getir
  const fetchUnreadCounts = async (myId) => {
    const { data } = await supabase
      .from('direct_messages')
      .select('sender_id')
      .eq('receiver_id', myId)
      .eq('is_read', false);
      
    if (data) {
      const counts = {};
      data.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  };

  const fetchChatHistory = async (myId) => {
    const { data: msgs } = await supabase
      .from('direct_messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });

    if (msgs) {
      const uniqueIds = new Set();
      msgs.forEach(m => {
        const partnerId = m.sender_id === myId ? m.receiver_id : m.sender_id;
        if (partnerId !== myId) uniqueIds.add(partnerId);
      });

      if (uniqueIds.size > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', Array.from(uniqueIds));
        setChatPartners(profiles || []);
      } else {
        setChatPartners([]);
      }
    }
  };

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', currentUser?.id)
        .limit(10);
      setSearchResults(data || []);
    };
    
    const timeoutId = setTimeout(() => { searchUsers(); }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser]);

  const loadSpecificUser = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      handleSelectUser(data);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    
    if (currentUser) {
      // O kişiden gelen mesajları "Görüldü" olarak işaretle
      await supabase.from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', user.id)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
        
      loadMessages(currentUser.id, user.id);
      fetchUnreadCounts(currentUser.id); // Sol paneli güncelle
    }
  };

  const loadMessages = async (myId, partnerId) => {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;
    
    setSending(true);
    try {
      const msgData = {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: newMessage,
        file_url: null,
        is_read: false
      };
      
      const { error } = await supabase.from('direct_messages').insert([msgData]);
      if (error) throw error;
      
      setNewMessage('');
    } catch (err) {
      alert("Mesaj gönderilemedi: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser || !currentUser) return;

    setSending(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `dm-${currentUser.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('support_files').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('support_files').getPublicUrl(fileName);
      
      await supabase.from('direct_messages').insert([{
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: "Bir dosya/görsel paylaştı.",
        file_url: data.publicUrl,
        is_read: false
      }]);
    } catch (err) {
      alert("Dosya yüklenirken hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
    await supabase.from('direct_messages').delete().match({ id: msgId, sender_id: currentUser.id });
  };

  const handleClearConversation = async () => {
    if (!window.confirm(`${selectedUser.full_name} ile olan tüm sohbet geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    
    try {
      await supabase.from('direct_messages').delete()
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`);
      
      setMessages([]);
      fetchChatHistory(currentUser.id);
      setSelectedUser(null);
    } catch (err) {
      alert("Sohbet temizlenirken bir hata oluştu.");
    }
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return Boolean(url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/));
  };

  return (
    <div className="flex-1 flex h-screen p-4 md:p-8 gap-6 font-sans relative overflow-hidden">
      
      {/* EVRENSEL UZAY ARKA PLANI */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
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

      {/* SOL TARAF: KİŞİ LİSTESİ */}
      <SpotlightCard className={`w-full md:w-80 flex-col shadow-2xl z-10 transition-all ${selectedUser ? 'hidden md:flex' : 'flex'}`} enableTilt={false} particleCount={10}>
        <div className="p-5 border-b border-white/10 relative z-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className={`w-5 h-5 ${theme.text}`} /> Özel Sohbet
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Yeni kişi veya sohbet ara..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative z-10">
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Sistemdeki Kişiler</p>
              {searchResults.map(user => (
                <button key={user.id} onClick={() => handleSelectUser(user)} className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-transparent hover:border-white/10">
                  <img src={user.avatar_url} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="Avatar" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.class_level}</p>
                  </div>
                </button>
              ))}
              <div className="h-px bg-white/10 my-3 mx-2"></div>
            </div>
          )}

          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Sohbetler</p>
          {chatPartners.length === 0 && searchQuery.length < 2 ? (
            <div className="text-center p-6 text-gray-500 text-sm font-bold">Henüz kimseyle sohbet etmedin. Yukarıdan birini ara!</div>
          ) : (
            chatPartners.map(user => (
              <button 
                key={user.id} 
                onClick={() => handleSelectUser(user)} 
                className={`w-full p-3 flex items-center justify-between gap-3 rounded-xl transition-all text-left border ${selectedUser?.id === user.id ? `${theme.bgLight} ${theme.border}` : 'border-transparent hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={user.avatar_url} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="Avatar" />
                  <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                </div>
                {unreadCounts[user.id] > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {unreadCounts[user.id]}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </SpotlightCard>

      {/* SAĞ TARAF: MESAJLAŞMA ALANI */}
      <SpotlightCard className={`flex-1 flex-col shadow-2xl z-10 transition-all ${!selectedUser ? 'hidden md:flex items-center justify-center' : 'flex'}`} enableTilt={false} particleCount={20}>
        {!selectedUser ? (
          <div className="text-center text-gray-500 relative z-10">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-white mb-2">Sohbet Seçin</h3>
            <p className="text-sm">Mesajlaşmaya başlamak için soldan bir kişi seçin veya arayın.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full relative z-10">
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg bg-black/40">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img src={selectedUser.avatar_url} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" alt="Avatar" />
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedUser.full_name}</h2>
                  <p className="text-xs text-gray-400 font-medium">{selectedUser.class_level || 'Öğrenci'}</p>
                </div>
              </div>
              <button onClick={handleClearConversation} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/30 flex items-center gap-2 text-xs font-bold" title="Tüm Sohbeti Sil">
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Sohbeti Temizle</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm font-bold opacity-60">
                  <User className="w-12 h-12 mb-3 opacity-50" /> Sohbet geçmişi tertemiz. İlk mesajı gönder!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex gap-3 w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && <img src={selectedUser.avatar_url} className="w-8 h-8 rounded-xl object-cover flex-shrink-0 border border-white/10 mt-auto" alt="" />}
                      
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div className="flex items-center gap-2 group-hover:opacity-100 relative">
                          
                          {isMe && (
                            <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <div className={`p-3.5 rounded-2xl shadow-md text-sm font-medium ${isMe ? `${theme.bgLight} ${theme.border} text-white rounded-br-sm` : 'bg-white/[0.03] border border-white/10 text-gray-200 rounded-bl-sm'}`}>
                            {msg.message}
                            {msg.file_url && (
                              <div className="mt-3 rounded-xl overflow-hidden border border-white/10 max-w-[200px] sm:max-w-xs bg-black/40">
                                <a href={msg.file_url} target="_blank" rel="noreferrer">
                                  {isImageFile(msg.file_url) ? (
                                    <img src={msg.file_url} alt="Görsel" className="w-full object-cover max-h-48 hover:opacity-90 transition-opacity" />
                                  ) : (
                                    <div className={`p-3 text-xs font-bold ${theme.text} flex items-center justify-center ${theme.bgLight} hover:${theme.bgActive}`}>Dosyayı Aç</div>
                                  )}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 px-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {/* GÖRÜLDÜ BİLGİSİ EKLENTİSİ (Mavi Çift Tik / Gri Tek Tik) */}
                          {isMe && (
                            msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" /> : <Check className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40 flex gap-3 items-center">
              <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
              
              <button type="button" onClick={() => fileInputRef.current.click()} disabled={sending} className={`p-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:${theme.text} hover:${theme.bgLight} ${theme.borderHover} transition-colors cursor-pointer disabled:opacity-50`}>
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input 
                  type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={sending}
                  placeholder={`${selectedUser.full_name} kişisine mesaj yaz...`} 
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-sm text-white font-medium focus:outline-none focus:border-white/30 transition-all shadow-inner"
                />
                <button type="submit" disabled={!newMessage.trim() || sending} className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg ${theme.bg} text-black ${theme.glowStrong} disabled:opacity-50 transition-opacity cursor-pointer`}>
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>

          </div>
        )}
      </SpotlightCard>

    </div>
  );
}