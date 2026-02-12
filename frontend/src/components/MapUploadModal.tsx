import { useEffect, useRef, useState } from 'react';
import { campaignApi } from '../lib/campaigns';

interface MapUploadModalProps {
  campaignId: string;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function MapUploadModal({ campaignId, onClose, onUploadSuccess }: MapUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zIndex, setZIndex] = useState(0);
  const [hexColumns, setHexColumns] = useState<number | ''>('');
  const [hexRows, setHexRows] = useState<number | ''>('');
  const [hexOrientation, setHexOrientation] = useState<'flat' | 'pointy'>('flat');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    const allowedTypes = ['image/png', 'image/webp', 'image/jpeg'];

    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);

      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);

      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setDimensions(null);
      };
      img.src = objectUrl;
    } else {
      setError('Please select a valid image (PNG, WebP, or JPEG).');
      setFile(null);
      setDimensions(null);
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('map_file', file);
      formData.append('campaign', campaignId);

      if (dimensions) {
        formData.append('image_width', dimensions.width.toString());
        formData.append('image_height', dimensions.height.toString());
      }

      // Hex grid metadata (optional but recommended for Fog of War).
      formData.append('z_index', String(zIndex));
      formData.append('hex_orientation', hexOrientation);
      if (hexColumns !== '' && Number.isFinite(Number(hexColumns))) {
        formData.append('hex_columns', String(hexColumns));
      }
      if (hexRows !== '' && Number.isFinite(Number(hexRows))) {
        formData.append('hex_rows', String(hexRows));
      }

      await campaignApi.uploadMapLayer(campaignId, formData);

      onUploadSuccess();
      onClose();
    } catch (err: unknown) {
      let displayMsg = 'Failed to upload map.';
      if (err instanceof Error) displayMsg = err.message;

      const pbError = err as { data?: { data?: Record<string, { message?: string }> } };
      if (pbError.data && typeof pbError.data === 'object' && pbError.data.data) {
        const fieldErrors = Object.entries(pbError.data.data)
          .map(([key, val]) => `${key}: ${val.message || String(val)}`)
          .join(', ');
        if (fieldErrors) displayMsg = `Validation Error: ${fieldErrors}`;
      }

      setError(displayMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="adnd-surface rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#7a4f24]/40 bg-[#efe0bf]">
          <h2 className="text-xl adnd-display text-[#2c1d0f] flex items-center gap-2">
            <span className="text-[#7a4f24]">Map</span> Upload
          </h2>
          <p className="adnd-muted text-sm mt-1">Upload a map image for this campaign.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#6b2a22]/20 border border-[#7a4f24]/60 rounded-lg text-[#b44a3a] text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="map-file" className="block text-sm font-medium adnd-muted mb-1">
              Map Image
            </label>
            <input
              id="map-file"
              name="map_file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/webp, image/jpeg"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file ? 'border-[#7a4f24]/80 bg-[#f0dcb4]' : 'border-[#7a4f24]/40 hover:border-[#7a4f24]'
              }`}
            >
              {file ? (
                <div className="space-y-1">
                  <p className="adnd-ink font-medium">{file.name}</p>
                  <p className="adnd-muted text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {dimensions && (
                    <p className="text-[#7a4f24] text-xs font-mono">
                      {dimensions.width}x{dimensions.height}px
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="adnd-ink">Click to select a file</p>
                  <p className="adnd-muted text-xs">PNG, WebP, or JPEG</p>
                </div>
              )}
            </div>
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-[#7a4f24]/60 bg-[#f0dcb4] p-3">
              <img src={previewUrl} alt="Map preview" className="w-full max-h-[40vh] object-contain rounded-lg" />
            </div>
          )}

          <div className="rounded-xl border border-[#7a4f24]/60 bg-[#f0dcb4] p-4 space-y-3">
            <div>
              <h3 className="text-xs font-black adnd-muted uppercase tracking-widest">Hex Grid</h3>
              <p className="text-[10px] adnd-muted-light font-bold uppercase tracking-widest mt-1">
                Needed for Fog of War and hex interactions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] adnd-muted uppercase font-black tracking-widest mb-1">Z Index</label>
                <input
                  type="number"
                  value={zIndex}
                  onChange={(e) => setZIndex(parseInt(e.target.value || '0', 10) || 0)}
                  className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                />
              </div>
              <div>
                <label className="block text-[10px] adnd-muted uppercase font-black tracking-widest mb-1">Orientation</label>
                <select
                  value={hexOrientation}
                  onChange={(e) => setHexOrientation(e.target.value === 'pointy' ? 'pointy' : 'flat')}
                  className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                >
                  <option value="flat">Flat</option>
                  <option value="pointy">Pointy</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] adnd-muted uppercase font-black tracking-widest mb-1">Hex Columns</label>
                <input
                  type="number"
                  min={1}
                  value={hexColumns}
                  onChange={(e) => setHexColumns(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                  placeholder="e.g. 80"
                />
              </div>
              <div>
                <label className="block text-[10px] adnd-muted uppercase font-black tracking-widest mb-1">Hex Rows</label>
                <input
                  type="number"
                  min={1}
                  value={hexRows}
                  onChange={(e) => setHexRows(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                  placeholder="e.g. 60"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#7a4f24]/60 text-[#2c1d0f] rounded-lg hover:bg-[#e7d3aa] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex-1 px-4 py-2 bg-[#3b2615] text-[#f3e5c5] rounded-lg hover:bg-[#4b311a] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isUploading ? 'Uploading...' : 'Upload Map'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
