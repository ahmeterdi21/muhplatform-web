import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Upload, Camera, Save, GraduationCap, ShieldCheck, Headset, Paperclip, Send, CheckCircle2, Lock as LockIcon, Palette } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App'; 
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';

const AVATAR_LIBRARY = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Engineer&baseColor=10b981",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Tactical&baseColor=10b981",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Chess&baseColor=10b981",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Lion&baseColor=10b981",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nova&baseColor=06b6d4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pulse&baseColor=06b6d4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&baseColor=8b5cf6",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&baseColor=8b5cf6",
];

const CLASS_LEVELS = ["Hazırlık", "1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "Yüksek Lisans"];

export default function Settings() {
  const { currentTheme, setCurrentTheme, theme, themeConfig } = useContext(ThemeContext);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('profile');

  const fileInputRef = useRef(null);
  const supportFileRef = useRef(null);
  const chatEndRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [classLevel, setClassLevel] = useState('3. Sınıf');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_LIBRARY[0]);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [supportMessage, setSupportMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [roomStatus, setRoomStatus] = useState('open');
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.class_level) setClassLevel(profile.class_level);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }

        const { data: roomData } = await supabase.from('support_rooms').select('*').eq('user_id', user.id).single();
        if (roomData) {
          setRoomStatus(roomData.status || 'open');
          setCloseReason(roomData.close_reason || '');
        }

        const { data: chatHistory } = await supabase
          .from('support_messages')
          .select('*')
          .eq('room_owner_id', user.id)
          .order('created_at', { ascending: true });
          
        if (chatHistory) setMessages(chatHistory);
      }
    };
    loadData();

    const sub = supabase
      .channel('user_room_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_rooms' }, (payload) => {
        if (payload.new && payload.new.user_id === currentUser?.id) {
          setRoomStatus(payload.new.status);
          setCloseReason(payload.new.close_reason);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [currentUser?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert("Fotoğraf yüklenirken hata: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName, class_level: classLevel, avatar_url: avatarUrl,
      }).eq('id', currentUser.id);
      if (error) throw error;
      alert("Profil bilgileri başarıyla güncellendi!");
    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) return alert("Şifre alanlarını doldurun.");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: currentPassword });
      if (signInError) throw new Error("Mevcut şifrenizi yanlış girdiniz.");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      alert("Şifreniz başarıyla değiştirildi!");
      setCurrentPassword(''); setNewPassword('');
    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewTicket = async () => {
    if (!currentUser) return;
    try {
      const { data: existing } = await supabase
        .from('support_rooms')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('support_rooms')
          .update({ status: 'open', close_reason: null })
          .eq('user_id', currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('support_rooms')
          .insert([{ id: crypto.randomUUID(), user_id: currentUser.id, status: 'open', close_reason: null }]);
        if (error) throw error;
      }

      setRoomStatus('open');
      setCloseReason('');
    } catch (error) {
      alert("Yeni talep açılırken hata: " + error.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!supportMessage.trim() || !currentUser || roomStatus === 'closed') return;
    
    setSendingMessage(true);
    try {
      const newMessage = {
        id: crypto.randomUUID(),
        sender_id: currentUser.id,
        room_owner_id: currentUser.id,
        message: supportMessage,
        file_url: null
      };

      setMessages((prev) => [...prev, newMessage]);
      setSupportMessage('');

      const { error } = await supabase.from('support_messages').insert([newMessage]);
      if (error) throw error;
    } catch (error) {
      alert("Mesaj gönderilemedi: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSupportFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser || roomStatus === 'closed') return;

    setSendingMessage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-proof-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('support_files').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('support_files').getPublicUrl(fileName);
      
      const newMessage = {
        id: crypto.randomUUID(),
        sender_id: currentUser.id,
        room_owner_id: currentUser.id,
        message: "Kanıt dosyası / Görsel eklendi.",
        file_url: data.publicUrl
      };

      setMessages((prev) => [...prev, newMessage]);
      const { error: dbError } = await supabase.from('support_messages').insert([newMessage]);
      if (dbError) throw dbError;
    } catch (error) {
      alert("Dosya yüklenirken hata: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex-1 p-10 relative overflow-y-auto font-sans">
      
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

      <header className="mb-10 relative z-10">
        <h1 className="text-4xl font-light tracking-tight text-white">
          Sistem <span className={`font-bold ${theme.text}`}>Ayarları</span>
        </h1>
        <p className="text-gray-400 mt-2">Profilini kişiselleştir, sınıf seviyeni belirle veya admin ekibiyle iletişime geç.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 relative z-10 max-w-6xl">
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${activeTab === 'profile' ? `${theme.bgLight} ${theme.text} border ${theme.border}` : 'text-gray-400 hover:bg-white/[0.05]'}`}>
            <User className="w-5 h-5" /> Profil Bilgileri
          </button>
          
          <button onClick={() => setActiveTab('theme')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${activeTab === 'theme' ? `${theme.bgLight} ${theme.text} border ${theme.border}` : 'text-gray-400 hover:bg-white/[0.05]'}`}>
            <Palette className="w-5 h-5" /> Tema ve Görünüm
          </button>

          <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${activeTab === 'security' ? `${theme.bgLight} ${theme.text} border ${theme.border}` : 'text-gray-400 hover:bg-white/[0.05]'}`}>
            <ShieldCheck className="w-5 h-5" /> Güvenlik
          </button>
          
          <div className="h-px bg-white/10 my-2"></div>
          
          <button onClick={() => setActiveTab('support')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${activeTab === 'support' ? `${theme.bgLight} ${theme.text} border ${theme.border}` : 'text-gray-400 hover:bg-white/[0.05]'}`}>
            <Headset className="w-5 h-5" /> Destek Talebi
          </button>
        </div>

        {/* ANA PANEL SPOTLIGHT KARTINA ÇEVRİLDİ */}
        <SpotlightCard 
          className="flex-1 p-8 shadow-2xl relative z-10" 
          particleCount={15} 
          enableTilt={false}
        >
          {activeTab === 'theme' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative z-10">
              <div className="flex flex-col gap-2 mb-6">
                <h3 className={`text-xl font-semibold flex items-center gap-2 text-white`}><Palette className={`w-5 h-5 ${theme.text}`} /> Tema ve Vurgu Rengi</h3>
                <p className="text-sm text-gray-400">Platformu kendi tarzına göre renklendir! Seçtiğin tema platformdan çıkış yapana veya sayfayı yenileyene kadar aktif kalacaktır.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Object.values(themeConfig).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCurrentTheme(t.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group ${
                      currentTheme === t.id
                        ? `${t.bgLight} ${t.border} shadow-lg scale-[1.02]`
                        : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className={`w-10 h-10 rounded-full shadow-lg border-2 border-white/10 flex items-center justify-center`} 
                        style={{ backgroundColor: t.hex }}
                      >
                        {currentTheme === t.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                      <span className={`text-sm font-bold ${currentTheme === t.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                        {t.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 relative z-10">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white"><Camera className={`w-5 h-5 ${theme.text}`} /> Dijital Avatar / Fotoğraf</h3>
                <div className="flex gap-8 items-start">
                  <div className={`w-32 h-32 rounded-3xl border-2 ${theme.border} bg-white/[0.05] p-2 overflow-hidden flex-shrink-0 relative group`}>
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-xs text-white gap-1 cursor-pointer">
                      <Upload className="w-4 h-4" /> {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-3">Veya kütüphaneden siber-avatarını seç:</p>
                    <div className="grid grid-cols-4 gap-3">
                      {AVATAR_LIBRARY.map((url, idx) => (
                        <button key={idx} onClick={() => setAvatarUrl(url)} className={`p-2 rounded-2xl border ${avatarUrl === url ? `${theme.border} ${theme.bgLight}` : 'border-white/10 hover:bg-white/[0.05]'} transition-all cursor-pointer`}>
                          <img src={url} alt={`Avatar ${idx}`} className="w-12 h-12 mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 my-6"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ad Soyad</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Sınıf Seviyesi</label>
                  <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white/30 transition-all appearance-none cursor-pointer">
                    {CLASS_LEVELS.map(level => <option key={level} value={level} className="bg-[#0a0a0a]">{level}</option>)}
                  </select>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveProfile} disabled={loading} className={`mt-8 relative overflow-hidden ${theme.bg} text-black font-bold py-3 px-8 rounded-xl transition-all ${theme.glow} flex items-center justify-center gap-2 group cursor-pointer opacity-90 hover:opacity-100`}>
                <span className="relative z-10 flex items-center gap-2"><Save className="w-4 h-4" /> Kaydet</span>
              </motion.button>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative z-10">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white"><Lock className={`w-5 h-5 ${theme.text}`} /> Şifre Değiştirme</h3>
              <p className="text-sm text-gray-400 mb-6">Şifrenizi değiştirmek için lütfen önce mevcut şifrenizi doğrulayın.</p>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Mevcut Şifre</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Yeni Şifre</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white/30 transition-all" />
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUpdatePassword} disabled={loading} className={`mt-6 relative overflow-hidden ${theme.bg} text-black font-bold py-3 px-8 rounded-xl transition-all ${theme.glow} flex items-center justify-center gap-2 group w-fit cursor-pointer opacity-90 hover:opacity-100`}>
                <span className="relative z-10 flex items-center gap-2"><Lock className="w-4 h-4" /> Şifreyi Güncelle</span>
              </motion.button>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[500px] relative z-10">
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-white"><Headset className={`w-5 h-5 ${theme.text}`} /> Canlı Destek & Bildirim</h3>
                  <p className="text-sm text-gray-400 mt-1">Kural ihlallerini kanıtlarla bildirebilir veya sistem hakkında yardım isteyebilirsin.</p>
                </div>
                
                {roomStatus === 'closed' ? (
                  <div className="px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Talep Sonuçlandırıldı
                  </div>
                ) : (
                  <div className={`px-3.5 py-1.5 rounded-full ${theme.bgLight} ${theme.border} ${theme.text} text-xs font-mono`}>
                    Bağlantı Şifreli
                  </div>
                )}
              </div>

              {roomStatus === 'closed' && (
                <div className={`mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-${theme.id}-500/10 border ${theme.border} flex items-center justify-between gap-4`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${theme.text} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className={`text-sm font-semibold ${theme.text}`}>Talebiniz Başarıyla Karşılandı ve Kapatıldı</p>
                      <p className="text-xs text-gray-300 mt-0.5">Yönetici Açıklaması: <span className="text-white font-medium">{closeReason}</span></p>
                    </div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleOpenNewTicket}
                    className={`px-4 py-2.5 ${theme.bg} text-black font-bold text-xs rounded-xl transition-all ${theme.glowStrong} flex-shrink-0 whitespace-nowrap cursor-pointer opacity-90 hover:opacity-100`}
                  >
                    Yeni Destek Talebi Aç
                  </motion.button>
                </div>
              )}

              <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 overflow-y-auto mb-4 flex flex-col gap-4">
                
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${theme.id}-500 to-gray-600 flex items-center justify-center flex-shrink-0 ${theme.glow}`}>
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                    <p className={`text-sm ${theme.text} font-medium mb-1`}>Sistem Yöneticisi</p>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      Merhaba! Talebini, şikayetini veya kanıt görsellerini buradan iletebilirsin. Tüm yetkili adminler bu odaya erişebilir ve sana en kısa sürede dönüş yapacaktır.
                    </p>
                  </div>
                </div>

                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img src={isMe ? avatarUrl : AVATAR_LIBRARY[6]} alt="User" className="w-full h-full object-cover" />
                      </div>
                      <div className={`border border-white/10 rounded-2xl p-4 max-w-[80%] ${isMe ? `${theme.bgLight} ${theme.border} rounded-tr-none` : 'bg-white/[0.03] rounded-tl-none'}`}>
                        <p className="text-sm text-gray-400 font-medium mb-1">
                          {isMe ? 'Sen' : 'Sistem Yöneticisi'}
                        </p>
                        <p className="text-gray-200 leading-relaxed text-sm">{msg.message}</p>
                        
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

              {roomStatus === 'closed' ? (
                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <LockIcon className="w-4 h-4 text-red-400" /> Bu destek talebi sonuçlandırılmıştır. Yeni bir talep açmak için yukarıdaki butonu kullanabilirsiniz.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input type="file" ref={supportFileRef} hidden accept="image/*" onChange={handleSupportFileUpload} />
                  
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => supportFileRef.current.click()}
                    disabled={sendingMessage}
                    className={`w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-400 hover:${theme.text} ${theme.borderHover} hover:${theme.bgLight} transition-colors flex-shrink-0 group cursor-pointer`}
                    title="Kanıt / Dosya Yükle"
                  >
                    <Paperclip className="w-5 h-5" />
                  </motion.button>

                  <div className="flex-1 relative group">
                    <input 
                      type="text" 
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      disabled={sendingMessage}
                      placeholder="Talebini buraya yaz..." 
                      className={`w-full h-14 bg-black/50 border border-white/10 rounded-2xl pl-5 pr-16 text-white focus:outline-none focus:border-white/30 transition-all`}
                    />
                    <button type="submit" disabled={sendingMessage || !supportMessage.trim()} className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl ${theme.bg} text-black flex items-center justify-center ${theme.glowStrong} disabled:opacity-50 cursor-pointer opacity-90 hover:opacity-100 transition-opacity`}>
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}