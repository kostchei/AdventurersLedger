import { useEffect, useRef, useState, useMemo } from 'react';
import { HexGrid } from '../utils/hexGrid';
import type { HexCoord } from '../utils/hexGrid';
import type { Map } from '../types';

interface HexMapViewerProps {
  map: Map;
  currentZ: number;
  revealedHexes: Set<string>; // Set of "q,r,z" strings
  partyPosition?: { hexX: number; hexY: number; z: number };
  isDM: boolean;
  onHexClick?: (hex: HexCoord & { z: number }) => void;
}

export default function HexMapViewer({
  map,
  currentZ,
  revealedHexes,
  partyPosition,
  isDM,
  onHexClick,
}: HexMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize hex grid with correct scaling and offset
  const hexGrid = useMemo(() => {
    const orientation = (map.hexOrientation as 'flat' | 'pointy') || 'flat';
    const W = map.imageWidth;
    const H = map.imageHeight;
    const Q = map.hexColumns;
    const R = map.hexRows;

    let hexSize = 20;
    let offsetX = 0;
    let offsetY = 0;

    if (orientation === 'flat') {
      hexSize = Math.min(W / (1.5 * Q + 0.5), H / (Math.sqrt(3) * (R + 0.5)));
      offsetX = hexSize;
      offsetY = (hexSize * Math.sqrt(3)) / 2;
    } else {
      hexSize = Math.min(W / (Math.sqrt(3) * (Q + 0.5)), H / (1.5 * R + 0.5));
      offsetX = (hexSize * Math.sqrt(3)) / 2;
      offsetY = hexSize;
    }

    return new HexGrid(
      hexSize,
      Q,
      R,
      orientation,
      offsetX,
      offsetY
    );
  }, [
    map.imageWidth,
    map.hexColumns,
    map.imageHeight,
    map.hexRows,
    map.hexOrientation,
    map.hexSize,
  ]);

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load map image:', map.imageUrl);
      setImageLoadError(`Failed to load map asset: ${map.imageUrl}`);
      setImageLoaded(true);
    };
    img.src = map.imageUrl;
    setImageLoaded(false);
    setImageLoadError(null);
  }, [map.imageUrl]);

  // State to trigger the interactive layer render
  const [renderNonce, setRenderNonce] = useState(0);
  const triggerInteractiveRender = () => setRenderNonce(prev => prev + 1);

  // Render base layer (static parts: map, fog, grid)
  useEffect(() => {
    if (!hexGrid || !imageLoaded || !imageRef.current) return;

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = map.imageWidth;
    baseCanvas.height = map.imageHeight;
    const ctx = baseCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw map image
    ctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    ctx.drawImage(imageRef.current, 0, 0, map.imageWidth, map.imageHeight);

    // 2. Prepare Fog Overlay
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = baseCanvas.width;
    fogCanvas.height = baseCanvas.height;
    const fogCtx = fogCanvas.getContext('2d');
    if (fogCtx) {
      fogCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      fogCtx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
      fogCtx.globalCompositeOperation = 'destination-out';

      // Add softness to the fog holes
      fogCtx.shadowBlur = 20;
      fogCtx.shadowColor = 'black';
      fogCtx.fillStyle = 'black';

      for (let q = 0; q < map.hexColumns; q++) {
        for (let r = 0; r < map.hexRows; r++) {
          const hexKey = `${q},${r},${currentZ}`;
          if (revealedHexes.has(hexKey) || isDM) {
            const corners = hexGrid.getHexCorners({ q, r, z: currentZ });
            fogCtx.beginPath();
            fogCtx.moveTo(corners[0].x, corners[0].y);
            for (let i = 1; i < corners.length; i++) {
              fogCtx.lineTo(corners[i].x, corners[i].y);
            }
            fogCtx.closePath();
            fogCtx.fill();
          }
        }
      }
      fogCtx.shadowBlur = 0; // Reset shadow
      ctx.drawImage(fogCanvas, 0, 0);
    }

    // 3. Draw hex grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let q = 0; q < map.hexColumns; q++) {
      for (let r = 0; r < map.hexRows; r++) {
        const corners = hexGrid.getHexCorners({ q, r, z: currentZ });
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) {
          ctx.lineTo(corners[i].x, corners[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    baseCanvasRef.current = baseCanvas;
    triggerInteractiveRender();
  }, [hexGrid, imageLoaded, revealedHexes, isDM, map.imageWidth, map.imageHeight, map.hexColumns, map.hexRows, currentZ]);

  // Render interactive layer (hover, party)
  useEffect(() => {
    if (!canvasRef.current || !baseCanvasRef.current || !hexGrid) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw cached base layer
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvasRef.current, 0, 0);

    // 4. Highlight hovered hex (if DM)
    if (isDM && hoveredHex && hexGrid.isInBounds(hoveredHex)) {
      const corners = hexGrid.getHexCorners(hoveredHex);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 5. Draw party position if on current Z layer
    if (partyPosition && partyPosition.z === currentZ) {
      const partyHex = { q: partyPosition.hexX, r: partyPosition.hexY, z: partyPosition.z };
      const center = hexGrid.hexToPixel(partyHex);
      const hexSize = hexGrid.hexSize;

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
      ctx.beginPath();
      ctx.arc(center.x, center.y, hexSize * 0.45, 0, 2 * Math.PI);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = `bold ${hexSize * 0.6}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', center.x, center.y);
      ctx.restore();
    }
  }, [renderNonce, hoveredHex, partyPosition, isDM, currentZ, hexGrid]);

  // Interaction handlers...
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hexGrid || !isDM) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const hex = hexGrid.pixelToHex({ x, y }, currentZ);
    setHoveredHex(hexGrid.isInBounds(hex) ? hex : null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hexGrid || !isDM || !onHexClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const hex = hexGrid.pixelToHex({ x, y }, currentZ);
    if (hexGrid.isInBounds(hex)) {
      onHexClick({ ...hex, z: currentZ });
    }
  };

  if (!imageLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading map layer {currentZ}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-auto bg-gray-950">
      <canvas
        ref={canvasRef}
        width={map.imageWidth}
        height={map.imageHeight}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredHex(null)}
        onClick={handleClick}
        className={`max-w-full h-auto ${isDM ? 'cursor-crosshair' : ''} shadow-2xl mx-auto`}
        style={{ display: 'block' }}
      />

      {imageLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-500/50 p-6 rounded-xl max-w-md text-center shadow-2xl">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Map Load Failed</h3>
            <p className="text-gray-400 text-sm mb-4">{imageLoadError}</p>
            <p className="text-xs text-gray-500 italic">Verify the map URL in the database or try re-uploading the asset.</p>
          </div>
        </div>
      )}

      {isDM && hoveredHex && (
        <div className="absolute top-4 left-4 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-lg shadow-xl text-sm backdrop-blur-md bg-opacity-80">
          <div className="font-bold border-b border-gray-700 pb-1 mb-1">Hex Coordinates</div>
          q: {hoveredHex.q}, r: {hoveredHex.r}, z: {currentZ}
          {onHexClick && <div className="text-xs text-primary-400 mt-2 font-medium">Click to Move Party</div>}
        </div>
      )}
    </div>
  );
}
