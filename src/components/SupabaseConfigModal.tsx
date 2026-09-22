import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  Check,
  Globe,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'vercel'>('config');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableExists?: boolean;
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getStoredSupabaseConfig();
      setUrl(current.url || '');
      setAnonKey(current.anonKey || '');
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onConfigUpdated();
  };

  const handleTest = async () => {
    // Save first so test uses current values
    saveStoredSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
    });
    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);
    onConfigUpdated();
  };

  const handleReset = () => {
    clearStoredSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onConfigUpdated();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Integrasi Database Supabase & Vercel
              </h3>
              <p className="text-xs text-slate-500">
                Konfigurasi penyimpanan cloud dan panduan deployment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Kredensial Supabase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. SQL Schema Tabel (Penting)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vercel')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'vercel'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Panduan Deploy Vercel
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4 flex-1">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Cara mendapatkan URL & Anon Key Supabase:</p>
                  <ol className="list-decimal list-inside space-y-0.5 mt-1 text-indigo-800">
                    <li>Buka dashboard proyek Anda di <strong>supabase.com</strong></li>
                    <li>Buka menu <strong>Project Settings</strong> (ikon gerigi) → <strong>API</strong></li>
                    <li>Salin <strong>Project URL</strong> dan <strong>anon public API key</strong> ke input di bawah.</li>
                  </ol>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Supabase Project URL (VITE_SUPABASE_URL)</span>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzabcdefghijklm.supabase.co"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-slate-800"
                />
              </div>

              {/* Anon Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Supabase Anon / Public Key (VITE_SUPABASE_ANON_KEY)</span>
                </label>
                <textarea
                  rows={3}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-slate-800"
                />
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Memerlukan Perhatian'}</p>
                    <p className="mt-0.5">{testResult.message}</p>
                    {testResult.tableExists === false && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('sql')}
                        className="mt-2 text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50"
                      >
                        Buka Tab SQL Schema & Salin Kode
                      </button>
                    )}
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Kredensial berhasil disimpan!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-medium"
                >
                  Hapus Kredensial
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={isTesting || !url || !anonKey}
                    className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {isTesting ? 'Menguji...' : 'Uji Koneksi'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!url || !anonKey}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Skrip SQL Pembuatan Tabel `absensi`
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Jalankan skrip ini sekali di menu <strong>SQL Editor</strong> pada dashboard Supabase Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-72">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Keamanan & RLS (Row Level Security):
                </p>
                <p className="text-[11px]">
                  Skrip ini sudah menyertakan konfigurasi RLS (Row Level Security) agar pengguna umum/karyawan dapat mengisi form tanda tangan dan presensi tanpa perlu login terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-3 text-xs text-slate-700">
              <h4 className="font-bold text-slate-800 text-sm">
                Panduan Deploy ke Vercel
              </h4>
              <p className="text-slate-600">
                Aplikasi ini dibangun menggunakan Vite + React dan siap di-deploy langsung ke Vercel:
              </p>

              <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <li>
                  <strong>Push Kode ke GitHub / GitLab:</strong> Pastikan seluruh file proyek tersimpan di repositori git Anda.
                </li>
                <li>
                  <strong>Import Proyek di Vercel:</strong> Buka <strong>vercel.com</strong> → Klik <em>Add New...</em> → <em>Project</em> → Pilih repositori Anda.
                </li>
                <li>
                  <strong>Atur Environment Variables di Vercel:</strong> Pada tahap <em>Environment Variables</em> di halaman deploy Vercel, masukkan 2 variabel berikut:
                  <div className="mt-2 space-y-1 font-mono text-[11px] bg-slate-900 text-slate-100 p-2.5 rounded-lg">
                    <div>VITE_SUPABASE_URL = https://your-project.supabase.co</div>
                    <div>VITE_SUPABASE_ANON_KEY = eyJhbGci...</div>
                  </div>
                </li>
                <li>
                  <strong>Klik Deploy:</strong> Vercel akan otomatis menjalankan <code>npm run build</code> dan mempublikasikan website absensi Anda dengan domain gratis <code>.vercel.app</code>.
                </li>
              </ol>

              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-indigo-900 text-xs">
                <strong>Catatan:</strong> Variabel dengan awalan <code>VITE_</code> otomatis dibaca oleh bundler Vite di Vercel pada saat proses build.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 font-medium"
          >
            <span>Buka Dashboard Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
