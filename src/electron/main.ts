import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import Store from "electron-store";
import dotenv from "dotenv";
import crypto from "crypto";

// Resolve .env path relative to this file (works in both dev and prod)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// In dev: dist-electron/ → need to go up to project root
// In prod (packaged): similar structure
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

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
const getBackendUrl = () => process.env.BACKEND_URL || "http://localhost:3000";

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

      const response = await fetch(`${getBackendUrl()}/vending/init`, {
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

    ipcMain.handle('vending:saveMachineId', (_, id: string, name?: string) => {
      store.set('machine_id', id);
      if (name) store.set('machine_name', name);
      return true;
    });

    ipcMain.handle('vending:purchase', async (_, items: { row: number, quantity: number }[]) => {
      const token = readSecurely('secret_token');
      const machineId = store.get('machine_id');
      if (!token || !machineId) throw new Error("Machine not initialized");

      const response = await fetch(`${getBackendUrl()}/vending/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_token: token, machine_id: machineId, items })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to sync purchase with backend");
      }

      return await response.json();
    });

    // 5a. Create a Razorpay UPI QR code — fetch the image in main process to avoid CSP issues
    ipcMain.handle('vending:createPaymentQR', async (_, amountInRupees: number) => {
      const token = readSecurely('secret_token');
      const machineId = store.get('machine_id');
      if (!token || !machineId) throw new Error("Machine not initialized");

      const backendBase = getBackendUrl();
      if (!backendBase || typeof backendBase !== 'string') {
        throw new Error(`Backend URL is not configured (got: ${backendBase}). Check BACKEND_URL in .env`);
      }

      const res = await fetch(`${backendBase}/vending/payment/create-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_token: token, machine_id: machineId, amount: amountInRupees }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create payment QR");
      }
      const data: any = await res.json();
      const imageUrl = data.imageUrl || "";
      let imageDataUrl = "";

      // Fetch QR image in main process to avoid renderer/network/CSP image load failures.
      if (imageUrl) {
        try {
          const imageRes = await fetch(imageUrl, {
            headers: {
              'Accept': 'image/png,image/*,*/*;q=0.8',
              'User-Agent': 'Mozilla/5.0 (compatible; VendingMachine/1.0)',
            },
          });
          if (imageRes.ok) {
            const contentType = imageRes.headers.get("content-type") || "image/png";
            // Only build a data URL if the response is actually an image
            const isImage = contentType.startsWith("image/") || contentType === "application/octet-stream";
            if (isImage) {
              const bytes = Buffer.from(await imageRes.arrayBuffer());
              const mimeType = contentType.startsWith("image/") ? contentType.split(";")[0].trim() : "image/png";
              imageDataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;
            } else {
              console.warn("[QR] Unexpected content-type for QR image:", contentType);
            }
          } else {
            console.warn("[QR] Image fetch failed with status:", imageRes.status);
          }
        } catch (e) {
          console.warn("[QR] Image fetch threw:", e);
          // Keep fallbacks (remote imageUrl / shortUrl QR) if this fetch fails.
        }
      }

      return {
        qrId: data.qrId,
        imageUrl,
        imageDataUrl,
        shortUrl: data.shortUrl || "",
        amount: data.amount,
      };
    });

    // 5b. Poll for payment status
    ipcMain.handle('vending:checkQRPayment', async (_, qrId: string) => {
      const token = readSecurely('secret_token');
      const machineId = store.get('machine_id');
      if (!token || !machineId) throw new Error("Machine not initialized");

      const res = await fetch(`${getBackendUrl()}/vending/payment/check-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_token: token, machine_id: machineId, qr_id: qrId }),
      });
      if (!res.ok) return { paid: false };
      const data: any = await res.json();
      return { paid: !!data.paid, paymentId: data.paymentId };
    });

    // 5c. Close QR on cancel/timeout
    ipcMain.handle('vending:closePaymentQR', async (_, qrId: string) => {
      const token = readSecurely('secret_token');
      const machineId = store.get('machine_id');
      if (!token || !machineId) return true;
      await fetch(`${getBackendUrl()}/vending/payment/close-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_token: token, machine_id: machineId, qr_id: qrId }),
      }).catch(() => {});
      return true;
    });

    // 4. Heartbeat Loop
    setInterval(async () => {
      const token = readSecurely('secret_token');
      const machineId = store.get('machine_id'); // Store this after first init

      if (token && machineId) {
        try {
          await fetch(`${getBackendUrl()}/vending/heartbeat`, {
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
