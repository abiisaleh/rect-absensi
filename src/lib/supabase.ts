import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AbsensiRecord } from '../types';

const STORAGE_CONFIG_KEY = 'absensi_supabase_config';
const LOCAL_STORAGE_RECORDS_KEY = 'absensi_records_cache';

export interface SupabaseSettings {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseSettings {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  try {
    const custom = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey };
      }
    }
  } catch {
    // Ignore JSON error
  }

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseSettings): void {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  // Invalidate cached client
  supabaseInstance = null;
}

export function clearStoredSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_CONFIG_KEY);
  supabaseInstance = null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  // Basic validation of URL format
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: false,
        },
      });
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export const SUPABASE_SQL_SCHEMA = `-- Jalankan SQL ini di menu "SQL Editor" pada dashboard Supabase Anda
-- (Klik "New Query", paste kode ini, lalu klik "Run")

CREATE TABLE IF NOT EXISTS absensi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  status TEXT DEFAULT 'Hadir' NOT NULL,
  signature_data TEXT NOT NULL,
  keterangan TEXT,
  waktu_absen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

-- Kebijakan agar siapa saja (publik / anonim) dapat mengisi form absensi
CREATE POLICY "Izinkan Insert Absensi Publik" 
ON absensi 
FOR INSERT 
WITH CHECK (true);

-- Kebijakan agar siapa saja dapat melihat daftar absensi
CREATE POLICY "Izinkan Baca Absensi Publik" 
ON absensi 
FOR SELECT 
USING (true);
`;

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableExists?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'URL atau Anon Key Supabase belum diatur.',
    };
  }

  try {
    const { data, error } = await client.from('absensi').select('id').limit(1);

    if (error) {
      // Check if table missing error (code 42P01 in postgres)
      if (error.code === '42P01' || error.message.includes('relation "absensi" does not exist') || error.message.includes('absensi')) {
        return {
          success: false,
          tableExists: false,
          message: 'Terkoneksi ke Supabase, namun tabel "absensi" belum dibuat. Harap jalankan SQL Schema di SQL Editor Supabase.',
        };
      }
      return {
        success: false,
        message: `Koneksi gagal: ${error.message}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: 'Koneksi ke Supabase dan tabel "absensi" berhasil terverifikasi!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat menguji koneksi.',
    };
  }
}

// Local storage fallback helpers
export function getLocalAbsensi(): AbsensiRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAbsensi(record: AbsensiRecord): void {
  try {
    const list = getLocalAbsensi();
    list.unshift(record);
    localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save to local storage cache:', err);
  }
}

// Main save function: Attempts Supabase first, saves to local cache if offline/unconfigured
export async function submitAbsensiToDatabase(
  record: Omit<AbsensiRecord, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: AbsensiRecord; error?: string; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  const id = crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`;
  const now = new Date().toISOString();

  const payload: AbsensiRecord = {
    ...record,
    id,
    created_at: now,
    synced_to_supabase: false,
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('absensi')
        .insert([
          {
            nama: record.nama,
            jabatan: record.jabatan,
            status: record.status,
            signature_data: record.signature_data,
            keterangan: record.keterangan || null,
            waktu_absen: record.waktu_absen || now,
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn('Gagal menyimpan ke Supabase, menyimpan ke lokal:', error.message);
        payload.synced_to_supabase = false;
        saveLocalAbsensi(payload);
        return {
          success: true,
          data: payload,
          error: `Tersimpan secara lokal. Gagal kirim ke Supabase: ${error.message}`,
          source: 'local',
        };
      }

      const savedRecord: AbsensiRecord = {
        id: data.id,
        nama: data.nama,
        jabatan: data.jabatan,
        status: data.status,
        signature_data: data.signature_data,
        keterangan: data.keterangan || '',
        waktu_absen: data.waktu_absen,
        created_at: data.created_at,
        synced_to_supabase: true,
      };

      // Also update local cache
      saveLocalAbsensi(savedRecord);

      return {
        success: true,
        data: savedRecord,
        source: 'supabase',
      };
    } catch (err: any) {
      console.warn('Error saat request Supabase:', err);
      payload.synced_to_supabase = false;
      saveLocalAbsensi(payload);
      return {
        success: true,
        data: payload,
        error: `Tersimpan secara lokal. Koneksi Supabase bermasalah: ${err.message}`,
        source: 'local',
      };
    }
  }

  // If client is not configured
  payload.synced_to_supabase = false;
  saveLocalAbsensi(payload);
  return {
    success: true,
    data: payload,
    source: 'local',
  };
}

// Fetch records from Supabase, or fall back to local
export async function fetchAbsensiRecords(): Promise<{
  data: AbsensiRecord[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('absensi')
        .select('*')
        .order('waktu_absen', { ascending: false });

      if (!error && data) {
        const mapped: AbsensiRecord[] = data.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          jabatan: item.jabatan,
          status: item.status || 'Hadir',
          signature_data: item.signature_data,
          keterangan: item.keterangan || '',
          waktu_absen: item.waktu_absen,
          created_at: item.created_at,
          synced_to_supabase: true,
        }));
        return { data: mapped, source: 'supabase' };
      }
    } catch (err: any) {
      console.warn('Supabase fetch failed, fallback to local cache:', err);
    }
  }

  return {
    data: getLocalAbsensi(),
    source: 'local',
  };
}
