import { useEffect, useRef, useState } from "react";
import { FaTimesCircle } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";

interface PaymentQRProps {
  qrId: string;
  imageUrl: string;
  imageDataUrl: string;
  shortUrl: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const POLL_INTERVAL_MS = 3000;
const EXPIRY_SECONDS = 20 * 60;

const PaymentQR = ({ qrId, imageUrl, imageDataUrl, shortUrl, amount, onSuccess, onCancel }: PaymentQRProps) => {
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
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
      } catch {
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
    await window.electron.closePaymentQR(qrId).catch(() => { });
    onCancel();
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = (secondsLeft / EXPIRY_SECONDS) * 100;
  const isWarning = secondsLeft <= 60;

  return (
    <div className="w-full h-full m-0 p-0 flex flex-row justify-center items-center text-white overflow-hidden bg-[#121212]">
      {/* Left Column: QR Code */}
      <div className="w-1/2 h-full flex flex-col items-center justify-center p-8 border-r border-[#333]">
        <h1 className="text-2xl font-black text-[#f3f4f6] mb-1">Scan & Pay</h1>
        <p className="text-gray-400 text-sm mb-6">Use any UPI app</p>

        {isExpired ? (
          <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-10 flex flex-col items-center">
            <FaTimesCircle size={48} className="text-red-500 mb-4" />
            <p className="text-red-400 font-semibold text-lg text-center">QR Code Expired</p>
          </div>
        ) : (imageDataUrl || imageUrl) && !imageFailed ? (
          <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center justify-center">
            <img
              src={imageDataUrl || imageUrl}
              alt="UPI Payment QR Code"
              className="w-[200px] h-[200px] object-contain"
              onError={() => {
                setImageFailed(true);
                setErrorMsg("QR image unavailable. Switched to fallback QR.");
              }}
            />
          </div>
        ) : (shortUrl || imageUrl) ? (
          <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center justify-center">
            <QRCodeSVG value={shortUrl || imageUrl} size={200} level="H" includeMargin />
          </div>
        ) : (
          <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-10 flex flex-col items-center">
            <FaTimesCircle size={48} className="text-red-500 mb-4" />
            <p className="text-red-400 font-semibold text-lg text-center">QR Unavailable</p>
          </div>
        )}
      </div>

      {/* Right Column: details and controls */}
      <div className="w-1/2 h-full flex flex-col justify-center px-10">
        <div className="mb-8">
          <p className="text-gray-400 text-sm">Total Amount</p>
          <p className="text-5xl font-black text-white mt-1">₹{amount}</p>
        </div>

        {/* Countdown bar */}
        {!isExpired && (
          <div className="w-full mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>QR expires in</span>
              <span className={isWarning ? "text-red-400 font-bold" : "text-gray-400"}>{mm}:{ss}</span>
            </div>
            <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isWarning ? "bg-red-500" : "bg-white"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Polling indicator */}
        {!isExpired && (
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span>Waiting for payment...</span>
          </div>
        )}

        {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

        {!isExpired && (
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Works with GPay, PhonePe, Paytm, BHIM, and all UPI-enabled apps.
          </p>
        )}

        <button
          onClick={handleCancel}
          className="w-full border border-[#333] text-gray-400 font-semibold py-4 rounded-2xl hover:bg-[#1e1e1e] hover:text-white transition-all active:scale-95 text-lg"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
};

export default PaymentQR;
