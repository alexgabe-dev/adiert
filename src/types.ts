export interface StatMetric {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  unit?: string;
  icon: string;
  hasProgress?: boolean;
  target?: number;
  percentage?: number;
}

export interface HowItWorksStep {
  stepNumber: number;
  title: string;
  description: string;
  shortLabel: string;
  iconType: 'bottles' | 'repont' | 'camera' | 'upload' | 'trophy';
  highlight: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Általános' | 'Visszaváltás' | 'Iskoláknak' | 'Bizonylat';
}

export interface VerificationDemoState {
  step: 'uploaded' | 'reviewing' | 'approved';
  schoolName: string;
  bottles: number;
  amount: number;
  receiptId: string;
  timestamp: string;
}
