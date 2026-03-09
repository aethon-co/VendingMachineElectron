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
        const unitPrice = Number(price);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) return;

        setItems(items.map(item => {
            const itemId = item.id || item._id;
            return itemId === id && item.quantity > 0
                ? { ...item, quantity: item.quantity - 1 }
                : item;
        }));
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        setCartTotal(prev => Number(prev) + unitPrice);
    }, [items, setItems, setCart, setCartTotal]);

    const handleRemoveFromCart = useCallback((id: string, price: number) => {
        if (!cart[id]) return;
        const unitPrice = Number(price);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) return;

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
        setCartTotal(prev => Number(prev) - unitPrice);
    }, [cart, items, setItems, setCart, setCartTotal]);

    const handleClearOrder = useCallback((machineDataItems: any[]) => {
        setItems(machineDataItems || []);
        setCartTotal(0);
        setCart({});
    }, [setItems, setCartTotal, setCart]);

    const handleInitiatePayment = useCallback(async () => {
        const payableAmount = Number(cartTotal);
        if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
            alert("Invalid cart total. Please clear order and try again.");
            return;
        }
        try {
            setIsCreatingQR(true);

            // Prepare items metadata for V2 Flow
            const purchaseItems = Object.keys(cart)
                .map(itemId => {
                    const item = items.find(i => i.id === itemId || i._id === itemId);
                    if (!item) return null;
                    return {
                        row: Number(item.row),
                        quantity: Number(cart[itemId]),
                        name: item.name,
                        price: Number(item.price)
                    };
                })
                .filter((item): item is { row: number, quantity: number, name: string, price: number } => item !== null);

            // Use V2 endpoint
            const qrData = await window.electron.createPaymentQRV2(payableAmount, purchaseItems);
            setPaymentQRData(qrData);
            setShowPaymentQR(true);
        } catch (e: any) {
            alert("Could not create payment QR: " + (e?.message || "Unknown error"));
        } finally {
            setIsCreatingQR(false);
        }
    }, [cartTotal, cart, items, setIsCreatingQR, setPaymentQRData, setShowPaymentQR]);

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
                // Use dispenseItems (Hardware only) because V2 backend already deducted stock via webhook
                await window.electron.dispenseItems(purchaseItems);

                // Optional: Re-fetch items to get updated quantities from backend 
                // Since this hook doesn't have re-fetch logic, the machine list will update on next refresh/heartbeat
            }
        } catch (e) {
            console.error("Failed to deduct stock physically in backend", e);
        }
        // Keep success screen visible briefly before resetting state.
        setTimeout(() => {
            setPaymentSuccess(false);
            setCart({});
            setCartTotal(0);
            isProcessing.current = false;
        }, 4000);
    }, [cart, items, setItems, setCart, setCartTotal, setPaymentSuccess]);

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
