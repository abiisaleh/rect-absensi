export interface KegiatanSession {
  id: string;
  judul_kegiatan: string;
  batas_waktu: string; // ISO string format (e.g. 2026-09-22T17:00)
  daftar_jabatan: string[]; // List of selectable positions, e.g. ['Staff', 'Manajer', 'Lainnya']
  created_at: string;
  // Official Kop Surat & Event Metadata for PDF Print
  instansi?: string;
  sub_instansi?: string;
  alamat?: string;
  tempat?: string;
  hari_tanggal?: string;
  pukul?: string;
  logo_url?: string;
}

export interface AbsensiRecord {
  id: string;
  session_id?: string;
  judul_kegiatan?: string;
  created_at: string;
  nama: string;
  jabatan: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Tugas Luar' | 'Dinas';
  signature_data: string; // base64 PNG data URL
  keterangan?: string;
  waktu_absen: string;
  synced_to_supabase?: boolean;
}

export type JabatanType = string;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isConnected: boolean;
}
