import { RefreshCcw } from "lucide-react";

type RefreshButtonProps = {
    isFetching: boolean;
    refetch: () => void;
    showLabel?: boolean;
}

const RefreshButton = ({ isFetching, refetch, showLabel = true }: RefreshButtonProps) => {
    return (
        <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={`
                inline-flex items-center gap-2
                px-4 py-2.5
                bg-white hover:bg-gray-50
                border border-gray-200 hover:border-gray-300
                text-gray-700 hover:text-gray-900
                text-sm font-medium
                rounded-lg
                shadow-sm hover:shadow
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95
            `}
            title="Refresh data"
        >
            <RefreshCcw 
                className={`
                    w-4 h-4 
                    ${isFetching ? 'animate-spin' : ''}
                    transition-transform duration-500
                `} 
            />
            {showLabel && (
                <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            )}
            
        </button>
    );
};

export default RefreshButton;