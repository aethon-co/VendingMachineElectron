export default function SuccessScreen() {
    return (
        <div className='bg-transparent w-[600px] h-[1024px] m-0 p-0 flex flex-col justify-center items-center text-gray-900 overflow-hidden font-["Outfit"] px-12 text-center'>
            <div className="relative w-32 h-32 mb-12 flex justify-center items-center">
                {/* Pulsing success background */}
                <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-pulse"></div>
                {/* Static indicator circle */}
                <div className="absolute inset-4 bg-emerald-500/10 rounded-full"></div>

                <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex justify-center items-center shadow-[0_10px_30px_rgba(16,185,129,0.3)]">

                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
                    Order <span className="text-emerald-500">Complete!</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg leading-relaxed">
                    Thank you for your purchase. Please collect your items from the dispenser below.
                </p>
                <div className="mt-6 flex items-center gap-3 px-6 py-3 bg-white shadow-sm rounded-2xl border border-black/5 text-emerald-600 text-sm font-bold uppercase tracking-widest">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Dispensing now
                </div>
            </div>
        </div>
    );
}


