import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld("electron", {
    setToken: async (token: string) => await ipcRenderer.invoke('vending:setToken', token),
    getToken: async () => await ipcRenderer.invoke('vending:getToken'),
    initMachine: async () => await ipcRenderer.invoke('vending:init'),
    saveMachineId: async (id: string, name?: string) => await ipcRenderer.invoke('vending:saveMachineId', id, name),
    encrypt: async (data: string) => await ipcRenderer.invoke('vending:encrypt', data),
    createPaymentQR: async (amountInRupees: number) => await ipcRenderer.invoke('vending:createPaymentQR', amountInRupees),
    checkQRPayment: async (qrId: string) => await ipcRenderer.invoke('vending:checkQRPayment', qrId),
    closePaymentQR: async (qrId: string) => await ipcRenderer.invoke('vending:closePaymentQR', qrId),
    purchase: async (items: { row: number, quantity: number }[]) => await ipcRenderer.invoke('vending:purchase', items),

    // V2 Webhook Flow
    createPaymentQRV2: async (amount: number, items: any[]) => await ipcRenderer.invoke('vending:createPaymentQRV2', { amount, items }),
    checkTransactionStatus: async (qrId: string) => await ipcRenderer.invoke('vending:checkTransactionStatus', qrId),
    dispenseItems: async (items: { row: number, quantity: number }[]) => await ipcRenderer.invoke('vending:dispenseItems', items),
})