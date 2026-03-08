export const getBackendUrl = () => process.env.BACKEND_URL || "http://localhost:3000";

export const fetchFromBackend = async (endpoint: string, body: any) => {
    const response = await fetch(`${getBackendUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        let err: any = {};
        try { err = await response.json(); } catch (e) { }
        throw new Error(err.message || `Backend request failed: ${endpoint}`);
    }

    return await response.json();
};
