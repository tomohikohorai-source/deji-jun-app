
export type OshiColor = 'pink' | 'blue' | 'green' | 'yellow' | 'purple' | 'red';

export interface OshiItem {
  category: SpotCategory;
  ipName: string;
}

export interface UserPrivacy {
  showSpots: boolean;
  showHistory: boolean;
  showOshis: boolean;
}

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  agreedAt: number;
}

export interface UserProfile {
  id: string;      // 内部ID (Firebase UID)
  displayId: string; // ユーザー設定ID (例: testtest)
  name: string;
  oshiColor: OshiColor;
  isAnonymous: boolean;
  age?: string;
  gender?: string;
  prefecture: string;
  city?: string;
  oshiIp?: string;
  oshiMember?: string;
  oshis?: OshiItem[];
  favoriteSpotIds?: string[];
  friendIds?: string[];
  privacy?: UserPrivacy;
}

export type SpotCategory = 'artist' | 'influencer' | 'actor' | 'media' | 'sports' | 'other';
export type SpotType = 'seichi' | 'memory';

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory;
  type: SpotType; // 'seichi' (聖地) または 'memory' (思い出)
  ipName: string; 
  keywords: string[];
  description: string;
  address?: string;    // 住所
  evidenceUrl: string; // 聖地用
  memoryDate?: number; // 思い出用
  photo?: string;      // 思い出登録時の写真（Base64）
  lat: number;
  lng: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: number;
  reportCount?: number;
}

export interface Stamp {
  id: string;
  userId: string;
  spotId: string;
  timestamp: number;
  type: 'seichi' | 'memory';
  photo?: string;    // チェックイン時の写真（Base64）
  photos?: string[]; // 互換性維持用
  note?: string;
  companionIds?: string[];
  companionNames?: string[];
}

export type ExchangeType = 'wanted' | 'offer' | 'exchange';
export type ExchangeType_Internal = 'wanted' | 'offer' | 'exchange';
export type ExchangeMethod = 'hand' | 'mail';

export interface ExchangePost {
  id: string;
  userId: string;
  userName: string;
  type: ExchangeType;
  ipName: string;      
  method: ExchangeMethod; 
  handPlace?: string;  
  handTime?: string;   
  mailPrefecture?: string; 
  wantText?: string;   
  offerText?: string;  
  description: string;
  area: string;
  wantImageUrl?: string;
  offerImageUrl?: string;
  createdAt: number;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  type: 'checkin' | 'stamp_earned' | 'exchange_posted';
  targetName: string;
  timestamp: number;
}
