import { useState, useEffect, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Sparkles, CheckCircle2, Clock, BookOpen, GraduationCap, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';
import { EventManager } from '../components/ui/event-manager';
import { ACADEMIC_CALENDAR_EVENTS } from '../data/academicCalendar';

export default function Events() {
  const { theme } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [showAcademic, setShowAcademic] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load user session & user-specific events
  useEffect(() => {
    const loadUserAndEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const storageKey = `muhplatform_events_${user.id}`;
      let loadedEvents = [];

      // 1. Try loading from Supabase
      try {
        const { data, error } = await supabase
          .from('user_events')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data && data.length > 0) {
          loadedEvents = data.map(item => ({
            ...item,
            startTime: new Date(item.start_time || item.startTime),
            endTime: new Date(item.end_time || item.endTime),
          }));
        }
      } catch (err) {
        console.warn("Supabase user_events table check fallback to localStorage", err);
      }

      // 2. Fallback to localStorage if no DB events found
      if (loadedEvents.length === 0) {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
          try {
            const parsed = JSON.parse(saved);
            loadedEvents = parsed.map(item => ({
              ...item,
              startTime: new Date(item.startTime),
              endTime: new Date(item.endTime),
            }));
          } catch (e) {
            console.error("Failed to parse local events", e);
          }
        }
      }

      // Filter out any legacy demo events (evt-1, evt-2, evt-3)
      const cleanEvents = loadedEvents.filter(e => e.id !== "evt-1" && e.id !== "evt-2" && e.id !== "evt-3");
      if (cleanEvents.length !== loadedEvents.length) {
        localStorage.setItem(storageKey, JSON.stringify(cleanEvents));
      }

      setPersonalEvents(cleanEvents);
      setLoading(false);
    };

    loadUserAndEvents();
  }, []);

  const saveEventsLocallyAndDb = async (updatedEvents, user) => {
    if (!user) return;
    const storageKey = `muhplatform_events_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedEvents));

    try {
      const dbPayload = updatedEvents.map(evt => ({
        id: evt.id,
        user_id: user.id,
        title: evt.title,
        description: evt.description || '',
        start_time: evt.startTime.toISOString(),
        end_time: evt.endTime.toISOString(),
        color: evt.color,
        category: evt.category || '',
        tags: evt.tags || []
      }));
      await supabase.from('user_events').upsert(dbPayload);
    } catch (e) {}
  };

  const handleEventCreate = (newEvent) => {
    if (!currentUser) return;
    const updated = [...personalEvents, newEvent];
    setPersonalEvents(updated);
    saveEventsLocallyAndDb(updated, currentUser);
  };

  const handleEventUpdate = (id, updatedFields) => {
    if (!currentUser) return;
    // Don't allow editing official academic events
    if (id.startsWith('acad-')) return;

    const updated = personalEvents.map(e => e.id === id ? { ...e, ...updatedFields } : e);
    setPersonalEvents(updated);
    saveEventsLocallyAndDb(updated, currentUser);
  };

  const handleEventDelete = (id) => {
    if (!currentUser) return;
    if (id.startsWith('acad-')) return;

    const updated = personalEvents.filter(e => e.id !== id);
    setPersonalEvents(updated);
    saveEventsLocallyAndDb(updated, currentUser);

    try {
      supabase.from('user_events').delete().eq('id', id).eq('user_id', currentUser.id);
    } catch (e) {}
  };

  // Combine academic events with student's personal events
  const combinedEvents = useMemo(() => {
    if (showAcademic) {
      return [...ACADEMIC_CALENDAR_EVENTS, ...personalEvents];
    }
    return personalEvents;
  }, [showAcademic, personalEvents]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 relative overflow-hidden font-sans">
      <Particles particleCount={40} className="opacity-20" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <SpotlightCard className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${theme.bgLight} border ${theme.border} flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]`}>
                <CalendarIcon className={`w-7 h-7 ${theme.text}`} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  Kişisel Etkinlik & Akademik Takvim
                  <span className={`text-xs px-3 py-1 rounded-full ${theme.bgLight} ${theme.text} font-bold border ${theme.border}`}>
                    Uludağ Üni. Entegre
                  </span>
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Bursa Uludağ Üniversitesi 2026-2027 Lisans Akademik Takvimi kişisel takviminize renk vurgularıyla entegre edilmiştir.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Toggle Academic Calendar */}
              <button
                onClick={() => setShowAcademic(!showAcademic)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer font-bold text-xs ${
                  showAcademic
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Akademik Takvim: {showAcademic ? 'Açık' : 'Kapalı'}</span>
                {showAcademic ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
              </button>

              <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Entegre
                </div>
                <span className="text-gray-600">|</span>
                <div className="text-gray-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> Toplam {combinedEvents.length} Etkinlik
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Legend Banner */}
        <div className="flex flex-wrap items-center gap-3 bg-black/40 p-3 px-5 rounded-2xl border border-white/10 text-xs text-gray-300">
          <span className="font-bold text-white flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-400" /> Renk Kodları:
          </span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Ders Kayıt & Harç</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ders Dönemleri</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Sınavlar & Bütünleme</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Dini Bayramlar</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Resmi Tatiller</span>
        </div>

        {/* Event Manager Component */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Akademik takvim yükleniyor...
          </div>
        ) : (
          <EventManager
            events={combinedEvents}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            categories={[
              "Ders / Sınav", "Proje Teslimi", "Toplantı", "Kişisel Not", "Laboratuvar",
              "Ders Kayıt", "Sınav Dönemi", "Akademik Dönem", "Resmi Tatil", "Dini Bayram"
            ]}
            availableTags={[
              "Akademik Takvim", "Önemli", "Acil", "Ödev", "Sınav", "Final", "Bütünleme",
              "Resmi Tatil", "Güz Yarıyılı", "Bahar Yarıyılı", "Kütüphane", "Staj"
            ]}
            defaultView="month"
          />
        )}
      </div>
    </div>
  );
}
