import { useEffect, useRef, useState } from 'react';
import { ScanLine, Keyboard, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { hapticSuccess, hapticMedium } from '../lib/haptics';
import { colors } from '../theme';
import { t } from '../i18n';
import type { Item } from '../types';

type Props = {
  onScan: (item: Item) => void;
  onNew: (barcode: string) => void;
};

export default function BarcodeScanner({ onScan, onNew }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const { items, loadItems } = useStore();
  const lockedRef = useRef(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setActive(true);
      setError(null);
      startDetecting();
    } catch {
      setError(t.camera_permission);
      setManualMode(true);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }

  function startDetecting() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let ticking = false;

    function tick() {
      if (!video || !ctx || !streamRef.current) {
        requestAnimationFrame(tick);
        return;
      }
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      if (!ticking) {
        ticking = true;
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'code_128', 'code_39', 'qr_code', 'ean_8'],
          });
          detector
            .detect(canvas)
            .then((codes: any[]) => {
              if (codes.length > 0 && !lockedRef.current) {
                handleBarcode(codes[0].rawValue);
              }
            })
            .catch(() => {})
            .finally(() => {
              ticking = false;
            });
        } else {
          ticking = false;
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  async function handleBarcode(code: string) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    hapticSuccess();
    setScanned(true);

    const existing = items.find((i) => i.barcode === code);
    if (existing) {
      onScan(existing);
    } else {
      const { data } = await supabase
        .from('items')
        .insert({
          name: t.new_product,
          barcode: code,
          quantity: 0,
          cost_price: 0,
          sell_price: 0,
          min_threshold: 5,
        })
        .select()
        .single();
      await loadItems();
      if (data) onNew(code);
    }

    setTimeout(() => {
      lockedRef.current = false;
      setScanned(false);
    }, 1500);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualValue.trim()) {
      hapticMedium();
      handleBarcode(manualValue.trim());
      setManualValue('');
    }
  }

  return (
    <div className="scanner-container">
      <video
        ref={videoRef}
        className="scanner-video"
        playsInline
        muted
      />

      {active && !manualMode && (
        <div className="scanner-overlay">
          <div className={`scanner-frame ${scanned ? 'scanner-frame-active' : ''}`}>
            <div className="scanner-corner scanner-corner-tl" />
            <div className="scanner-corner scanner-corner-tr" />
            <div className="scanner-corner scanner-corner-bl" />
            <div className="scanner-corner scanner-corner-br" />
            {scanned && (
              <div className="scanner-check">
                <Check size={48} color={colors.success} />
              </div>
            )}
          </div>
          <p className="scanner-hint">{t.scan_hint}</p>
          <button
            className="scanner-toggle"
            onClick={() => {
              hapticMedium();
              stopCamera();
              setManualMode(true);
            }}
          >
            <Keyboard size={18} />
            <span>{t.enter_barcode}</span>
          </button>
        </div>
      )}

      {manualMode && (
        <div className="scanner-manual">
          <ScanLine size={64} color={colors.primary} strokeWidth={1.5} />
          <form onSubmit={handleManualSubmit} className="manual-form">
            <input
              type="text"
              className="manual-input"
              placeholder={t.enter_barcode}
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              autoFocus
              dir="ltr"
            />
            <button type="submit" className="btn-primary">
              {t.confirm}
            </button>
          </form>
          {!error && (
            <button
              className="scanner-toggle"
              onClick={() => {
                hapticMedium();
                setManualMode(false);
                startCamera();
              }}
            >
              <ScanLine size={18} />
              <span>استخدام الكاميرا</span>
            </button>
          )}
        </div>
      )}

      {error && manualMode && (
        <div className="scanner-error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
