
export interface LeadFormData {
  fullName: string;
  phone: string;
  carType: string;
  budget: string;
  notes?: string;
}

export type CarCategory = 'SUV' | 'Sedan' | 'Sports' | 'Luxury' | 'Electric';
