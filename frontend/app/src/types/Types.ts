export interface Unit {
    property: Property;
    id: string;
    unit: string;
    name: string;
    tenant_names?: string;
    monthly_rent: number;
    status: 'occupied' | 'vacant' | 'maintenance';
    floor: string;
    is_active: 'active' | 'inactive';
    payments: any[];
    rent_status: {
        balance: number;
        status: 'paid' | 'partial' | 'unpaid';
        paid: number;
        rent: number;
    };
};

export interface Property {
  id: string;
  name: string;
  location: string;
  description: string | null;
  property_type: string;
  floor: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  units_count: number;
  occupied_units_count: number;
  vacant_units_count: number;
  maintenance_units_count: number;
  occupancy: string;
  status: "full" | "partial" | "low";
}

export interface Payment {
  id: string;
  tenancy: string;
  tenancy_start: string;
  unit_name: string;
  amount_paid: string;
  payment_method: string;
  type: string;
  paid_on: string;
  paid_for: string;
  reference: string | null;
  notes: string | null;
  category: string | null;
}
export interface PaginatedPayments {
  results: Payment[];
  next: string | null;
  previous: string | null;
  count: number;
}

export interface PaymentAnalytics {
  stats: {
    total_amount_paid: number;
    total_amount_rent_paid: number;
    total_amount_deposit_paid: number;
    total_amount_refunded: number;
    net_total_amount: number;
    payment_count: number;
    deposit_count: number;
    refund_count: number;
    mpesa: number;
    cash: number;
    bank_transfer: number;
  };

  payment_methods: {
    name: string;
    value: number;
  }[];

  types: {
    name: string;
    value: number;
  }[];

  categories: {
    name: string;
    value: number;
  }[];

  monthly: {
    month: string;
    payments: number;
    refunds: number;
  }[];
}

export interface Tenant {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  id_number: number | string;
  created_at: string;
  tenancies: {
    id: string;
    property_name: string;
    unit_name: string;
    is_active: boolean;
    start_date: string;
    end_date: string | null;
  }[];
};