import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { characterApi } from '../lib/characterApi';
import type { UserStats } from '../types/pocketbase';

export function useCharacterStats(statsId?: string, campaignId?: string, userId?: string) {
    const { user: currentUser } = useAuthStore();
    const effectiveUserId = userId || currentUser?.id;
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            let data: UserStats | null = null;
            if (statsId) {
                data = await characterApi.getOne(statsId);
            } else if (effectiveUserId) {
                data = await characterApi.getByUserId(effectiveUserId, campaignId);
            }
            setStats(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch character stats:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [statsId, effectiveUserId, campaignId]);

    useEffect(() => {
        fetchStats();

        if (!effectiveUserId) return;

        // Subscribe to real-time updates using the generic subscriber
        let unsubscribe: (() => void) | undefined;

        const setupSubscription = async () => {
            unsubscribe = await characterApi.subscribeAll((e) => {
                if (statsId) {
                    if (e.record.id === statsId) {
                        setStats(e.record);
                    }
                } else if (effectiveUserId) {
                    const recordCampaign = (e.record as unknown as { campaign?: string }).campaign;
                    const campaignMatches = campaignId
                        ? (recordCampaign ? recordCampaign === campaignId : true)
                        : true;

                    if (e.record.user === effectiveUserId && campaignMatches) {
                        setStats(e.record);
                    }
                }
            });
        };

        setupSubscription();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [statsId, effectiveUserId, campaignId, fetchStats]);

    const updateHP = async (newHP: number) => {
        if (!stats) return;
        await characterApi.updateHP(stats.id, newHP, stats.max_hp);
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

    const updatePiety = async (value: number) => {
        if (!stats) return;
        await characterApi.updatePiety(stats.id, value);
    };

    const updateAbilityScore = async (ability: string, value: number) => {
        if (!stats) return;
        await characterApi.updateAbilityScore(stats.id, ability, value);
    };

    const updateClassLevel = async (className: string, level: number) => {
        if (!stats) return;
        await characterApi.updateClassLevel(stats.id, stats.levels || {}, className, level);
    };

    const addCondition = async (condition: string) => {
        if (!stats) return;
        await characterApi.addCondition(stats.id, stats.conditions || [], condition);
    };

    const removeCondition = async (condition: string) => {
        if (!stats) return;
        await characterApi.removeCondition(stats.id, stats.conditions || [], condition);
    };

    const updateMaxHP = async (maxHP: number) => {
        if (!stats) return;
        await characterApi.updateMaxHP(stats.id, maxHP);
    };



    const updateDetails = async (details: { character_name?: string, class_name?: string, species?: string, background?: string }) => {
        if (!stats) return;
        await characterApi.updateDetails(stats.id, details);
    };

    const updateSpells = async (spells: string[]) => {
        if (!stats) return;
        await characterApi.updateSpells(stats.id, spells);
    };

    const updateFeats = async (feats: string[]) => {
        if (!stats) return;
        await characterApi.updateFeats(stats.id, feats);
    };

    const updateBastion = async (bastion: string[]) => {
        if (!stats) return;
        await characterApi.updateBastion(stats.id, bastion);
    };

    const updateInventory = async (inventory: string[]) => {
        if (!stats) return;
        await characterApi.updateInventory(stats.id, inventory);
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
        updatePiety,
        updateAbilityScore,
        updateClassLevel,
        addCondition,
        removeCondition,
        updateMaxHP,
        updateDetails,
        updateSpells,
        updateFeats,
        updateBastion,
        updateInventory
    };
}
