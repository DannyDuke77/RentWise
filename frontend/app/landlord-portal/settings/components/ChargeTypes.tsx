"use client";

import { useState, useEffect } from "react";
import { 
    Trash2, PlusCircle, CreditCard, DollarSign, Edit3, Check, X, 
    Loader2, AlertTriangle, AlertCircle, Receipt, RefreshCcw, LayoutGrid,
    Search, ChevronDown,
    Filter
} from "lucide-react";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { useChargeTypes } from "@/app/hooks/queries/useSettingsQueries";
import { useCreateChargeType, useUpdateChargeType } from "@/app/hooks/mutations/useSettingsMutations";
import CustomTooltip from "@/app/components/ui/CustomTooltip";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import { useToast } from "@/app/providers/ToastProvider";
import { useDebounce } from "@/app/hooks/useDebounce";
import Pagination from "@/app/components/ui/Pagination";
import { SearchInput } from "@/app/components/ui/SearchInput";
import RefreshButton from "@/app/components/ui/RefreshButton";

interface ChargeType {
  id: string;
  name: string;
  default_amount: number;
  is_active: boolean;
  created_at: string;
}

const ChargeTypesTab = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("True");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const effectiveSearch = debouncedSearch.trim();

  const { data: chargeTypesData, refetch, isFetching } = useChargeTypes(
    page,
    pageSize,
    effectiveSearch,
    statusFilter,
  );
  
  const chargeTypes: ChargeType[] = chargeTypesData?.results ?? [];
  const totalCount = chargeTypesData?.count ?? 0;

  const createCharge = useCreateChargeType();
  const updateCharge = useUpdateChargeType();
  
  const [chargeName, setChargeName] = useState("");
  const [defaultAmount, setDefaultAmount] = useState<number | "">("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [errors, setErrors] = useState<any>({});
  const { showToast } = useToast();

  useEffect(() => {
    setPage(1);
  }, [effectiveSearch]);

  const handleSubmit = async () => {
    const isCreating = !editingId;
    
    if (isCreating) {
      if (!chargeName || Number(defaultAmount) <= 0) {
        showToast('Missing Information', 'Please fill in all required fields.', 'error');
        setErrors({
          ...(chargeName.trim() === "" && { chargeName: ['Charge name is required'] }),
          ...(defaultAmount === "" && { defaultAmount: ['Default amount is required'] }),
        });
        return;
      }
    } else {
      if (!hasChanges()) {
        showToast('No Changes', 'No changes were made to the charge type.', 'warning');
        return;
      }
      
      if (!editName || !editAmount || Number(editAmount) <= 0) {
        showToast('Missing Information', 'Please fill in all required fields.', 'error');
        return;
      }
    }

    try {
      if (isCreating) {
        const response = await createCharge.mutateAsync({
          name: chargeName,
          default_amount: Number(defaultAmount),
        });
        setChargeName("");
        setDefaultAmount("");
        setErrors({});  
        
        if (response.id) {
          showToast('Success', 'Charge type created successfully', 'success');
        } else {
          showToast('Error', response.business || 'Failed to create charge type', 'error');
        }
      } else {
        const response = await updateCharge.mutateAsync({
          id: editingId,
          name: editName,
          default_amount: Number(editAmount),
        });
        cancelEditing();
        
        if (response.id) {
          showToast('Success', 'Charge type updated successfully', 'success');
        } else {
          showToast('Error', response.business || 'Failed to update charge type', 'error');
        }
      }
    } catch (error) {
      console.error("Failed to submit:", error);
      showToast('Error', isCreating ? 'Failed to create charge type' : 'Failed to update charge type', 'error');
    }
  };

  const startEditing = (ct: ChargeType) => {
    setEditingId(ct.id);
    setEditName(ct.name);
    setEditAmount(ct.default_amount);
  };

  const hasChanges = () => {
    if (!editingId) return false;
    const baseline = {
      name: chargeTypes.find((ct: ChargeType) => ct.id === editingId)?.name ?? "",
      amount: chargeTypes.find((ct: ChargeType) => ct.id === editingId)?.default_amount ?? "",
    };
    return JSON.stringify({ name: editName, amount: editAmount }) !== JSON.stringify(baseline);
  }

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditAmount("");
  };

  const clearFilters = () => {
      setSearchTerm('');
      setStatusFilter('True');
      setPage(1);
    };

  const handleDeleteClick = (ct: ChargeType) => {
    setDeletingId(ct.id);
    setDeletingName(ct.name);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      await updateCharge.mutateAsync({ 
        id: deletingId, 
        is_active: false 
      });
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setDeletingName("");
      showToast('Success', 'Charge type deactivated successfully', 'success');
      refetch();
    } catch (error: any) {
      console.error("Failed to delete charge type:", error);
      setDeleteError(error?.response?.data?.detail || "Failed to delete charge type. Please try again.");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingId(null);
    setDeletingName("");
    setDeleteError(null);
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Charge Types</h2>
              <p className="text-sm text-gray-500">Define and manage fee types and their default amounts</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton isFetching={isFetching} refetch={refetch} />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
            <LayoutGrid className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">
              {totalCount} {totalCount === 1 ? 'type' : 'types'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <SearchInput 
            onSearchChange={setSearchTerm} 
            placeholder="Search changes..."
          />
        </div>
        
        <div className="relative">
          <select
            className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none min-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="True">Active</option>
            <option value="False">Inactive</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {(searchTerm || statusFilter !== 'True') && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Add Charge Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Create New Type</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-[2]">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Charge Name e.g. Window Damage"
              value={chargeName}
              onChange={(e) => {
                setChargeName(e.target.value);
                if (errors.chargeName) {
                  setErrors((prev: any) => ({ ...prev, chargeName: undefined }));
                }
              }}
              className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none ${
                errors.chargeName ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500'
              }`}
            />
            {errors.chargeName && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{errors.chargeName[0]}</p>
              </div>
            )}
          </div>
          
          <div className="relative flex-[2]">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              placeholder="Default Amount e.g. 1000"
              value={defaultAmount}
              onChange={(e) => {
                setDefaultAmount(e.target.value === "" ? "" : Number(e.target.value));
                if (errors.defaultAmount) {
                  setErrors((prev: any) => ({ ...prev, defaultAmount: undefined }));
                }
              }}
              className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none ${
                errors.defaultAmount ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500'
              }`}
            />
            {errors.defaultAmount && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{errors.defaultAmount[0]}</p>
              </div>
            )}
          </div>
          
          <div className="relative group">
            <button
              onClick={handleSubmit}
              disabled={createCharge.isPending}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {createCharge.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle size={18} />
              )}
              {createCharge.isPending ? 'Creating...' : 'Create Type'}
            </button>
            {(!chargeName || !defaultAmount || Number(defaultAmount) <= 0) && (
              <CustomTooltip message="Please fill out all fields" />
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {isFetching ? (
        <LoadingSpinner 
          label="Fetching charge types"  
        />
      ) : !chargeTypes.length ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 italic">
            {searchTerm ? `No charge types found matching "${searchTerm}"` : 'No charge types found. Please create a new one using the fields above.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chargeTypes.map((ct: ChargeType) => (
              <div 
                key={ct.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  editingId === ct.id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-100 bg-white hover:border-gray-300 shadow-sm"
                }`}
              >
                {editingId === ct.id ? (
                  /* EDIT MODE */
                  <div className="flex flex-1 flex-col md:flex-row gap-3 items-center">
                    <input
                      className="w-full md:w-auto flex-[2] px-3 py-1.5 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <div className="relative w-full md:w-auto flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Ksh</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-3 py-1.5 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={handleSubmit}
                        disabled={!hasChanges() || updateCharge.isPending}
                        className="p-2 relative group bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {updateCharge.isPending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                        {!hasChanges() && (
                          <CustomTooltip message="No changes made" />
                        )}
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <>
                    <div className={`flex items-center gap-4 ${ct.is_active ? "opacity-100" : "opacity-40"}`}>
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight">{ct.name}</h4>
                        <p className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
                          Ksh {ct.default_amount.toLocaleString()}
                        </p>
                        {ct.is_active && <p className="text-sm text-gray-500">Active</p>}
                      </div>
                    </div>
                    {ct.is_active && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(ct)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ct)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        icon={<AlertTriangle size={24} className="text-red-500" />}
        title="Deactivate Charge Type"
        detail={
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Are you sure you want to deactivate <span className="font-semibold text-gray-900">"{deletingName}"</span>?
            </p>
            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}
          </div>
        }
        message="This charge type will no longer be available for new charges."
        message2="Existing charges using this type will keep their current amount."
        onConfirm={handleConfirmDelete}
        onClose={handleCancelDelete}
        confirmText="Deactivate"
        isLoading={updateCharge.isPending}
      />
    </div>
  );
};

export default ChargeTypesTab;