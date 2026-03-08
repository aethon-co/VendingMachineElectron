import { ipcMain } from "electron";
import { readSecurely, getMachineId } from "../services/storeService.js";
import { fetchFromBackend, getBackendUrl } from "../services/apiService.js";

export function registerPaymentHandlers() {
    // 5a. Create a Razorpay UPI QR code — fetch the image in main process to avoid CSP issues
    ipcMain.handle('vending:createPaymentQR', async (_, amountInRupees: number) => {
        const token = readSecurely('secret_token');
        const machineId = getMachineId();
        if (!token || !machineId) throw new Error("Machine not initialized");

        const backendBase = getBackendUrl();
        if (!backendBase || typeof backendBase !== 'string') {
            throw new Error(`Backend URL is not configured (got: ${backendBase}). Check BACKEND_URL in .env`);
        }

        const data = await fetchFromBackend('/vending/payment/create-qr', {
            secret_token: token,
            machine_id: machineId,
            amount: amountInRupees
        });

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
        const machineId = getMachineId();
        if (!token || !machineId) throw new Error("Machine not initialized");

        try {
            const data = await fetchFromBackend('/vending/payment/check-qr', {
                secret_token: token,
                machine_id: machineId,
                qr_id: qrId
            });
            return { paid: !!data.paid, paymentId: data.paymentId };
        } catch (e) {
            return { paid: false };
        }
    });

    // 5c. Close QR on cancel/timeout
    ipcMain.handle('vending:closePaymentQR', async (_, qrId: string) => {
        const token = readSecurely('secret_token');
        const machineId = getMachineId();
        if (!token || !machineId) return true;

        try {
            await fetchFromBackend('/vending/payment/close-qr', {
                secret_token: token,
                machine_id: machineId,
                qr_id: qrId
            });
        } catch (e) {
            // Ignore closure errors
        }
        return true;
    });
}
