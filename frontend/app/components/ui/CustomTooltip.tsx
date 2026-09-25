const CustomTooltip = ({ message }: { message: string | null }) => {
    return (
        <div className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 
            px-3.5 py-2 
            bg-gray-900 text-white text-xs font-medium rounded-lg 
            opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 
            transition-all duration-300 ease-out 
            whitespace-nowrap pointer-events-none 
            z-50 shadow-xl border border-white/10
            origin-bottom
        ">
            {message}
            <div className="
                absolute top-full left-1/2 -translate-x-1/2 -mt-px 
                border-4 border-transparent border-t-gray-900
                [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.1))]
            " />
        </div>
    )
}

export default CustomTooltip