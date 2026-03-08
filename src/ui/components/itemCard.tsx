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
            className={`relative w-full h-[310px] rounded-[32px] overflow-hidden flex flex-col border transition-all duration-500 ease-out
            ${isOut && !cartQuantity
                    ? 'opacity-60 grayscale-[40%] border-black/5 bg-gray-50'
                    : 'group cursor-pointer border-black/5 hover:border-blue-500/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] bg-white'}`}
        >
            {/* Top Area - Image (approx 60% height) */}
            <div className="relative h-[186px] w-full overflow-hidden shrink-0">
                <img
                    src={image}
                    className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${isOut ? 'grayscale scale-105' : 'group-hover:scale-110'}`}
                    alt={name}
                />

                {/* Out of Stock Overlay */}
                {isOut && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-20">
                        <div className="bg-orange-600 text-white font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg transform rotate-[-5deg] border-2 border-white">
                            Temporarily Unavailable
                        </div>
                    </div>
                )}

                {/* Floating Tags */}
                <div className="absolute top-4 left-4 flex gap-2 z-30">
                    {tag && (
                        <span className="bg-white text-blue-600 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-xl shadow-sm border border-black/5">
                            {tag}
                        </span>
                    )}
                    {!isOut && (
                        <span className="bg-white text-gray-500 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-xl shadow-sm border border-black/5">
                            {quantity} in stock
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom Area - Content Section (rest of height) */}
            <div className="flex-1 bg-white h-[124px] p-5 pt-3 flex flex-col justify-between relative z-20">
                <div className="flex flex-col gap-0">
                    <h3 className="text-gray-900 text-lg font-black tracking-tight leading-tight group-hover:text-blue-600 transition-colors truncate">
                        {name}
                    </h3>
                    <p className="text-blue-600 font-extrabold text-base">
                        ₹{price}
                    </p>
                </div>

                <div className="mt-2 text-center">
                    {cartQuantity && cartQuantity > 0 ? (
                        <div className="w-full bg-blue-600 text-white flex items-center justify-between rounded-xl overflow-hidden shadow-lg h-[44px]">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove?.(id, price); }}
                                className="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center text-xl font-light"
                            >
                                −
                            </button>
                            <span className="font-black text-lg tabular-nums">
                                {cartQuantity}
                            </span>
                            <button
                                disabled={isOut}
                                onClick={(e) => { e.stopPropagation(); onAdd(id, price); }}
                                className="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center text-xl font-light disabled:opacity-20"
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <button
                            disabled={isOut}
                            onClick={(e) => { e.stopPropagation(); onAdd(id, price); }}
                            className="w-full h-[44px] bg-blue-600 text-white border border-transparent font-black text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group/btn overflow-hidden relative"
                        >
                            {isOut ? (
                                <span className="text-xs">Sold Out</span>
                            ) : (
                                <>
                                    <span className="relative z-10 transition-colors">Add to Cart</span>
                                    <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 transition-all relative z-10 shadow-sm">
                                        <FaArrowRight size={12} />
                                    </span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemCard