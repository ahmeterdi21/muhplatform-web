import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Sparkles, CheckCircle2, Clock, BookOpen, Layers } from 'lucide-react';
import { supabase } from '../supabase';
import { ThemeContext } from '../App';
import SpotlightCard from '../components/SpotlightCard';
import Particles from '../components/Particles';
import { EventManager } from '../components/ui/event-manager';

export default function Events() {
  const { theme } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
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
        if (saved) {
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

      // 3. Default demo events for new users
      if (loadedEvents.length === 0) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();

        loadedEvents = [
          {
            id: "evt-1",
            title: "Statik & Mukavemet Vize Hazırlığı",
            description: "Bölüm 4 ve 5 soru çözümleri ve formül kâğıdı hazırlığı.",
            startTime: new Date(year, month, day, 10, 0),
            endTime: new Date(year, month, day, 12, 30),
            color: "green",
            category: "Ders / Sınav",
            tags: ["Önemli", "Sınav"],
          },
          {
            id: "evt-2",
            title: "Mühendislik Projesi Raporu Teslimi",
            description: "Taslak analizi ve PDF formatında sisteme yükleme.",
            startTime: new Date(year, month, day + 2, 14, 0),
            endTime: new Date(year, month, day + 2, 16, 0),
            color: "purple",
            category: "Proje Teslimi",
            tags: ["Acil", "Ödev"],
          },
          {
            id: "evt-3",
            title: "Kütüphane Odaklanma Seansı",
            description: "Akışkanlar mekaniği ödev takibi.",
            startTime: new Date(year, month, day + 4, 15, 0),
            endTime: new Date(year, month, day + 4, 18, 0),
            color: "blue",
            category: "Kişisel Not",
            tags: ["Kütüphane"],
          }
        ];
        localStorage.setItem(storageKey, JSON.stringify(loadedEvents));
      }

      setEvents(loadedEvents);
      setLoading(false);
    };

    loadUserAndEvents();
  }, []);

  const saveEventsLocallyAndDb = async (updatedEvents, user) => {
    if (!user) return;
    const storageKey = `muhplatform_events_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedEvents));

    // Async attempt to persist to Supabase user_events table if it exists
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
    } catch (e) {
      // Ignored if table isn't created yet in Supabase schema
    }
  };

  const handleEventCreate = (newEvent) => {
    if (!currentUser) return;
    const updated = [...events, newEvent];
    setEvents(updated);
    saveEventsLocallyAndDb(updated, currentUser);
  };

  const handleEventUpdate = (id, updatedFields) => {
    if (!currentUser) return;
    const updated = events.map(e => e.id === id ? { ...e, ...updatedFields } : e);
    setEvents(updated);
    saveEventsLocallyAndDb(updated, currentUser);
  };

  const handleEventDelete = (id) => {
    if (!currentUser) return;
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveEventsLocallyAndDb(updated, currentUser);

    // Delete from Supabase if available
    try {
      supabase.from('user_events').delete().eq('id', id).eq('user_id', currentUser.id);
    } catch (e) {}
  };

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
                  Kişisel Etkinlik Takvimi
                  <span className={`text-xs px-3 py-1 rounded-full ${theme.bgLight} ${theme.text} font-bold border ${theme.border}`}>
                    Event Manager
                  </span>
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Çalışma planlarınızı, ders notlarınızı ve sınav takviminizi günlere özel organize edin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Senkronize
              </div>
              <span className="text-gray-600">|</span>
              <div className="text-gray-300 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Toplam {events.length} Etkinlik
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Event Manager Component */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Takvim yükleniyor...
          </div>
        ) : (
          <EventManager
            events={events}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            categories={["Ders / Sınav", "Proje Teslimi", "Toplantı", "Kişisel Not", "Laboratuvar"]}
            availableTags={["Önemli", "Acil", "Ödev", "Sınav", "Kütüphane", "Takım", "Staj"]}
            defaultView="month"
          />
        )}
      </div>
    </div>
  );
}
