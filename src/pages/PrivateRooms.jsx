import { useState, useEffect, useRef, useContext } from 'react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import { 
  Send, Users, Lock, Unlock, Settings, LogOut, Plus, 
  Trash2, Video, MessageSquare, ShieldAlert, MonitorPlay, 
  XCircle, Radio, CheckSquare, CalendarDays, UploadCloud, Loader2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';

export default function PrivateRooms() {
  const { theme } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState(null);
  
  // --- Oda Yönetimi ---
  const [privateRooms, setPrivateRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null); 
  const [roomParticipants, setRoomParticipants] = useState([]);
  
  // --- Oda İçi Sekmeler ---
  const [roomTab, setRoomTab] = useState('chat'); 
  
  // --- Chat State'leri ---
  const [roomMessages, setRoomMessages] = useState([]);
  const [roomInput, setRoomInput] = useState('');
  const roomChatRef = useRef(null);

  // --- Modallar ---
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  
  const [showJoinRoom, setShowJoinRoom] = useState(null); 
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(data);
      }
      fetchPrivateRooms();
    };
    init();

    const roomsSub = supabase.channel('private_rooms_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_rooms' }, () => {
        fetchPrivateRooms();
      }).subscribe();

    return () => supabase.removeChannel(roomsSub);
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    
    setRoomTab('chat');
    fetchRoomMessages(activeRoom.id);
    fetchRoomParticipants(activeRoom.id);

    const roomMsgsSub = supabase.channel(`room_msgs_${activeRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_room_messages', filter: `room_id=eq.${activeRoom.id}` }, () => {
        fetchRoomMessages(activeRoom.id);
      }).subscribe();

    const roomPartsSub = supabase.channel(`room_parts_${activeRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${activeRoom.id}` }, () => {
        fetchRoomParticipants(activeRoom.id);
      }).subscribe();

    return () => {
      supabase.removeChannel(roomMsgsSub);
      supabase.removeChannel(roomPartsSub);
    };
  }, [activeRoom]);

  useEffect(() => { 
    if(roomTab === 'chat') {
      roomChatRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [roomMessages, roomTab]);

  const fetchPrivateRooms = async () => {
    const { data } = await supabase.from('private_rooms').select('*, admin:admin_id(full_name)').order('created_at', { ascending: false });
    if (data) setPrivateRooms(data);
  };

  const fetchRoomMessages = async (roomId) => {
    const { data } = await supabase.from('private_room_messages').select('*, profiles(full_name, avatar_url, is_admin)').eq('room_id', roomId).order('created_at', { ascending: true });
    if (data) setRoomMessages(data);
  };

  const fetchRoomParticipants = async (roomId) => {
    const { data } = await supabase.from('room_participants').select('*, profiles(full_name, avatar_url, is_admin, class_level)').eq('room_id', roomId);
    if (data) setRoomParticipants(data);
  };

  const handleSendPrivate = async (e) => {
    e.preventDefault();
    if (!roomInput.trim() || !currentUser || !activeRoom) return;
    const msg = roomInput;
    setRoomInput('');

    const optimisticMsg = {
      id: crypto.randomUUID(),
      room_id: activeRoom.id,
      sender_id: currentUser.id,
      message: msg,
      created_at: new Date().toISOString(),
      profiles: currentUser
    };
    setRoomMessages(prev => [...prev, optimisticMsg]);

    await supabase.from('private_room_messages').insert([{ room_id: activeRoom.id, sender_id: currentUser.id, message: msg }]);
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
    setRoomMessages(prev => prev.filter(m => m.id !== messageId));
    await supabase.from('private_room_messages').delete().eq('id', messageId);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomPassword.trim() || !currentUser) return;
    
    const { data, error } = await supabase.from('private_rooms').insert([{
      name: newRoomName,
      password: newRoomPassword,
      admin_id: currentUser.id
    }]).select('*, admin:admin_id(full_name)').single(); 

    if (!error && data) {
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomPassword('');
      setPrivateRooms(prev => [data, ...prev]);
      joinRoomDirectly(data);
    }
  };

  const attemptJoinRoom = async (e) => {
    e.preventDefault();
    setJoinError('');
    const room = privateRooms.find(r => r.id === showJoinRoom);
    
    if (room.password === joinPassword || currentUser?.is_admin) {
      setShowJoinRoom(null);
      setJoinPassword('');
      joinRoomDirectly(room);
    } else {
      setJoinError('Hatalı şifre. Lütfen tekrar deneyin.');
    }
  };

  const joinRoomDirectly = async (room) => {
    setActiveRoom(room);
    await supabase.from('room_participants').insert([{ room_id: room.id, user_id: currentUser.id }]).catch(()=>{});
    fetchRoomParticipants(room.id);
  };

  const leaveRoom = async () => {
    if (activeRoom && currentUser) {
      await supabase.from('room_participants').delete().match({ room_id: activeRoom.id, user_id: currentUser.id });
    }
    setActiveRoom(null);
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Bu çalışma odasını kalıcı olarak silmek istediğinize emin misiniz?")) return;
    await supabase.from('private_rooms').delete().eq('id', activeRoom.id);
    
    setPrivateRooms(prev => prev.filter(r => r.id !== activeRoom.id));
    setActiveRoom(null);
    setShowSettings(false);
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImage(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `room_${activeRoom.id}_${Math.random()}.${fileExt}`;
      const filePath = `room_avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('course_files').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('course_files').getPublicUrl(filePath);

      await supabase.from('private_rooms').update({ room_image: publicUrl }).eq('id', activeRoom.id);
      
      setActiveRoom({ ...activeRoom, room_image: publicUrl });
      setPrivateRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, room_image: publicUrl } : r));
      
    } catch (error) {
      alert("Resim yüklenirken bir hata oluştu. Dosya boyutu çok büyük olabilir.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ==========================================
  // RENDER - EĞER BİR ODANIN İÇİNDEYSEK
  // ==========================================
  if (activeRoom) {
    const isRoomAdmin = activeRoom.admin_id === currentUser?.id;
    const isGlobalAdmin = currentUser?.is_admin;
    const hasAdminPowers = isRoomAdmin || isGlobalAdmin;

    return (
      <div className="flex-1 flex flex-col h-screen font-sans overflow-hidden bg-[#0a0a0a] relative">
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

        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-md relative">
          <div className="flex items-center gap-3">
            <img src={activeRoom.room_image} alt="Room" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
            <div>
              <h2 className="text-white font-bold text-lg leading-none">{activeRoom.name}</h2>
              <p className="text-[11px] text-gray-400 font-bold mt-1 flex items-center gap-1 uppercase tracking-widest">
                <Lock className="w-3 h-3" /> Şifreli Çalışma Alanı
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasAdminPowers && (
              <button onClick={() => setShowSettings(true)} className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Oda Ayarları">
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={leaveRoom} className="px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer">
              <LogOut className="w-4 h-4" /> Odadan Çık
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-4 pt-0 relative z-10">
          <SpotlightCard className="flex-1 flex w-full rounded-3xl shadow-2xl overflow-hidden" enableTilt={false} particleCount={20}>
            
            <div className="w-64 bg-black/40 border-r border-white/5 p-4 flex flex-col gap-2 overflow-y-auto hidden md:flex relative z-10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Oda Kanalları</p>

              <button onClick={() => setRoomTab('chat')} className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all font-bold text-sm text-left cursor-pointer ${roomTab === 'chat' ? `${theme.bg} text-black shadow-lg` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <MessageSquare className="w-5 h-5" /> Grup Sohbeti
              </button>

              <button onClick={() => setRoomTab('video')} className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all font-bold text-sm text-left cursor-pointer ${roomTab === 'video' ? `${theme.bg} text-black shadow-lg` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <Video className="w-5 h-5" /> Görüntülü Çalışma
              </button>

              <button onClick={() => setRoomTab('space')} className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all font-bold text-sm text-left cursor-pointer ${roomTab === 'space' ? `${theme.bg} text-black shadow-lg` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <Radio className="w-5 h-5" /> Space Odası (Sesli)
              </button>

              <button onClick={() => setRoomTab('schedule')} className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all font-bold text-sm text-left cursor-pointer ${roomTab === 'schedule' ? `${theme.bg} text-black shadow-lg` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <CheckSquare className="w-5 h-5" /> Çalışma Programı
              </button>

              <button onClick={() => setRoomTab('attendance')} className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all font-bold text-sm text-left cursor-pointer ${roomTab === 'attendance' ? `${theme.bg} text-black shadow-lg` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <CalendarDays className="w-5 h-5" /> Ders Yoklaması
              </button>

              <div className="h-px bg-white/5 my-2 mx-2"></div>

              <button onClick={() => setRoomTab('members')} className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all font-bold text-sm text-left cursor-pointer ${roomTab === 'members' ? `${theme.bg} text-black shadow-lg` : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                <Users className="w-5 h-5" /> Üyeler
              </button>
            </div>

            <div className="flex-1 bg-black/60 relative overflow-hidden flex flex-col z-10">
              
              {roomTab === 'chat' && (
                <>
                  <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className={`w-5 h-5 ${theme.text}`} /> 
                      <h3 className="font-bold text-white"># Grup Sohbeti</h3>
                    </div>
                    {hasAdminPowers && <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">Yönetici Modu Aktif</span>}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {roomMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 font-bold text-sm">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                        Bu odada henüz mesaj yok. İlk mesajı sen gönder!
                      </div>
                    )}
                    {roomMessages.map((msg) => {
                      const isMe = msg.sender_id === currentUser?.id;
                      
                      return (
                        <div key={msg.id} className={`flex gap-3 w-full ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                          <img src={msg.profiles?.avatar_url} alt="" className="w-10 h-10 rounded-xl border border-white/10 flex-shrink-0 object-cover" />
                          
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                            <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className={`text-[12px] font-bold ${isMe ? theme.text : 'text-gray-300'}`}>
                                {msg.profiles?.full_name}
                              </span>
                              <span className="text-[10px] text-gray-600 font-bold">
                                {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 group-hover:opacity-100 relative">
                              {hasAdminPowers && !isMe && (
                                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Mesajı Sil">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}

                              <div className={`text-sm p-3.5 rounded-2xl shadow-sm ${isMe ? `${theme.bgLight} border ${theme.border} text-white rounded-tr-sm` : 'bg-white/[0.03] border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                                {msg.message}
                              </div>

                              {hasAdminPowers && isMe && (
                                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Mesajı Sil">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={roomChatRef} />
                  </div>

                  <form onSubmit={handleSendPrivate} className="p-4 bg-black/40 border-t border-white/5">
                    <div className="relative">
                      <input 
                        type="text" value={roomInput} onChange={(e) => setRoomInput(e.target.value)}
                        placeholder={`${activeRoom.name} odasına mesaj gönder...`} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-4 pr-14 text-sm font-bold text-white focus:outline-none focus:border-white/30"
                      />
                      <button type="submit" className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg ${theme.bg} text-black flex items-center justify-center cursor-pointer hover:opacity-90`}>
                        <Send className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </form>
                </>
              )}

              {roomTab === 'video' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] relative p-6">
                  <div className="z-10 flex flex-col items-center max-w-md text-center bg-white/[0.02] border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                      <Video className={`w-10 h-10 ${theme.text} animate-pulse`} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Canlı Çalışma Masası</h2>
                    <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">
                      Kesintisiz, süre sınırı olmayan ve sen sekmeler arası gezinirken kapanmayan bir deneyim için görüntülü görüşme <strong className="text-white">yeni sekmede</strong> açılacaktır.
                    </p>
                    <button 
                      onClick={() => window.open(`https://meet.jit.si/Muehplattmon_Room_${activeRoom.id.replace(/-/g, '')}`, '_blank')}
                      className={`w-full py-4 rounded-xl ${theme.bg} text-black font-black text-sm transition-all flex items-center justify-center gap-3 ${theme.glowStrong} hover:scale-[1.02] cursor-pointer`}
                    >
                      Kamerayı Aç & Masaya Katıl <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {roomTab === 'members' && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center gap-2">
                    <Users className={`w-5 h-5 ${theme.text}`} /> 
                    <h3 className="font-bold text-white"># Odadaki Üyeler ({roomParticipants.length})</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {roomParticipants.map(part => (
                        <div key={part.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                          <img src={part.profiles?.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                          <div>
                            <p className={`font-bold ${part.user_id === currentUser?.id ? theme.text : 'text-white'}`}>
                              {part.profiles?.full_name} {part.user_id === currentUser?.id ? '(Sen)' : ''}
                            </p>
                            <p className="text-xs text-gray-400 font-semibold">{part.profiles?.class_level || 'Mühendislik Öğrencisi'}</p>
                            {part.user_id === activeRoom.admin_id && <span className={`text-[9px] font-black ${theme.text} uppercase tracking-widest mt-1 block`}>Oda Kurucusu</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(roomTab === 'space' || roomTab === 'schedule' || roomTab === 'attendance') && (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className={`w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 ${theme.text}`}>
                    {roomTab === 'space' && <Radio className="w-10 h-10" />}
                    {roomTab === 'schedule' && <CheckSquare className="w-10 h-10" />}
                    {roomTab === 'attendance' && <CalendarDays className="w-10 h-10" />}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Bu Modül Yapım Aşamasında</h2>
                  <p className="text-gray-400 text-sm max-w-md font-medium">Bu alt sayfa için sistem entegrasyonları geliştiriliyor. Şimdilik "Grup Sohbeti" ve "Görüntülü Çalışma" aktif.</p>
                </div>
              )}

            </div>
          </SpotlightCard>
        </div>

        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className={`w-6 h-6 ${theme.text}`} /> Oda Ayarları</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Oda Fotoğrafını Değiştir</label>
                    <div className="relative">
                      <input type="file" accept="image/*" id="roomImageUpload" onChange={handleImageUpload} className="hidden" />
                      <label htmlFor="roomImageUpload" className={`w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-white/30 hover:bg-white/[0.02] transition-all cursor-pointer ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingImage ? (
                          <><Loader2 className={`w-8 h-8 animate-spin ${theme.text}`} /><span className="text-sm font-bold text-white">Fotoğraf Yükleniyor...</span></>
                        ) : (
                          <><div className="w-12 h-12 rounded-full bg-black/50 border border-white/5 flex items-center justify-center"><UploadCloud className={`w-6 h-6 ${theme.text}`} /></div><div className="text-center"><p className="text-sm font-bold text-white mb-1">Bilgisayardan Fotoğraf Seç</p><p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">PNG, JPG (Maks. 2MB)</p></div></>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <button onClick={handleDeleteRoom} className="w-full py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <Trash2 className="w-4 h-4" /> Odayı Tamamen Sil
                    </button>
                  </div>
                </div>

                <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer"><XCircle className="w-6 h-6" /></button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================
  // ANA EKRAN (Odalar Listesi)
  // ==========================================
  return (
    <div className="flex-1 flex flex-col h-screen p-6 md:p-10 overflow-y-auto font-sans relative">
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
      
      <header className="mb-10 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${theme.bgLight} ${theme.border} ${theme.text}`}><MonitorPlay className="w-6 h-6"/></div> 
            Özel <span className={theme.text}>Odalar</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-2">Sadece şifreyi bilenlerin girebildiği, görüntülü ve sesli çalışma alanları.</p>
        </div>
        <button onClick={() => setShowCreateRoom(true)} className={`px-6 py-3 rounded-xl ${theme.bg} text-black font-bold text-sm transition-all flex items-center gap-2 ${theme.glowStrong} hover:opacity-90 cursor-pointer`}>
          <Plus className="w-5 h-5 stroke-[3]" /> Yeni Oda Kur
        </button>
      </header>

      <div className="flex-1 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {privateRooms.length === 0 ? (
            <div className="col-span-full py-24 bg-white/[0.02] border border-white/5 rounded-3xl text-center text-gray-500 font-bold text-sm shadow-inner">
              <Lock className="w-12 h-12 mx-auto mb-4 opacity-20" /> Şu an aktif özel oda yok. Arkadaşlarınla çalışmak için ilk odayı sen kur!
            </div>
          ) : (
            privateRooms.map(room => (
              <SpotlightCard key={room.id} className="rounded-3xl overflow-hidden transition-all group shadow-lg flex flex-col" enableTilt={true} clickEffect={true}>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="h-32 bg-black/50 relative overflow-hidden">
                    <img src={room.room_image} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-lg"><Lock className="w-3.5 h-3.5 text-gray-300" /></div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-white font-bold text-xl mb-1 truncate">{room.name}</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-6">Kurucu: <span className="text-gray-200">{room.admin?.full_name}</span></p>
                    <button onClick={() => setShowJoinRoom(room.id)} className={`mt-auto w-full py-3.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold text-sm hover:${theme.bg} hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md`}>
                      <Unlock className="w-4 h-4" /> Şifre Gir & Katıl
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Lock className={`w-6 h-6 ${theme.text}`} /> Şifreli Oda Kur</h3>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Odanın Adı</label>
                  <input type="text" required value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Örn: Vize Kampı 🚀" className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Giriş Şifresi</label>
                  <input type="text" required value={newRoomPassword} onChange={(e) => setNewRoomPassword(e.target.value)} placeholder="Arkadaşlarınla paylaşacağın şifre" className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30" />
                </div>
                <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setShowCreateRoom(false)} className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-colors text-sm cursor-pointer">Vazgeç</button>
                  <button type="submit" className={`flex-1 py-3.5 rounded-xl ${theme.bg} text-black font-bold text-sm ${theme.glowStrong} hover:opacity-90 cursor-pointer`}>Odayı Oluştur</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showJoinRoom && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
              <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center mx-auto mb-4 mt-[-48px] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <Lock className={`w-8 h-8 ${theme.text}`} />
              </div>
              <h3 className="text-center text-xl font-bold text-white mb-2">Gizli Odaya Katıl</h3>
              <p className="text-center text-xs text-gray-400 font-medium mb-6">İçeri girmek için parolayı bilmelisin.</p>
              
              {currentUser?.is_admin && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-amber-400 leading-relaxed">Sistem yöneticisi olduğun için şifre girmeden (boş bırakarak) odaya giriş yapabilirsin.</p>
                </div>
              )}

              <form onSubmit={attemptJoinRoom}>
                <input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} placeholder="Şifreyi girin..." className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-center text-sm font-bold text-white focus:outline-none focus:border-white/30 mb-2 tracking-widest" />
                {joinError && <p className="text-red-400 text-xs font-bold text-center mb-2 animate-pulse">{joinError}</p>}
                
                <div className="flex gap-2 mt-6">
                  <button type="button" onClick={() => setShowJoinRoom(null)} className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-colors text-sm cursor-pointer">İptal</button>
                  <button type="submit" className={`flex-[2] py-3.5 rounded-xl ${theme.bg} text-black font-bold text-sm ${theme.glowStrong} hover:opacity-90 cursor-pointer`}>Kapıyı Aç</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}