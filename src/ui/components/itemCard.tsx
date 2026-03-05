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
        <div className={`relative w-full h-[330px] rounded-[36px] overflow-hidden flex flex-col justify-end p-5 shadow-lg border border-[#333] transition-transform duration-300 ${isOut && !cartQuantity ? 'opacity-60 grayscale-[50%]' : 'group cursor-pointer transform hover:-translate-y-1'}`}>
            {/* Background Image */}
            <img src={image} className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-110 transition-transform duration-700" alt={name} />

            {/* Soft Gradient Overlay - Dark Theme Match */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 via-30% to-transparent to-50% z-10" />

            {/* Discount Badge */}
            {/* {discount && (
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold px-3 py-1.5 rounded-full z-20">
                    {discount}
                </div>
            )} */}

            <div className="z-20 w-full relative">
                {/* Title & Price */}
                <div className="flex justify-between items-center w-full mb-3">
                    <h3 className="text-white text-2xl font-black truncate drop-shadow-md">{name}</h3>
                    <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-sm whitespace-nowrap ml-2 border border-white/10">
                        ₹{price}
                    </div>
                </div>

                {/* Condition Pills */}
                <div className="flex gap-2 mb-6">
                    {tag && (
                        <span className="bg-black/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm border border-black/10">
                            {tag}
                        </span>
                    )}
                    <span className={`text-white/90 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm border border-black/10 ${isOut ? 'bg-red-500/80' : 'bg-black/20'}`}>
                        {quantity} left
                    </span>
                </div>

                {/* Add to Cart Button / Swiggy Controls */}
                {cartQuantity && cartQuantity > 0 ? (
                    <div className="w-full bg-white text-black font-extrabold text-[15px] rounded-full z-20 flex justify-between items-center shadow-xl overflow-hidden border border-white/20">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove?.(id, price); }}
                            className="px-6 py-3.5 hover:bg-gray-100 flex-1 flex justify-center items-center active:bg-gray-200 transition-colors text-xl">
                            −
                        </button>
                        <span className="px-2 text-lg">{cartQuantity}</span>
                        <button
                            disabled={isOut}
                            onClick={(e) => { e.stopPropagation(); onAdd(id, price); }}
                            className="px-6 py-3.5 hover:bg-gray-100 flex-1 flex justify-center items-center active:bg-gray-200 transition-colors text-xl disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                            +
                        </button>
                    </div>
                ) : (
                    <button
                        disabled={isOut}
                        onClick={(e) => { e.stopPropagation(); onAdd(id, price); }}
                        className="w-full bg-white text-black font-extrabold text-[15px] py-3.5 rounded-full z-20 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed border border-white/20">
                        {isOut ? 'Out of Stock' : 'Add to cart'}
                    </button>
                )}
            </div>
        </div>
    )
}

export default ItemCard