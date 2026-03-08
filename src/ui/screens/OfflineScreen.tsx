import { FaWifi } from 'react-icons/fa';

export default function OfflineScreen() {
    return (
        <div className='bg-[#121212] w-full h-full m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
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
