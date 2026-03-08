export default function LoadingScreen() {
    return (
        <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white   overflow-hidden'>
            <div className="w-16 h-16 border-4 border-[#333] border-t-white rounded-full animate-spin mb-6"></div>
            <h1 className="text-xl font-bold text-[#f3f4f6]">Initializing Machine...</h1>
        </div>
    );
}
