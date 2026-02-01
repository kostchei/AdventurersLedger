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
     * Get all characters for a specific campaign
     */
    getByCampaign: async (campaignId: string) => {
        return userStatsApi.getByCampaign(campaignId);
    },

    /**
     * Get all characters in the campaign/system
     */
    getAllCharacters: async () => {
        return userStatsApi.getAll();
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
        return userStatsApi.update(id, { piety_deity: deityName });
    },

    /**
     * Update piety score
     */
    updatePiety: async (id: string, value: number) => {
        return userStatsApi.update(id, { piety_score: value });
    },

    /**
     * Update a single ability score
     */
    updateAbilityScore: async (id: string, ability: string, value: number) => {
        return userStatsApi.update(id, { [ability]: value });
    },

    /**
     * Update class level for a specific class
     */
    updateClassLevel: async (id: string, currentLevels: Record<string, number>, className: string, level: number) => {
        const newLevels = { ...currentLevels };
        if (level <= 0) {
            delete newLevels[className];
        } else {
            newLevels[className] = level;
        }
        return userStatsApi.update(id, { levels: newLevels });
    },

    updateMaxHP: async (id: string, maxHP: number) => {
        return userStatsApi.update(id, { max_hp: maxHP });
    },

    /**
     * Update character details
     */
    updateDetails: async (id: string, details: { character_name?: string, class_name?: string, species?: string, background?: string }) => {
        return userStatsApi.update(id, details);
    },

    /**
     * Update inventory list
     */
    updateInventory: async (id: string, inventory: string[]) => {
        return userStatsApi.update(id, { inventory });
    },

    /**
     * Update spells list
     */
    updateSpells: async (id: string, spells: string[]) => {
        return userStatsApi.update(id, { spells });
    },

    /**
     * Update feats list
     */
    updateFeats: async (id: string, feats: string[]) => {
        return userStatsApi.update(id, { feats });
    },

    /**
     * Update bastion features list
     */
    updateBastion: async (id: string, bastion: string[]) => {
        return userStatsApi.update(id, { bastion });
    }
};
