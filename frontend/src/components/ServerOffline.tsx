import React from 'react';
import { useServerStatus } from '../hooks/useServerStatus';

interface ServerOfflineProps {
    children?: React.ReactNode;
}

const ServerOffline: React.FC<ServerOfflineProps> = ({ children }) => {
    const { isOnline, isRetrying, retry, retryCount } = useServerStatus();

    if (isOnline === null) {
        // Still checking status
        return (
            <div className="min-h-screen adnd-page flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7a4f24] mx-auto mb-4"></div>
                    <p className="adnd-muted font-medium">Summoning the Realm...</p>
                </div>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="min-h-screen adnd-page flex items-center justify-center p-4 relative overflow-hidden">
                {/* Visual background elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#f6e3bf] via-[#f0dcb4] to-[#e7d3aa] opacity-70"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c79c52]/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 max-w-md w-full adnd-surface rounded-2xl p-8 shadow-2xl text-center">
                    <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full adnd-chip text-[#f3e5c5]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl adnd-display text-[#2c1d0f] mb-2">Campaign Resting</h1>
                    <p className="adnd-muted mb-8">
                        The archives are currently sealed. Our scribes are working to restore access to the ledger.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={retry}
                            disabled={isRetrying}
                            className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isRetrying
                                    ? 'bg-[#efe0bf] text-[#6b4a2b] cursor-not-allowed'
                                    : 'bg-[#3b2615] hover:bg-[#4b311a] text-[#f3e5c5] shadow-lg active:scale-95'
                                }`}
                        >
                            {isRetrying ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6b4a2b] border-t-transparent"></div>
                                    Retrying... ({retryCount})
                                </>
                            ) : (
                                'Reconnect to Realm'
                            )}
                        </button>

                        <div className="text-xs adnd-muted mt-4 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                            <span className="w-8 h-px bg-[#7a4f24]/60"></span>
                            Offline Mode
                            <span className="w-8 h-px bg-[#7a4f24]/60"></span>
                        </div>
                    </div>
                </div>

                <p className="absolute bottom-8 adnd-muted text-sm italic">
                    "Not all who wander are lost, but some maps are currently folded."
                </p>
            </div>
        );
    }

    return <>{children}</>;
};

export default ServerOffline;
