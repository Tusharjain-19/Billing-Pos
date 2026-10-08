import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  X,
  Move,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Circle,
  Square,
  RectangleHorizontal,
} from 'lucide-react';

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
  title = 'Crop & Position Restaurant Logo',
  aspectRatio = 1,
  isCircle = false,
  onCropComplete,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Shape Mode: 'square' | 'circle' | 'wide'
  const [shapeMode, setShapeMode] = useState<'square' | 'circle' | 'wide'>(isCircle ? 'circle' : 'square');

  // Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
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

    // Clear background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center point
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

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

    // Dark Mask Overlay
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 29, 0.72)';
    ctx.fillRect(0, 0, width, height);

    // Calculate Crop Box based on shape
    let boxW = Math.min(width, height) * 0.78;
    let boxH = boxW;

    if (shapeMode === 'wide') {
      boxW = width * 0.88;
      boxH = boxW * 0.6;
    }

    const cropX = (width - boxW) / 2;
    const cropY = (height - boxH) / 2;

    ctx.globalCompositeOperation = 'destination-out';

    if (shapeMode === 'circle') {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, boxW / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(cropX + radius, cropY);
      ctx.lineTo(cropX + boxW - radius, cropY);
      ctx.quadraticCurveTo(cropX + boxW, cropY, cropX + boxW, cropY + radius);
      ctx.lineTo(cropX + boxW, cropY + boxH - radius);
      ctx.quadraticCurveTo(cropX + boxW, cropY + boxH, cropX + boxW - radius, cropY + boxH);
      ctx.lineTo(cropX + radius, cropY + boxH);
      ctx.quadraticCurveTo(cropX, cropY + boxH, cropX, cropY + boxH - radius);
      ctx.lineTo(cropX, cropY + radius);
      ctx.quadraticCurveTo(cropX, cropY, cropX + radius, cropY);
      ctx.closePath();
      ctx.fill();
    }

    // Grid Guidelines & Border
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw 3x3 Grid Lines inside crop area
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    if (shapeMode !== 'circle') {
      // Vertical grid lines
      ctx.beginPath();
      ctx.moveTo(cropX + boxW / 3, cropY);
      ctx.lineTo(cropX + boxW / 3, cropY + boxH);
      ctx.moveTo(cropX + (boxW * 2) / 3, cropY);
      ctx.lineTo(cropX + (boxW * 2) / 3, cropY + boxH);
      // Horizontal grid lines
      ctx.moveTo(cropX, cropY + boxH / 3);
      ctx.lineTo(cropX + boxW, cropY + boxH / 3);
      ctx.moveTo(cropX, cropY + (boxH * 2) / 3);
      ctx.lineTo(cropX + boxW, cropY + (boxH * 2) / 3);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Glowing Green Outer Border
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;

    if (shapeMode === 'circle') {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, boxW / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(cropX + radius, cropY);
      ctx.lineTo(cropX + boxW - radius, cropY);
      ctx.quadraticCurveTo(cropX + boxW, cropY, cropX + boxW, cropY + radius);
      ctx.lineTo(cropX + boxW, cropY + boxH - radius);
      ctx.quadraticCurveTo(cropX + boxW, cropY + boxH, cropX + boxW - radius, cropY + boxH);
      ctx.lineTo(cropX + radius, cropY + boxH);
      ctx.quadraticCurveTo(cropX, cropY + boxH, cropX, cropY + boxH - radius);
      ctx.lineTo(cropX, cropY + radius);
      ctx.quadraticCurveTo(cropX, cropY, cropX + radius, cropY);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }, [imageObj, zoom, rotation, pan, shapeMode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Pointer dragging handlers
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

  // Reset adjustments
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Export High Resolution Cropped Image
  const handleExportCrop = () => {
    if (!imageObj) return;

    const exportW = shapeMode === 'wide' ? 600 : 512;
    const exportH = shapeMode === 'wide' ? 360 : 512;

    const offscreen = document.createElement('canvas');
    offscreen.width = exportW;
    offscreen.height = exportH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let boxW = Math.min(canvas.width, canvas.height) * 0.78;
    let boxH = boxW;
    if (shapeMode === 'wide') {
      boxW = canvas.width * 0.88;
      boxH = boxW * 0.6;
    }

    const cropX = (canvas.width - boxW) / 2;
    const cropY = (canvas.height - boxH) / 2;

    // Render full transformed image
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

    // If circle mode, clip destination
    if (shapeMode === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(exportW / 2, exportH / 2, exportW / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(
      tempCanvas,
      cropX,
      cropY,
      boxW,
      boxH,
      0,
      0,
      exportW,
      exportH
    );

    if (shapeMode === 'circle') {
      ctx.restore();
    }

    // High quality JPEG/PNG
    const croppedDataUrl = offscreen.toDataURL('image/jpeg', 0.92);
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
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '1.5px solid #E2E8F0',
        padding: '22px',
        width: '100%',
        maxWidth: '460px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 25px 65px rgba(0, 0, 0, 0.35)',
        animation: 'fadeIn 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
            }}>
              <Crop size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16.5px', fontWeight: 850, margin: 0, color: '#0F172A' }}>
                {title}
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
                Pan & zoom to fit your bill logo perfectly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#64748B',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Shape Mode Presets */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShapeMode('square')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '9px',
              backgroundColor: shapeMode === 'square' ? '#2563EB' : '#F8FAFC',
              color: shapeMode === 'square' ? '#FFFFFF' : '#334155',
              border: `1px solid ${shapeMode === 'square' ? '#2563EB' : '#CBD5E1'}`,
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            <Square size={13} />
            <span>Square (1:1)</span>
          </button>

          <button
            type="button"
            onClick={() => setShapeMode('circle')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '9px',
              backgroundColor: shapeMode === 'circle' ? '#2563EB' : '#F8FAFC',
              color: shapeMode === 'circle' ? '#FFFFFF' : '#334155',
              border: `1px solid ${shapeMode === 'circle' ? '#2563EB' : '#CBD5E1'}`,
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            <Circle size={13} />
            <span>Circular</span>
          </button>

          <button
            type="button"
            onClick={() => setShapeMode('wide')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '9px',
              backgroundColor: shapeMode === 'wide' ? '#2563EB' : '#F8FAFC',
              color: shapeMode === 'wide' ? '#FFFFFF' : '#334155',
              border: `1px solid ${shapeMode === 'wide' ? '#2563EB' : '#CBD5E1'}`,
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            <RectangleHorizontal size={13} />
            <span>Header Banner</span>
          </button>
        </div>

        {/* Canvas Area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '290px',
            backgroundColor: '#0F172A',
            borderRadius: '16px',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
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
            width={420}
            height={290}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '999px',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 650,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}>
            <Move size={12} />
            <span>Drag to adjust position</span>
          </div>
        </div>

        {/* Zoom, Rotate & Quick Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}>
          <button
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.15))}
            style={{ background: 'none', border: 'none', color: '#64748B', padding: '4px', cursor: 'pointer' }}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              flex: 1,
              accentColor: '#2563EB',
              cursor: 'pointer',
              height: '5px',
            }}
          />

          <button
            onClick={() => setZoom((prev) => Math.min(3.5, prev + 0.15))}
            style={{ background: 'none', border: 'none', color: '#64748B', padding: '4px', cursor: 'pointer' }}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', minWidth: '40px', textAlign: 'right' }}>
            {Math.round(zoom * 100)}%
          </span>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#CBD5E1' }} />

          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              fontSize: '11.5px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
            title="Rotate 90° clockwise"
          >
            <RotateCw size={13} />
            <span>Rotate</span>
          </button>

          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#64748B',
              fontSize: '11.5px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
            title="Reset position and zoom"
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#475569',
              fontSize: '13.5px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleExportCrop}
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 850,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
            }}
          >
            <Check size={18} />
            <span>Save & Set Logo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
