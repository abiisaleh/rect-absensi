import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Download,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { KegiatanSession } from '../types';

interface ShareModalProps {
  session: KegiatanSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  session,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen || !session) return null;

  // Construct absolute shareable URL to direct form page
  const getShareUrl = () => {
    try {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}?page=form&session=${encodeURIComponent(session.id)}`;
    } catch {
      return `?page=form&session=${session.id}`;
    }
  };

  const shareUrl = getShareUrl();

  // Generate QR Code
  useEffect(() => {
    if (!isOpen || !session) return;
    setQrLoaded(false);

    const timer = setTimeout(() => {
      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          shareUrl,
          {
            width: 220,
            margin: 2,
            color: {
              dark: '#1e1b4b', // deep indigo
              light: '#ffffff',
            },
          },
          (err) => {
            if (!err) {
              setQrLoaded(true);
            }
          }
        );
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, session, shareUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_Absensi_${session.judul_kegiatan.replace(/\s+/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleWhatsAppShare = () => {
    const text = `*Absensi Kehadiran Online*\n\nKegiatan: *${session.judul_kegiatan}*\n\nSilakan isi kehadiran dan bubuhkan tanda tangan digital Anda melalui tautan berikut:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Formulir Absensi</span>
            </div>
            <h3 className="font-bold text-slate-900 text-lg line-clamp-1">
              {session.judul_kegiatan}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Peserta dapat memindai kode QR atau membuka tautan langsung untuk mengisi daftar hadir
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5 font-medium flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pindai menggunakan kamera smartphone untuk membuka form</span>
          </p>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Unduh Gambar QR Code</span>
          </button>
        </div>

        {/* Link Input & Copy Button */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tautan Langsung Formulir (Link Form)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none select-all"
            />
            <button
              type="button"
              id="btn-copy-share-url"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-2xs cursor-pointer ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Bagikan via WhatsApp</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-slate-600" />
            <span>Buka di Tab Baru</span>
          </a>
        </div>

        {/* Footer Close */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
