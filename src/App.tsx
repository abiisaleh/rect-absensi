import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  ListOrdered,
  Settings,
  Calendar,
  Layers,
  Printer,
  Share2,
  ArrowLeft,
} from 'lucide-react';
import { AbsensiForm } from './components/AbsensiForm';
import { AbsensiList } from './components/AbsensiList';
import { KegiatanIndex } from './components/KegiatanIndex';
import { DaftarHadirPrintView } from './components/DaftarHadirPrintView';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import {
  fetchAbsensiRecords,
  getStoredSupabaseConfig,
  testSupabaseConnection,
  getLocalSessions,
  saveLocalSession,
} from './lib/supabase';
import { AbsensiRecord, KegiatanSession } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'index' | 'form' | 'rekap' | 'print'>('index');
  const [sessions, setSessions] = useState<KegiatanSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<KegiatanSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  // Sync state from URL query parameters
  const syncFromUrl = useCallback((allSessions: KegiatanSession[]) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const sessionParam = params.get('session');

      let currentSession: KegiatanSession | null = null;
      if (sessionParam) {
        currentSession = allSessions.find((s) => s.id === sessionParam) || null;
      }
      if (!currentSession && allSessions.length > 0) {
        currentSession = allSessions[0];
      }
      setSelectedSession(currentSession);

      if (pageParam === 'form') {
        setCurrentPage('form');
      } else if (pageParam === 'print') {
        setCurrentPage('print');
      } else if (pageParam === 'rekap') {
        setCurrentPage('rekap');
      } else {
        setCurrentPage('index');
      }
    } catch {
      setCurrentPage('index');
    }
  }, []);

  // Update URL query parameters
  const navigateTo = (page: 'index' | 'form' | 'rekap' | 'print', session?: KegiatanSession | null) => {
    setCurrentPage(page);
    const targetSession = session !== undefined ? session : selectedSession;
    if (session !== undefined) {
      setSelectedSession(session);
    }

    try {
      const url = new URL(window.location.href);
      if (page === 'index') {
        url.searchParams.delete('page');
        url.searchParams.delete('session');
      } else {
        url.searchParams.set('page', page);
        if (targetSession) {
          url.searchParams.set('session', targetSession.id);
        } else {
          url.searchParams.delete('session');
        }
      }
      window.history.pushState({}, '', url.toString());
    } catch {
      // Ignore URL history errors in sandboxed iframes
    }
  };

  // Load sessions from local storage
  const loadSessions = useCallback(() => {
    let list = getLocalSessions();
    if (list.length === 0) {
      // Create initial starter session matching official format
      const now = new Date();
      now.setHours(23, 59, 0, 0);
      const starter: KegiatanSession = {
        id: 'session-kpu-deiyai',
        judul_kegiatan: 'Rapat Pleno Koordinasi dan Evaluasi',
        batas_waktu: now.toISOString(),
        instansi: 'KOMISI PEMILIHAN UMUM',
        sub_instansi: 'KABUPATEN DEIYAI',
        tempat: 'AULA KANTOR KPU DEIYAI',
        alamat: 'Jalan Utama Waghete, Kab. Deiyai, Prov. Papua Tengah',
        hari_tanggal: now
          .toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          .toUpperCase(),
        pukul: '08.30 WIT – SELESAI',
        daftar_jabatan: [
          'Ketua',
          'Anggota',
          'Sekretaris',
          'Kasubag Rendatin',
          'Kasubag KUL',
          'Kasubag SDM',
          'Kasubag Teknis',
          'Staf',
          'Lainnya',
        ],
        created_at: new Date().toISOString(),
      };
      saveLocalSession(starter);
      list = [starter];
    }
    setSessions(list);
    return list;
  }, []);

  // Load configuration & test connection
  const checkSupabaseStatus = useCallback(async () => {
    const config = getStoredSupabaseConfig();
    const hasConfig = Boolean(config.url && config.anonKey);
    setSupabaseConfigured(hasConfig);

    if (hasConfig) {
      const test = await testSupabaseConnection();
      if (!test.success) {
        setConnectionNotice(test.message);
      } else {
        setConnectionNotice(null);
      }
    } else {
      setConnectionNotice('Kredensial Supabase belum diisi. Data saat ini disimpan sementara di browser.');
    }
  }, []);

  // Fetch records from Supabase or local storage
  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchAbsensiRecords();
      setRecords(result.data);
      setDataSource(result.source);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSupabaseStatus();
    loadRecords();
    const currentSessions = loadSessions();
    syncFromUrl(currentSessions);

    // Handle browser popstate (back/forward button)
    const handlePopState = () => {
      syncFromUrl(getLocalSessions());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [checkSupabaseStatus, loadRecords, loadSessions, syncFromUrl]);

  // Handle session selection from Index -> navigate to form page
  const handleSelectSession = (session: KegiatanSession) => {
    navigateTo('form', session);
  };

  // Handle print session directly from Index -> navigate to print page
  const handlePrintSession = (session: KegiatanSession) => {
    navigateTo('print', session);
  };

  // Handle new session created from Index
  const handleCreateSession = (newSession: KegiatanSession) => {
    saveLocalSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
  };

  // Handle delete session
  const handleDeleteSession = (id: string) => {
    try {
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      localStorage.setItem('absensi_sessions_cache', JSON.stringify(updated));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        navigateTo('index');
      }
    } catch {
      // ignore
    }
  };

  // Handle new record submitted from AbsensiForm
  const handleRecordSuccess = (newRecord: AbsensiRecord, source: 'supabase' | 'local') => {
    setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
    setDataSource(source);
  };

  // Filter records for the current selected session (for print or focused rekap)
  const sessionRecords = selectedSession
    ? records.filter(
        (r) =>
          r.session_id === selectedSession.id ||
          (r.judul_kegiatan &&
            r.judul_kegiatan.toLowerCase() === selectedSession.judul_kegiatan.toLowerCase())
      )
    : records;

  // Render Page: Dedicated Print PDF View
  if (currentPage === 'print') {
    return (
      <DaftarHadirPrintView
        session={selectedSession}
        records={sessionRecords.length > 0 ? sessionRecords : records}
        onBack={() => navigateTo('index')}
      />
    );
  }

  // Render Page: Dedicated Standalone Attendee Form
  if (currentPage === 'form') {
    return (
      <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased font-sans flex flex-col">
        {/* Simple Minimal Header for Form Page */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigateTo('index')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Kembali ke Index Kegiatan</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo('rekap', selectedSession)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lihat Rekap</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('print', selectedSession)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* Standalone Form Page Body */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AbsensiForm
            onSuccess={handleRecordSuccess}
            supabaseConfigured={supabaseConfigured && !connectionNotice}
            onOpenSettings={() => setIsConfigModalOpen(true)}
            session={selectedSession}
            onBackToIndex={() => navigateTo('index')}
            standalone={true}
          />
        </main>

        <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Form Absensi Online • Sistem Presensi Digital & Tanda Tangan</p>
            <button
              type="button"
              onClick={() => navigateTo('index')}
              className="hover:text-indigo-600 font-medium cursor-pointer"
            >
              Index Kegiatan
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Render Page: Index or Rekap Page (Administrative & Management)
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => navigateTo('index')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  Form Absensi Online
                </h1>
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Digital Signature
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Presensi kehadiran kegiatan terintegrasi Supabase
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('print', selectedSession)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Cetak format Daftar Hadir resmi seperti gambar"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>

            <button
              type="button"
              id="btn-open-settings"
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Pengaturan Database Supabase & Vercel"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page Switcher Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-100 overflow-x-auto">
          {/* Index Kegiatan Tab */}
          <button
            type="button"
            id="tab-kegiatan-index"
            onClick={() => navigateTo('index')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentPage === 'index'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Index Kegiatan</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal">
              {sessions.length}
            </span>
          </button>

          {/* Rekap Kehadiran Tab */}
          <button
            type="button"
            id="tab-riwayat-absensi"
            onClick={() => navigateTo('rekap')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentPage === 'rekap'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Rekapitulasi Kehadiran</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal">
              {records.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentPage === 'index' && (
          <KegiatanIndex
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            onPrintSession={handlePrintSession}
          />
        )}

        {currentPage === 'rekap' && (
          <div className="space-y-6">
            <AbsensiList
              records={records}
              isLoading={isLoading}
              onRefresh={loadRecords}
              source={dataSource}
              currentKegiatanJudul={selectedSession?.judul_kegiatan}
              onOpenPrintView={(recordsToPrint) => navigateTo('print', selectedSession)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Form Absensi Online • Sistem Presensi Digital & Tanda Tangan</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="hover:text-indigo-600 font-medium cursor-pointer"
            >
              Pengaturan Database
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                navigateTo('rekap');
                loadRecords();
              }}
              className="hover:text-indigo-600 font-medium cursor-pointer"
            >
              Lihat Rekap
            </button>
          </div>
        </div>
      </footer>

      {/* Supabase & Vercel Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigUpdated={() => {
          checkSupabaseStatus();
          loadRecords();
        }}
      />
    </div>
  );
}
