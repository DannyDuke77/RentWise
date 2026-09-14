export interface Unit {
    property: Property;
    id: string;
    unit: string;
    name: string;
    tenant_names?: string;
    tenancy_id?: string;
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
  unit: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
  }
  amount_paid: string;
  payment_method: "mpesa" | "cash" | "bank";
  type: "payment" | "refund";
  paid_on: string;
  paid_for: string;
  reference: string | null;
  notes: string | null;
  category: "rent" | "deposit";
  source: "manual" | "stk";
  created_at: string;
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
    property:{
      id: string;
      name: string;
    };
    unit: {
      id: string;
      name: string;
    };
    is_active: boolean;
    start_date: string;
    end_date: string | null;
    created_at: string;
  }[];
};

export interface Charge {
    id: string;
    unit: {
        id: string;
        name: string;
    };
    property: {
        id: string;
        name: string;
    }
    charge_type: string;
    charge_type_name: string;
    amount: number;
    description: string;
    status: 'pending' | 'paid' | 'waived';
    created_at: string;
}

export interface ChargeType {
    id: string;
    name: string;
    default_amount: string;
}

export interface ChargeStats {
    total_charges: number;
    total_amount: number;
    pending: number;
    paid: number;
    waived: number;
}

export interface Business {
    id: string;
    company_name: string;
    email: string;
    phone: string;
    address: string;
}
