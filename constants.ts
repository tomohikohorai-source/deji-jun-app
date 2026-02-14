
import { OshiColor, Spot } from './types';

export const OSHI_COLORS: Record<OshiColor, { primary: string; secondary: string; text: string; hex: string }> = {
  pink: { primary: 'bg-pink-500', secondary: 'bg-pink-100', text: 'text-pink-600', hex: '#ec4899' },
  blue: { primary: 'bg-blue-500', secondary: 'bg-blue-100', text: 'text-blue-600', hex: '#3b82f6' },
  green: { primary: 'bg-emerald-500', secondary: 'bg-emerald-100', text: 'text-emerald-600', hex: '#10b981' },
  yellow: { primary: 'bg-amber-400', secondary: 'bg-amber-100', text: 'text-amber-700', hex: '#fbbf24' },
  purple: { primary: 'bg-purple-500', secondary: 'bg-purple-100', text: 'text-purple-600', hex: '#a855f7' },
  red: { primary: 'bg-rose-500', secondary: 'bg-rose-100', text: 'text-rose-600', hex: '#f43f5e' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  artist: 'アーティスト',
  influencer: 'インフルエンサー',
  actor: '俳優',
  media: 'アニメ・映画・ゲーム',
  sports: 'スポーツ',
  other: 'その他'
};

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export const CHECKIN_RADIUS_METERS = 200;

const timestamp = Date.now();

export const INITIAL_SPOTS: Spot[] = [
  // --- Penang, Malaysia ---
  {
    id: 'penang_1',
    name: 'Chew Jetty (姓周橋)',
    category: 'other',
    // Added type property to fix error
    type: 'seichi',
    ipName: 'Penang Heritage',
    keywords: ['Penang', 'Malaysia', 'Heritage'],
    description: 'ジョージタウンにある歴史的な水上集落。多くの映画やドラマの撮影地として有名。',
    evidenceUrl: 'https://www.tourism.gov.my/states/penang',
    lat: 5.4125,
    lng: 100.3400,
    isPublic: true,
    createdBy: 'system',
    createdAt: timestamp,
  },
  {
    id: 'penang_2',
    name: 'Street Art: Children on a Bicycle',
    category: 'other',
    // Added type property to fix error
    type: 'seichi',
    ipName: 'Ernest Zacharevic',
    keywords: ['Penang', 'Art', 'ジョージタウン'],
    description: 'リトアニア人アーティストによる有名なウォールアート。ペナン観光の象徴的な聖地。',
    evidenceUrl: 'https://ernestzacharevic.com/',
    lat: 5.4144,
    lng: 100.3385,
    isPublic: true,
    createdBy: 'system',
    createdAt: timestamp,
  },
  {
    id: 'penang_3',
    name: 'Kek Lok Si Temple (極楽寺)',
    category: 'other',
    // Added type property to fix error
    type: 'seichi',
    ipName: 'Penang Landmarks',
    keywords: ['Penang', 'Temple'],
    description: '東南アジア最大級の仏教寺院。壮大な建築と景観が魅力。',
    evidenceUrl: 'https://kekloksi.com/',
    lat: 5.3999,
    lng: 100.2736,
    isPublic: true,
    createdBy: 'system',
    createdAt: timestamp,
  },
  // --- Artist: JO1 ---
  {
    id: 'jo1_1',
    name: '高松南新町商店街（MV撮影地）',
    category: 'artist',
    // Added type property to fix error
    type: 'seichi',
    ipName: 'JO1',
    keywords: ['JO1', 'Your Key', '香川'],
    description: '『Your Key』MVの街並みシーンのロケ地として紹介されている商店街。',
    evidenceUrl: 'https://mqa.jp/jo1-yourkey-specialkeyvideo-filminglocation-where/',
    lat: 34.3412,
    lng: 134.0494,
    isPublic: true,
    createdBy: 'system',
    createdAt: timestamp,
  },
  {
    id: 'yoa_1',
    name: '東京都庁前広場（ライブ・MV撮影エリア）',
    category: 'artist',
    // Added type property to fix error
    type: 'seichi',
    ipName: 'YOASOBI',
    keywords: ['YOASOBI', '新宿'],
    description: 'YOASOBIのライブ映像・プロモーション撮影で大都市風景として登場。',
    evidenceUrl: 'https://realsound.jp/2021/01/post-699327.html',
    lat: 35.6895,
    lng: 139.6917,
    isPublic: true,
    createdBy: 'system',
    createdAt: timestamp,
  }
];
