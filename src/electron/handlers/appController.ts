import { app, BrowserWindow } from "electron";
import path from "path";
import { isDev } from "../util.js";
import { getPreloadPath } from "../pathResolver.js";
import { readSecurely, getMachineId } from "../services/storeService.js";
import { fetchFromBackend } from "../services/apiService.js";

export function setupMainWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: 600,
        height: 1024,
        // fullscreen: true,
        // kiosk: true,
        // autoHideMenuBar: true,
        webPreferences: {
            preload: getPreloadPath(),
        }
    });

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5173')
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    }

    return mainWindow;
}

export function startHeartbeatLoop() {
    setInterval(async () => {
        const token = readSecurely('secret_token');
        const machineId = getMachineId();

        if (token && machineId) {
            try {
                await fetchFromBackend('/vending/heartbeat', {
                    secret_token: token,
                    machine_id: machineId
                });
            } catch (e) {
                console.error("Heartbeat failed", e);
            }
        }
    }, 60 * 60 * 1000);
}
