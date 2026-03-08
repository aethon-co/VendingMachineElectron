export default function LoadingScreen() {
    return (
        <div className='bg-transparent w-[600px] h-[1024px] m-0 p-0 flex flex-col justify-center items-center text-gray-900 overflow-hidden font-["Outfit"]'>
            <div className="relative w-24 h-24 mb-10">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/5 animate-ping opacity-40"></div>
                {/* Inner gradient spinner */}
                <div className="absolute inset-0 rounded-full border-t-4 border-l-4 border-blue-600 border-transparent animate-spin"></div>
                {/* Center dot */}
                <div className="absolute inset-[35%] bg-blue-600 rounded-full"></div>
            </div>


            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-black tracking-tighter text-gray-900">
                    Initializing<span className="text-blue-600/30">...</span>
                </h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">
                    Setting up your experience
                </p>
            </div>
        </div>
    );
}


