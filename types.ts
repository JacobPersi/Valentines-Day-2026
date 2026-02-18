
export type PinCategory = 'MEMORY' | 'DREAM';
export type PinOwner = 'USER1' | 'USER2' | 'SHARED';

export interface TravelPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: PinCategory;
  owner: PinOwner;
  date?: string;
  description: string;
  images: string[];
  bannerImage?: string;
}

export interface MapPosition {
  x: number;
  y: number;
  k: number;
}

export interface AppConfig {
  user1Name: string;
  user2Name: string;
  siteTitle: string;
  siteSubtitle: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  user1Name: 'User 1',
  user2Name: 'User 2',
  siteTitle: 'Our Global Love Story',
  siteSubtitle: 'To the one I want to see the whole world with.',
};
