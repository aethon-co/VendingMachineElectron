import { FaArrowRight } from "react-icons/fa";

interface ItemCardProps {
    id: string;
    name: string;
    price: number;
    image: string;
    tag?: string;
    quantity: number;
    cartQuantity?: number;
    onAdd: (id: string, price: number) => void;
    onRemove?: (id: string, price: number) => void;
}

const ItemCard = ({ id, name, price, image, tag, quantity, cartQuantity, onAdd, onRemove }: ItemCardProps) => {
    const isOut = quantity === 0;

    return (
        <div
            className={`relative w-full h-[110px] rounded-[24px] overflow-hidden flex flex-row border transition-all duration-300
            ${isOut && !cartQuantity
                    ? 'opacity-60 grayscale-[40%] border-black/5 bg-gray-50'
                    : 'group cursor-pointer border-black/5 hover:border-blue-500/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] bg-white'}`}
        >
            {/* Image */}
            <div className="relative w-[110px] h-full shrink-0 overflow-hidden">
                <img
                    src={image}
                    className={`w-full h-full object-cover transition-all duration-700 ${isOut ? 'grayscale' : 'group-hover:scale-110'}`}
                    alt={name}
                />
                {isOut && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <div className="bg-orange-600 text-white font-black text-[9px] uppercase tracking-widest px-2 py-1 rounded-full shadow-md transform rotate-[-6deg] border-2 border-white">
                            Sold Out
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 px-5 flex items-center justify-between bg-white">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-gray-900 text-lg font-black tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                        {name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <p className="text-blue-600 font-black text-base">₹{price}</p>
                        {tag && (
                            <span className="text-blue-600 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100">
                                {tag}
                            </span>
                        )}
                        {!isOut && (
                            <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">
                                {quantity} left
                            </span>
                        )}
                    </div>
                </div>

                {cartQuantity && cartQuantity > 0 ? (
                    <div className="bg-blue-600 text-white flex items-center rounded-xl overflow-hidden shadow-md h-[44px] shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove?.(id, price); }}
                            className="h-full px-3 hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center text-xl font-light"
                        >
                            −
                        </button>
                        <span className="font-black text-base tabular-nums min-w-[20px] text-center px-1">
                            {cartQuantity}
                        </span>
                        <button
                            disabled={isOut}
                            onClick={(e) => { e.stopPropagation(); onAdd(id, price); }}
                            className="h-full px-3 hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center text-xl font-light disabled:opacity-20"
                        >
                            +
                        </button>
                    </div>
                ) : (
                    <button
                        disabled={isOut}
                        onClick={(e) => { e.stopPropagation(); onAdd(id, price); }}
                        className="h-[44px] px-4 bg-blue-600 text-white font-black text-sm rounded-xl flex items-center gap-2 hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {isOut ? (
                            <span className="text-xs">Sold Out</span>
                        ) : (
                            <>
                                <span>Add</span>
                                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                                    <FaArrowRight size={10} />
                                </span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ItemCard