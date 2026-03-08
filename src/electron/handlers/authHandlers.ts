import { ipcMain } from "electron";
import { saveSecurely, readSecurely, saveMachineId } from "../services/storeService.js";
import { encrypt } from "../services/cryptoService.js";

export function registerAuthHandlers() {
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

    ipcMain.handle('vending:saveMachineId', (_, id: string, name?: string) => {
        saveMachineId(id, name);
        return true;
    });
}
