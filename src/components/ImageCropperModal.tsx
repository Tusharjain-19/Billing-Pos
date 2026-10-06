import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, ZoomIn, ZoomOut, RotateCw, Check, X, Move } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  aspectRatio?: number; // default 1 (square 1:1)
  isCircle?: boolean;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  title = 'Crop & Position Image',
  aspectRatio = 1,
  isCircle = false,
  onCropComplete,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // in degrees: 0, 90, 180, 270
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load Image Object
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw Canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Center of canvas
    ctx.translate(width / 2, height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom and user pan
    ctx.scale(zoom, zoom);

    // Calculate image render dimensions maintaining aspect ratio
    const imgAspect = imageObj.width / imageObj.height;
    let drawW = width;
    let drawH = width / imgAspect;

    if (drawH < height) {
      drawH = height;
      drawW = height * imgAspect;
    }

    ctx.drawImage(
      imageObj,
      -drawW / 2 + pan.x,
      -drawH / 2 + pan.y,
      drawW,
      drawH
    );

    ctx.restore();

    // Draw Mask Overlay (Darkening outside crop zone)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, width, height);

    // Cut out the crop window
    const boxSize = Math.min(width, height) * 0.85;
    const cropX = (width - boxSize) / 2;
    const cropY = (height - boxSize) / 2;

    ctx.globalCompositeOperation = 'destination-out';
    if (isCircle) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, boxSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rounded rectangle
      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(cropX + radius, cropY);
      ctx.lineTo(cropX + boxSize - radius, cropY);
      ctx.quadraticCurveTo(cropX + boxSize, cropY, cropX + boxSize, cropY + radius);
      ctx.lineTo(cropX + boxSize, cropY + boxSize - radius);
      ctx.quadraticCurveTo(cropX + boxSize, cropY + boxSize, cropX + boxSize - radius, cropY + boxSize);
      ctx.lineTo(cropX + radius, cropY + boxSize);
      ctx.quadraticCurveTo(cropX, cropY + boxSize, cropX, cropY + boxSize - radius);
      ctx.lineTo(cropX, cropY + radius);
      ctx.quadraticCurveTo(cropX, cropY, cropX + radius, cropY);
      ctx.closePath();
      ctx.fill();
    }

    // Border around crop zone
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    if (isCircle) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, boxSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(cropX + radius, cropY);
      ctx.lineTo(cropX + boxSize - radius, cropY);
      ctx.quadraticCurveTo(cropX + boxSize, cropY, cropX + boxSize, cropY + radius);
      ctx.lineTo(cropX + boxSize, cropY + boxSize - radius);
      ctx.quadraticCurveTo(cropX + boxSize, cropY + boxSize, cropX + boxSize - radius, cropY + boxSize);
      ctx.lineTo(cropX + radius, cropY + boxSize);
      ctx.quadraticCurveTo(cropX, cropY + boxSize, cropX, cropY + boxSize - radius);
      ctx.lineTo(cropX, cropY + radius);
      ctx.quadraticCurveTo(cropX, cropY, cropX + radius, cropY);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }, [imageObj, zoom, rotation, pan, isCircle]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse / Touch handlers for panning
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Crop & Export
  const handleExportCrop = () => {
    if (!imageObj) return;

    // Create export offscreen canvas (400x400 output)
    const exportSize = 400;
    const offscreen = document.createElement('canvas');
    offscreen.width = exportSize;
    offscreen.height = exportSize;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const boxSize = Math.min(canvas.width, canvas.height) * 0.85;
    const cropX = (canvas.width - boxSize) / 2;
    const cropY = (canvas.height - boxSize) / 2;

    // Temporary full render canvas without mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.translate(canvas.width / 2, canvas.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(zoom, zoom);

    const imgAspect = imageObj.width / imageObj.height;
    let drawW = canvas.width;
    let drawH = canvas.width / imgAspect;
    if (drawH < canvas.height) {
      drawH = canvas.height;
      drawW = canvas.height * imgAspect;
    }

    tempCtx.drawImage(
      imageObj,
      -drawW / 2 + pan.x,
      -drawH / 2 + pan.y,
      drawW,
      drawH
    );

    // Draw the cropped section onto offscreen canvas
    ctx.drawImage(
      tempCanvas,
      cropX,
      cropY,
      boxSize,
      boxSize,
      0,
      0,
      exportSize,
      exportSize
    );

    // Export as clean WebP / JPEG (quality 0.88, lightweight ~30KB)
    const croppedDataUrl = offscreen.toDataURL('image/webp', 0.88);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 130,
      padding: '12px',
    }}>
      <div className="animate-slide-up" style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        padding: '20px',
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
            }}>
              <Crop size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {title}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Drag to reposition • Slide to zoom
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '50%',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Canvas Area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            backgroundColor: '#0F172A',
            borderRadius: '16px',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => {
            if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={380}
            height={280}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '4px 10px',
            borderRadius: '999px',
            color: '#ffffff',
            fontSize: '10.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none',
          }}>
            <Move size={12} />
            <span>Drag image to position</span>
          </div>
        </div>

        {/* Zoom & Rotate Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 10px',
          backgroundColor: 'var(--bg-app)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}>
          <button
            onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.15))}
            style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          <input
            type="range"
            min="0.6"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              flex: 1,
              accentColor: 'var(--primary)',
              cursor: 'pointer',
              height: '4px',
            }}
          />

          <button
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.15))}
            style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)' }} />

          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '11.5px',
              fontWeight: 700,
            }}
            title="Rotate 90 degrees"
          >
            <RotateCw size={13} />
            <span>Rotate</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '13.5px',
              fontWeight: 700,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleExportCrop}
            className="glow-btn-green"
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
