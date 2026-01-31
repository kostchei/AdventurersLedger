import { describe, it, expect, afterAll } from 'vitest';
import PocketBase from 'pocketbase';

const PB_URL = 'http://127.0.0.1:8090';

describe('Global Roles Schema Integration', () => {
    const pb = new PocketBase(PB_URL);
    const testUserEmail = `test_${Date.now()}@example.com`;
    const testUserPassword = 'password123456';
    let testUserId: string;

    it('should connect to PocketBase', async () => {
        const health = await pb.health.check();
        expect(health.code).toBe(200);
    });

    it('should allow user registration (default role USER)', async () => {
        try {
            const user = await pb.collection('users').create({
                email: testUserEmail,
                password: testUserPassword,
                passwordConfirm: testUserPassword,
                name: 'Test User',
                global_role: 'USER'
            });
            testUserId = user.id;
            expect(user).toBeDefined();
            expect(user.global_role).toBe('USER');
        } catch (e: unknown) {
            const pbError = e as { data?: unknown; message?: string; status?: number };
            console.warn('Registration failed:', pbError.data || pbError.message);
            if (pbError.status === 403 || pbError.status === 400) {
                throw new Error('Cannot register test user. Is registration open?');
            }
            throw e;
        }
    });

    it('should allow login as USER', async () => {
        if (!testUserId) return;
        await pb.collection('users').authWithPassword(testUserEmail, testUserPassword);
        expect(pb.authStore.isValid).toBe(true);
        expect(pb.authStore.model?.id).toBe(testUserId);
        expect(pb.authStore.model?.global_role).toBe('USER');
    });

    it('should FORBID USER from creating campaigns', async () => {
        if (!testUserId) return;

        // We expect this to fail because @request.auth.global_role is 'USER'
        // and rule requires 'GM' or 'ADMIN'
        await expect(pb.collection('campaigns').create({
            name: 'Illegal Campaign',
            dmId: testUserId
        })).rejects.toThrow();
    });

    afterAll(async () => {
        if (testUserId) {
            try {
                await pb.collection('users').delete(testUserId);
            } catch (e) {
                console.log('Failed to cleanup test user', e);
            }
        }
    });
});
