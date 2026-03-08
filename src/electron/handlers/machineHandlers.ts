import { ipcMain } from "electron";
import { readSecurely, getMachineId } from "../services/storeService.js";
import { fetchFromBackend } from "../services/apiService.js";
import { dispenseItems } from "../services/serialService.js";

export function registerMachineHandlers() {
    ipcMain.handle('vending:init', async () => {
        const token = readSecurely('secret_token');
        if (!token) throw new Error("No secret token configured");

        return await fetchFromBackend('/vending/init', { secret_token: token });
    });

    ipcMain.handle('vending:purchase', async (_, items: { row: number, quantity: number }[]) => {
        const token = readSecurely('secret_token');
        const machineId = getMachineId();
        if (!token || !machineId) throw new Error("Machine not initialized");

        const response = await fetchFromBackend('/vending/purchase', {
            secret_token: token,
            machine_id: machineId,
            items
        });

        // Backend successfully confirmed deduction. Send commands to Serial Arduino!
        const dispenseArray: string[] = [];
        for (const item of items) {
            for (let i = 0; i < item.quantity; i++) {
                dispenseArray.push(`row${item.row}`);
            }
        }
        // Tell hardware background loop to commence LED / Motor commands sequentially 
        dispenseItems(dispenseArray);

        return response;
    });
}
