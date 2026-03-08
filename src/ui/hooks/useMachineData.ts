import { useState, useEffect } from "react";

export function useMachineData(setItems: (items: any[]) => void) {
    const [isLoading, setIsLoading] = useState(true);
    const [machineData, setMachineData] = useState<any>(null);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [secretTokenInput, setSecretTokenInput] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [qrEncryptedPayload, setQrEncryptedPayload] = useState<string>("");

    useEffect(() => {
        // Generate QR Code Payload asynchronously if machine is unlinked
        const generateSecureQr = async () => {
            if (machineData && !machineData.institute_id) {
                const qrPayload = JSON.stringify({
                    machine_id: machineData.id || machineData._id,
                    name: machineData.name,
                    timestamp: Date.now()
                });
                const encrypted = await window.electron.encrypt(qrPayload);
                setQrEncryptedPayload(encrypted);
            }
        };
        generateSecureQr();
    }, [machineData]);

    const loadMachineData = async () => {
        try {
            const data = await window.electron.initMachine();
            setMachineData(data.machine || data);
            setItems(data.machine?.items || data.items || []);
            setNeedsSetup(false);

            // Save ID (and name) for heartbeat & QR labelling
            const machineId = data.id || data.machine?.id;
            const machineName = data.name || data.machine?.name;
            if (machineId) {
                window.electron.saveMachineId(machineId, machineName);
            }
        } catch (e) {
            console.error("Failed to load machine data:", e);
            setNeedsSetup(true); // Token might be invalid
        } finally {
            setIsLoading(false);
        }
    };

    const checkMachineStatus = async () => {
        try {
            setIsLoading(true);
            const token = await window.electron.getToken();

            if (!token) {
                setNeedsSetup(true);
                setIsLoading(false);
                return;
            }

            await loadMachineData();
        } catch (e) {
            console.error(e);
            setNeedsSetup(true);
            setIsLoading(false);
        }
    };

    const handleSetup = async () => {
        if (!secretTokenInput.trim()) return;
        try {
            setIsLoading(true);
            await window.electron.setToken(secretTokenInput.trim());
            await loadMachineData();
        } catch (e) {
            alert("Invalid secret token or connection error.");
            setIsLoading(false);
        }
    };

    const handleRefreshQR = async () => {
        setRefreshing(true);
        await loadMachineData();
        setRefreshing(false);
    };

    return {
        isLoading,
        machineData,
        needsSetup,
        secretTokenInput,
        setSecretTokenInput,
        refreshing,
        qrEncryptedPayload,
        checkMachineStatus,
        handleSetup,
        handleRefreshQR,
    };
}
