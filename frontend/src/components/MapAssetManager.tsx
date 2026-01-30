import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '../lib/campaigns';
import type { MapLayer } from '../types';
import MapUploadModal from './MapUploadModal';

interface MapAssetManagerProps {
    campaignId: string;
    maps: MapLayer[];
    onClose: () => void;
    onRefresh: () => void;
}

export default function MapAssetManager({
    campaignId,
    maps,
    onClose,
    onRefresh,
}: MapAssetManagerProps) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (mapId: string) => campaignApi.deleteMapLayer(mapId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maps', campaignId] });
            onRefresh();
        },
    });

    const handleDelete = async (mapId: string) => {
        if (window.confirm('Are you sure you want to delete this map? This cannot be undone.')) {
            try {
                await deleteMutation.mutateAsync(mapId);
            } catch (err) {
                console.error('Failed to delete map:', err);
                alert('Failed to delete map. It might still be in use.');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="text-indigo-400">🗺️</span> Map Archives
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Manage the cartographic records of your realm
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {maps.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {maps.map((map) => (
                                <div
                                    key={map.id}
                                    className="group relative bg-slate-800/40 border border-white/5 rounded-xl p-4 flex gap-4 items-center hover:bg-slate-800/60 transition-all hover:border-indigo-500/30"
                                >
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-black/50 border border-white/5 flex-shrink-0">
                                        <img
                                            src={map.imageUrl}
                                            alt="Map thumbnail"
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-200 truncate">
                                            {map.imageUrl.split('/').pop()?.split('?')[0] || 'Unnamed Map'}
                                        </h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter flex items-center gap-1">
                                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                {map.imageWidth} x {map.imageHeight} px
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter flex items-center gap-1">
                                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                {map.hexColumns} x {map.hexRows} Hexes
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter flex items-center gap-1">
                                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                {new Date(map.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDelete(map.id!)}
                                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-red-500/5 hover:scale-105"
                                            title="Delete entry"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="text-5xl mb-6 opacity-20 filter grayscale">🗺️</div>
                            <h3 className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs mb-3">The Archives are Empty</h3>
                            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest max-w-[280px] mx-auto leading-relaxed">
                                No cartographic records have been etched into the ledger for this campaign.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-slate-950/50 flex justify-between items-center">
                    <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic">
                        "{maps.length} maps currently active in this chronicle"
                    </p>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Commence New Survey
                    </button>
                </div>
            </div>

            {isUploadOpen && (
                <MapUploadModal
                    campaignId={campaignId}
                    onClose={() => setIsUploadOpen(false)}
                    onUploadSuccess={() => {
                        setIsUploadOpen(false);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
}
