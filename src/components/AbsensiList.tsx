import React, { useState } from 'react';
import {
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  User,
  Briefcase,
  Calendar,
  X,
  Database,
  Cloud,
} from 'lucide-react';
import { AbsensiRecord } from '../types';

interface AbsensiListProps {
  records: AbsensiRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  source: 'supabase' | 'local';
}

export const AbsensiList: React.FC<AbsensiListProps> = ({
  records,
  isLoading,
  onRefresh,
  source,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AbsensiRecord | null>(null);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.keterangan && rec.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesJabatan = filterJabatan === 'ALL' || rec.jabatan === filterJabatan;
    const matchesStatus = filterStatus === 'ALL' || rec.status === filterStatus;

    return matchesSearch && matchesJabatan && matchesStatus;
  });

  // Unique list of jabatans from records
  const uniqueJabatans = Array.from(new Set(records.map((r) => r.jabatan)));

  // Export to CSV
  const exportToCSV = () => {
    if (records.length === 0) return;

    const headers = ['No', 'Waktu Absen', 'Nama Lengkap', 'Jabatan', 'Status', 'Keterangan'];
    const rows = filteredRecords.map((r, index) => {
      const date = new Date(r.waktu_absen).toLocaleString('id-ID');
      return [
        index + 1,
        `"${date}"`,
        `"${r.nama.replace(/"/g, '""')}"`,
        `"${r.jabatan.replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${(r.keterangan || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap-absensi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hadir':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dinas':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Tugas Luar':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Izin':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Sakit':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Riwayat Presensi
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              {filteredRecords.length} Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            {source === 'supabase' ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Cloud className="w-3.5 h-3.5" /> Terhubung Supabase Database
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Database className="w-3.5 h-3.5" /> Database Lokal (Offline)
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-none text-slate-800 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Jabatan Filter */}
        <div>
          <select
            value={filterJabatan}
            onChange={(e) => setFilterJabatan(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-700 bg-white"
          >
            <option value="ALL">Semua Jabatan ({uniqueJabatans.length})</option>
            {uniqueJabatans.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-700 bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Dinas">Dinas</option>
            <option value="Tugas Luar">Tugas Luar</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
          </select>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="mt-5">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="text-sm">Memuat data presensi...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Belum Ada Catatan Kehadiran</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Silakan isi formulir di samping untuk mencatat kehadiran baru lengkap dengan tanda tangan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama & Jabatan</th>
                  <th className="py-3 px-4">Waktu Presensi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-center">Tanda Tangan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{item.nama}</div>
                      <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span>{item.jabatan}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{formatDate(item.waktu_absen)}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{formatTime(item.waktu_absen)}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {item.keterangan || <span className="text-slate-300 italic">-</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.signature_data ? (
                        <div
                          onClick={() => setSelectedRecord(item)}
                          className="inline-block cursor-pointer group"
                          title="Klik untuk memperbesar tanda tangan"
                        >
                          <div className="w-20 h-10 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                            <img
                              src={item.signature_data}
                              alt={`TTD ${item.nama}`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <span className="text-[10px] text-indigo-600 group-hover:underline block mt-0.5">
                            Lihat TTD
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Tidak ada</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(item)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature & Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Bukti Kehadiran Digital
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-semibold text-slate-900">{selectedRecord.nama}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Jabatan:</span>
                <span className="font-semibold text-slate-900">{selectedRecord.jabatan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(selectedRecord.status)}`}>
                  {selectedRecord.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Waktu Presensi:</span>
                <span className="font-mono text-xs text-slate-800">
                  {new Date(selectedRecord.waktu_absen).toLocaleString('id-ID')}
                </span>
              </div>
              {selectedRecord.keterangan && (
                <div className="py-1 border-b border-slate-50">
                  <span className="text-slate-500 block mb-1">Keterangan:</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedRecord.keterangan}
                  </p>
                </div>
              )}

              {/* Digital Signature Inspection */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Tanda Tangan Digital Tersimpan:
                </label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center min-h-[160px]">
                  {selectedRecord.signature_data ? (
                    <img
                      src={selectedRecord.signature_data}
                      alt={`Tanda tangan ${selectedRecord.nama}`}
                      className="max-h-40 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Tidak ada tanda tangan</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tanda Tangan Sah & Terekam pada Database
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
