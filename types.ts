
export type OshiColor = 'pink' | 'blue' | 'green' | 'yellow' | 'purple' | 'red';

export interface UserProfile {
  id: string;
  name: string;
  oshiColor: OshiColor;
  isAnonymous: boolean;
  age?: string;
  gender?: string;
  prefecture: string; // マスト登録
  city?: string;
  oshiIp?: string;
  oshiMember?: string;
  favoriteSpotIds?: string[]; // 気になるスポット
}

export type SpotCategory = 'artist' | 'influencer' | 'actor' | 'media' | 'sports' | 'other';

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory;
  ipName: string; 
  keywords: string[];
  description: string;
  evidenceUrl: string;
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
  photos?: string[];
  note?: string;
  companionIds?: string[];
  companionNames?: string[];
}

export type ExchangeType = 'wanted' | 'offer' | 'exchange';
export type ExchangeMethod = 'hand' | 'mail';

export interface ExchangePost {
  id: string;
  userId: string;
  userName: string;
  type: ExchangeType;
  ipName: string;      // IP名（必須）
  method: ExchangeMethod; // 受け渡し方法
  handPlace?: string;  // 手渡し場所
  handTime?: string;   // 手渡し希望日時
  mailPrefecture?: string; // 郵送場所（都道府県）
  wantText?: string;   // 求
  offerText?: string;  // 譲
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
