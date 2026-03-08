import { FaWifi } from 'react-icons/fa';

export default function OfflineScreen() {
    return (
        <div className='bg-transparent w-[600px] h-[1024px] m-0 p-0 flex flex-col justify-center items-center text-gray-900 overflow-hidden font-["Outfit"] px-12 text-center'>
            <div className="relative w-32 h-32 mb-12 flex justify-center items-center">
                {/* Pulsing red background */}
                <div className="absolute inset-0 bg-red-500/5 rounded-full animate-pulse"></div>

                <div className="relative">
                    <FaWifi size={48} className="text-red-500/20" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1.5 bg-red-500 rounded-full -rotate-45 shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
                    Connection <span className="text-red-500">Lost.</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg leading-relaxed">
                    This vending machine requires an active internet connection to process payments.
                </p>
                <div className="mt-4 px-6 py-3 bg-white shadow-sm rounded-2xl border border-black/5 text-gray-400 text-sm font-bold uppercase tracking-widest">
                    Waiting for network...
                </div>
            </div>
        </div>
    );
}


