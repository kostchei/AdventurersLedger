import React, { useState, useRef, useMemo, useEffect } from 'react';
import { campaignApi } from '../lib/campaigns';

interface MapUploadModalProps {
    campaignId: string;
    onClose: () => void;
    onUploadSuccess: () => void;
}

interface CalibrationPoint {
    x: number;
    y: number;
}

const MIN_HEX_COLUMNS = 4;
const MIN_HEX_ROWS = 4;

const computeFlatCoverColumns = (imageWidth: number, hexSize: number): number => {
    if (!imageWidth || !hexSize) return MIN_HEX_COLUMNS;
    const raw = (imageWidth / hexSize + 0.5) / 1.5;
    return Math.max(MIN_HEX_COLUMNS, Math.ceil(raw) + 1);
};

const computeFlatCoverRows = (imageHeight: number, hexSize: number, columns: number): number => {
    if (!imageHeight || !hexSize || !columns) return MIN_HEX_ROWS;
    const base = Math.max(imageHeight - hexSize, 0) / (Math.sqrt(3) * hexSize) + 1;
    const offset = (columns - 1) / 2;
    return Math.max(MIN_HEX_ROWS, Math.ceil(base + offset));
};

export default function MapUploadModal({ campaignId, onClose, onUploadSuccess }: MapUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scaleMilesInput, setScaleMilesInput] = useState('100');
    const [milesPerHexInput, setMilesPerHexInput] = useState('6');
    const [calibrationPoints, setCalibrationPoints] = useState<{ start?: CalibrationPoint; end?: CalibrationPoint }>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        const allowedTypes = ['image/png', 'image/webp', 'image/jpeg'];
        if (selectedFile && allowedTypes.includes(selectedFile.type)) {
            setFile(selectedFile);
            setError(null);
            setCalibrationPoints({});

            const objectUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(objectUrl);
            setPreviewSize(null);

            const img = new Image();
            img.onload = () => {
                setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = objectUrl;
        } else {
            setError('Please select a valid image (PNG, WebP, or JPEG).');
            setFile(null);
            setDimensions(null);
            setCalibrationPoints({});
            setPreviewUrl(null);
            setPreviewSize(null);
        }
    };

    useEffect(() => {
        const element = previewRef.current;
        if (!element) {
            setPreviewSize(null);
            return;
        }

        const updateSize = () => {
            const rect = element.getBoundingClientRect();
            if (rect.width && rect.height) {
                setPreviewSize({ width: rect.width, height: rect.height });
            }
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(updateSize);
        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [dimensions, file]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const scaleDistanceMiles = useMemo(() => {
        const parsed = parseFloat(scaleMilesInput);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [scaleMilesInput]);

    const targetMilesPerHex = useMemo(() => {
        const parsed = parseFloat(milesPerHexInput);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [milesPerHexInput]);

    const measuredPixelDistance = useMemo(() => {
        const { start, end } = calibrationPoints;
        if (!start || !end) return null;
        return Math.hypot(end.x - start.x, end.y - start.y);
    }, [calibrationPoints]);

    const pixelsPerMile = useMemo(() => {
        if (!measuredPixelDistance || !scaleDistanceMiles) return null;
        return measuredPixelDistance / scaleDistanceMiles;
    }, [measuredPixelDistance, scaleDistanceMiles]);

    const hexSizePx = useMemo(() => {
        if (!pixelsPerMile || !targetMilesPerHex) return null;
        const flatWidthPx = pixelsPerMile * targetMilesPerHex;
        return flatWidthPx / 2;
    }, [pixelsPerMile, targetMilesPerHex]);

    const derivedLayout = useMemo(() => {
        if (!dimensions || !hexSizePx) return null;
        const columns = computeFlatCoverColumns(dimensions.width, hexSizePx);
        const rows = computeFlatCoverRows(dimensions.height, hexSizePx, columns);
        return { columns, rows };
    }, [dimensions, hexSizePx]);

    const isCalibrated = Boolean(pixelsPerMile && hexSizePx && derivedLayout && scaleDistanceMiles && targetMilesPerHex);

    const convertToPreviewCoords = (point: CalibrationPoint) => {
        if (!dimensions) return { x: 0, y: 0 };
        const rect = previewRef.current?.getBoundingClientRect();
        const width = rect?.width || previewSize?.width || 0;
        const height = rect?.height || previewSize?.height || 0;
        if (!width || !height || !dimensions.width || !dimensions.height) {
            return { x: 0, y: 0 };
        }
        return {
            x: (point.x / dimensions.width) * width,
            y: (point.y / dimensions.height) * height,
        };
    };

    const startPreview = calibrationPoints.start ? convertToPreviewCoords(calibrationPoints.start) : null;
    const endPreview = calibrationPoints.end ? convertToPreviewCoords(calibrationPoints.end) : null;

    const handleCalibrationClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!dimensions || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const clampedX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const clampedY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        const point: CalibrationPoint = {
            x: clampedX * dimensions.width,
            y: clampedY * dimensions.height,
        };

        setCalibrationPoints((prev) => {
            if (!prev.start) {
                return { start: point };
            }
            if (!prev.end) {
                return { start: prev.start, end: point };
            }
            return { start: point };
        });
    };

    const resetCalibration = () => {
        setCalibrationPoints({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !dimensions) return;

        if (!isCalibrated || !derivedLayout || !pixelsPerMile || !hexSizePx || !targetMilesPerHex) {
            setError(
                'Complete the scale calibration by placing the two endpoints on the scale bar so we can calculate the grid.'
            );
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();

            formData.append('map_file', file);
            formData.append('campaign', campaignId);

            // Required by the PocketBase `world_state` schema on production.
            // Default to stacking on top of existing layers.
            let zIndex = 0;
            try {
                const existingLayers = await campaignApi.getMaps(campaignId);
                const maxExisting = Math.max(
                    -1,
                    ...existingLayers
                        .map((layer) => Number((layer as unknown as { z_index?: unknown }).z_index))
                        .filter((n) => Number.isFinite(n))
                );
                zIndex = Math.max(0, maxExisting + 1);
            } catch {
                zIndex = 0;
            }
            formData.append('z_index', zIndex.toString());

            formData.append('hex_columns', derivedLayout.columns.toString());
            formData.append('hex_rows', derivedLayout.rows.toString());
            formData.append('image_width', dimensions.width.toString());
            formData.append('image_height', dimensions.height.toString());
            formData.append('pixels_per_mile', pixelsPerMile.toString());
            formData.append('miles_per_hex', targetMilesPerHex.toString());
            formData.append('hex_size', hexSizePx.toString());

            // Debug: log what we're sending
            console.log('Uploading map with data:', {
                campaignId,
                hex_columns: derivedLayout.columns,
                hex_rows: derivedLayout.rows,
                image_width: dimensions.width,
                image_height: dimensions.height,
                pixels_per_mile: pixelsPerMile,
                miles_per_hex: targetMilesPerHex,
                hex_size: hexSizePx,
                file: file.name,
            });

            await campaignApi.uploadMapLayer(campaignId, formData);

            onUploadSuccess();
            onClose();
        } catch (err: unknown) {
            console.error('Upload failed:', err);

            // Try to get the most specific message possible
            let displayMsg = 'Failed to upload map layer.';

            if (err instanceof Error) {
                displayMsg = err.message;
            }

            // If it's a PocketBase error with data
            const pbError = err as { data?: { data?: Record<string, { message?: string }> } };
            if (pbError.data && typeof pbError.data === 'object' && pbError.data.data) {
                const fieldErrors = Object.entries(pbError.data.data)
                    .map(([key, val]) => `${key}: ${val.message || String(val)}`)
                    .join(', ');

                if (fieldErrors) {
                    displayMsg = `Validation Error: ${fieldErrors}`;
                }
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
                        <span className="text-[#7a4f24]">🗺️</span> Upload Map
                    </h2>
                    <p className="adnd-muted text-sm mt-1">Upload a map to expand your campaign world.</p>
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
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file ? 'border-[#7a4f24]/80 bg-[#f0dcb4]' : 'border-[#7a4f24]/40 hover:border-[#7a4f24]'
                                }`}
                        >
                            {file ? (
                                <div className="space-y-1">
                                    <p className="adnd-ink font-medium">{file.name}</p>
                                    <p className="adnd-muted text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    {dimensions && (
                                        <p className="text-[#7a4f24] text-xs font-mono">{dimensions.width}x{dimensions.height}px</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="adnd-ink">Click to select a file</p>
                                    <p className="adnd-muted text-xs">PNG, WebP, or JPEG (max 20MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {dimensions && previewUrl && (
                        <div className="space-y-4 rounded-xl border border-[#7a4f24]/60 bg-[#f0dcb4] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold adnd-ink">Step 1 · Calibrate the scale</h3>
                                    <p className="text-xs adnd-muted">
                                        Click the two ends of the horizontal scale bar (the 100/500 mile markers) so
                                        we can calculate pixels per mile.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetCalibration}
                                    className="text-[10px] uppercase tracking-widest text-[#7a4f24] transition-opacity hover:opacity-80"
                                >
                                    Reset line
                                </button>
                            </div>

                            <div
                                ref={previewRef}
                                onClick={handleCalibrationClick}
                                className="relative flex items-center justify-center rounded-lg border border-[#7a4f24]/70 bg-[#24160c] p-2 text-xs text-[#f3e5c5]/70 transition-colors hover:border-[#d8b46c] cursor-crosshair"
                                style={{ minHeight: '220px' }}
                            >
                                <img
                                    src={previewUrl}
                                    alt="Map preview for calibration"
                                    className="pointer-events-none h-full w-full max-h-[320px] object-contain"
                                />
                                {(startPreview || endPreview) && (
                                    <svg className="absolute inset-0 pointer-events-none">
                                        {startPreview && endPreview && (
                                            <>
                                                <line
                                                    x1={startPreview.x}
                                                    y1={startPreview.y}
                                                    x2={endPreview.x}
                                                    y2={endPreview.y}
                                                    stroke="rgba(248,245,239,0.8)"
                                                    strokeWidth={3}
                                                    strokeLinecap="round"
                                                />
                                                <circle
                                                    cx={startPreview.x}
                                                    cy={startPreview.y}
                                                    r={4}
                                                    fill="#fde68a"
                                                    stroke="white"
                                                    strokeWidth={2}
                                                />
                                                <circle
                                                    cx={endPreview.x}
                                                    cy={endPreview.y}
                                                    r={4}
                                                    fill="#fde68a"
                                                    stroke="white"
                                                    strokeWidth={2}
                                                />
                                            </>
                                        )}
                                    </svg>
                                )}
                                <div className="absolute bottom-3 left-3 text-[11px] text-[#f3e5c5]/80">
                                    {!calibrationPoints.start
                                        ? 'Click the first endpoint'
                                        : !calibrationPoints.end
                                            ? 'Click the second endpoint'
                                            : 'Measurement captured — click again to restart'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                                <label className="space-y-1 text-left">
                                    <span className="text-xs adnd-muted">Measured miles for the line</span>
                                    <input
                                        id="scale-miles"
                                        name="scale_miles"
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={scaleMilesInput}
                                        onChange={(e) => setScaleMilesInput(e.target.value)}
                                        className="w-full adnd-input rounded px-3 py-2 text-sm"
                                    />
                                </label>
                                <label className="space-y-1 text-left">
                                    <span className="text-xs adnd-muted">Target hex width (across flats)</span>
                                    <input
                                        id="miles-per-hex"
                                        name="miles_per_hex"
                                        type="number"
                                        min={1}
                                        step={0.5}
                                        value={milesPerHexInput}
                                        onChange={(e) => setMilesPerHexInput(e.target.value)}
                                        className="w-full adnd-input rounded px-3 py-2 text-sm"
                                    />
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-3 text-[11px] adnd-muted">
                                <span>Pixels/mile: {pixelsPerMile ? pixelsPerMile.toFixed(2) : '—'}</span>
                                <span>Hex radius (px): {hexSizePx ? hexSizePx.toFixed(1) : '—'}</span>
                                <span>Columns: {derivedLayout?.columns ?? '—'}</span>
                                <span>Rows: {derivedLayout?.rows ?? '—'}</span>
                                <span>Measured px: {measuredPixelDistance ? measuredPixelDistance.toFixed(1) : '—'}</span>
                            </div>
                        </div>
                    )}

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
                            disabled={!file || isUploading || !isCalibrated}
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
