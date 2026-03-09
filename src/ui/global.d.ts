interface Window {
    electron: {
        setToken: (token: string) => Promise<boolean>;
        getToken: () => Promise<string | null>;
        initMachine: () => Promise<any>;
        saveMachineId: (id: string, name?: string) => Promise<boolean>;
        encrypt: (data: string) => Promise<string>;
        // Razorpay QR payment
        createPaymentQR: (amountInRupees: number) => Promise<{ qrId: string; imageUrl: string; imageDataUrl: string; shortUrl: string; amount: number }>;
        checkQRPayment: (qrId: string) => Promise<{ paid: boolean; paymentId?: string }>;
        closePaymentQR: (qrId: string) => Promise<boolean>;
        purchase: (items: { row: number, quantity: number }[]) => Promise<any>;

        // V2 Webhook Flow
        createPaymentQRV2: (amount: number, items: any[]) => Promise<{ qrId: string; imageUrl: string; imageDataUrl: string; shortUrl: string; amount: number }>;
        checkTransactionStatus: (qrId: string) => Promise<{ paid: boolean; status: string; paymentId?: string }>;
        dispenseItems: (items: { row: number, quantity: number }[]) => Promise<{ status: string }>;
    };
}
