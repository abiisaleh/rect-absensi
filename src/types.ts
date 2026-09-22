export interface AbsensiRecord {
  id: string;
  created_at: string;
  nama: string;
  jabatan: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Tugas Luar' | 'Dinas';
  signature_data: string; // base64 PNG data URL
  keterangan?: string;
  waktu_absen: string;
  synced_to_supabase?: boolean;
}

export type JabatanType =
  | 'Direktur'
  | 'Manajer'
  | 'Supervisor'
  | 'Staff / Karyawan'
  | 'Teknisi'
  | 'Administrasi'
  | 'Keuangan / Akuntansi'
  | 'Magang / Intern'
  | 'Tamu / Pengunjung'
  | 'Lainnya';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isConnected: boolean;
}
