import { useState, useCallback, useRef } from "react";

export function useCartPayments(items: any[], setItems: (items: any[]) => void) {
    const [cartTotal, setCartTotal] = useState(0);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const [showPaymentQR, setShowPaymentQR] = useState(false);
    const [isCreatingQR, setIsCreatingQR] = useState(false);
    const [paymentQRData, setPaymentQRData] = useState<{ qrId: string; imageUrl: string; imageDataUrl: string; shortUrl: string; amount: number } | null>(null);

    const isProcessing = useRef(false);

    const handleAddToCart = useCallback((id: string, price: number) => {
        setItems(items.map(item => {
            const itemId = item.id || item._id;
            return itemId === id && item.quantity > 0
                ? { ...item, quantity: item.quantity - 1 }
                : item;
        }));
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        setCartTotal(prev => prev + price);
    }, [items, setItems, setCart, setCartTotal]);

    const handleRemoveFromCart = useCallback((id: string, price: number) => {
        if (!cart[id]) return;
        setItems(items.map(item => {
            const itemId = item.id || item._id;
            return itemId === id
                ? { ...item, quantity: item.quantity + 1 }
                : item;
        }));
        setCart(prev => {
            const newCart = { ...prev };
            newCart[id] -= 1;
            if (newCart[id] === 0) delete newCart[id];
            return newCart;
        });
        setCartTotal(prev => prev - price);
    }, [cart, items, setItems, setCart, setCartTotal]);

    const handleClearOrder = useCallback((machineDataItems: any[]) => {
        setItems(machineDataItems || []);
        setCartTotal(0);
        setCart({});
    }, [setItems, setCartTotal, setCart]);

    const handleInitiatePayment = useCallback(async () => {
        if (cartTotal === 0) return;
        try {
            setIsCreatingQR(true);
            const qrData = await window.electron.createPaymentQR(cartTotal);
            setPaymentQRData(qrData);
            setShowPaymentQR(true);
        } catch (e: any) {
            alert("Could not create payment QR: " + (e?.message || "Unknown error"));
        } finally {
            setIsCreatingQR(false);
        }
    }, [cartTotal, setIsCreatingQR, setPaymentQRData, setShowPaymentQR]);

    const handlePaymentSuccess = useCallback(async () => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        setShowPaymentQR(false);
        setPaymentQRData(null);
        setPaymentSuccess(true);

        // 1. Trigger physical dispensing and wait for it to finish
        try {
            const purchaseItems = Object.keys(cart)
                .map(itemId => {
                    const item = items.find(i => i.id === itemId || i._id === itemId);
                    if (!item) return null;
                    return {
                        row: Number(item.row),
                        quantity: Number(cart[itemId])
                    };
                })
                .filter((item): item is { row: number; quantity: number } => item !== null);

            if (purchaseItems.length > 0) {
                // This now waits until ALL items are dispensed (7s each)
                const res = await window.electron.purchase(purchaseItems);
                if (res && res.items) {
                    setItems(res.items);
                }
            }
        } catch (e) {
            console.error("Failed to deduct stock physically in backend", e);
        }
        setPaymentSuccess(false);
        setCart({});
        setCartTotal(0);
        isProcessing.current = false;
    }, [cart, items, setItems, setCart, setCartTotal]);

    const handlePaymentCancel = useCallback(() => {
        setShowPaymentQR(false);
        setPaymentQRData(null);
    }, [setShowPaymentQR, setPaymentQRData]);

    return {
        cartTotal,
        cart,
        paymentSuccess,
        showPaymentQR,
        isCreatingQR,
        paymentQRData,
        handleAddToCart,
        handleRemoveFromCart,
        handleClearOrder,
        handleInitiatePayment,
        handlePaymentSuccess,
        handlePaymentCancel
    };
}
