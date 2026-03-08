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
