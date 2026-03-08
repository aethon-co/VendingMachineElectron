import { ipcMain } from "electron";
import { readSecurely, getMachineId } from "../services/storeService.js";
import { fetchFromBackend } from "../services/apiService.js";
import { dispenseItems } from "../services/serialService.js";

const rowToLetter: Record<number, string> = {
    1: "E",
    2: "D",
    3: "C",
    4: "B"
};

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

  
        const dispenseArray: string[] = [];
        for (const item of items) {
            const letter = rowToLetter[item.row];
            if (!letter) {
                console.error(`[MachineHandler] Unknown row: ${item.row}`);
                continue;
            }
            for (let i = 0; i < item.quantity; i++) {
                dispenseArray.push(letter);
            }
        }

        dispenseItems(dispenseArray);
        return response;
    });
}



