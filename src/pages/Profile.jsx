import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, GraduationCap, FileText, Plus, X, Edit3, Check, Award, ArrowRight, Trash2, ShieldAlert, UserPlus, UserCheck, Users, Clock, Heart, MessageCircle, Globe, Lock, Send } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';

export default function Profile() {
  const { theme } = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('none');

  const [bio, setBio] = useState('');
  const [academicInfo, setAcademicInfo] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [visibility, setVisibility] = useState('everyone');
  const [uploading, setUploading] = useState(false);

  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('id');
    fetchUserData(userIdParam);
  }, [window.location.search]);

  const fetchUserData = async (targetUserId = null) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (myProfile) {
        setCurrentUserProfile(myProfile);
        if (myProfile.is_admin) setIsAdmin(true);
      }

      const profileIdToFetch = targetUserId || user.id;
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', profileIdToFetch).single();
      
      if (profileData) {
        setProfile(profileData);
        if (profileIdToFetch === user.id) {
          setBio(profileData.bio || '');
          setAcademicInfo(profileData.academic_info || '');
          setViewedUser(null);
        } else {
          setViewedUser(profileData);
        }
      }

      const { data: postsData } = await supabase
        .from('profile_posts')
        .select(`*, post_likes(user_id), post_comments(id, content, created_at, user_id)`)
        .eq('user_id', profileIdToFetch)
        .order('created_at', { ascending: false });
      
      if (postsData) {
        const commenterIds = [...new Set(postsData.flatMap(p => p.post_comments?.map(c => c.user_id) || []))];
        let profilesMap = {};
        if (commenterIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('id, full_name, avatar_url, class_level').in('id', commenterIds);
          if (profilesData) profilesData.forEach(prof => profilesMap[prof.id] = prof);
        }
        postsData.forEach(p => {
          if (p.post_comments) {
            p.post_comments = p.post_comments.map(c => ({ ...c, profiles: profilesMap[c.user_id] || { full_name: 'Mühendis', class_level: 'Öğrenci' } }));
            p.post_comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          }
        });
        setPosts(postsData);
      }
      await fetchConnectionsData(user.id, profileIdToFetch);
    } catch (err) {} finally { setLoading(false); }
  };

  const fetchConnectionsData = async (myId, currentProfileId) => {
    try {
      const { data: connData } = await supabase.from('connections').select('id, sender_id, receiver_id, status').or(`sender_id.eq.${myId},receiver_id.eq.${myId}`).eq('status', 'accepted');
      if (connData) {
        const friendIds = connData.map(c => c.sender_id === myId ? c.receiver_id : c.sender_id);
        if (friendIds.length > 0) {
          const { data: friendsProfiles } = await supabase.from('profiles').select('*').in('id', friendIds);
          setConnections(friendsProfiles || []);
        } else setConnections([]);
      }
      const { data: reqData } = await supabase.from('connections').select('id, sender_id, status').eq('receiver_id', myId).eq('status', 'pending');
      if (reqData && reqData.length > 0) {
        const senderIds = reqData.map(r => r.sender_id);
        const { data: senderProfiles } = await supabase.from('profiles').select('*').in('id', senderIds);
        setPendingRequests(reqData.map(req => ({ requestId: req.id, profile: senderProfiles?.find(s => s.id === req.sender_id) })).filter(item => item.profile));
      } else setPendingRequests([]);
      if (currentProfileId !== myId) {
        const { data: existingConn } = await supabase.from('connections').select('*').or(`and(sender_id.eq.${myId},receiver_id.eq.${currentProfileId}),and(sender_id.eq.${currentProfileId},receiver_id.eq.${myId})`).maybeSingle();
        if (!existingConn) setConnectionStatus('none');
        else if (existingConn.status === 'accepted') setConnectionStatus('connected');
        else if (existingConn.sender_id === myId) setConnectionStatus('pending_sent');
        else setConnectionStatus('pending_received');
      }
    } catch (err) {}
  };

  const handleSendConnectionRequest = async () => {
    if (!viewedUser || !currentUserId) return;
    try {
      await supabase.from('connections').insert([{ sender_id: currentUserId, receiver_id: viewedUser.id, status: 'pending' }]);
      setConnectionStatus('pending_sent');
    } catch (err) {}
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await supabase.from('connections').update({ status: 'accepted' }).eq('id', requestId);
      fetchConnectionsData(currentUserId, profile?.id);
    } catch (err) {}
  };

  const handleSaveBio = async () => {
    try {
      await supabase.from('profiles').update({ bio, academic_info: academicInfo }).eq('id', currentUserId);
      setIsEditing(false);
      window.location.reload(); 
    } catch (error) {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-doc-${Math.random()}.${fileExt}`;
      await supabase.storage.from('support_files').upload(fileName, file);
      const { data } = supabase.storage.from('support_files').getPublicUrl(fileName);
      setNewFileUrl(data.publicUrl);
    } finally { setUploading(false); }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await supabase.from('profile_posts').insert([{ user_id: currentUserId, title: newTitle, content: newContent, file_url: newFileUrl || null, visibility: visibility }]);
      setShowAddModal(false);
      window.location.reload(); 
    } catch (error) {}
  };

  const handleDeletePost = async (postId) => {
    if(!window.confirm("Emin misiniz?")) return;
    try {
      await supabase.from('profile_posts').delete().eq('id', postId);
      window.location.reload(); 
    } catch (error) {}
  };

  const handleToggleLike = async (post) => {
    const isLiked = post.post_likes?.some(l => l.user_id === currentUserId);
    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUserId });
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, post_likes: p.post_likes.filter(l => l.user_id !== currentUserId) } : p));
      } else {
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId, post_owner_id: post.user_id });
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, post_likes: [...(p.post_likes || []), { user_id: currentUserId }] } : p));
      }
    } catch (err) {}
  };

  const handleAddComment = async (e, post) => {
    e.preventDefault();
    const content = commentInputs[post.id];
    if (!content?.trim()) return;
    try {
      const { data, error } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: currentUserId, post_owner_id: post.user_id, content }).select('id, content, created_at, user_id').single();
      if (error) throw error;
      if (data) {
        const newComment = { ...data, profiles: currentUserProfile || { full_name: 'Sen', class_level: 'Öğrenci' } };
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, post_comments: [...(p.post_comments || []), newComment] } : p));
        setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
      }
    } catch (err) {}
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await supabase.from('post_comments').delete().eq('id', commentId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, post_comments: p.post_comments.filter(c => c.id !== commentId) } : p));
    } catch (err) {}
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return Boolean(url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/));
  };

  if (loading || !profile) return <div className={`flex-1 p-10 ${theme.text500} font-sans font-bold`}>Yükleniyor...</div>;

  const isMyProfile = !viewedUser || viewedUser.id === currentUserId;

  const visiblePosts = posts.filter(post => {
    const postVis = post.visibility || 'everyone'; 
    if (postVis === 'everyone') return true;
    if (isMyProfile || isAdmin) return true;
    if (connectionStatus === 'connected') return true;
    return false;
  });

  return (
    <div className="flex-1 p-6 md:p-10 relative overflow-y-auto font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Users className={`w-4 h-4 ${theme.text}`} /> Bağlantı İstekleri
            </h3>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold">Bekleyen bağlantı isteğiniz yok.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.requestId} className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2.5">
                    <div onClick={() => window.location.href = `/profile?id=${req.profile.id}`} className="flex items-center gap-3 cursor-pointer group">
                      <img src={req.profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold text-white group-hover:${theme.text} truncate`}>{req.profile.full_name || 'Mühendis'}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{req.profile.class_level}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptRequest(req.requestId)} className={`flex-1 py-1.5 rounded-xl ${theme.bg} text-black text-[11px] font-bold transition-opacity cursor-pointer opacity-90 hover:opacity-100`}>Kabul Et</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
            <div className={`absolute top-0 right-0 w-64 h-64 ${theme.bgLight} blur-[80px] rounded-full pointer-events-none`}></div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
              <div className={`w-28 h-28 rounded-3xl border-2 ${theme.border} bg-white/5 overflow-hidden shadow-xl flex-shrink-0 relative`}>
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full ${theme.bg} border-2 border-black`}></div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3.5 mb-2.5">
                  <h1 className="text-3xl font-bold text-white tracking-tight">{profile.full_name || 'İsimsiz Mühendis'}</h1>
                  {profile.is_admin && (
                    <span className="px-3.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <ShieldAlert className="w-3.5 h-3.5" /> ADMİN
                    </span>
                  )}
                  <span className={`px-3.5 py-1 rounded-full ${theme.bgLight} border ${theme.border} ${theme.text} text-xs font-bold`}>Seviye {profile.level || 1}</span>
                  <span className={`px-3.5 py-1 rounded-full ${theme.bgLight} border ${theme.border} ${theme.text} text-xs font-bold`}>Puan: {profile.score || 0}</span>
                </div>

                <p className="text-gray-200 font-medium text-sm leading-relaxed mb-4">{profile.bio || 'Henüz bir biyografi eklenmemiş.'}</p>

                <div className="flex flex-wrap items-center gap-6 text-xs text-gray-300 font-semibold">
                  <span className="flex items-center gap-2"><GraduationCap className={`w-4 h-4 ${theme.text}`} /> Uludağ Üniversitesi</span>
                  <span className="flex items-center gap-2"><Briefcase className={`w-4 h-4 ${theme.text}`} /> {profile.academic_info || 'Staj Belirtilmedi'}</span>
                </div>
              </div>

              {isMyProfile ? (
                <button onClick={() => setIsEditing(!isEditing)} className={`px-5 py-3 rounded-2xl bg-white/5 hover:${theme.bg} hover:text-black border border-white/10 ${theme.borderHover} text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer`}>
                  <Edit3 className="w-4 h-4" /> {isEditing ? 'İptal' : 'Düzenle'}
                </button>
              ) : (
                <div>
                  {connectionStatus === 'none' && (
                    <button onClick={handleSendConnectionRequest} className={`px-5 py-3 rounded-2xl ${theme.bg} text-black text-xs font-bold flex items-center gap-2 ${theme.glow} cursor-pointer opacity-90 hover:opacity-100 transition-opacity`}><UserPlus className="w-4 h-4" /> Bağlantı Ekle</button>
                  )}
                  {connectionStatus === 'pending_sent' && <button disabled className="px-5 py-3 rounded-2xl bg-white/10 text-gray-400 text-xs font-bold flex items-center gap-2 cursor-not-allowed"><Clock className="w-4 h-4" /> İstek Gönderildi</button>}
                  {connectionStatus === 'connected' && <button disabled className={`px-5 py-3 rounded-2xl ${theme.bgLight} border ${theme.border} ${theme.text} text-xs font-bold flex items-center gap-2`}><UserCheck className="w-4 h-4" /> Bağlantıdasınız</button>}
                </div>
              )}
            </div>

            <AnimatePresence>
              {isEditing && isMyProfile && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-6 border-t border-white/10 space-y-4">
                  <h3 className={`text-xs font-bold ${theme.text} uppercase tracking-wider`}>Profili Kişiselleştir</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-300 font-bold mb-1.5">Kısa Biyografi (Hakkımda)</label>
                      <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Örn: Mekatronik..." className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 font-bold mb-1.5">Okuduğu Yıllar & Stajlar</label>
                      <input type="text" value={academicInfo} onChange={(e) => setAcademicInfo(e.target.value)} placeholder="Örn: 2023 | Tusaş" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSaveBio} className={`px-6 py-3 rounded-xl ${theme.bg} text-black text-xs font-bold flex items-center gap-2 ${theme.glowStrong} cursor-pointer opacity-90 hover:opacity-100 transition-opacity`}><Check className="w-4 h-4" /> Kaydet</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className={`w-5 h-5 ${theme.text}`} /> Portföy ve Paylaşım Akışı
            </h2>
            <span className="text-xs text-gray-300 font-bold">Görülebilir {visiblePosts.length} paylaşım</span>
          </div>

          <div className="space-y-6 pb-20">
            {posts.length > 0 && visiblePosts.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-center text-gray-400">
                <Lock className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-60" />
                <p className="text-sm font-bold text-gray-200">Kullanıcının paylaşımları sadece bağlantılarına açıktır.</p>
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-60" />
                <p className="text-sm font-bold text-gray-200">Bu profilde henüz bir paylaşım yok.</p>
              </div>
            ) : (
              visiblePosts.map((post) => {
                const isOwner = post.user_id === currentUserId;
                const canDelete = isOwner || isAdmin;
                const hasLiked = post.post_likes?.some(l => l.user_id === currentUserId);
                const isCommentsOpen = expandedComments[post.id];

                return (
                  <div key={post.id} className={`bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl transition-all ${theme.borderHover} relative group`}>
                    {canDelete && (
                      <button onClick={() => handleDeletePost(post.id)} className="absolute top-6 right-6 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold" title="Sil">
                        <Trash2 className="w-4 h-4" /> Sil
                      </button>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{profile.full_name || 'Mühendis'}</h4>
                          <span className="text-gray-500" title={post.visibility === 'everyone' ? 'Herkes Görebilir' : 'Sadece Bağlantılar'}>
                            {(!post.visibility || post.visibility === 'everyone') ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-semibold">{new Date(post.created_at).toLocaleDateString('tr-TR')} • {profile.class_level || 'Öğrenci'}</p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 pr-16">{post.title}</h3>
                    <p className="text-sm text-gray-200 font-medium leading-relaxed mb-4">{post.content || 'Açıklama belirtilmemiş.'}</p>

                    {post.file_url && (
                      <div className="mt-4 mb-4">
                        {isImageFile(post.file_url) ? (
                          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-h-[450px] flex items-center justify-center">
                            <img src={post.file_url} alt="Paylaşım Görseli" className="w-full object-cover max-h-[450px]" />
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                            <span className={`text-xs ${theme.text} font-bold flex items-center gap-2`}><FileText className="w-4 h-4" /> Ekli Doküman</span>
                            <a href={post.file_url} target="_blank" rel="noreferrer" className={`px-4 py-2 rounded-xl ${theme.bgLight} border ${theme.border} ${theme.text} hover:${theme.bg} hover:text-black text-xs font-bold transition-all flex items-center gap-1.5`}>Görüntüle <ArrowRight className="w-3.5 h-3.5" /></a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                      <button 
                        onClick={() => handleToggleLike(post)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${hasLiked ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'}`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-400' : ''}`} /> {post.post_likes?.length || 0}
                      </button>
                      <button 
                        onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" /> {post.post_comments?.length || 0} Yorum
                      </button>
                    </div>

                    {isCommentsOpen && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                        
                        <div className="space-y-3">
                          {post.post_comments?.map(comment => (
                            <div key={comment.id} className="flex gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 group/comment relative">
                              <img src={comment.profiles?.avatar_url} alt="Av" className="w-8 h-8 rounded-xl object-cover border border-white/10" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-white">{comment.profiles?.full_name}</span>
                                  <span className="text-[10px] text-gray-500">{new Date(comment.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-xs text-gray-300 font-medium">{comment.content}</p>
                              </div>
                              {comment.user_id === currentUserId && (
                                <button onClick={() => handleDeleteComment(post.id, comment.id)} className="absolute top-3 right-3 opacity-0 group-hover/comment:opacity-100 text-red-400 hover:text-red-500 transition-opacity cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <form onSubmit={(e) => handleAddComment(e, post)} className="flex gap-2">
                          <input 
                            type="text" 
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({...prev, [post.id]: e.target.value}))}
                            placeholder="Bir yorum ekle... (Puan kazandırır)"
                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-white/30"
                          />
                          <button type="submit" disabled={!commentInputs[post.id]?.trim()} className={`px-4 rounded-xl ${theme.bg} text-black transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center opacity-90 hover:opacity-100`}>
                            <Send className="w-4 h-4 ml-0.5" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Users className={`w-4 h-4 ${theme.text}`} /> Bağlantılar ({connections.length})</h3>
            {connections.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold">Bağlantınız bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {connections.map((friend) => (
                  <div key={friend.id} onClick={() => window.location.href = `/profile?id=${friend.id}`} className={`p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3 ${theme.borderHover} transition-all cursor-pointer group`}>
                    <img src={friend.avatar_url} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold text-white group-hover:${theme.text} truncate`}>{friend.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{friend.class_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {isMyProfile && (
        <div className="fixed bottom-6 left-28 z-50">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddModal(true)}
            className={`w-14 h-14 rounded-2xl ${theme.bg} text-black flex items-center justify-center ${theme.glowStrong} cursor-pointer opacity-90 hover:opacity-100 transition-opacity`}
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#121212] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative font-sans">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Profiline İçerik Ekle</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1.5">Görünürlük (Gizlilik)</label>
                  <select 
                    value={visibility} 
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30 cursor-pointer appearance-none"
                  >
                    <option value="everyone">🌐 Herkes Görebilir</option>
                    <option value="connections">🔒 Sadece Bağlantılarım Görebilir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1.5">Başlık</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30" />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1.5">Açıklama</label>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30 resize-none" />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1.5">Dosya / Görsel</label>
                  <input type="file" onChange={handleFileUpload} className={`text-xs text-gray-300 font-bold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 ${theme.bgLight} ${theme.text} cursor-pointer`} />
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-bold hover:bg-white/10 cursor-pointer">İptal</button>
                  <button type="submit" disabled={uploading} className={`px-6 py-2.5 rounded-xl ${theme.bg} text-black text-xs font-bold cursor-pointer opacity-90 hover:opacity-100 transition-opacity`}>
                    {uploading ? 'Yükleniyor...' : 'Paylaş'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}