export const queryKeys = {
    // Business
    businesses: () => ['businesses'] as const,
    businessMembers: (businessId: string | null, page?: number, pageSize?: number) => ["business-members", businessId, page, pageSize] as const,
    businessInvitations: (businessId: string | null, page?: number, pageSize?: number) => ["business-invitations", businessId, page, pageSize] as const,

    // Mpesa Configuration
    mpesaConfiguration: (businessId: string | null) => ["mpesaConfiguration", businessId] as const,

    // Property
    properties: (businessId: string | null, page?: number, pageSize?: number, search?: string) => ['properties', businessId, page, pageSize, search] as const,
    property: (businessId: string | null, propertyId: string) => ['property', businessId, propertyId] as const,
    propertyTypes: () => ['property-types'] as const,
    propertyRentSummary: (businessId: string | null, propertyId: string, month: number, year: number) => ['property-rent-summary', businessId, propertyId, month, year] as const,
    propertyUnits: (businessId: string | null, propertyId: string, page?: number, pageSize?: number, search?: string, statusFilter?: string, rentStatusFilter?: string) => ['property-units',businessId, propertyId, page, pageSize, search, statusFilter, rentStatusFilter] as const,
    
    // Unit
    units: () => ['units'] as const,
    unit: (unitId: string) => ['unit', unitId] as const,
    unitDetails: (unitId?: string | null) => ['unit-detail', unitId] as const,
    unitTenants: (unitId?: string | null) => ['unit-tenants', unitId] as const,
    unitPayments: (unitId: string, page?: number, pageSize?: number, search?: string, filterMethod?: string, filterDate?: string) => ['unit-payments', unitId, page, pageSize, search, filterMethod, filterDate] as const,

    // Tenants
    tenants: (businessId: string | null, page: number, pageSize: number, search?: string, status?: string) => ['tenants', businessId, page, pageSize, search, status] as const,
    tenantPortal: () => ["tenantPortal"] as const,
    tenantPayments: (page: number, pageSize: number) => ["tenantPayments", page, pageSize] as const,

    // Payments
    payments: (businessId: string | null, page: number, pageSize: number, search?: string, paymentMethod?: string, filterDate?: string, filterType?: string) => ['payments', businessId, page, pageSize, search, paymentMethod, filterDate, filterType] as const,
    paymentAnalytics: () => ['payment-analytics'] as const,
    propertyPaymentAnalytics: (propertyId: string) => ['property-payment-analytics', propertyId] as const,

    // Settings
    chargeTypes: (businessId: string | null, page: number, pageSize: number, search?: string, statusFilter?: string) => ['charge-types', businessId, page, pageSize, search, statusFilter] as const,
    userProfile: () => ['user-profile'] as const,

    // Charges
    charges: (businessId: string | null, page: number, pageSize: number, search: string = "", status: string = "", propertyId: string = "", unitId: string = "", tenancyId?: string) => ['charges', businessId, page, pageSize, search, status, propertyId, unitId, tenancyId] as const,
    chargeStats: (businessId: string | null) => ['charge-stats', businessId] as const,
    chargeDetails: (chargeId: string) => ['charge', chargeId] as const,

    // Change Logs
    changeLogs: (page: number, pageSize: number, unitId?: string, propertyId?: string, fieldName?: string, search?: string) => ['change-logs', page, pageSize, unitId, propertyId, fieldName, search] as const,
    unitChangeLogs: (unitId: string, page: number, pageSize: number) => ['unit-change-logs', unitId, page, pageSize] as const,
    changeLogFields: () => ['change-log-fields'] as const,
};