import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld("electron", {
    setToken: async (token: string) => await ipcRenderer.invoke('vending:setToken', token),
    getToken: async () => await ipcRenderer.invoke('vending:getToken'),
    initMachine: async () => await ipcRenderer.invoke('vending:init'),
    saveMachineId: async (id: string) => await ipcRenderer.invoke('vending:saveMachineId', id), // Need to add this
})