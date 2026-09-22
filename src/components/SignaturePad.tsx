import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, RotateCcw, PenTool, CheckCircle2, AlertCircle } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  required?: boolean;
}

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  required = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>('#0f172a'); // Slate 900 / Navy Blue
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Redraw all strokes on canvas
  const redraw = useCallback(
    (allStrokes: Stroke[], current: Stroke = []) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      // Clear full canvas in device pixels
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save state and set scale
      ctx.save();
      ctx.scale(dpr, dpr);

      // Set stroke style for user drawing
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;

      const drawStroke = (pts: Point[]) => {
        if (pts.length === 0) return;
        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }

        // Connect to last point
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      };

      // Draw historical strokes
      allStrokes.forEach((s) => drawStroke(s));

      // Draw current stroke
      if (current.length > 0) {
        drawStroke(current);
      }

      ctx.restore();
    },
    [strokeColor, strokeWidth]
  );

  // Resize canvas according to device pixel ratio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set display size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `200px`;

    // Set actual buffer size
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(200 * dpr);

    redraw(strokes, currentStroke);
  }, [strokes, currentStroke, redraw]);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas]);

  // Export current canvas to image data
  const exportSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) {
      onSignatureChange(null);
      setHasDrawn(false);
      return;
    }

    // Export transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
    setHasDrawn(true);
  }, [strokes, onSignatureChange]);

  useEffect(() => {
    exportSignature();
  }, [strokes, exportSignature]);

  // Get coordinates relative to canvas
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const point = getCoordinates(e);
    const newStroke = [point];
    setCurrentStroke(newStroke);
    redraw(strokes, newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = getCoordinates(e);
    const updated = [...currentStroke, point];
    setCurrentStroke(updated);
    redraw(strokes, updated);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);

    if (currentStroke.length > 0) {
      const updatedStrokes = [...strokes, currentStroke];
      setStrokes(updatedStrokes);
      setCurrentStroke([]);
      redraw(updatedStrokes, []);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHasDrawn(false);
    onSignatureChange(null);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        redraw([]);
      }
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    redraw(nextStrokes);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-indigo-600" />
          <span>Tanda Tangan Digital</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="flex items-center gap-1 text-xs">
          {hasDrawn ? (
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Telah Ditandatangani
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Wajib Ditandatangani
            </span>
          )}
        </div>
      </div>

      {/* Signature Canvas Box */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-xl border-2 transition-colors bg-white overflow-hidden shadow-xs touch-none ${
          hasDrawn
            ? 'border-indigo-400 focus-within:border-indigo-500'
            : 'border-dashed border-slate-300 hover:border-slate-400'
        }`}
      >
        <canvas
          id="signature-pad-canvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="cursor-crosshair block w-full touch-none select-none"
          style={{ height: '200px' }}
        />

        {/* Floating controls toolbar inside canvas box */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-xs">
          {/* Color Selector */}
          <button
            type="button"
            id="btn-color-black"
            title="Tinta Hitam"
            onClick={() => {
              setStrokeColor('#0f172a');
              redraw(strokes);
            }}
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              strokeColor === '#0f172a' ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105' : 'opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: '#0f172a' }}
          />
          <button
            type="button"
            id="btn-color-blue"
            title="Tinta Biru Pulpen"
            onClick={() => {
              setStrokeColor('#1d4ed8');
              redraw(strokes);
            }}
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              strokeColor === '#1d4ed8' ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105' : 'opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: '#1d4ed8' }}
          />

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          {/* Line thickness toggle */}
          <button
            type="button"
            id="btn-stroke-size"
            title={`Ketebalan: ${strokeWidth === 2.5 ? 'Standar' : strokeWidth === 1.5 ? 'Halus' : 'Tebal'}`}
            onClick={() => {
              const next = strokeWidth === 1.5 ? 2.5 : strokeWidth === 2.5 ? 3.8 : 1.5;
              setStrokeWidth(next);
              redraw(strokes);
            }}
            className="px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 rounded font-medium"
          >
            {strokeWidth === 1.5 ? 'Halus' : strokeWidth === 2.5 ? 'Sedang' : 'Tebal'}
          </button>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          {/* Undo */}
          <button
            type="button"
            id="btn-undo-signature"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Undo / Batalkan coretan terakhir"
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            type="button"
            id="btn-clear-signature"
            onClick={handleClear}
            disabled={strokes.length === 0}
            title="Hapus semua coretan"
            className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent rounded"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Goreskan tanda tangan dengan jari, mouse, atau stylus pen.</span>
        {strokes.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-rose-600 hover:text-rose-700 font-medium hover:underline"
          >
            Reset Tanda Tangan
          </button>
        )}
      </div>
    </div>
  );
};
