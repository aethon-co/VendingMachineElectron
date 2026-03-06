import { useEffect, useRef, useState } from "react";
import { FaTimesCircle } from "react-icons/fa";

interface PaymentQRProps {
  qrId: string;
  imageUrl: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const POLL_INTERVAL_MS = 3000;
const EXPIRY_SECONDS = 20 * 60; // must match main.ts expire_by window (Razorpay enforces strict >15 min)

const PaymentQR = ({ qrId, imageUrl, amount, onSuccess, onCancel }: PaymentQRProps) => {
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setIsExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  // Payment polling
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const result = await window.electron.checkQRPayment(qrId);
        if (result.paid) {
          clearInterval(pollRef.current!);
          clearInterval(timerRef.current!);
          onSuccess(result.paymentId || "");
        }
      } catch (e) {
        setErrorMsg("Network error while checking payment.");
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current!);
  }, [qrId, onSuccess]);

  // Stop polling when expired
  useEffect(() => {
    if (isExpired) clearInterval(pollRef.current!);
  }, [isExpired]);

  const handleCancel = async () => {
    clearInterval(pollRef.current!);
    clearInterval(timerRef.current!);
    await window.electron.closePaymentQR(qrId).catch(() => {});
    onCancel();
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = (secondsLeft / EXPIRY_SECONDS) * 100;
  const isWarning = secondsLeft <= 60;

  return (
    <div className="bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden px-10">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-black text-[#f3f4f6]">Scan & Pay</h1>
        <p className="text-gray-400 text-sm mt-1">Use any UPI app to complete your payment</p>
      </div>

      {/* QR Code */}
      {isExpired ? (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-10 flex flex-col items-center mb-6">
          <FaTimesCircle size={64} className="text-red-500 mb-4" />
          <p className="text-red-400 font-semibold text-lg text-center">QR Code Expired</p>
          <p className="text-gray-500 text-sm text-center mt-2">Please go back and try again.</p>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl mb-6 shadow-lg">
          <img
            src={imageUrl}
            alt="UPI Payment QR Code"
            className="w-[230px] h-[230px] object-contain"
            onError={() => setErrorMsg("Failed to load QR image.")}
          />
        </div>
      )}

      {/* Amount */}
      <div className="mb-6 text-center">
        <p className="text-gray-400 text-sm">Total Amount</p>
        <p className="text-4xl font-black text-white mt-1">₹{amount}</p>
      </div>

      {/* Countdown bar */}
      {!isExpired && (
        <div className="w-full mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>QR expires in</span>
            <span className={isWarning ? "text-red-400 font-bold" : "text-gray-400"}>
              {mm}:{ss}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isWarning ? "bg-red-500" : "bg-white"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Polling indicator */}
      {!isExpired && (
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Waiting for payment confirmation...</span>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <p className="text-red-400 text-xs mb-4 text-center">{errorMsg}</p>
      )}

      {/* UPI badge hints */}
      {!isExpired && (
        <p className="text-gray-600 text-xs text-center mb-6 px-6 leading-relaxed">
          Works with GPay, PhonePe, Paytm, BHIM, and all UPI-enabled apps.
        </p>
      )}

      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="w-full border border-[#333] text-gray-400 font-semibold py-4 rounded-2xl hover:bg-[#1e1e1e] hover:text-white transition-all active:scale-95"
      >
        Cancel
      </button>
    </div>
  );
};

export default PaymentQR;
