export type SchoolType =
  | 'kindergarten'
  | 'primary_school'
  | 'secondary_school'
  | 'vocational_school'
  | 'special_school'
  | 'other';

export interface SchoolSelection {
  id: string;
  name: string;
  city: string;
  county: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  slug: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  approvedAmount: number;
  approvedBottleCount: number;
  participatingSchoolCount: number;
}

export interface LeaderboardSchool extends SchoolSelection {
  slug: string;
  type: SchoolType;
  rank: number;
  approvedAmount: number;
  approvedBottleCount: number;
}

export interface LeaderboardPage {
  schools: LeaderboardSchool[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PublishedNewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishedAt: string;
}

export interface PublicHomeData {
  available: boolean;
  campaign: CampaignSummary | null;
  leaderboard: LeaderboardSchool[];
  news: PublishedNewsItem[];
}

export interface SchoolProfile extends LeaderboardSchool {
  campaignId: string;
  campaignName: string;
}

export const schoolTypeLabels: Record<SchoolType, string> = {
  kindergarten: 'Óvoda',
  primary_school: 'Általános iskola',
  secondary_school: 'Középiskola',
  vocational_school: 'Szakképző iskola',
  special_school: 'Gyógypedagógiai intézmény',
  other: 'Iskola',
};
