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
        <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white   overflow-hidden'>
            <div className="bg-white p-6 rounded-2xl mb-8">
                {qrEncryptedPayload ? (
                    <QRCodeSVG value={qrEncryptedPayload} size={250} level="H" />
                ) : (
                    <div className="w-[250px] h-[250px] flex items-center justify-center text-black">Generating...</div>
                )}
            </div>
            <h1 className="text-3xl font-black mb-2 text-[#f3f4f6]">Action Required</h1>
            <p className="text-gray-400 font-medium text-center px-12 mb-8 leading-relaxed">
                This vending machine ({machineName}) is not linked to any institution.
                <br /><br />
                Scan this QR code using the Official Admin App to complete the setup.
            </p>

            <button
                onClick={handleRefreshQR}
                disabled={refreshing}
                className="flex items-center gap-3 bg-[#1e1e1e]  px-8 py-3 rounded-full hover:bg-[#2a2a2a] transition-all disabled:opacity-50"
            >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                <span>I've scanned the code</span>
            </button>
        </div>
    );
}
