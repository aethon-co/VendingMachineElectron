import Store from "electron-store";
import { safeStorage } from "electron";

const store = new Store();

// Helper to encrypt before saving
export const saveSecurely = (key: string, value: string) => {
    if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(value);
        store.set(key, encrypted.toString('base64'));
    } else {
        store.set(key, value); // Fallback if OS doesn't support it
    }
};

// Helper to decrypt when reading
export const readSecurely = (key: string): string | null => {
    const stored = store.get(key) as string | undefined;
    if (!stored) return null;

    if (safeStorage.isEncryptionAvailable()) {
        try {
            return safeStorage.decryptString(Buffer.from(stored, 'base64'));
        } catch (e) {
            console.error("Failed to decrypt token, possibly corrupted or raw", e);
            return stored; // Fallback in case it was stored raw previously
        }
    }
    return stored;
};

export const saveMachineId = (id: string, name?: string) => {
    store.set('machine_id', id);
    if (name) store.set('machine_name', name);
};

export const getMachineId = () => store.get('machine_id') as string | undefined;
export const getMachineName = () => store.get('machine_name') as string | undefined;
