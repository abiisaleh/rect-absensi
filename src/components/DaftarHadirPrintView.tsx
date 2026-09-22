import React, { useState } from 'react';
import {
  Printer,
  ArrowLeft,
  Settings2,
  FileDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AbsensiRecord, KegiatanSession } from '../types';

interface DaftarHadirPrintViewProps {
  session?: KegiatanSession | null;
  records: AbsensiRecord[];
  onBack: () => void;
}

export const DaftarHadirPrintView: React.FC<DaftarHadirPrintViewProps> = ({
  session,
  records,
  onBack,
}) => {
  // Format default values from session or current date
  const getDefaultHariTanggal = () => {
    if (session?.hari_tanggal) return session.hari_tanggal;
    const now = session?.created_at ? new Date(session.created_at) : new Date();
    return now
      .toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      .toUpperCase();
  };

  const getDefaultPukul = () => {
    if (session?.pukul) return session.pukul;
    if (session?.batas_waktu) {
      try {
        const d = new Date(session.batas_waktu);
        const timeStr = d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${timeStr} WIT – SELESAI`;
      } catch {
        // fallback
      }
    }
    return '08.30 WIT – SELESAI';
  };

  // State for editable Kop Surat & metadata
  const [instansi, setInstansi] = useState(
    session?.instansi || 'KOMISI PEMILIHAN UMUM'
  );
  const [subInstansi, setSubInstansi] = useState(
    session?.sub_instansi || 'KABUPATEN DEIYAI'
  );
  const [alamat, setAlamat] = useState(
    session?.alamat || 'Jalan Utama Waghete, Kab. Deiyai, Prov. Papua Tengah'
  );
  const [tempat, setTempat] = useState(
    session?.tempat || 'AULA KANTOR KPU DEIYAI'
  );
  const [hariTanggal, setHariTanggal] = useState(getDefaultHariTanggal());
  const [pukul, setPukul] = useState(getDefaultPukul());
  const [minRows, setMinRows] = useState(Math.max(18, records.length));
  const [showSettings, setShowSettings] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Build rows: actual records followed by empty numbered rows up to minRows
  const tableRows = [];
  const totalRows = Math.max(minRows, records.length);

  for (let i = 0; i < totalRows; i++) {
    const record = records[i] || null;
    tableRows.push({
      no: i + 1,
      nama: record ? record.nama : '',
      jabatan: record ? record.jabatan : '',
      signatureData: record ? record.signature_data : null,
    });
  }

  return (
    <div className="min-h-screen bg-slate-100/90 py-6 px-3 sm:px-6 print:bg-white print:p-0">
      {/* Non-printed Controls Toolbar */}
      <div className="max-w-4xl mx-auto mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Format Cetak PDF Daftar Hadir
            </h1>
            <p className="text-[11px] text-slate-500">
              Format baku Kop Surat & Kolom Tanda Tangan Selang-Seling (Zig-zag)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <span>{showSettings ? 'Tutup Pengaturan' : 'Sesuaikan Kop & Info'}</span>
          </button>

          <button
            type="button"
            id="btn-print-pdf-trigger"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Editable Settings Panel (Collapsed by default, hidden in print) */}
      {showSettings && (
        <div className="max-w-4xl mx-auto mb-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pengaturan Kop Surat & Info Acara</span>
            </h2>
            <span className="text-[11px] text-slate-500">
              Perubahan langsung tampil pada lembar di bawah
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Instansi (Baris 1)
              </label>
              <input
                type="text"
                value={instansi}
                onChange={(e) => setInstansi(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Sub-Instansi / Daerah (Baris 2)
              </label>
              <input
                type="text"
                value={subInstansi}
                onChange={(e) => setSubInstansi(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Alamat / Kontak (Baris 3)
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
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
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hari / Tanggal
              </label>
              <input
                type="text"
                value={hariTanggal}
                onChange={(e) => setHariTanggal(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pukul / Waktu
              </label>
              <input
                type="text"
                value={pukul}
                onChange={(e) => setPukul(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-600">
                Jumlah Baris Lembar (Minimal):
              </label>
              <input
                type="number"
                min={records.length || 1}
                max={100}
                value={minRows}
                onChange={(e) => setMinRows(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300"
              />
              <span className="text-[11px] text-slate-400">
                (Standar form kertas: 18 baris)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      )}

      {/* Printable Paper Canvas (Styled for A4 Print & Web Preview) */}
      <div
        id="printable-daftar-hadir-area"
        className="max-w-[210mm] mx-auto bg-white text-black p-[15mm] sm:p-[20mm] shadow-lg border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-0 print:w-full"
        style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: '#000000',
        }}
      >
        {/* KOP SURAT */}
        <div className="relative pb-3 mb-1">
          <div className="flex items-center justify-center">
            {/* Logo KPU / Garuda Emblem on Left */}
            <div className="absolute left-0 top-0 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-black fill-current"
              >
                {/* Official seal / emblem contour */}
                <circle cx="50" cy="50" r="46" fill="#111827" />
                <circle cx="50" cy="50" r="42" fill="#ffffff" />
                <circle cx="50" cy="50" r="39" fill="#991b1b" />
                {/* Center shield & eagle silhouette */}
                <path
                  d="M50 20 L58 35 L74 35 L61 46 L66 62 L50 51 L34 62 L39 46 L26 35 L42 35 Z"
                  fill="#facc15"
                />
                <circle cx="50" cy="50" r="24" fill="#ffffff" />
                {/* Text Ring KOMISI PEMILIHAN UMUM */}
                <path
                  d="M50 30 C 61 30 70 39 70 50 C 70 61 61 70 50 70 C 39 70 30 61 30 50 C 30 39 39 30 50 30"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="2"
                />
                <text
                  x="50"
                  y="53"
                  fontSize="7.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#111827"
                  fontFamily="sans-serif"
                >
                  KOMISI
                </text>
                <text
                  x="50"
                  y="61"
                  fontSize="6.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#991b1b"
                  fontFamily="sans-serif"
                >
                  PEMILIHAN UMUM
                </text>
              </svg>
            </div>

            {/* Kop Text Centered */}
            <div className="text-center px-16 sm:px-24">
              <h2 className="text-lg sm:text-xl font-bold tracking-wide uppercase leading-tight">
                {instansi}
              </h2>
              <h3 className="text-base sm:text-lg font-bold tracking-wider uppercase mt-0.5 leading-tight">
                {subInstansi}
              </h3>
              <p className="text-xs sm:text-sm italic text-black mt-1 leading-snug">
                {alamat}
              </p>
            </div>
          </div>

          {/* Double Lines Separator (Kop Surat Dinas) */}
          <div className="mt-3">
            <div className="border-b-[3px] border-black w-full" />
            <div className="border-b-[1px] border-black w-full mt-[2px]" />
          </div>
        </div>

        {/* Title DAFTAR HADIR */}
        <div className="text-center my-4 sm:my-5">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-widest text-black underline underline-offset-4 decoration-1">
            DAFTAR HADIR
          </h2>
        </div>

        {/* Event Metadata */}
        <div className="mb-4 text-xs sm:text-sm leading-relaxed text-black">
          <table className="border-none p-0 text-left">
            <tbody>
              <tr>
                <td className="w-28 sm:w-32 py-0.5 font-normal">Tempat</td>
                <td className="w-4 py-0.5 font-semibold">:</td>
                <td className="py-0.5 font-bold uppercase">{tempat}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-normal">Hari/Tanggal</td>
                <td className="py-0.5 font-semibold">:</td>
                <td className="py-0.5 font-bold uppercase">{hariTanggal}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-normal">Pukul</td>
                <td className="py-0.5 font-semibold">:</td>
                <td className="py-0.5 font-bold uppercase">{pukul}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TABLE DAFTAR HADIR (Exact Structure Matching Attached Image) */}
        <div className="w-full overflow-hidden">
          <table
            className="w-full text-black text-xs sm:text-sm border-collapse"
            style={{
              border: '1.5px solid black',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1.5px solid black' }}>
                <th
                  style={{
                    border: '1px solid black',
                    width: '38px',
                    textAlign: 'center',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                  }}
                >
                  NO
                </th>
                <th
                  style={{
                    border: '1px solid black',
                    textAlign: 'center',
                    padding: '8px 8px',
                    fontWeight: 'bold',
                    width: '32%',
                  }}
                >
                  NAMA
                </th>
                <th
                  style={{
                    border: '1px solid black',
                    textAlign: 'center',
                    padding: '8px 8px',
                    fontWeight: 'bold',
                    width: '26%',
                  }}
                >
                  JABATAN
                </th>
                <th
                  style={{
                    border: '1px solid black',
                    textAlign: 'center',
                    padding: '8px 8px',
                    fontWeight: 'bold',
                  }}
                >
                  TANDA TANGAN
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => {
                const isEven = (index + 1) % 2 === 0; // 2, 4, 6, 8...
                const rowNum = index + 1;

                return (
                  <tr
                    key={rowNum}
                    style={{
                      borderBottom: '1px solid black',
                      height: '42px',
                    }}
                  >
                    {/* NO */}
                    <td
                      style={{
                        borderRight: '1px solid black',
                        borderLeft: '1px solid black',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        padding: '4px 2px',
                        fontSize: '13px',
                      }}
                    >
                      {rowNum}
                    </td>

                    {/* NAMA */}
                    <td
                      style={{
                        borderRight: '1px solid black',
                        verticalAlign: 'middle',
                        padding: '4px 8px',
                        fontSize: '13px',
                      }}
                    >
                      {row.nama}
                    </td>

                    {/* JABATAN */}
                    <td
                      style={{
                        borderRight: '1px solid black',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        padding: '4px 6px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {row.jabatan}
                    </td>

                    {/* TANDA TANGAN (Zig-zag / Selang-seling Format) */}
                    <td
                      style={{
                        borderRight: '1px solid black',
                        verticalAlign: 'middle',
                        padding: '2px 8px',
                        height: '44px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {!isEven ? (
                          /* ODD ROW (1, 3, 5, 7...): Positioned on the LEFT half */
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              width: '52%',
                              minHeight: '38px',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 'normal',
                                fontSize: '13px',
                                marginRight: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {rowNum}.
                            </span>
                            {row.signatureData ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  maxHeight: '38px',
                                }}
                              >
                                <img
                                  src={row.signatureData}
                                  alt={`TTD ${row.nama}`}
                                  style={{
                                    maxHeight: '36px',
                                    maxWidth: '120px',
                                    objectFit: 'contain',
                                    filter: 'contrast(1.4) brightness(0.9)',
                                  }}
                                />
                              </div>
                            ) : (
                              <span
                                style={{
                                  color: '#222222',
                                  letterSpacing: '1px',
                                  fontSize: '12px',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                .......................................
                              </span>
                            )}
                          </div>
                        ) : (
                          /* EVEN ROW (2, 4, 6, 8...): Positioned on the RIGHT half */
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              width: '100%',
                              justifyContent: 'flex-end',
                              minHeight: '38px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '52%',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 'normal',
                                  fontSize: '13px',
                                  marginRight: '4px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {rowNum}.
                              </span>
                              {row.signatureData ? (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    maxHeight: '38px',
                                  }}
                                >
                                  <img
                                    src={row.signatureData}
                                    alt={`TTD ${row.nama}`}
                                    style={{
                                      maxHeight: '36px',
                                      maxWidth: '120px',
                                      objectFit: 'contain',
                                      filter: 'contrast(1.4) brightness(0.9)',
                                    }}
                                  />
                                </div>
                              ) : (
                                <span
                                  style={{
                                    color: '#222222',
                                    letterSpacing: '1px',
                                    fontSize: '12px',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  .......................................
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
