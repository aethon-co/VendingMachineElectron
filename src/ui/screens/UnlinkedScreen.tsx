import { FaSync } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

interface UnlinkedScreenProps {
    machineName: string;
    qrEncryptedPayload: string;
    refreshing: boolean;
    handleRefreshQR: () => void;
}

export default function UnlinkedScreen({ machineName, qrEncryptedPayload, refreshing, handleRefreshQR }: UnlinkedScreenProps) {
    return (
        <div className='bg-transparent w-[600px] h-[1024px] m-0 p-0 flex flex-col justify-center items-center text-gray-900 overflow-hidden font-["Outfit"] px-12 text-center'>
            <div className="w-full max-w-[480px] flex flex-col gap-12">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
                        Action <span className="text-blue-600">Required.</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        This machine (<span className="text-gray-900 font-bold">{machineName}</span>) needs to be linked to your institution.
                    </p>
                </div>

                <div className="relative group mx-auto">
                    {/* QR Code Container with subtle background strip */}
                    <div className="absolute inset-[-10px] bg-blue-500/5 rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-white p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-[1.02] border border-black/5">

                        {qrEncryptedPayload ? (
                            <QRCodeSVG value={qrEncryptedPayload} size={240} level="H" bgColor="#FFFFFF" fgColor="#000000" />
                        ) : (
                            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center text-gray-200 gap-3">
                                <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="font-bold text-xs uppercase tracking-widest text-gray-400">Generating</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-8 items-center">
                    <p className="text-gray-400 text-base leading-relaxed max-w-[320px]">
                        Scan this code using the <span className="text-blue-600 font-bold italic">Official Admin App</span> to complete activation.
                    </p>

                    <button
                        onClick={handleRefreshQR}
                        disabled={refreshing}
                        className="flex items-center gap-3 bg-white shadow-sm border border-black/5 px-10 py-5 rounded-[24px] hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-30 group"
                    >
                        <FaSync className={`text-gray-400 group-hover:text-blue-600 transition-colors ${refreshing ? "animate-spin" : ""}`} />
                        <span className="font-bold text-gray-600 group-hover:text-gray-900">I've scanned the code</span>
                    </button>
                </div>
            </div>
        </div>
    );
}


