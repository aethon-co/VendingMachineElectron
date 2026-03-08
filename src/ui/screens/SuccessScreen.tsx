export default function SuccessScreen() {
    return (
        <div className='bg-[#121212] w-[600px] h-[860px] m-0 p-0 rounded-2xl flex flex-col justify-center items-center text-white border border-[#333] shadow-2xl overflow-hidden'>
            <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex justify-center items-center mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-3xl font-black mb-2 text-[#f3f4f6]">Payment Successful!</h1>
            <p className="text-gray-400 font-medium">Thank you for your order.</p>
            <p className="text-gray-500 text-sm mt-8">Dispensing your items...</p>
        </div>
    );
}
