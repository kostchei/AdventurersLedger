import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { characterApi } from '../lib/characterApi';
import type { UserStats } from '../types/pocketbase';

export function useCharacterStats(targetUserId?: string) {
    const { user: currentUser } = useAuthStore();
    const effectiveUserId = targetUserId || currentUser?.id;
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async () => {
        if (!effectiveUserId) return;
        try {
            setLoading(true);
            const data = await characterApi.getByUserId(effectiveUserId);
            setStats(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch character stats:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [effectiveUserId]);

    useEffect(() => {
        fetchStats();

        if (!effectiveUserId) return;

        // Subscribe to real-time updates using the generic subscriber
        let unsubscribe: (() => void) | undefined;

        const setupSubscription = async () => {
            unsubscribe = await characterApi.subscribeAll((e) => {
                if (e.record.user_id === effectiveUserId) {
                    setStats(e.record);
                }
            });
        };

        setupSubscription();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [effectiveUserId, fetchStats]);

    const updateHP = async (amount: number) => {
        if (!stats) return;
        await characterApi.updateHP(stats.id, stats.hp + amount, stats.max_hp);
    };

    const addXP = async (amount: number) => {
        if (!stats) return;
        await characterApi.addXP(stats.id, stats.xp, amount);
    };

    const updateGold = async (amount: number) => {
        if (!stats) return;
        await characterApi.updateGold(stats.id, amount);
    };

    const updateFactionRenown = async (factionName: string, value: number) => {
        if (!stats) return;
        await characterApi.updateFactionRenown(stats.id, stats.factions || {}, factionName, value);
    };

    const selectDeity = async (deityName: string | null) => {
        if (!stats) return;
        await characterApi.selectDeity(stats.id, deityName);
    };

    const updatePiety = async (deityName: string, value: number) => {
        if (!stats) return;
        await characterApi.updatePiety(stats.id, stats.piety_json || {}, deityName, value);
    };

    return {
        stats,
        loading,
        error,
        refresh: fetchStats,
        updateHP,
        addXP,
        updateGold,
        updateFactionRenown,
        selectDeity,
        updatePiety
    };
}
