import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  ListOrdered,
  Settings,
  Database,
  Cloud,
  CheckCircle2,
  Users,
  CalendarCheck,
  Building2,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { AbsensiForm } from './components/AbsensiForm';
import { AbsensiList } from './components/AbsensiList';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import {
  fetchAbsensiRecords,
  getStoredSupabaseConfig,
  testSupabaseConnection,
} from './lib/supabase';
import { AbsensiRecord } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'riwayat'>('form');
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

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
  }, [checkSupabaseStatus, loadRecords]);

  // Handle new record submitted from AbsensiForm
  const handleRecordSuccess = (newRecord: AbsensiRecord, source: 'supabase' | 'local') => {
    setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
    setDataSource(source);
  };

  // Stats calculation
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((r) => r.waktu_absen.startsWith(todayStr));
  const hadirCount = todayRecords.filter((r) => r.status === 'Hadir').length;
  const dinasCount = todayRecords.filter((r) => r.status === 'Dinas' || r.status === 'Tugas Luar').length;
  const izinCount = todayRecords.filter((r) => r.status === 'Izin' || r.status === 'Sakit').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
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
                Presensi kehadiran karyawan & tamu terintegrasi Supabase
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Status indicator button */}
            <button
              type="button"
              id="btn-status-supabase"
              onClick={() => setIsConfigModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                supabaseConfigured && !connectionNotice
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {supabaseConfigured && !connectionNotice ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Supabase:</span>
                  <span>Terkoneksi</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Supabase:</span>
                  <span>Setup Diperlukan</span>
                </>
              )}
            </button>

            {/* Config modal button */}
            <button
              type="button"
              id="btn-open-settings"
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Pengaturan Database Supabase & Vercel"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-100">
          <button
            type="button"
            id="tab-form-absensi"
            onClick={() => setActiveTab('form')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Isi Form Absensi</span>
          </button>

          <button
            type="button"
            id="tab-riwayat-absensi"
            onClick={() => setActiveTab('riwayat')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Riwayat Kehadiran</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal">
              {records.length}
            </span>
          </button>
        </div>
      </header>

      {/* Notice Banner if Supabase not configured */}
      {connectionNotice && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-xs text-amber-900">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Perhatian:</strong> {connectionNotice}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="font-semibold text-indigo-700 hover:underline whitespace-nowrap"
            >
              Atur Supabase Sekarang →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column (8 cols on lg) */}
            <div className="lg:col-span-8">
              <AbsensiForm
                onSuccess={handleRecordSuccess}
                supabaseConfigured={supabaseConfigured && !connectionNotice}
                onOpenSettings={() => setIsConfigModalOpen(true)}
              />
            </div>

            {/* Sidebar / Quick Stats & Instructions (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Daily Statistics Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  <span>Statistik Hari Ini</span>
                </h3>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <span className="block text-2xl font-bold text-emerald-700">
                      {hadirCount}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">Hadir</span>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <span className="block text-2xl font-bold text-blue-700">
                      {dinasCount}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600">Dinas</span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <span className="block text-2xl font-bold text-amber-700">
                      {izinCount}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-600">Izin/Sakit</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Presensi Tercatat:</span>
                  <span className="font-semibold text-slate-800">{records.length} orang</span>
                </div>
              </div>

              {/* Petunjuk Pengisian Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Petunjuk Presensi</span>
                </h3>

                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Masukkan <strong>Nama Lengkap</strong> sesuai identitas resmi Anda.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Pilih <strong>Jabatan</strong> atau masukkan jabatan spesifik bila memilih 'Lainnya'.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Goreskan <strong>Tanda Tangan Digital</strong> di area kanvas. Anda dapat mengganti warna tinta (Hitam/Biru) atau menggunakan tombol Reset jika ingin mengulang.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Klik <strong>Kirim Presensi Kehadiran</strong> untuk menyimpan ke database.</span>
                  </li>
                </ul>
              </div>

              {/* Supabase & Vercel Integration Info */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                    Supabase + Vercel
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Data absensi disimpan ke tabel <code>absensi</code> di PostgreSQL Supabase dengan Row Level Security (RLS) terpasang. Siap deploy langsung ke Vercel.
                </p>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors text-white cursor-pointer"
                >
                  <span>Lihat Panduan & SQL</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AbsensiList
              records={records}
              isLoading={isLoading}
              onRefresh={loadRecords}
              source={dataSource}
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
              className="hover:text-indigo-600 font-medium"
            >
              Pengaturan Database
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('riwayat');
                loadRecords();
              }}
              className="hover:text-indigo-600 font-medium"
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
