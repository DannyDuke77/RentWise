export const queryKeys = {
    properties: () => ['properties'] as const,
    property: (propertyId: string) => ['property', propertyId] as const,
    propertyTypes: () => ['property-types'] as const,
    propertyRentSummary: (propertyId: string, month: number, year: number) =>
        ['property-rent-summary', propertyId, month, year] as const,
    propertyUnits: (propertyId: string, page: number, pageSize: number) => ['property-units', propertyId, page, pageSize] as const,
    
    units: () => ['units'] as const,
    unit: (unitId: string) => ['unit', unitId] as const,

    unitDetails: (unitId?: string | null) => ['unit-detail', unitId] as const,
    unitTenants: (unitId?: string | null) => ['unit-tenants', unitId] as const,
    unitPayments: (page: number, pageSize: number, unitId?: string | null,) => ['unit-payments', page, pageSize, unitId] as const,

    tenants: (page: number, pageSize: number) => ['tenants', page, pageSize] as const,

    payments: (page: number, pageSize: number) => ['payments', page, pageSize] as const,
    paymentAnalytics: () => ['payment-analytics'] as const,
    propertyPaymentAnalytics: (propertyId: string) => ['property-payment-analytics', propertyId] as const,

    businessProfile: () => ['business-profile'] as const,
    chargeTypes: () => ['charge-types'] as const,
    charges: (tenancyId?: string | null) => ['charges', tenancyId] as const,
    userProfile: () => ['user-profile'] as const
};