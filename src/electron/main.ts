import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import Store from "electron-store";
import 'dotenv/config';

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

    // 2. Set and Get Token IPCs
    ipcMain.handle('vending:setToken', (_, token) => {
      store.set('secret_token', token);
      return true;
    });

    ipcMain.handle('vending:getToken', () => {
      return store.get('secret_token');
    });

    // 3. Init Machine API Call
    ipcMain.handle('vending:init', async () => {
      const token = store.get('secret_token');
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
      const token = store.get('secret_token');
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
    }, 60 * 1000); // 60 seconds

  } catch (e) {
    console.error("Failed to start the application:", e);
    app.quit();
  }
});
