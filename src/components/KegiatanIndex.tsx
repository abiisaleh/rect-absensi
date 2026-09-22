import React, { useState } from 'react';
import {
  PlusCircle,
  Calendar,
  Clock,
  Briefcase,
  Trash2,
  ArrowRight,
  Sparkles,
  ListPlus,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Share2,
  Printer,
  Building,
  MapPin,
} from 'lucide-react';
import { KegiatanSession } from '../types';
import { ShareModal } from './ShareModal';

interface KegiatanIndexProps {
  sessions: KegiatanSession[];
  onSelectSession: (session: KegiatanSession) => void;
  onCreateSession: (session: KegiatanSession) => void;
  onDeleteSession?: (id: string) => void;
  onPrintSession?: (session: KegiatanSession) => void;
}

const DEFAULT_PRESET_JABATAN = [
  'Direktur',
  'Manajer',
  'Supervisor',
  'Staff / Karyawan',
  'Teknisi',
  'Administrasi',
  'Keuangan / Akuntansi',
  'Magang / Intern',
  'Tamu / Pengunjung',
];

export const KegiatanIndex: React.FC<KegiatanIndexProps> = ({
  sessions,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onPrintSession,
}) => {
  const [judulKegiatan, setJudulKegiatan] = useState('');
  
  // Default deadline: today at 17:00 or tomorrow if late
  const getDefaultDeadline = () => {
    const now = new Date();
    now.setHours(17, 0, 0, 0);
    if (new Date().getHours() >= 17) {
      now.setDate(now.getDate() + 1);
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [batasWaktu, setBatasWaktu] = useState(getDefaultDeadline());
  const [instansi, setInstansi] = useState('KOMISI PEMILIHAN UMUM');
  const [subInstansi, setSubInstansi] = useState('KABUPATEN DEIYAI');
  const [tempat, setTempat] = useState('AULA KANTOR KPU DEIYAI');
  const [alamat, setAlamat] = useState('Jalan Utama Waghete, Kab. Deiyai, Prov. Papua Tengah');
  const [showAdvancedKop, setShowAdvancedKop] = useState(false);

  const [jabatanList, setJabatanList] = useState<string[]>([
    'Staff / Karyawan',
    'Manajer',
    'Supervisor',
    'Tamu / Undangan',
    'Lainnya',
  ]);
  const [newJabatanInput, setNewJabatanInput] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sharing state
  const [shareSession, setShareSession] = useState<KegiatanSession | null>(null);

  const handleAddJabatan = () => {
    const trimmed = newJabatanInput.trim();
    if (!trimmed) return;
    if (jabatanList.includes(trimmed)) {
      setErrorMsg(`Jabatan "${trimmed}" sudah ada di dalam daftar.`);
      return;
    }
    setErrorMsg(null);
    if (jabatanList.includes('Lainnya')) {
      const withoutLainnya = jabatanList.filter((j) => j !== 'Lainnya');
      setJabatanList([...withoutLainnya, trimmed, 'Lainnya']);
    } else {
      setJabatanList([...jabatanList, trimmed, 'Lainnya']);
    }
    setNewJabatanInput('');
  };

  const handleRemoveJabatan = (itemToRemove: string) => {
    if (itemToRemove === 'Lainnya') return;
    setJabatanList(jabatanList.filter((j) => j !== itemToRemove));
  };

  const handleResetToPresets = () => {
    setJabatanList([...DEFAULT_PRESET_JABATAN, 'Lainnya']);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedTitle = judulKegiatan.trim();
    if (!trimmedTitle) {
      setErrorMsg('Silakan isi Judul Kegiatan.');
      return;
    }

    if (!batasWaktu) {
      setErrorMsg('Silakan tentukan batas waktu absensi.');
      return;
    }

    const finalJabatan = jabatanList.includes('Lainnya')
      ? [...jabatanList]
      : [...jabatanList, 'Lainnya'];

    if (finalJabatan.length < 2) {
      setErrorMsg('Harap sediakan minimal 1 pilihan jabatan selain "Lainnya".');
      return;
    }

    const newSession: KegiatanSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      judul_kegiatan: trimmedTitle,
      batas_waktu: batasWaktu,
      daftar_jabatan: finalJabatan,
      created_at: new Date().toISOString(),
      instansi: instansi.trim() || undefined,
      sub_instansi: subInstansi.trim() || undefined,
      tempat: tempat.trim() || undefined,
      alamat: alamat.trim() || undefined,
    };

    onCreateSession(newSession);

    // Reset create form & immediately redirect to created session form
    setJudulKegiatan('');
    setIsFormOpen(false);
    onSelectSession(newSession);
  };

  const isExpired = (deadlineStr: string) => {
    return new Date().getTime() > new Date(deadlineStr).getTime();
  };

  const formatDeadlineText = (deadlineStr: string) => {
    try {
      const d = new Date(deadlineStr);
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return deadlineStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Index Kegiatan & Presensi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Manajemen Kegiatan & Daftar Hadir
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Buat kegiatan baru, bagikan formulir kepada peserta melalui tautan atau QR Code, dan cetak format Daftar Hadir resmi bertanda tangan.
            </p>
          </div>

          <button
            type="button"
            id="btn-toggle-create-session"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {isFormOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>Tutup Form Buat</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Buat Kegiatan Baru</span>
              </>
            )}
          </button>
        </div>

        {/* Form Buat Kegiatan Baru (Collapsible) */}
        {isFormOpen && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-3 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Form Pengaturan Kegiatan Baru</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="font-semibold text-rose-600 hover:underline ml-2"
                >
                  Tutup
                </button>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Judul Kegiatan */}
                <div>
                  <label
                    htmlFor="input-judul-kegiatan"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Judul Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-judul-kegiatan"
                    type="text"
                    required
                    value={judulKegiatan}
                    onChange={(e) => setJudulKegiatan(e.target.value)}
                    placeholder="Contoh: Rapat Pleno Rekapitulasi, Seminar, Bimtek..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-sm text-slate-800 bg-white"
                  />
                </div>

                {/* Batas Waktu Absensi */}
                <div>
                  <label
                    htmlFor="input-batas-waktu"
                    className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between"
                  >
                    <span>Batas Waktu Absensi <span className="text-rose-500">*</span></span>
                    <span className="text-slate-400 font-normal text-[11px]">(Waktu setempat)</span>
                  </label>
                  <input
                    id="input-batas-waktu"
                    type="datetime-local"
                    required
                    value={batasWaktu}
                    onChange={(e) => setBatasWaktu(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-sm text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Opsi Kop Surat untuk Cetak PDF (Opsional / Collapsible) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedKop(!showAdvancedKop)}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>{showAdvancedKop ? 'Sembunyikan' : 'Atur'} Kop Surat & Lokasi untuk Cetak PDF (Opsional)</span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {showAdvancedKop ? 'Tersedia' : 'Bisa disesuaikan nanti'}
                  </span>
                </div>

                {showAdvancedKop && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Instansi (Kop Baris 1)
                      </label>
                      <input
                        type="text"
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Sub-Instansi / Daerah (Kop Baris 2)
                      </label>
                      <input
                        type="text"
                        value={subInstansi}
                        onChange={(e) => setSubInstansi(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tempat Acara
                      </label>
                      <input
                        type="text"
                        value={tempat}
                        onChange={(e) => setTempat(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Alamat Instansi
                      </label>
                      <input
                        type="text"
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Daftar Jabatan Setting */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Daftar Jabatan untuk Formulir:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetToPresets}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                  >
                    Gunakan Preset Standar
                  </button>
                </div>

                {/* Chips of Current Jabatan */}
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[46px] items-center">
                  {jabatanList.map((job) => (
                    <span
                      key={job}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        job === 'Lainnya'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span>{job}</span>
                      {job !== 'Lainnya' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJabatan(job)}
                          className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                          title={`Hapus jabatan ${job}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {/* Add new Jabatan input */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newJabatanInput}
                    onChange={(e) => setNewJabatanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddJabatan();
                      }
                    }}
                    placeholder="Ketik jabatan tambahan (misal: Ketua, Anggota, Kasubag, Staf)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-xs text-slate-800 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddJabatan}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {/* Submit create session */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-session"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Simpan & Buka Form Absensi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Available Sessions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Daftar Kegiatan ({sessions.length})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Bagikan form kepada peserta atau cetak lembar daftar hadir
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Belum Ada Kegiatan Dibuat</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik tombol "Buat Kegiatan Baru" untuk mulai membuat formulir presensi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Kegiatan Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => {
              const expired = isExpired(sess.batas_waktu);
              return (
                <div
                  key={sess.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between group ${
                    expired
                      ? 'border-slate-200 bg-slate-50/40'
                      : 'border-slate-200/80 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Status & Actions Header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          expired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {expired ? (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Ditutup</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </>
                        )}
                      </span>

                      <div className="flex items-center gap-1">
                        {/* Share Button on Card */}
                        <button
                          type="button"
                          onClick={() => setShareSession(sess)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          title="Bagikan Form & QR Code kepada peserta"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Bagikan Form</span>
                        </button>

                        {onDeleteSession && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Hapus kegiatan "${sess.judul_kegiatan}"?`)) {
                                onDeleteSession(sess.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus kegiatan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {sess.judul_kegiatan}
                    </h4>

                    {/* Venue / Location if set */}
                    {sess.tempat && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{sess.tempat}</span>
                      </div>
                    )}

                    {/* Deadline Info */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Batas Waktu: <strong>{formatDeadlineText(sess.batas_waktu)}</strong></span>
                    </div>

                    {/* Jabatan Preview */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Daftar Jabatan ({sess.daftar_jabatan.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sess.daftar_jabatan.slice(0, 4).map((j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]"
                          >
                            {j}
                          </span>
                        ))}
                        {sess.daftar_jabatan.length > 4 && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px]">
                            +{sess.daftar_jabatan.length - 4} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {onPrintSession && (
                      <button
                        type="button"
                        onClick={() => onPrintSession(sess)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Cetak PDF lembar daftar hadir resmi"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Cetak PDF</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectSession(sess)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer ml-auto ${
                        expired
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                      }`}
                    >
                      <span>Buka Form Absensi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        session={shareSession}
        isOpen={Boolean(shareSession)}
        onClose={() => setShareSession(null)}
      />
    </div>
  );
};
