import { userStatsApi } from './pbClient';

/**
 * High-level API for character stats operations, extending the base pbClient API
 */
export const characterApi = {
    ...userStatsApi,

    /**
     * Update current HP, ensuring it doesn't exceed max HP or fall below zero
     */
    updateHP: async (id: string, currentHP: number, maxHP: number) => {
        const hp = Math.max(0, Math.min(currentHP, maxHP));
        return userStatsApi.update(id, { hp });
    },

    /**
     * Add XP to the character
     */
    addXP: async (id: string, currentXP: number, amount: number) => {
        return userStatsApi.update(id, { xp: currentXP + amount });
    },

    /**
     * Update gold amount
     */
    updateGold: async (id: string, amount: number) => {
        return userStatsApi.update(id, { gold: amount });
    },

    /**
     * Add a condition to the character
     */
    addCondition: async (id: string, currentConditions: string[], condition: string) => {
        if (currentConditions.includes(condition)) return;
        return userStatsApi.update(id, {
            conditions: [...currentConditions, condition]
        });
    },

    /**
     * Remove a condition from the character
     */
    removeCondition: async (id: string, currentConditions: string[], condition: string) => {
        const conditions = currentConditions.filter(c => c !== condition);
        return userStatsApi.update(id, { conditions });
    },

    /**
     * Update renown for a specific faction
     */
    updateFactionRenown: async (id: string, currentFactions: Record<string, number>, factionName: string, value: number) => {
        return userStatsApi.update(id, {
            factions: {
                ...currentFactions,
                [factionName]: value
            }
        });
    },

    /**
     * Set the active deity for the character
     */
    selectDeity: async (id: string, deityName: string | null) => {
        return userStatsApi.update(id, { active_deity: deityName });
    },

    /**
     * Update piety for a specific deity
     */
    updatePiety: async (id: string, currentPiety: Record<string, number>, deityName: string, value: number) => {
        return userStatsApi.update(id, {
            piety_json: {
                ...currentPiety,
                [deityName]: value
            }
        });
    }
};
