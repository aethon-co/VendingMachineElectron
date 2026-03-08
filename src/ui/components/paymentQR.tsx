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
    <div className="bg-transparent w-[600px] h-[1024px] m-0 p-0 flex flex-col justify-center items-center text-gray-900 overflow-hidden px-12 font-['Outfit']">
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-16 h-16 bg-white shadow-sm rounded-2xl border border-black/5 flex items-center justify-center mb-6">
          <span className="text-3xl">📱</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
          Scan <span className="text-blue-600">& Pay.</span>
        </h1>
        <p className="text-gray-400 font-medium text-lg mt-2">Use any UPI app to complete payment</p>
      </div>

      <div className="relative group mb-10">
        <div className="absolute inset-[-10px] bg-blue-500/5 rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {isExpired ? (
          <div className="relative bg-white shadow-xl rounded-[40px] p-12 flex flex-col items-center border border-black/5 w-[300px] h-[300px] justify-center text-center">

            <FaTimesCircle size={48} className="text-red-500/40 mb-4" />
            <p className="text-red-500 font-bold text-lg">QR Expired</p>
            <p className="text-gray-400 text-xs mt-2 font-bold uppercase tracking-widest leading-loose">Please try again</p>
          </div>
        ) : (imageDataUrl || imageUrl) && !imageFailed ? (
          <div className="relative bg-white p-6 rounded-[40px] shadow-2xl overflow-hidden transition-transform group-hover:scale-[1.02] border border-black/5">
            <img
              src={imageDataUrl || imageUrl}
              alt="UPI Payment QR Code"
              className="w-[440px] h-[440px] object-contain"
              onError={() => {
                setImageFailed(true);
                setErrorMsg("QR image unavailable. Switched to fallback.");
              }}
            />
          </div>
        ) : (shortUrl || imageUrl) ? (
          <div className="relative bg-white p-6 rounded-[40px] shadow-2xl overflow-hidden transition-transform group-hover:scale-[1.02] border border-black/5">
            <QRCodeSVG value={shortUrl || imageUrl} size={440} level="H" includeMargin bgColor="#FFFFFF" fgColor="#000000" />
          </div>
        ) : (
          <div className="relative bg-white shadow-xl rounded-[40px] p-12 flex flex-col items-center border border-black/5 w-[300px] h-[300px] justify-center text-center">
            <FaTimesCircle size={48} className="text-red-500/40 mb-4" />
            <p className="text-red-400 font-bold text-lg">QR Unavailable</p>
            <p className="text-gray-400 text-xs mt-2 font-bold uppercase tracking-widest leading-loose">Please retry</p>
          </div>
        )}
      </div>

      <div className="mb-10 text-center py-4 px-10 bg-white shadow-sm rounded-[32px] border border-black/5">
        <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.3em] mb-1">Total Amount</p>
        <p className="text-4xl font-black text-gray-900 tabular-nums tracking-tight">₹{amount}</p>
      </div>

      {!isExpired && (
        <div className="w-full mb-10 max-w-[320px]">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Expires in</span>
              <span className={`text-xl font-black tabular-nums ${isWarning ? "text-red-500 animate-pulse" : "text-gray-700"}`}>{mm}:{ss}</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">Secure Link</div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-black/5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isWarning ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {!isExpired && (
        <div className="flex items-center gap-3 bg-white shadow-sm px-6 py-3 rounded-full text-gray-400 text-xs font-bold uppercase tracking-widest mb-8 border border-black/5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
          <span>Waiting for Payment</span>
        </div>
      )}

      {errorMsg && <p className="text-red-500 text-xs mb-6 text-center font-bold px-4">{errorMsg}</p>}

      {!isExpired && (
        <p className="text-gray-300 text-[10px] text-center mb-8 px-10 leading-relaxed font-bold uppercase tracking-widest">
          GPay · PhonePe · Paytm · BHIM · Any UPI
        </p>
      )}

      <button
        onClick={handleCancel}
        className="w-full max-w-[320px] text-gray-400 font-bold py-6 rounded-3xl hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95 border border-transparent hover:border-black/5"
      >
        Cancel Order
      </button>
    </div>
  );
};


export default PaymentQR;

