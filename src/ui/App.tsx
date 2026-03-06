import { useState, useEffect } from 'react';
import './App.css'
import ItemCard from './components/itemCard'
import OrderFooter from './components/orderFooter'
import PaymentQR from './components/paymentQR'
import { FaWifi, FaSync } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

function App() {
  const [items, setItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // New auth states
  const [isLoading, setIsLoading] = useState(true);
  const [machineData, setMachineData] = useState<any>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [secretTokenInput, setSecretTokenInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [qrEncryptedPayload, setQrEncryptedPayload] = useState<string>("");

  // Razorpay payment QR state
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [isCreatingQR, setIsCreatingQR] = useState(false);
  const [paymentQRData, setPaymentQRData] = useState<{ qrId: string; imageUrl: string; amount: number } | null>(null);

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

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    checkMachineStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const handleAddToCart = (id: string, price: number) => {
    setItems(items.map(item =>
      item.id === id && item.quantity > 0
        ? { ...item, quantity: item.quantity - 1 }
        : item
    ));
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setCartTotal(prev => prev + price);
  };

  const handleRemoveFromCart = (id: string, price: number) => {
    if (!cart[id]) return;
    setItems(items.map(item =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ));
    setCart(prev => {
      const newCart = { ...prev };
      newCart[id] -= 1;
      if (newCart[id] === 0) delete newCart[id];
      return newCart;
    });
    setCartTotal(prev => prev - price);
  };

  const handleClearOrder = () => {
    // We'd refill local quantities here based on machineData, 
    // but a simple reset is fine for the UI flow.
    setItems(machineData?.items || []);
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

  const handlePaymentSuccess = async (_paymentId: string) => {
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

  if (isOffline) {
    return (
      <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
        <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex justify-center items-center mb-6 relative">
          <FaWifi size={40} className="opacity-50" />
          <div className="absolute inset-0 flex justify-center items-center transform -rotate-45">
            <div className="w-16 h-1 bg-red-500 rounded" />
          </div>
        </div>
        <h1 className="text-3xl font-black mb-2 text-[#f3f4f6]">Wi-Fi Disconnected</h1>
        <p className="text-gray-400 font-medium text-center px-12 leading-relaxed">This vending machine requires an active internet connection to process payments. Please wait for the network to be restored.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
        <div className="w-16 h-16 border-4 border-[#333] border-t-white rounded-full animate-spin mb-6"></div>
        <h1 className="text-xl font-bold text-[#f3f4f6]">Initializing Machine...</h1>
      </div>
    );
  }

  // 1. Initial Setup Screen (No Token)
  if (needsSetup) {
    return (
      <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden px-12'>
        <h1 className="text-3xl font-black mb-6 text-[#f3f4f6]">Machine Setup</h1>
        <p className="text-gray-400 text-center mb-8">Please enter the secret token generated by the admin to initialize this vending machine.</p>
        <input
          type="text"
          value={secretTokenInput}
          onChange={(e) => setSecretTokenInput(e.target.value)}
          placeholder="Paste Secret Token Here"
          className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white mb-6"
        />
        <button
          onClick={handleSetup}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Initialize Machine
        </button>
      </div>
    );
  }



  if (machineData && !machineData.institute_id) {
    return (
      <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
        <div className="bg-white p-6 rounded-2xl mb-8">
          {qrEncryptedPayload ? (
            <QRCodeSVG value={qrEncryptedPayload} size={250} level="H" />
          ) : (
            <div className="w-[250px] h-[250px] flex items-center justify-center text-black">Generating...</div>
          )}
        </div>
        <h1 className="text-3xl font-black mb-2 text-[#f3f4f6]">Action Required</h1>
        <p className="text-gray-400 font-medium text-center px-12 mb-8 leading-relaxed">
          This vending machine ({machineData.name}) is not linked to any institution.
          <br /><br />
          Scan this QR code using the Official Admin App to complete the setup.
        </p>

        <button
          onClick={handleRefreshQR}
          disabled={refreshing}
          className="flex items-center gap-3 bg-[#1e1e1e] border border-[#333] px-8 py-3 rounded-full hover:bg-[#2a2a2a] transition-all disabled:opacity-50"
        >
          <FaSync className={refreshing ? "animate-spin" : ""} />
          <span>I've scanned the code</span>
        </button>
      </div>
    );
  }

  // 3. Razorpay QR Payment Screen
  if (showPaymentQR && paymentQRData) {
    return (
      <PaymentQR
        qrId={paymentQRData.qrId}
        imageUrl={paymentQRData.imageUrl}
        amount={paymentQRData.amount}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  // 4. Payment Success Screen
  if (paymentSuccess) {
    return (
      <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex justify-center items-center mb-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-black mb-2 text-[#f3f4f6]">Payment Successful!</h1>
        <p className="text-gray-400 font-medium">Thank you for your order.</p>
        <p className="text-gray-500 text-sm mt-8">Dispensing your items...</p>
      </div>
    );
  }

  // 5. Main Kiosk Screen
  return (
    <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
      <div className="w-full flex justify-between items-center px-[4%] mt-6">
        <p className='font-extrabold text-[#f3f4f6] text-xl'>All Items</p>
        <p className='text-gray-500 text-sm'>Machine: {machineData?.name}</p>
      </div>

      <div className='w-[92%] h-[90%] grid grid-cols-2 gap-4 overflow-y-auto pb-4 mt-4'>
        {items.length === 0 ? (
          <div className="col-span-2 flex justify-center items-center h-full text-gray-500">
            No items stocked.
          </div>
        ) : (
          items.map((item) => (
            <ItemCard key={item.id} {...item} onAdd={handleAddToCart} onRemove={handleRemoveFromCart} cartQuantity={cart[item.id] || 0} />
          ))
        )}
      </div>

      <OrderFooter total={cartTotal} onClear={handleClearOrder} onPay={handleInitiatePayment} isLoading={isCreatingQR} />
    </div>
  )
}

export default App
