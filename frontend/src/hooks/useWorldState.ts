import { useEffect, useState, useCallback } from 'react';
import { worldStateApi } from '../lib/pbClient';
import type { WorldState } from '../types/pocketbase';

export function useWorldState(zIndex: number = 0) {
    const [state, setState] = useState<WorldState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchState = useCallback(async () => {
        try {
            setLoading(true);
            const data = await worldStateApi.getByZIndex(zIndex);
            setState(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch world state:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [zIndex]);

    useEffect(() => {
        fetchState();

        let unsubscribe: (() => void) | undefined;

        const setupSubscription = async () => {
            unsubscribe = await worldStateApi.subscribe((e) => {
                if (e.record.z_index === zIndex) {
                    setState(e.record);
                }
            });
        };

        setupSubscription();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [zIndex, fetchState]);

    return { state, loading, error, refresh: fetchState };
}
