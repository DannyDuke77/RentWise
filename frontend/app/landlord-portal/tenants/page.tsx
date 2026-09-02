'use client';

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { useEffect, useMemo, useRef, useState } from "react";
import { 
  Building, PhoneIcon, UserIcon, IdCardIcon,
  CheckCircleIcon, HistoryIcon, Users, Search, X, 
  Filter, MailIcon, 
} from "lucide-react";
import { useTenants } from "@/app/hooks/queries/useTenantsQueries";
import { Tenant } from "@/app/src/types/Types";
import Pagination from "@/app/components/ui/Pagination";

const TenantsPage = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

  const { data: tenantData, isLoading, isError } = useTenants(page, pageSize);

  const rawTenants: Tenant[] = tenantData?.results ?? [];
  const totalCount = tenantData?.count ?? 0;

  const isActive = (tenant: Tenant) => tenant.tenancies?.some((t) => t.is_active);

  // Filter current page results locally
  const filteredTenants = useMemo(() => {
    return rawTenants.filter((tenant: Tenant) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !search ||
        tenant.full_name.toLowerCase().includes(search) ||
        tenant.phone.toLowerCase().includes(search) ||
        tenant.email?.toLowerCase().includes(search) ||
        tenant.id_number?.toString().toLowerCase().includes(search) ||
        tenant.tenancies.some(
          (t) =>
            t.property_name.toLowerCase().includes(search) ||
            t.unit_name.toLowerCase().includes(search)
        );

      const active = isActive(tenant);

      const matchesFilter =
        !filterMethod ||
        (filterMethod === "active" && active) ||
        (filterMethod === "inactive" && !active);

      return matchesSearch && matchesFilter;
    });
  }, [rawTenants, searchTerm, filterMethod]);

  useEffect(() => {
    setPage(1);
  }, [filterMethod, searchTerm, pageSize]);

  const clearSearch = () => {
    setSearchTerm("");
    setFilterMethod("");
  };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner
          size="lg"
          color="blue-600"
          label="Fetching tenants..."
          showTimer={true}
        />
      </div>
  );

  if (isError)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold text-gray-900">Unable to load tenants</h1>
      </div>
    );

  return (
    <div className="max-w-8xl space-y-8 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <h1 className="flex items-center space-x-3">
          <Users className="w-10 h-10" />
          <span className="text-3xl font-bold text-gray-900 uppercase">Tenants</span>
        </h1>
        <p className="mt-2 text-gray-600">Historical and active tracking of all residents</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Records</p>
          <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-gray-500">Currently Renting (Page)</p>
          <p className="text-3xl font-bold text-green-600">
            {rawTenants.filter((t) => isActive(t)).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-sm font-medium text-gray-500">Past Tenants (Page)</p>
          <p className="text-3xl font-bold text-amber-600">
            {rawTenants.filter((t) => !isActive(t)).length}
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, ID number, property, or unit..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 hover:bg-white appearance-none cursor-pointer min-w-[140px]"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {(searchTerm || filterMethod) && (
            <button
              onClick={clearSearch}
              className="inline-flex items-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 cursor-pointer"
            >
              <X className="w-5 h-5 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tenant Directory */}
      {filteredTenants.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-20 text-center">
          <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No matching tenants found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTenants.map((tenant: Tenant) => (
            <div
              key={tenant.id}
              className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-xl font-bold text-gray-600 border">
                      {tenant.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{tenant.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {isActive(tenant) ? (
                          <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircleIcon className="h-3 w-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <HistoryIcon className="h-3 w-3 mr-1" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      Member Since
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(tenant.created_at).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{tenant.phone}</span>
                    </div>
                    <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <IdCardIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{tenant.id_number}</span>
                    </div>
                  </div>
                  {tenant.email && (
                    <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{tenant.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Occupancy History
                  </h4>
                  <div className="space-y-2">
                    {tenant.tenancies?.map((tcy) => (
                      <div
                        key={tcy.id}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          tcy.is_active
                            ? "bg-blue-50/50 border-blue-100"
                            : "bg-white border-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Building
                            className={`h-4 w-4 ${
                              tcy.is_active ? "text-blue-500" : "text-gray-400"
                            }`}
                          />
                          <div>
                            <p
                              className={`text-sm font-bold ${
                                tcy.is_active ? "text-blue-900" : "text-gray-700"
                              }`}
                            >
                              {tcy.property_name} - Unit {tcy.unit_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(tcy.start_date)} —{" "}
                              {tcy.end_date ? formatDate(tcy.end_date) : "Present"}
                            </p>
                          </div>
                        </div>
                        {tcy.is_active ? (
                          <span className="text-[10px] font-black text-blue-600 uppercase italic">
                            Current
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            Moved Out
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default TenantsPage;