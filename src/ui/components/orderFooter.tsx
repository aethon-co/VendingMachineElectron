import { FaTrash } from "react-icons/fa";

interface OrderFooterProps {
    total: number;
    onClear: () => void;
    onPay: () => void;
}

const OrderFooter = ({ total, onClear, onPay }: OrderFooterProps) => {
    return (
        <div className='flex items-center w-full mt-auto self-end h-[100px] bg-[#1a1a1a] rounded-b-2xl text-white border-t border-[#333] shrink-0'>
            <button onClick={onClear} className='ml-[5%] text-gray-400 hover:text-red-500 transition-colors p-3 flex justify-center items-center rounded-2xl hover:bg-[#333] active:scale-95 duration-200' title="Clear Order">
                <FaTrash size={20} />
            </button>

            <div className='ml-auto text-right mr-6'>
                <p className='font-bold text-sm text-gray-400'>Your Order</p>
                <p className='text-2xl font-black text-[#f3f4f6]'>₹{total}</p>
            </div>

            <button
                onClick={onPay}
                disabled={total === 0}
                className='bg-white text-black mr-[5%] rounded-2xl px-8 py-3.5 font-extrabold text-[15px] hover:bg-gray-200 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed'>
                Pay Now
            </button>
        </div>
    )
}

export default OrderFooter;
