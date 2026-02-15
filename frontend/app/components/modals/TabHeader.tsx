'use client';

interface TabHeaderProps {
    currentTab: 'details' | 'tenant' | 'payment' | 'charges' | 'logs';
    setCurrentTab: (tab: 'details' | 'tenant' | 'payment' | 'charges' | 'logs') => void;
    hasTenant: boolean;
    hasPendingCharges?: boolean;
}

const TabHeader = ({ currentTab, setCurrentTab, hasTenant, hasPendingCharges }: TabHeaderProps) => {
    return (
        <div className="px-1 flex border-b border-gray-200 sticky top-0 bg-white z-20">
            <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    currentTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('details')}
            >
                Unit Details
            </button>

            <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    currentTab === 'tenant' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('tenant')}
            >
                {hasTenant ? 'Add Roommate' : 'Assign Tenant'}
            </button>
            
            <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    currentTab === 'payment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('payment')}
            >
                Payment
            </button>

            <button
                className={`flex-1 py-2 text-sm font-medium transition-colors relative ${
                    currentTab === 'charges' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('charges')}
            >
                <span className="inline-flex items-center gap-1.5">
                    Charges
                    {hasPendingCharges && (
                        <span className="relative flex h-4 w-4 items-center justify-center">
                            {/* Expanding ring */}
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            {/* Stable solid dot */}
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </span>
            </button>

            <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    currentTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'                
                }`}
                onClick={() => setCurrentTab('logs')}
            >
                Logs
            </button>
        </div>
    );
};

export default TabHeader;