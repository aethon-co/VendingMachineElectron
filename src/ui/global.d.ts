interface Window {
    electron: {
        setToken: (token: string) => Promise<boolean>;
        getToken: () => Promise<string | null>;
        initMachine: () => Promise<any>;
        saveMachineId: (id: string) => Promise<boolean>;
        encrypt: (data: string) => Promise<string>;
    };
}
