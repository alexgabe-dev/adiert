export interface School {
  id: string;
  rank: number;
  previousRank: number;
  name: string;
  city: string;
  region: 'Budapest' | 'Pest megye' | 'Dunántúl' | 'Kelet-Magyarország';
  type: 'Általános iskola' | 'Gimnázium' | 'Technikum' | 'Középiskola';
  bottlesCount: number;
  totalAmount: number;
  badge?: string;
  avatarColor: string;
  studentCount?: number;
}

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

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  excerpt: string;
  readTime: string;
  tag: string;
  icon: string;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
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
