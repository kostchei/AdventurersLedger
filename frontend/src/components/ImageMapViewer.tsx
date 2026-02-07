import { useEffect, useState } from 'react';
import type { MapLayer } from '../types';

interface ImageMapViewerProps {
  map: MapLayer;
}

export default function ImageMapViewer({ map }: ImageMapViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  useEffect(() => {
    setImageLoaded(false);
    setImageLoadError(null);
  }, [map.imageUrl]);

  return (
    <div className="relative w-full h-full overflow-auto bg-[#efe0bf]">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7a4f24] mx-auto mb-4"></div>
            <p className="adnd-muted">Loading map...</p>
          </div>
        </div>
      )}

      <img
        src={map.imageUrl}
        alt="Campaign map"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageLoaded(true);
          setImageLoadError(`Failed to load map asset: ${map.imageUrl}`);
        }}
        className="block max-w-none shadow-2xl mx-auto"
        style={{
          width: map.imageWidth || undefined,
          height: map.imageHeight || undefined,
        }}
      />

      {imageLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="adnd-surface p-6 rounded-xl max-w-md text-center shadow-2xl">
            <div className="text-4xl mb-3">!</div>
            <h3 className="text-xl adnd-display text-[#2c1d0f] mb-2">Map Load Failed</h3>
            <p className="adnd-muted text-sm mb-4">{imageLoadError}</p>
            <p className="text-xs adnd-muted italic">Try re-uploading the asset.</p>
          </div>
        </div>
      )}
    </div>
  );
}

