import { useState, useEffect } from 'react';
import './App.css'
import ItemCard from './components/itemCard'
import OrderFooter from './components/orderFooter'
import PaymentQR from './components/paymentQR'
import LoadingScreen from './screens/LoadingScreen';
import OfflineScreen from './screens/OfflineScreen';
import SetupScreen from './screens/SetupScreen';
import UnlinkedScreen from './screens/UnlinkedScreen';
import SuccessScreen from './screens/SuccessScreen';
import { useMachineData } from './hooks/useMachineData';
import { useCartPayments } from './hooks/useCartPayments';

function App() {
  const [items, setItems] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Hook 1: Authenticates & Fetches from Node IPC
  const {
    isLoading, machineData, needsSetup, secretTokenInput,
    setSecretTokenInput, refreshing, qrEncryptedPayload,
    checkMachineStatus, handleSetup, handleRefreshQR
  } = useMachineData(setItems);

  // Hook 2: Handles Shopping Cart Local State & Razorpay IPC
  const {
    cartTotal, cart, paymentSuccess, showPaymentQR,
    isCreatingQR, paymentQRData, handleAddToCart,
    handleRemoveFromCart, handleClearOrder, handleInitiatePayment,
    handlePaymentSuccess, handlePaymentCancel
  } = useCartPayments(items, setItems);

  // Global listener for internet connection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkMachineStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) return <OfflineScreen />;
  if (isLoading) return <LoadingScreen />;

  // 1. Initial Setup Screen (No Token)
  if (needsSetup) {
    return (
      <SetupScreen
        secretTokenInput={secretTokenInput}
        setSecretTokenInput={setSecretTokenInput}
        handleSetup={handleSetup}
      />
    );
  }

  // 2. Machine Registered but not Linked to Institution
  if (machineData && !machineData.institute_id) {
    return (
      <UnlinkedScreen
        machineName={machineData.name}
        qrEncryptedPayload={qrEncryptedPayload}
        refreshing={refreshing}
        handleRefreshQR={handleRefreshQR}
      />
    );
  }

  // 3. Razorpay QR Payment Screen
  if (showPaymentQR && paymentQRData) {
    return (
      <PaymentQR
        qrId={paymentQRData.qrId}
        imageUrl={paymentQRData.imageUrl}
        imageDataUrl={paymentQRData.imageDataUrl}
        shortUrl={paymentQRData.shortUrl}
        amount={paymentQRData.amount}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  // 4. Payment Success Screen
  if (paymentSuccess) return <SuccessScreen />;

  // 5. Main Kiosk Screen
  return (
    <div className='relative bg-transparent w-[600px] h-[1024px] m-0 p-0 flex flex-col items-center text-gray-900 overflow-hidden font-["Outfit"]'>
      {/* Premium Header */}
      <div className="w-full flex justify-between items-end px-8 pt-10 pb-6 z-20">
        <div className="flex flex-col gap-1">
          <h1 className='font-black text-4xl tracking-tight text-gray-900'>
            Delicious <span className="text-blue-600">Choices.</span>
          </h1>
          <p className='text-gray-400 font-bold text-xs uppercase tracking-[0.2em]'>
            Select your items below
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="px-3 py-1 bg-white rounded-full border border-black/10 shadow-sm">
            <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest'>
              ID: {machineData?.name || 'VEND-01'}
            </p>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className='w-full flex-1 overflow-y-auto px-6 pt-2 pb-32 space-y-4'>
        {items.length === 0 ? (
          <div className="w-full h-full flex flex-col justify-center items-center py-20 text-center gap-4">
            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center border border-black/5">
              <span className="text-4xl opacity-40">📦</span>
            </div>
            <div>
              <h3 className="text-gray-400 font-bold text-xl">Out of Stock</h3>
              <p className="text-gray-300 text-sm">We're restocking this machine right now.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {items.map((item) => {
              const itemId = item._id || item.id;
              return (
                <ItemCard
                  key={itemId}
                  {...item}
                  id={itemId}
                  onAdd={handleAddToCart}
                  onRemove={handleRemoveFromCart}
                  cartQuantity={cart[itemId] || 0}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Overlay */}
      <OrderFooter
        total={cartTotal}
        onClear={() => handleClearOrder(machineData?.items)}
        onPay={handleInitiatePayment}
        isLoading={isCreatingQR}
      />
    </div>
  )
}



export default App
