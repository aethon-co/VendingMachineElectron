export default function LoadingScreen() {
    return (
        <div className='bg-[#121212] w-full h-full m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
            <div className="w-16 h-16 border-4 border-[#333] border-t-white rounded-full animate-spin mb-6"></div>
            <h1 className="text-xl font-bold text-[#f3f4f6]">Initializing Machine...</h1>
        </div>
    );
}
