interface Window {
    electron: {
        setToken: (token: string) => Promise<boolean>;
        getToken: () => Promise<string | null>;
        initMachine: () => Promise<any>;
        saveMachineId: (id: string, name?: string) => Promise<boolean>;
        encrypt: (data: string) => Promise<string>;
        // Razorpay QR payment
        createPaymentQR: (amountInRupees: number) => Promise<{ qrId: string; imageUrl: string; amount: number }>;
        checkQRPayment: (qrId: string) => Promise<{ paid: boolean; paymentId?: string }>;
        closePaymentQR: (qrId: string) => Promise<boolean>;
        purchase: (items: { row: number, quantity: number }[]) => Promise<any>;
    };
}
