import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, FileCheck, MessageSquare, Send, CheckCircle2, XCircle, Archive, Lock, Trash2, AlertTriangle, Users, ExternalLink, UserMinus, UserCheck, Search, Gavel, Calendar } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';

// --- YENİ DOSYA YÖNETİM MODÜLÜ ---
function DosyaYonetimi({ theme }) {
  const [subTab, setSubTab] = useState('pending'); // 'pending' veya 'approved'
  const [files, setFiles] = useState([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { fetchFiles(); }, [subTab]);

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('course_materials')
      .select(`*, profiles(full_name)`)
      .eq('status', subTab)
      .order('created_at', { ascending: false });
    if (data) setFiles(data);
  };

  const handleApprove = async (id) => {
    await supabase.from('course_materials').update({ status: 'approved' }).eq('id', id);
    fetchFiles();
  };

  const handleDelete = async (id) => {
    const isApproved = subTab === 'approved';
    const msg = isApproved 
      ? "Bu dosyayı sistemden tamamen kaldırmak istediğinize emin misiniz? (Dashboard ve Dersler sayfasından da silinecektir.)" 
      : "Bu dosyayı reddedip kalıcı olarak silmek istediğinize emin misiniz?";
      
    if (!window.confirm(msg)) return;
    
    await supabase.from('course_materials').delete().eq('id', id);
    fetchFiles();
  };

  const handleClearAllApproved = async () => {
    if (!window.confirm("DİKKAT: Sistemdeki onaylanmış TÜM ders materyallerini sileceksiniz. Bu işlem geri alınamaz! Emin misiniz?")) return;
    setClearing(true);
    try {
      await supabase.from('course_materials').delete().eq('status', 'approved');
      fetchFiles();
    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setSubTab('pending')} 
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${subTab === 'pending' ? `${theme.bg} text-black ${theme.glow}` : 'text-gray-400 hover:text-white'}`}
          >
            Bekleyen Onaylar
          </button>
          <button 
            onClick={() => setSubTab('approved')} 
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${subTab === 'approved' ? `${theme.bg} text-black ${theme.glow}` : 'text-gray-400 hover:text-white'}`}
          >
            Sistemdeki Dosyalar
          </button>
        </div>

        {subTab === 'approved' && files.length > 0 && (
          <button 
            onClick={handleClearAllApproved} 
            disabled={clearing} 
            className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" /> {clearing ? 'Sistem Temizleniyor...' : 'Tüm Onaylıları Sil'}
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-white/[0.02] border border-white/5 rounded-3xl">
          <FileCheck className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-sm">
            {subTab === 'pending' ? 'Şu anda onay bekleyen dosya yok.' : 'Sistemde yüklü onaylı dosya bulunmuyor.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {files.map(file => (
            <SpotlightCard key={file.id} className="p-5 flex flex-col group transition-colors shadow-lg" particleCount={5} enableTilt={false}>
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="font-bold text-white text-base truncate mb-1" title={file.title}>{file.title}</h3>
                <p className="text-[11px] text-gray-400 font-semibold mb-4">Yükleyen: {file.profiles?.full_name}</p>
                
                <a href={file.file_url} target="_blank" rel="noreferrer" className={`flex-1 flex items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/5 mb-4 text-xs font-bold ${theme.text} hover:bg-white/5 transition-colors`}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Dosyayı İncele
                </a>

                <div className="flex gap-2">
                  {subTab === 'pending' ? (
                    <>
                      <button onClick={() => handleDelete(file.id)} className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors cursor-pointer">
                        Reddet (Sil)
                      </button>
                      <button onClick={() => handleApprove(file.id)} className={`flex-1 py-3 rounded-xl ${theme.bg} text-black font-bold text-xs ${theme.glow} hover:opacity-90 transition-opacity cursor-pointer`}>
                        Onayla
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleDelete(file.id)} className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <Trash2 className="w-4 h-4" /> Sistemden Kaldır
                    </button>
                  )}
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('support'); 
  const [supportSubTab, setSupportSubTab] = useState('active'); 
  
  const [activeRooms, setActiveRooms] = useState([]);
  const [archivedRooms, setArchivedRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null); 
  const [roomMessages, setRoomMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('İşlem Başarıyla Gerçekleştirildi');
  
  const [clearing, setClearing] = useState(false);
  const chatEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  // --- KULLANICI YÖNETİMİ STATE'LERİ ---
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [showBanModal, setShowBanModal] = useState(null);
  const [banType, setBanType] = useState('temporary'); // temporary | permanent
  const [banDays, setBanDays] = useState(7);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [isProcessingUser, setIsProcessingUser] = useState(false);

  useEffect(() => {
    const initAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
      fetchRooms();
      fetchAllUsers();
    };
    initAdmin();

    const sub = supabase
      .channel('admin_panel_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        fetchRooms();
        if (selectedRoom) loadRoomMessages(selectedRoom.id);
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [selectedRoom]);

  const fetchRooms = async () => {
    const { data: rooms } = await supabase.from('support_rooms').select('*');
    const { data: messages } = await supabase.from('support_messages').select('room_owner_id');
    if (!messages) return;
    const ownerIds = [...new Set(messages.map(m => m.room_owner_id))];

    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ownerIds);
      if (profiles) {
        const activeList = [];
        const archiveList = [];

        profiles.forEach(profile => {
          const roomRecord = rooms?.find(r => r.id === profile.id || r.user_id === profile.id);
          const isClosed = roomRecord?.status === 'closed';
          
          const profileWithRoom = { 
            ...profile, 
            close_reason: roomRecord?.close_reason || null,
            status: roomRecord?.status || 'open'
          };

          if (isClosed) archiveList.push(profileWithRoom);
          else activeList.push(profileWithRoom);
        });

        setActiveRooms(activeList);
        setArchivedRooms(archiveList);

        if (!selectedRoom && activeList.length > 0) {
          setSelectedRoom(activeList[0]);
          loadRoomMessages(activeList[0].id);
        }
      }
    }
  };

  const fetchAllUsers = async () => {
    // Veritabanında is_banned, ban_reason, ban_until sütunlarının olduğunu varsayıyoruz
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) setAllUsers(data);
  };

  const loadRoomMessages = async (userId) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('room_owner_id', userId)
      .order('created_at', { ascending: true });
    
    if (data) setRoomMessages(data);
  };

  const handleSelectRoom = (roomUser) => {
    setSelectedRoom(roomUser);
    loadRoomMessages(roomUser.id);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedRoom || !currentUser) return;
    if (selectedRoom.status === 'closed') return;

    try {
      const newMsg = {
        id: crypto.randomUUID(),
        sender_id: currentUser.id,
        room_owner_id: selectedRoom.id,
        message: replyMessage,
        file_url: null,
        created_at: new Date().toISOString()
      };

      setRoomMessages(prev => [...prev, newMsg]);
      setReplyMessage('');

      const { error } = await supabase.from('support_messages').insert([newMsg]);
      if (error) throw error;
    } catch (error) {
      alert("Yanıt gönderilemedi: " + error.message);
    }
  };

  const handleCloseSupportRoom = async () => {
    if (!selectedRoom) return;
    try {
      const { data: existingRoom } = await supabase.from('support_rooms').select('*').eq('user_id', selectedRoom.id).single();
      if (existingRoom) {
        await supabase.from('support_rooms').update({ status: 'closed', close_reason: closeReason }).eq('user_id', selectedRoom.id);
      } else {
        await supabase.from('support_rooms').insert([{ id: crypto.randomUUID(), user_id: selectedRoom.id, status: 'closed', close_reason: closeReason }]);
      }

      const sysMsg = {
        id: crypto.randomUUID(),
        sender_id: currentUser.id,
        room_owner_id: selectedRoom.id,
        message: `[SİSTEM BİLDİRİMİ]: Bu destek talebi yönetici tarafından kapatılmıştır. Sonuç / Sebep: "${closeReason}"`,
        file_url: null,
        created_at: new Date().toISOString()
      };
      await supabase.from('support_messages').insert([sysMsg]);

      alert("Destek talebi başarıyla kapatıldı ve arşive taşındı.");
      setShowCloseModal(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch (error) {
      alert("Talep kapatılırken hata oluştu: " + error.message);
    }
  };

  const handleClearLobby = async () => {
    const confirm = window.confirm("DİKKAT: Ortak Kampüs Sohbet Odasındaki TÜM geçmiş silinecektir. Bu işlem geri alınamaz! Emin misiniz?");
    if (!confirm) return;

    setClearing(true);
    try {
      const { error } = await supabase.from('lobby_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      alert("Tüm sohbet geçmişi başarıyla temizlendi.");
    } catch (error) {
      alert("Temizleme sırasında hata: " + error.message);
    } finally {
      setClearing(false);
    }
  };

  // --- KULLANICI YÖNETİMİ FONKSİYONLARI ---
  const handleToggleAdmin = async (userId, currentStatus) => {
    const actionText = currentStatus ? 'Admin yetkisini almak' : 'Admin yetkisi vermek';
    if (!window.confirm(`Bu kullanıcının ${actionText} istediğinize emin misiniz?`)) return;
    
    setIsProcessingUser(true);
    try {
      const { error } = await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
      if (error) throw error;
      alert(`Kullanıcı yetkileri başarıyla güncellendi.`);
      fetchAllUsers();
    } catch (err) {
      alert("Hata: " + err.message);
    } finally {
      setIsProcessingUser(false);
    }
  };

  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!showBanModal) return;
    if (!banReasonInput.trim()) return alert("Lütfen kullanıcı için bir uzaklaştırma sebebi belirtin.");

    setIsProcessingUser(true);
    try {
      let banUntil = null;
      if (banType === 'temporary') {
        const date = new Date();
        date.setDate(date.getDate() + Number(banDays));
        banUntil = date.toISOString();
      }

      const { error } = await supabase.from('profiles').update({
        is_banned: true,
        ban_reason: banReasonInput,
        ban_until: banUntil
      }).eq('id', showBanModal.id);

      if (error) throw error;

      alert(`${showBanModal.full_name} sistemden başarıyla uzaklaştırıldı.`);
      setShowBanModal(null);
      setBanReasonInput('');
      fetchAllUsers();
    } catch (err) {
      alert("Ban işlemi başarısız: " + err.message);
    } finally {
      setIsProcessingUser(false);
    }
  };

  const handleRemoveBan = async (userId) => {
    if (!window.confirm("Bu kullanıcının uzaklaştırmasını (ban) kaldırmak istediğinize emin misiniz?")) return;
    
    setIsProcessingUser(true);
    try {
      const { error } = await supabase.from('profiles').update({
        is_banned: false,
        ban_reason: null,
        ban_until: null
      }).eq('id', userId);

      if (error) throw error;
      alert("Kullanıcının uzaklaştırması başarıyla kaldırıldı.");
      fetchAllUsers();
    } catch (err) {
      alert("İşlem başarısız: " + err.message);
    } finally {
      setIsProcessingUser(false);
    }
  };

  const displayedRooms = supportSubTab === 'active' ? activeRooms : archivedRooms;
  const filteredUsers = allUsers.filter(u => u.full_name?.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col h-screen p-6 overflow-hidden relative font-sans">
      
      {/* EVRENSEL UZAY/YILDIZ ARKA PLANI */}
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

      <header className="mb-6 relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight flex items-center gap-3 text-white">
            Yönetici <span className={`font-bold ${theme.text}`}>Paneli</span>
            <ShieldAlert className={`w-6 h-6 ${theme.text}`} />
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-semibold">Talepleri yönet, dosyaları denetle ve platform güvenliğini/disiplinini sağla.</p>
        </div>

        <div className="flex gap-2 bg-black/40 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md shadow-lg">
          <button 
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'support' ? `${theme.bg} text-black ${theme.glow}` : 'text-gray-400 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" /> Destek ({activeRooms.length})
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'files' ? `${theme.bg} text-black ${theme.glow}` : 'text-gray-400 hover:text-white'}`}
          >
            <FileCheck className="w-4 h-4" /> Dosyalar
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'chat' ? `${theme.bg} text-black ${theme.glow}` : 'text-gray-400 hover:text-white'}`}
          >
            <Users className="w-4 h-4" /> Sohbet Geçmişi
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'users' ? `${theme.bg} text-black ${theme.glow}` : 'text-gray-400 hover:text-white'}`}
          >
            <Gavel className="w-4 h-4" /> Kullanıcılar
          </button>
        </div>
      </header>

      {/* YÖNETİM PANELLERİNİN TAMAMI SPOTLIGHT KARTIYLA SARMALANDI */}
      <SpotlightCard className="flex-1 rounded-3xl backdrop-blur-md flex overflow-hidden shadow-2xl relative z-10" particleCount={20} enableTilt={false}>
        
        {activeTab === 'support' ? (
          <div className="flex-1 flex relative z-10">
            <div className="w-80 border-r border-white/5 flex flex-col bg-black/40">
              <div className="grid grid-cols-2 p-2 border-b border-white/5 gap-2">
                <button 
                  onClick={() => setSupportSubTab('active')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${supportSubTab === 'active' ? `${theme.bgActive} ${theme.text} border ${theme.border}` : 'text-gray-400 hover:text-white'}`}
                >
                  Aktif ({activeRooms.length})
                </button>
                <button 
                  onClick={() => setSupportSubTab('archive')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${supportSubTab === 'archive' ? `${theme.bgActive} ${theme.text} border ${theme.border}` : 'text-gray-400 hover:text-white'}`}
                >
                  Geçmiş ({archivedRooms.length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                {displayedRooms.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-xs font-bold">
                    {supportSubTab === 'active' ? 'Aktif destek talebi yok.' : 'Arşivde geçmiş destek bulunmuyor.'}
                  </div>
                ) : (
                  displayedRooms.map((roomUser) => (
                    <button
                      key={roomUser.id}
                      onClick={() => handleSelectRoom(roomUser)}
                      className={`w-full p-4 flex items-center gap-3 transition-colors text-left cursor-pointer ${selectedRoom?.id === roomUser.id ? `${theme.bgLight} border-l-4` : 'hover:bg-white/[0.05]'}`}
                      style={{ borderLeftColor: selectedRoom?.id === roomUser.id ? theme.hex : 'transparent' }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden border border-white/10 flex-shrink-0 relative">
                        <img src={roomUser.avatar_url || 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Unknown'} alt="Avatar" className="w-full h-full object-cover" />
                        {supportSubTab === 'archive' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Archive className={`w-4 h-4 ${theme.text}`} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{roomUser.full_name || 'İsimsiz'}</p>
                        <p className="text-[10px] text-gray-400 truncate font-semibold">{roomUser.close_reason || roomUser.class_level || 'Öğrenci'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-black/20">
              {selectedRoom ? (
                <>
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                        <img src={selectedRoom.avatar_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          {selectedRoom.full_name}
                          {selectedRoom.status === 'closed' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Kapatıldı</span>
                          )}
                        </h3>
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                          {selectedRoom.status === 'closed' ? `Sonuç: ${selectedRoom.close_reason}` : 'Canlı Destek Oturumu Aktif'}
                        </p>
                      </div>
                    </div>

                    {selectedRoom.status !== 'closed' && (
                      <button 
                        onClick={() => setShowCloseModal(true)}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Talebi Kapat
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {roomMessages.map((msg) => {
                      const isAdminMsg = msg.sender_id === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isAdminMsg ? 'flex-row-reverse' : ''}`}>
                          <div className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed border shadow-md ${isAdminMsg ? `${theme.bgLight} ${theme.border} text-white rounded-tr-none` : 'bg-white/5 border-white/10 text-gray-200 rounded-tl-none'}`}>
                            <p className="text-[10px] font-bold mb-1 opacity-70 uppercase tracking-wider">
                              {isAdminMsg ? 'Yönetici (Sen)' : selectedRoom.full_name}
                            </p>
                            <p className="font-medium">{msg.message}</p>
                            
                            {msg.file_url && (
                              <div className="mt-3 rounded-xl overflow-hidden border border-white/10 max-w-xs bg-black/40">
                                <a href={msg.file_url} target="_blank" rel="noreferrer">
                                  <img src={msg.file_url} alt="Kanıt" className="w-full h-48 object-cover hover:opacity-80 transition-opacity" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {selectedRoom.status === 'closed' ? (
                    <div className="p-4 border-t border-white/5 bg-black/40 text-center text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4 text-red-400" /> Bu destek talebi kapatılmıştır. Yeni mesaj gönderilemez.
                    </div>
                  ) : (
                    <form onSubmit={handleSendReply} className="p-4 border-t border-white/5 flex gap-3 bg-black/40">
                      <input 
                        type="text" 
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Öğrenciye yanıt yaz..."
                        className="flex-1 h-12 bg-black/60 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30 transition-all shadow-inner"
                      />
                      <button type="submit" className={`px-6 h-12 ${theme.bg} text-black font-bold rounded-xl transition-colors flex items-center gap-2 ${theme.glowStrong} opacity-90 hover:opacity-100 cursor-pointer`}>
                        <Send className="w-4 h-4" /> Yanıtla
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm font-bold">
                  Soldaki listeden bir destek talebi seçin.
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'files' ? (
          <div className="flex-1 flex flex-col bg-black/20 overflow-y-auto custom-scrollbar relative z-10">
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileCheck className={`w-6 h-6 ${theme.text}`} /> Dosya Yönetim Merkezi
              </h2>
              <p className="text-xs text-gray-400 font-semibold mt-1">Bekleyen dosyaları onayla, mevcut dosyaları incele ve gerekirse sistemden kaldır.</p>
            </div>
            <div className="p-6 flex-1">
              <DosyaYonetimi theme={theme} />
            </div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="flex-1 flex flex-col bg-black/20 overflow-y-auto custom-scrollbar relative z-10">
            <div className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Gavel className={`w-6 h-6 ${theme.text}`} /> Kullanıcı Disiplin ve Yetki Merkezi
                </h2>
                <p className="text-xs text-gray-400 font-semibold mt-1">Platformdaki tüm kişilere admin yetkisi verebilir veya kuralları bozanları sistemden uzaklaştırabilirsin.</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Kullanıcı Ara..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm font-bold focus:outline-none focus:border-white/30 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                  <div key={user.id} className={`bg-white/[0.03] border ${user.is_banned ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'} rounded-3xl p-5 shadow-lg flex flex-col group transition-all`}>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl overflow-hidden border ${user.is_admin ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-white/10'}`}>
                        <img src={user.avatar_url || 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Unknown'} alt="User" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base truncate flex items-center gap-2">
                          {user.full_name} 
                          {user.is_admin && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" title="Sistem Yöneticisi" />}
                          {user.is_banned && <Lock className="w-3.5 h-3.5 text-red-400" title="Uzaklaştırıldı" />}
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold truncate">{user.class_level || 'Öğrenci'}</p>
                      </div>
                    </div>

                    {user.is_banned && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                        <p className="font-bold text-red-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Uzaklaştırılmış Hesap</p>
                        <p className="text-gray-300 font-medium line-clamp-2">Not: {user.ban_reason}</p>
                        {user.ban_until && <p className="text-gray-400 mt-1 font-bold">Bitiş: {new Date(user.ban_until).toLocaleDateString('tr-TR')}</p>}
                      </div>
                    )}

                    <div className="mt-auto flex gap-2">
                      <button 
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        disabled={isProcessingUser || user.id === currentUser?.id}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${user.is_admin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-black' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
                      >
                        {user.is_admin ? <><UserMinus className="w-4 h-4"/> Yetkiyi Al</> : <><UserCheck className="w-4 h-4"/> Yetki Ver</>}
                      </button>

                      {user.is_banned ? (
                        <button 
                          onClick={() => handleRemoveBan(user.id)}
                          disabled={isProcessingUser}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Banı Kaldır
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowBanModal(user)}
                          disabled={isProcessingUser || user.id === currentUser?.id || user.is_admin}
                          className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Gavel className="w-4 h-4" /> Uzaklaştır
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto flex justify-center items-start pt-16 relative z-10">
            <div className="max-w-xl w-full">
                <div className={`bg-white/[0.02] border ${theme.border} rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bgLight} blur-[50px] rounded-full pointer-events-none`}></div>
                  
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 relative z-10">
                    <MessageSquare className={`w-5 h-5 ${theme.text}`} /> Ortak Sohbet Yönetimi
                  </h2>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6 relative z-10">
                    Lobi sohbetinde uygunsuz içerik biriktiğinde veya dönemi kapatmak istediğinizde tüm geçmişi nükleer olarak temizleyebilirsiniz.
                  </p>

                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 mb-6 relative z-10">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Geri Dönüşü Yoktur</p>
                      <p className="text-[11px] text-gray-300 font-medium mt-1">Bu butona basıldığında sunucudaki tüm mesajlar silinir ve anlık olarak bağlanan tüm kullanıcıların ekranı temizlenir.</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleClearLobby}
                    disabled={clearing}
                    className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 relative z-10"
                  >
                    <Trash2 className="w-5 h-5" /> 
                    {clearing ? 'Sistem Temizleniyor...' : 'Tüm Sohbeti Temizle'}
                  </button>
                </div>
            </div>
          </div>
        )}
      </SpotlightCard>

      {/* TALEBİ SONUÇLANDIR MODALI */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative font-sans">
            <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${theme.text}`}>
              <CheckCircle2 className="w-6 h-6" /> Destek Talebini Sonuçlandır
            </h3>
            <p className="text-sm text-gray-400 font-semibold mb-6">
              Bu talebi kapatmak üzeresin. Öğrenciye gösterilecek ve arşivde saklanacak kapatma sebebini seç veya yaz:
            </p>

            <div className="space-y-3 mb-6">
              {[
                "İşlem Başarıyla Gerçekleştirildi",
                "İşlem Gerçekleştirilemedi / Reddedildi",
                "Destek Gereksiz / Asılsız Bildirim",
                "Sorun Kullanıcı Tarafından Çözüldü"
              ].map((reason, idx) => (
                <button
                  key={idx}
                  onClick={() => setCloseReason(reason)}
                  className={`w-full p-3 rounded-xl border text-left text-sm font-bold transition-all cursor-pointer ${closeReason === reason ? `${theme.border} ${theme.bgLight} ${theme.text}` : 'border-white/10 bg-black/40 text-gray-300 hover:border-white/30'}`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-bold cursor-pointer"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleCloseSupportRoom}
                className={`flex-1 py-3 rounded-xl ${theme.bg} text-black font-bold text-sm ${theme.glowStrong} opacity-90 hover:opacity-100 cursor-pointer transition-opacity`}
              >
                Talebi Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ: KULLANICI UZAKLAŞTIRMA (BAN) MODALI */}
      <AnimatePresence>
        {showBanModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative font-sans">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 mt-[-48px] shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <Gavel className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-center text-xl font-bold text-white mb-2">Sistemden Uzaklaştır</h3>
              <p className="text-center text-xs text-gray-400 font-medium mb-6">
                <span className="text-white font-bold">{showBanModal.full_name}</span> adlı kişiyi platformdan uzaklaştırmak üzeresin. Bu kişinin yetkilerini geri verene kadar sisteme giriş yapamayacaktır.
              </p>

              <form onSubmit={handleBanUser} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ceza Tipi</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setBanType('temporary')} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${banType === 'temporary' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                      Süreli (Geçici)
                    </button>
                    <button type="button" onClick={() => setBanType('permanent')} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${banType === 'permanent' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                      Kalıcı (Sınırsız)
                    </button>
                  </div>
                </div>

                {banType === 'temporary' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Süre (Gün)</label>
                    <input type="number" min="1" max="365" value={banDays} onChange={(e) => setBanDays(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30" />
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Yönetici Notu / Sebep</label>
                  <textarea 
                    rows={3} required value={banReasonInput} onChange={(e) => setBanReasonInput(e.target.value)} 
                    placeholder="Örn: Küfürlü konuşma, spam, kural ihlali..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30 resize-none custom-scrollbar" 
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-semibold">Bu not, kullanıcı sisteme girmeye çalıştığında karşısına çıkacaktır.</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setShowBanModal(null)} className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-colors text-sm cursor-pointer">Vazgeç</button>
                  <button type="submit" disabled={isProcessingUser} className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all cursor-pointer disabled:opacity-50">Onayla ve Uzaklaştır</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}