const OPEN5E_BASE_URL = 'https://api.open5e.com';

export const Open5eService = {
    async getClasses() {
        try {
            const response = await fetch(`${OPEN5E_BASE_URL}/classes/`);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error("Error fetching classes:", error);
            return [];
        }
    },

    async getRaces() {
        try {
            const response = await fetch(`${OPEN5E_BASE_URL}/races/`);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error("Error fetching races:", error);
            return [];
        }
    },

    async getBackgrounds() {
        try {
            const response = await fetch(`${OPEN5E_BASE_URL}/backgrounds/`);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            // Backgrounds might not be fully populated in all Open5e endpoints or licenses
            console.error("Error fetching backgrounds:", error);
            return [];
        }
    }
};
