import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SignaturePad } from './SignaturePad';
import { submitAbsensiToDatabase } from '../lib/supabase';
import { AbsensiRecord, JabatanType } from '../types';

interface AbsensiFormProps {
  onSuccess: (newRecord: AbsensiRecord, source: 'supabase' | 'local') => void;
  supabaseConfigured: boolean;
  onOpenSettings: () => void;
}

const JABATAN_OPTIONS: JabatanType[] = [
  'Direktur',
  'Manajer',
  'Supervisor',
  'Staff / Karyawan',
  'Teknisi',
  'Administrasi',
  'Keuangan / Akuntansi',
  'Magang / Intern',
  'Tamu / Pengunjung',
  'Lainnya',
];

export const AbsensiForm: React.FC<AbsensiFormProps> = ({
  onSuccess,
  supabaseConfigured,
  onOpenSettings,
}) => {
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState<JabatanType | ''>('');
  const [customJabatan, setCustomJabatan] = useState('');
  const [status, setStatus] = useState<AbsensiRecord['status']>('Hadir');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState('');

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ record: AbsensiRecord; source: 'supabase' | 'local' } | null>(null);

  // Key to force reset SignaturePad
  const [signaturePadKey, setSignaturePadKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const trimmedNama = nama.trim();
    if (!trimmedNama) {
      setErrorMessage('Silakan isi Nama Lengkap Anda.');
      return;
    }

    if (!jabatan) {
      setErrorMessage('Silakan pilih Jabatan Anda.');
      return;
    }

    const finalJabatan = jabatan === 'Lainnya' ? customJabatan.trim() : jabatan;
    if (jabatan === 'Lainnya' && !finalJabatan) {
      setErrorMessage('Silakan masukkan nama jabatan spesifik Anda.');
      return;
    }

    if (!signatureData) {
      setErrorMessage('Tanda tangan wajib diisi pada kotak tanda tangan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAbsensiToDatabase({
        nama: trimmedNama,
        jabatan: finalJabatan,
        status,
        signature_data: signatureData,
        keterangan: keterangan.trim() || undefined,
        waktu_absen: currentTime.toISOString(),
      });

      if (result.success && result.data) {
        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
          });
        } catch {
          // ignore confetti if unsupported
        }

        setSuccessData({ record: result.data, source: result.source });
        onSuccess(result.data, result.source);

        // Reset inputs
        setNama('');
        setJabatan('');
        setCustomJabatan('');
        setStatus('Hadir');
        setSignatureData(null);
        setKeterangan('');
        setSignaturePadKey((prev) => prev + 1);
      } else {
        setErrorMessage(result.error || 'Terjadi kesalahan saat menyimpan absensi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan absensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setErrorMessage(null);
    setNama('');
    setJabatan('');
    setCustomJabatan('');
    setStatus('Hadir');
    setSignatureData(null);
    setKeterangan('');
    setSignaturePadKey((prev) => prev + 1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
      {/* Live Time Badge Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Formulir Presensi Kehadiran</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lengkapi data dan bubuhkan tanda tangan digital Anda di bawah ini
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            {formattedDate}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1.5 text-indigo-700 font-mono font-semibold">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            {formattedTime} WIB
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successData && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-900">
                Presensi Berhasil Dicatat!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Terima kasih, <strong>{successData.record.nama}</strong> ({successData.record.jabatan}).{' '}
                {successData.source === 'supabase' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                    Tersimpan di Supabase Cloud.
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    Tersimpan di Penyimpanan Lokal (Sambungkan Supabase untuk cloud).
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap self-end sm:self-auto"
          >
            Isi Absensi Baru
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 font-semibold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama Input */}
        <div>
          <label
            htmlFor="input-nama"
            className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5"
          >
            <User className="w-4 h-4 text-indigo-600" />
            <span>Nama Lengkap</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-nama"
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Budi Santoso, S.Kom"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all bg-white"
          />
        </div>

        {/* Jabatan Select */}
        <div>
          <label
            htmlFor="select-jabatan"
            className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Jabatan / Posisi</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="select-jabatan"
              required
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value as JabatanType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-sm text-slate-800 transition-all bg-white appearance-none cursor-pointer pr-10"
            >
              <option value="" disabled>
                -- Pilih Jabatan / Posisi --
              </option>
              {JABATAN_OPTIONS.map((job) => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Custom Jabatan field if 'Lainnya' chosen */}
          {jabatan === 'Lainnya' && (
            <div className="mt-2.5 animate-in fade-in duration-200">
              <input
                id="input-custom-jabatan"
                type="text"
                required
                value={customJabatan}
                onChange={(e) => setCustomJabatan(e.target.value)}
                placeholder="Tuliskan jabatan Anda secara spesifik..."
                className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-sm text-slate-800 placeholder:text-slate-400"
              />
            </div>
          )}
        </div>

        {/* Status Presensi Pills */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Status Presensi
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(['Hadir', 'Dinas', 'Tugas Luar', 'Izin', 'Sakit'] as const).map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setStatus(st)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                  status === st
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Signature Pad */}
        <SignaturePad
          key={signaturePadKey}
          onSignatureChange={setSignatureData}
          required={true}
        />

        {/* Keterangan / Keperluan Tambahan */}
        <div>
          <label
            htmlFor="input-keterangan"
            className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Keterangan / Keperluan (Opsional)</span>
          </label>
          <textarea
            id="input-keterangan"
            rows={2}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Menghadiri rapat koordinasi mingguan, dinas proyek A, dll."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all resize-none"
          />
        </div>

        {/* Database target indicator */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                supabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-600">
              Penyimpanan:{' '}
              <strong className={supabaseConfigured ? 'text-emerald-700' : 'text-amber-700'}>
                {supabaseConfigured ? 'Supabase Database Cloud' : 'Lokal (Supabase Belum Diatur)'}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-xs"
          >
            {supabaseConfigured ? 'Konfigurasi' : 'Setup Supabase'}
          </button>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            id="btn-submit-absensi"
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-xs hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Menyimpan Presensi...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Presensi Kehadiran</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-reset-form"
            onClick={handleResetForm}
            disabled={isSubmitting}
            className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </form>
    </div>
  );
};
