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
        const cloned = response.clone();

        try {
            const errJson: any = await response.json();
            errMessage =
                errJson?.message ||
                errJson?.error?.description ||
                errJson?.error ||
                "";
        } catch {
            // ignore parse error; try text from cloned response below
        }

        if (!errMessage) {
            try {
                const errText = await cloned.text();
                errMessage = errText.slice(0, 500);
            } catch {
                errMessage = "";
            }
        }

        const base = `Backend request failed (${response.status} ${response.statusText}) for ${endpoint} [${url}]`;
        throw new Error(errMessage ? `${base}: ${errMessage}` : base);
    }

    return await response.json();
};
