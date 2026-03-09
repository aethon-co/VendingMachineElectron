export const getBackendUrl = () => process.env.BACKEND_URL || "http://localhost:3000";

export const fetchFromBackend = async (endpoint: string, body: any) => {
    const url = `${getBackendUrl()}${endpoint}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        let errMessage = "";
        try {
            const errJson: any = await response.json();
            errMessage = errJson?.message || "";
        } catch {
            try {
                const errText = await response.text();
                errMessage = errText.slice(0, 300);
            } catch {
                errMessage = "";
            }
        }

        const base = `Backend request failed (${response.status}) for ${endpoint} [${url}]`;
        throw new Error(errMessage ? `${base}: ${errMessage}` : base);
    }

    return await response.json();
};
