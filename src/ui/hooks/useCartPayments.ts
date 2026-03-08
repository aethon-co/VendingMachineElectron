import { useState } from "react";

export function useCartPayments(items: any[], setItems: (items: any[]) => void) {
    const [cartTotal, setCartTotal] = useState(0);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const [showPaymentQR, setShowPaymentQR] = useState(false);
    const [isCreatingQR, setIsCreatingQR] = useState(false);
    const [paymentQRData, setPaymentQRData] = useState<{ qrId: string; imageUrl: string; imageDataUrl: string; shortUrl: string; amount: number } | null>(null);

    const handleAddToCart = (id: string, price: number) => {
        setItems(items.map(item => {
            const itemId = item.id || item._id;
            return itemId === id && item.quantity > 0
                ? { ...item, quantity: item.quantity - 1 }
                : item;
        }));
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        setCartTotal(prev => prev + price);
    };

    const handleRemoveFromCart = (id: string, price: number) => {
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
    };

    const handleClearOrder = (machineDataItems: any[]) => {
        setItems(machineDataItems || []);
        setCartTotal(0);
        setCart({});
    };

    const handleInitiatePayment = async () => {
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
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentQR(false);
        setPaymentQRData(null);
        setPaymentSuccess(true);

        // Deduct stock in backend
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
                const res = await window.electron.purchase(purchaseItems);
                if (res && res.items) {
                    setItems(res.items); // immediately update local UI stock
                }
            }
        } catch (e) {
            console.error("Failed to deduct stock physically in backend", e);
        }

        setTimeout(() => {
            setPaymentSuccess(false);
            setCart({});
            setCartTotal(0); // Also clear cart total
        }, 4000);
    };

    const handlePaymentCancel = () => {
        setShowPaymentQR(false);
        setPaymentQRData(null);
    };

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
