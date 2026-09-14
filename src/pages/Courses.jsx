import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, X, FileText, Heart, Search, Check, FileCheck, ExternalLink, Maximize2 } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';

export default function Courses() {
  const { theme } = useContext(ThemeContext);
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modallar
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Yükleme State'leri
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      fetchMaterials(user?.id);
    };
    init();
  }, []);

  const fetchMaterials = async (userId) => {
    try {
      // Sadece 'approved' (onaylanmış) dosyaları getir
      const { data, error } = await supabase
        .from('course_materials')
        .select(`*, profiles(full_name, avatar_url, class_level), course_likes(user_id)`)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMaterials(data);
    } catch (error) {
      console.error("Dersler çekilemedi:", error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFile || !currentUser) return;
    
    setIsUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `note-${Date.now()}.${fileExt}`;
      
      // Supabase Storage'a Yükle (Bucket adın: course_files)
      const { error: uploadError } = await supabase.storage.from('course_files').upload(fileName, uploadFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('course_files').getPublicUrl(fileName);

      // Veritabanına 'pending' (beklemede) olarak kaydet
      const { error: dbError } = await supabase.from('course_materials').insert([{
        user_id: currentUser.id,
        title: uploadTitle,
        file_url: urlData.publicUrl,
        status: 'pending' // Admin onayı bekleyecek
      }]);

      if (dbError) throw dbError;

      alert("Dosya başarıyla yüklendi! Admin onayından sonra listede görünecektir.");
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadFile(null);
    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleLike = async (materialId, currentLikes) => {
    if (!currentUser) return;
    
    const hasLiked = currentLikes?.some(l => l.user_id === currentUser.id);
    
    try {
      if (hasLiked) {
        await supabase.from('course_likes').delete().match({ material_id: materialId, user_id: currentUser.id });
      } else {
        await supabase.from('course_likes').insert({ material_id: materialId, user_id: currentUser.id });
      }
      fetchMaterials(currentUser.id); // Listeyi güncelle
    } catch (error) {
      console.error("Beğeni hatası:", error);
    }
  };

  const openPreview = (material) => {
    setSelectedMaterial(material);
    setShowPreviewModal(true);
  };

  const filteredMaterials = materials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const isImageFile = (url) => {
    if (!url) return false;
    return Boolean(url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/));
  };

  return (
    <main className="flex-1 p-6 md:p-10 relative overflow-y-auto font-sans">
      
      {/* EVRENSEL UZAY/YILDIZ ARKA PLANI */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <Particles
          particleColors={['#ffffff', theme.hex]} // Yıldızlar beyaz ve tema renginde
          particleCount={250}
          particleSpread={10}
          speed={0.1}
          moveParticlesOnHover={true}
          particleHoverFactor={1.5}
          alphaParticles={true}
          particleBaseSize={100}
        />
      </div>

      <header className="mb-10 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BookOpen className={`w-8 h-8 ${theme.text}`} /> Ders <span className={theme.text}>Arşivi</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium text-sm">Vize, final notları ve onaylanmış çalışma materyalleri.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Dosya Ara..."
              className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm font-bold focus:outline-none focus:border-white/30 transition-all shadow-inner backdrop-blur-md"
            />
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className={`px-5 py-2.5 rounded-xl ${theme.bg} text-black font-bold text-sm transition-all flex items-center gap-2 ${theme.glowStrong} cursor-pointer whitespace-nowrap opacity-90 hover:opacity-100`}
          >
            <Upload className="w-4 h-4 stroke-[3]" /> Not Yükle
          </button>
        </div>
      </header>

      {/* DOSYA LİSTESİ */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length === 0 ? (
           <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-md">
             <FileText className="w-12 h-12 mb-4 opacity-50" />
             <p className="font-bold">Henüz onaylanmış bir ders materyali bulunmuyor veya aramanızla eşleşmedi.</p>
           </div>
        ) : (
          filteredMaterials.map((mat) => {
            const hasLiked = mat.course_likes?.some(l => l.user_id === currentUser?.id);
            const isImage = isImageFile(mat.file_url);

            return (
              <SpotlightCard 
                key={mat.id} 
                className="p-5 flex flex-col group transition-all shadow-xl"
                particleCount={10}
                enableTilt={true}
                clickEffect={true}
              >
                {/* SpotlightCard içindeki z-index içeriğin üstte kalmasını sağlar */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                      <img src={mat.profiles?.avatar_url || 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Unknown'} alt="Uploader" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{mat.profiles?.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{mat.profiles?.class_level}</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => openPreview(mat)}
                    className={`flex-1 flex flex-col items-center justify-center py-8 rounded-2xl bg-black/40 border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors relative group/preview`}
                  >
                    <Maximize2 className={`absolute top-3 right-3 w-4 h-4 text-gray-500 group-hover/preview:${theme.text} transition-colors`} />
                    {isImage ? <FileCheck className={`w-12 h-12 mb-3 ${theme.text} opacity-80`} /> : <FileText className={`w-12 h-12 mb-3 ${theme.text} opacity-80`} />}
                    <h3 className="text-center font-bold text-gray-200 px-4 group-hover/preview:text-white transition-colors">{mat.title}</h3>
                    <p className="text-[10px] mt-2 text-gray-500 font-bold uppercase tracking-wider">Tıkla ve Ön İzle</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Butona tıklanınca kartın eğilme veya önizleme fonksiyonunun karışmasını önler
                        handleToggleLike(mat.id, mat.course_likes);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative z-20 ${hasLiked ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-red-400' : ''}`} /> {mat.course_likes?.length || 0}
                    </button>
                    <span className="text-[10px] text-gray-500 font-bold">{new Date(mat.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </SpotlightCard>
            );
          })
        )}
      </div>

      {/* YÜKLEME MODALI */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Upload className={`w-5 h-5 ${theme.text}`} /> Dosya Yükle</h3>
                <button onClick={() => setShowUploadModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1.5">Dosya Başlığı (Örn: Mat2 Vize Özeti)</label>
                  <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1.5">Materyal (PDF veya Görsel)</label>
                  <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} required accept=".pdf,image/*" className={`w-full text-xs text-gray-300 font-bold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 ${theme.bgLight} ${theme.text} cursor-pointer bg-black/50 border border-white/10 rounded-xl p-2`} />
                </div>
                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 text-sm font-bold hover:bg-white/10">Vazgeç</button>
                  <button type="submit" disabled={isUploading} className={`flex-1 py-3 rounded-xl ${theme.bg} text-black font-bold text-sm ${theme.glowStrong} opacity-90 hover:opacity-100 disabled:opacity-50 flex items-center justify-center gap-2`}>
                    {isUploading ? 'Yükleniyor...' : <><Check className="w-4 h-4" /> Onaya Gönder</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SİTE İÇİ ÖN İZLEME MODALI */}
      <AnimatePresence>
        {showPreviewModal && selectedMaterial && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col p-4 md:p-10">
            <div className="flex items-center justify-between mb-4 bg-[#121212] p-4 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white truncate max-w-[70%]">{selectedMaterial.title}</h3>
              <div className="flex items-center gap-3">
                <a href={selectedMaterial.file_url} target="_blank" rel="noreferrer" className={`px-4 py-2 rounded-xl ${theme.bgLight} ${theme.text} text-xs font-bold flex items-center gap-2 hover:${theme.bg} hover:text-black transition-colors`}>
                  <ExternalLink className="w-4 h-4" /> Yeni Sekmede Aç
                </a>
                <button onClick={() => setShowPreviewModal(false)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden relative flex items-center justify-center">
              {isImageFile(selectedMaterial.file_url) ? (
                <img src={selectedMaterial.file_url} alt="Ön İzleme" className="max-w-full max-h-full object-contain p-4" />
              ) : (
                <iframe src={selectedMaterial.file_url} className="w-full h-full border-none bg-white rounded-3xl" title="PDF Preview"></iframe>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}