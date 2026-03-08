import { FaTrash, FaArrowRight } from "react-icons/fa";

interface OrderFooterProps {
    total: number;
    onClear: () => void;
    onPay: () => void;
    isLoading?: boolean;
}

const OrderFooter = ({ total, onClear, onPay, isLoading = false }: OrderFooterProps) => {
    return (
        <div className='fixed bottom-8 left-1/2 -translate-x-1/2 w-[540px] h-[88px] bg-white border border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-[28px] text-gray-900 flex items-center px-6 z-50'>
            <button
                onClick={onClear}
                className='text-gray-300 hover:text-orange-600 transition-all p-4 flex justify-center items-center rounded-2xl hover:bg-orange-50 active:scale-90 duration-200 group'
                title="Clear Order"
            >
                <FaTrash size={18} className="group-hover:rotate-12 transition-transform" />
            </button>

            <div className='flex flex-col ml-4'>
                <p className='font-bold text-[10px] uppercase tracking-widest text-gray-400'>Total Amount</p>
                <p className='text-2xl font-black text-gray-900 tabular-nums'>₹{total}</p>
            </div>

            <div className="ml-auto flex items-center gap-4">
                <button
                    onClick={onPay}
                    disabled={total === 0 || isLoading}
                    className='relative group overflow-hidden bg-blue-600 text-white rounded-[18px] px-10 py-4 font-black text-[16px] transition-all shadow-md shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3 active:scale-95'
                >
                    {isLoading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Pay Now</span>
                            <FaArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>

    )
}



export default OrderFooter;
