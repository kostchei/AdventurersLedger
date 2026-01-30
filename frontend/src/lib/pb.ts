import PocketBase from 'pocketbase';

const PB_URL = import.meta.env.VITE_PB_URL || 'http://localhost:8090';
export const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

// Optional: you can export the authStore separately for easier access in stores
export const authStore = pb.authStore;
