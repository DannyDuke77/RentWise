import { useDebounce } from "@/app/hooks/useDebounce";
import { Search, XCircle } from "lucide-react";
import { useEffect, useState } from "react";


export function SearchInput({ onSearchChange, placeholder }: { onSearchChange: (val: string) => void, placeholder?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedText = useDebounce(searchTerm, 500);

  useEffect(() => {
    onSearchChange(debouncedText);
  }, [debouncedText, onSearchChange]);

  return (
    <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
            type="text"
            placeholder={placeholder || 'Search...'}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full  bg-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
        <XCircle
            className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={() => setSearchTerm('')}
        />
    </div>
    
  );
}