"use client";

import { useState, useEffect } from "react";
import apiService from "@/app/services/apiService";
import { Trash2, PlusCircle, CreditCard, DollarSign, Edit3, Check, X } from "lucide-react";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

interface ChargeType {
  id: string;
  name: string;
  default_amount: number;
  is_active: boolean;
  created_at: string;
}

const ChargeTypesTab = () => {
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create State
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<number | "">("");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");

  const fetchChargeTypes = async () => {
    setLoading(true);
    try {
      const data = await apiService.get("/api/properties/charge-types/");
      setChargeTypes(data);
    } catch (error) {
      console.error("Failed to load charge types:", error);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchChargeTypes();
  }, []);

  const handleCreate = async () => {
    if (!newName || !newAmount || Number(newAmount) <= 0) {
      return alert("Please provide valid name and amount");
    }
    try {
      await apiService.post("/api/properties/charge-types/", { 
        name: newName, 
        default_amount: Number(newAmount) 
      });
      setNewName("");
      setNewAmount("");
      fetchChargeTypes();
    } catch (error) {
      console.error("Failed to create charge type:", error);
    }
  };

  const startEditing = (ct: ChargeType) => {
    setEditingId(ct.id);
    setEditName(ct.name);
    setEditAmount(ct.default_amount);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditAmount("");
  };

  const handleUpdate = async (id: string) => {
    if (!editName || !editAmount || Number(editAmount) <= 0) return;
    try {
      await apiService.patch(`/api/properties/charge-types/${id}/`, {
        name: editName,
        default_amount: Number(editAmount),
      });
      setEditingId(null);
      fetchChargeTypes();
    } catch (error) {
      console.error("Failed to update charge type:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this charge type?")) return;
    try {
        await apiService.patch(`/api/properties/charge-types/${id}/`, { is_active: false });
        setChargeTypes(chargeTypes.filter(ct => ct.id !== id));
    } catch (error) {
        console.error("Failed to deactivate charge type:", error);
        fetchChargeTypes();
    }
    };

  if (loading) {
    return <LoadingSpinner label="Loading Charges Settings"/>;
  }

  return (
    <div className="mx-auto">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-800">Charge Configuration</h2>
        <p className="text-gray-500 text-sm">Define and manage fee types and their default amounts.</p>
      </div>

      {/* Add New Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8 transition-all hover:shadow-md">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Create New Type</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-[2]">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Charge Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">Ksh</span>
            <input
              type="number"
              placeholder="0.00"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full pl-12 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            <PlusCircle size={18} />
            Create
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        {chargeTypes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 italic">No records found.</p>
          </div>
        ) : (
          chargeTypes.map((ct) => (
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
                    className="w-full md:w-auto flex-[2] px-3 py-1.5 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <div className="relative w-full md:w-auto flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Ksh</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-3 py-1.5 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleUpdate(ct.id)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Check size={18} />
                    </button>
                    <button onClick={cancelEditing} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">{ct.name}</h4>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">
                        Ksh {ct.default_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(ct)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(ct.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChargeTypesTab;