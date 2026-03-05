import { RiDrinks2Line } from "react-icons/ri";
import { GiChipsBag } from "react-icons/gi";
import { GiWrappedSweet } from "react-icons/gi";

const MenuFilter = () => {
    return (
        <div className="mt-5 w-[60%] flex justify-around">
            <button className="rounded-2xl flex justify-center items-center w-14 h-14 bg-[#1e1e1e] border border-[#333] text-white hover:bg-[#333] hover:border-[#555] transition-all duration-300 shadow-md transform hover:scale-105"><RiDrinks2Line size={24} /></button>
            <button className="rounded-2xl flex justify-center items-center w-14 h-14 bg-[#1e1e1e] border border-[#333] text-white hover:bg-[#333] hover:border-[#555] transition-all duration-300 shadow-md transform hover:scale-105"><GiChipsBag size={24} /></button>
            <button className="rounded-2xl flex justify-center items-center w-14 h-14 bg-[#1e1e1e] border border-[#333] text-white hover:bg-[#333] hover:border-[#555] transition-all duration-300 shadow-md transform hover:scale-105"><GiWrappedSweet size={24} /></button>
        </div>
    )
}

export default MenuFilter