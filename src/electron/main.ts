import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import Store from "electron-store";
import 'dotenv/config';
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.QR_ENCRYPTION_KEY;
  if (!key) throw new Error("QR_ENCRYPTION_KEY is not set in environment variables");
  return crypto.createHash("sha256").update(key).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// 1. Initialize store for the secret token
const store = new Store();

// Replace with production backend URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

app.on("ready", async () => {
  try {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 1280,
      webPreferences: {
        preload: getPreloadPath(),
      }
    });

    if (isDev()) {
      mainWindow.loadURL('http://localhost:5173')
    } else {
      mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    }

    // Helper to encrypt before saving
    const saveSecurely = (key: string, value: string) => {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(value);
        store.set(key, encrypted.toString('base64'));
      } else {
        store.set(key, value); // Fallback if OS doesn't support it
      }
    };

    // Helper to decrypt when reading
    const readSecurely = (key: string): string | null => {
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

    // 2. Set and Get Token IPCs
    ipcMain.handle('vending:setToken', (_, token) => {
      saveSecurely('secret_token', token);
      return true;
    });

    ipcMain.handle('vending:getToken', () => {
      return readSecurely('secret_token');
    });

    ipcMain.handle('vending:encrypt', (_, data) => {
      return encrypt(data);
    });

    // 3. Init Machine API Call
    ipcMain.handle('vending:init', async () => {
      const token = readSecurely('secret_token');
      if (!token) throw new Error("No secret token configured");

      const response = await fetch(`${BACKEND_URL}/vending/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_token: token })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to init machine from backend");
      }

      return await response.json();
    });

    ipcMain.handle('vending:saveMachineId', (_, id: string) => {
      store.set('machine_id', id);
      return true;
    });

    // 4. Heartbeat Loop
    setInterval(async () => {
      const token = readSecurely('secret_token');
      const machineId = store.get('machine_id'); // Store this after first init

      if (token && machineId) {
        try {
          await fetch(`${BACKEND_URL}/vending/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret_token: token, machine_id: machineId })
          });
        } catch (e) {
          console.error("Heartbeat failed", e);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

  } catch (e) {
    console.error("Failed to start the application:", e);
    app.quit();
  }
});
