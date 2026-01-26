
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, 
  MapPin, 
  Book, 
  Repeat, 
  Settings, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  X,
  MapPinned,
  Map as MapIcon,
  LocateFixed,
  BellRing,
  ChevronRight,
  LogOut,
  User,
  KeyRound,
  Sparkles,
  Camera,
  Search,
  Users,
  Calendar,
  FileText,
  Link as LinkIcon,
  Flag,
  Globe,
  GripVertical,
  Truck,
  HandHelping,
  ChevronDown,
  Heart
} from 'lucide-react';
import { UserProfile, OshiColor, Spot, Stamp, ExchangePost, SpotCategory, ExchangeType, ExchangeMethod } from './types';
import { OSHI_COLORS, CHECKIN_RADIUS_METERS, CATEGORY_LABELS, PREFECTURES } from './constants';
import * as store from './services/store';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  Auth
} from "firebase/auth";

declare const L: any;

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBmgeKANNZ9h8gAFm1q06lYNvyr_qFWcr0",
  authDomain: "dejijun-9586f.firebaseapp.com",
  projectId: "dejijun-9586f",
  storageBucket: "dejijun-9586f.firebasestorage.app",
  messagingSenderId: "545891608394",
  appId: "1:545891608394:web:a8ac89372494c2c3d903b3",
  measurementId: "G-HEQQ63Y9ER"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const fbAuth: Auth = getAuth(app);

// --- Utilities ---
const compressImage = (file: File, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Button = ({ children, onClick, className = '', disabled = false, variant = 'primary', type = "button" }: any) => {
  const theme = useTheme();
  const baseStyle = "w-full py-4 px-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";
  const variants: any = {
    primary: `${theme.colorSet.primary} text-white shadow-lg`,
    secondary: `bg-white border-2 border-slate-200 text-slate-700`,
    ghost: `bg-transparent text-slate-500`
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ThemeContext = React.createContext<{ color: OshiColor, colorSet: any }>({ 
  color: 'pink', 
  colorSet: OSHI_COLORS.pink 
});
const useTheme = () => React.useContext(ThemeContext);

// --- Shared IP Suggestion Input Component ---
const IpSuggestionInput = ({ value, onChange, category, placeholder, spots }: { value: string, onChange: (val: string) => void, category?: SpotCategory, placeholder: string, spots: Spot[] }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    let ips = spots.map(s => s.ipName);
    if (category) {
      ips = spots.filter(s => s.category === category).map(s => s.ipName);
    }
    const uniqueIps = Array.from(new Set(ips)).sort((a, b) => a.localeCompare(b, 'ja'));
    if (!query) return uniqueIps;
    return uniqueIps.filter(name => name.toLowerCase().includes(query.toLowerCase()));
  }, [spots, category, query]);

  return (
    <div className="relative w-full">
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value} 
        onFocus={() => { setIsFocused(true); setQuery(''); }}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onChange={e => { onChange(e.target.value); setQuery(e.target.value); }}
        className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none transition-all"
      />
      {isFocused && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl z-[4000] shadow-2xl max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[9px] font-black text-slate-300 p-3 uppercase tracking-widest border-b border-slate-50">登録済みIP候補</p>
          {suggestions.map(ip => (
            <button key={ip} type="button" onClick={() => { onChange(ip); setIsFocused(false); }} className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-bold text-sm border-b border-slate-50 last:border-0">
              {ip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Auth Component ---
const AuthOverlay = ({ onLoginSuccess }: { onLoginSuccess: (user: UserProfile) => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ 
    loginId: '', password: '', age: '', gender: '', prefecture: '東京都', terms: false 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState<'terms' | 'privacy' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.loginId.length < 6 || formData.password.length < 6) {
      setError('IDとパスワードは6文字以上で入力してください');
      return;
    }
    if (mode === 'signup' && !formData.terms) {
      setError('利用規約とプライバシーポリシーに同意してください');
      return;
    }

    setLoading(true);
    const email = `${formData.loginId.toLowerCase()}@dejijun.app`;
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(fbAuth, email, formData.password);
        const newUser: UserProfile = { 
          id: cred.user.uid, 
          name: formData.loginId, 
          oshiColor: 'pink', 
          isAnonymous: false,
          prefecture: formData.prefecture,
          age: formData.age,
          gender: formData.gender,
          favoriteSpotIds: []
        };
        store.saveUser(newUser);
        onLoginSuccess(newUser);
      } else {
        const cred = await signInWithEmailAndPassword(fbAuth, email, formData.password);
        let user = store.getStoredUser();
        if (!user || user.id !== cred.user.uid) {
          user = { 
            id: cred.user.uid, 
            name: formData.loginId || 'ファン', 
            oshiColor: 'pink', 
            isAnonymous: false,
            prefecture: '東京都',
            favoriteSpotIds: []
          };
          store.saveUser(user);
        }
        onLoginSuccess(user);
      }
    } catch (e: any) {
      setError('ログインに失敗しました。内容を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <h1 className="text-3xl font-black text-center text-slate-800 mb-8 tracking-tighter italic">デジ<span className="text-pink-600">巡</span></h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="ログインID" value={formData.loginId} onChange={e => setFormData({...formData, loginId: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-xl outline-none focus:border-pink-400 transition-all font-bold" />
          <input type="password" placeholder="パスワード" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-xl outline-none focus:border-pink-400 transition-all font-bold" />
          
          {mode === 'signup' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <select value={formData.prefecture} onChange={e => setFormData({...formData, prefecture: e.target.value})} className="p-4 bg-slate-50 border-2 rounded-xl font-bold">
                  {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="p-4 bg-slate-50 border-2 rounded-xl font-bold">
                  <option value="">性別（任意）</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <input type="number" placeholder="年齢（任意）" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-xl font-bold" />
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl">
                <input type="checkbox" checked={formData.terms} onChange={e => setFormData({...formData, terms: e.target.checked})} className="w-5 h-5 accent-pink-500" />
                <span className="text-xs font-bold text-slate-500 leading-tight">
                  <button type="button" onClick={() => setShowLegal('terms')} className="text-pink-600 underline">利用規約</button>
                  と
                  <button type="button" onClick={() => setShowLegal('privacy')} className="text-pink-600 underline">プライバシーポリシー</button>
                  に同意する
                </span>
              </label>
            </div>
          )}

          {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 p-2 rounded-lg">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}</Button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm font-bold text-slate-400">
          {mode === 'login' ? '新規アカウント作成はこちら' : 'ログインはこちら'}
        </button>
      </div>

      {showLegal && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl border border-white/20">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <FileText className="text-pink-600" />
              {showLegal === 'terms' ? '利用規約' : 'プライバシーポリシー'}
            </h2>
            <div className="text-sm text-slate-600 space-y-6 font-medium leading-relaxed whitespace-pre-wrap">
              {showLegal === 'terms' ? `利用規約
本利用規約（以下「本規約」といいます。）は、「デジ巡」（以下「本サービス」といいます。）の利用条件を定めるものです。本サービスを利用される皆様（以下「ユーザー」といいます。）は、本規約の内容を理解し、同意したうえで本サービスを利用するものとします。
第1条（本サービスの内容）
本サービスは、ユーザーがアーティスト、アニメ作品、インフルエンサー、スポーツ選手等に関連する「聖地」や「思い出の場所」を登録・閲覧し、チェックイン、デジタルスタンプの取得、写真の保存、記録（ログ）の管理、ユーザー同士の交流等を楽しむためのファン活動支援型デジタルサービスです。
本サービスは、特定の知的財産（以下「IP」といいます。）の権利者、芸能事務所、制作会社、スポーツ団体等（以下「権利者」といいます。）と提携または公認されたものではありません（当社が別途明示した場合を除きます）。
本サービスは、ファンによる自主的な活動の場を提供するものであり、特定IPの公式性、正確性、完全性を保証するものではありません。
第2条（利用登録）
本サービスの利用を希望する者は、本規約に同意のうえ、当社が定める方法により利用登録を行うものとします。
当社は、以下のいずれかに該当すると判断した場合、利用登録の拒否、または登録後であってもアカウントの停止・削除を行うことがあります。
虚偽、誤解を招く情報を登録した場合
過去に本規約に違反したことがある場合
未成年者が法定代理人の同意なく利用している場合
その他、当社が不適切と判断した場合
第3条（ユーザー投稿コンテンツ）
ユーザーは、本サービス上において、以下の情報（以下「投稿コンテンツ」といいます。）を投稿することができます。
聖地・思い出の場所の名称、位置情報、説明文
自身の体験・感想・記録（ログ）
SNS投稿やWebページのURL（※第三者の画像・動画そのものの転載は禁止）
チェックイン履歴、スタンプ取得履歴
ユーザー自身が撮影した写真
ユーザーは、投稿コンテンツについて、自らが投稿する正当な権利を有していること、また第三者の権利を侵害していないことを保証するものとします。
投稿コンテンツの著作権は、原則として当該ユーザーに帰属します。ただし、ユーザーは当社に対し、本サービスの運営、改善、広報、機能検証の目的に限り、無償・非独占的に利用（複製、表示、公開、翻案を含みます）する権利を許諾するものとします。
第4条（禁止事項）
ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
権利者の著作権、商標権、肖像権、パブリシティ権その他の権利を侵害する行為
本サービスが公式・公認であるかのような誤認を生じさせる表現（例：「公式聖地」「本人公認」「事務所監修」等）
他人のSNS投稿、画像、動画、文章等を、権利者または投稿者の許諾なく転載する行為
虚偽、誤解を招く、または確認不能な情報の登録
誹謗中傷、差別的表現、嫌がらせ、迷惑行為
商業目的の無断広告、勧誘、営業行為
法令または公序良俗に反する行為
その他、当社が不適切と判断する行為
第5条（IPおよびファン活動に関する注意事項）
本サービスは、ファンによる自主的な活動を支援するものであり、特定IPの権利関係について保証、承認、推奨するものではありません。
ユーザーは、IP名、人物名、関連表現、画像、説明文等の使用にあたり、第三者の権利を侵害しないよう十分に配慮し、自らの責任において利用するものとします。
当社は、権利者または第三者から、投稿コンテンツに関して削除・修正等の要請を受けた場合、ユーザーへの事前通知なく、当該コンテンツの削除、非公開、修正等の対応を行うことがあります。
第6条（チェックインおよび位置情報）
本サービスでは、GPS等の位置情報を利用してチェックイン判定を行う機能を提供する場合があります。
位置情報の取得は、ユーザーの明示的な同意に基づき行われます。
当社は、取得した位置情報を、本サービス提供および改善の目的以外に利用しません。詳細は別途定めるプライバシーポリシーに従うものとします。
第7条（コミュニティ機能・ユーザー間取引）
ユーザー同士の交流、コメント、チャット、グッズ交換等の行為は、ユーザー自身の責任において行われるものとします。
当社は、ユーザー間で生じたトラブル、紛争、損害について、一切の責任を負いません。
当社は、報告や確認に基づき、不適切と判断した場合、警告、投稿削除、機能制限、アカウント停止等の措置を行うことがあります。
第8条（免責事項）
当社は、本サービスの内容、情報の正確性、完全性、有用性について、いかなる保証も行うものではありません。
本サービスの利用または利用不能によりユーザーに生じた損害について、当社の故意または重過失による場合を除き、責任を負いません。
ユーザーと権利者または第三者との間で生じた紛争については、ユーザー自身の責任と費用により解決するものとします。
第9条（サービスの変更・停止）
当社は、ユーザーへの事前通知なく、本サービスの内容の変更、追加、停止、または終了を行うことがあります。
第10条（規約の変更）
当社は、必要と判断した場合、本規約を変更することができます。変更後の規約は、本サービス上に表示した時点で効力を生じるものとします。
第11条（準拠法・管轄）
本規約は日本法を準拠法とし、本サービスに関して生じた紛監については、当社本店所在地を管轄する地方裁判所を専属的合意管轄とします。` : 
              `プライバシーポリシー
「デジ巡」（以下「本サービス」といいます。）は、ユーザーの皆様のプライバシーを尊重し、個人情報の保護を重要な責務と考えています。本プライバシーポリシーは、本サービスにおけるユーザーの情報の取扱いについて定めるものです。
第1条（取得する情報）
本サービスでは、以下の情報を取得する場合があります。
ユーザーが直接提供する情報
利用登録時に入力する情報（ニックネーム、メールアドレス等）
投稿コンテンツ（聖地情報、コメント、写真、チェックイン記録等）
お問い合わせ時に提供される情報
本サービス利用時に自動的に取得される情報
位置情報（GPS等によるチェックイン判定時）
利用履歴（チェックイン日時、スタンプ取得履歴、閲覧履歴等）
端末情報（OS、ブラウザ種別、アプリバージョン等）
クッキー（Cookie）や類似技術による識別情報（Web版提供時）
第2条（位置情報の取扱い）
本サービスでは、チェックイン機能の提供を目的として、GPS等の位置情報を取得する場合があります。
位置情報の取得は、ユーザーの明示的な同意を得た場合にのみ行われます。
取得した位置情報は、以下の目的に限り利用します。
チェックイン判定
デジタルスタンプ・記録（ログ）の生成
本サービスの改善・不正利用防止
当社は、位置情報を常時追跡することはなく、チェックイン等の機能実行時にのみ取得します。
第3条（利用目的）
当社は、取得した情報を以下の目的で利用します。
本サービスの提供・運営・改善
チェックイン、スタンプ、記録機能の提供
ユーザーサポートおよび問い合わせ対応
利用状況の分析および機能改善（個人を特定しない形に限る）
不正利用、規約違反行為の防止および対応
サービスに関する重要なお知らせの通知
第4条（第三者提供）
当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
ユーザー本人の同意がある場合
法令に基づき開示が求められた場合
人の生命、身体または財産の保護のために必要がある場合
サービス運営に必要な範囲で業務委託先に提供する場合（この場合、適切な管理を行います）
投稿コンテンツに含まれる情報は、ユーザー自身の設定および投稿内容に基づき、他のユーザーに表示される場合があります。
第5条（情報の管理）
当社は、個人情報の漏えい、滅失、改ざん、不正アクセス等を防止するため、合理的な安全管理措置を講じます。
第6条（保存期間）
当社は、取得した個人情報を、利用目的の達成に必要な期間に限り保管し、その後は適切な方法により削除または匿名化します。
第7条（ユーザーの権利）
ユーザーは、当社所定の方法により、以下を請求することができます。
自身の個人情報の確認、訂正、削除
利用停止の要請（法令上対応可能な範囲に限ります）
第8条（未成年者の利用）
未成年者が本サービスを利用する場合は、保護者または法定代理人の同意を得たうえで利用するものとします。
第9条（外部サービスとの連携）
本サービスでは、外部サービス（SNS、地図サービス等）へのリンクや連携機能を提供する場合があります。これらの外部サービスにおける個人情報の取扱いについては、当社は責任を負いません。
第10条（プライバシーポリシーの変更）
当社は、必要に応じて本プライバシーポリシーを変更することがあります。変更後の内容は、本サービス上に掲載した時点で効力を生じるものとします。`}
            </div>
            <Button className="mt-10" onClick={() => setShowLegal(null)}>内容を確認しました</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Map Component ---
const MapView = ({ spots, stamps, user, onRefresh }: { spots: Spot[], stamps: Stamp[], user: UserProfile, onRefresh: () => void }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const theme = useTheme();
  
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isAdding, setIsAdding] = useState<'none' | 'spot' | 'checkin' | 'pick_location'>('none');
  const [newSpotData, setNewSpotData] = useState<Partial<Spot>>({ 
    name: '', category: 'artist', ipName: '', description: '', evidenceUrl: '' 
  });
  const [pickedLoc, setPickedLoc] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [checkinForm, setCheckinForm] = useState({ note: '', photos: [] as string[] });

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', { zoomControl: false }).setView([35.6895, 139.6917], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setUserLocation([latitude, longitude]);
    }, (err) => console.error(err), { enableHighAccuracy: true });

    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 15);
      L.circle([pos.coords.latitude, pos.coords.longitude], { radius: 30, color: '#3b82f6', fillOpacity: 0.1 }).addTo(mapRef.current);
    });

    return () => { 
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } 
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    spots.forEach(spot => {
      const isStamped = stamps.some(s => s.spotId === spot.id);
      // チェックイン前はテーマカラー、チェックイン後は緑
      const colorHex = isStamped ? '#10b981' : OSHI_COLORS[theme.color as OshiColor].hex;
      const icon = L.divIcon({
        className: 'custom-pin-container',
        html: `<div class="custom-pin" style="background-color: ${colorHex};"><i class="text-white">${isStamped ? '✓' : '●'}</i></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32]
      });
      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(mapRef.current);
      marker.on('click', () => setSelectedSpot(spot));
      markersRef.current.push(marker);
    });
  }, [spots, stamps, theme.color]);

  const handleFacilitySearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=jp`);
      const data = await res.json();
      setSearchResults(data.slice(0, 5));
    } catch (e) { console.error(e); }
  };

  const handleSelectResult = (res: any) => {
    const lat = parseFloat(res.lat);
    const lng = parseFloat(res.lon);
    setPickedLoc([lat, lng]);
    mapRef.current.setView([lat, lng], 17);
    setSearchResults([]);
    setSearchQuery(res.display_name.split(',')[0]);
    setNewSpotData(prev => ({ ...prev, name: res.display_name.split(',')[0] }));
    setIsAdding('spot');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const compressed = await Promise.all(files.slice(0, 3).map(f => compressImage(f)));
    setCheckinForm(prev => ({ ...prev, photos: [...prev.photos, ...compressed].slice(0, 3) }));
  };

  const handleSaveCheckin = () => {
    if (!selectedSpot) return;
    const dist = userLocation ? calculateDistance(userLocation[0], userLocation[1], selectedSpot.lat, selectedSpot.lng) : Infinity;
    if (dist > CHECKIN_RADIUS_METERS) {
      alert(`距離が遠すぎます（約${Math.round(dist)}m）。200m以内に入ってからチェックインしてください。`);
      return;
    }
    store.saveStamp({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      spotId: selectedSpot.id,
      timestamp: Date.now(),
      type: selectedSpot.isPublic ? 'seichi' : 'memory',
      photos: checkinForm.photos,
      note: checkinForm.note,
    });
    setIsAdding('none');
    setSelectedSpot(null);
    setCheckinForm({ note: '', photos: [] });
    onRefresh();
    alert('チェックインが完了しました！');
  };

  const handleRegisterSpot = (isPublic: boolean) => {
    const targetLoc = pickedLoc || userLocation;
    if (!targetLoc || !newSpotData.name || !newSpotData.ipName) {
      alert('「場所の名前」と「IP名」は必須入力です');
      return;
    }
    const newSpot: Spot = {
      id: `user_${Date.now()}`,
      name: newSpotData.name || '',
      category: (newSpotData.category as SpotCategory) || 'artist',
      ipName: newSpotData.ipName || '',
      keywords: [],
      description: newSpotData.description || '',
      evidenceUrl: newSpotData.evidenceUrl || '',
      lat: targetLoc[0],
      lng: targetLoc[1],
      isPublic: isPublic,
      createdBy: user.id,
      createdAt: Date.now()
    };
    store.saveSpot(newSpot);
    setIsAdding('none');
    setNewSpotData({ name: '', category: 'artist', ipName: '', description: '', evidenceUrl: '' });
    setPickedLoc(null);
    onRefresh();
    alert('聖地が登録できました！');
  };

  const isFavorite = selectedSpot && (user.favoriteSpotIds || []).includes(selectedSpot.id);

  return (
    <div className="relative h-full w-full">
      <div id="map" className="h-full w-full"></div>
      
      {isAdding === 'pick_location' && (
        <div className="absolute inset-0 pointer-events-none z-[1001] flex items-center justify-center">
          <div className="text-pink-600 mb-8 animate-bounce"><MapPin size={48} /></div>
          <div className="absolute bottom-10 pointer-events-auto flex flex-col items-center gap-4">
             <div className="flex gap-3">
                <button onClick={() => setIsAdding('spot')} className="bg-white/95 backdrop-blur px-6 py-4 rounded-2xl font-black text-sm shadow-xl border border-slate-100 flex items-center gap-2 active:scale-95 transition-all">
                  <X size={18} /> 登録をキャンセル
                </button>
                <button onClick={() => {
                    const center = mapRef.current.getCenter();
                    setPickedLoc([center.lat, center.lng]);
                    setIsAdding('spot');
                }} className={`${theme.colorSet.primary} text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all`}>
                  <CheckCircle2 size={18}/> ここで登録する
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => navigator.geolocation.getCurrentPosition(p => mapRef.current.setView([p.coords.latitude, p.coords.longitude], 15))} className="bg-white p-3 rounded-full shadow-lg"><LocateFixed size={24} /></button>
        <button onClick={() => setIsAdding('spot')} className={`${theme.colorSet.primary} p-4 rounded-full shadow-xl text-white`}><Plus size={28} /></button>
      </div>

      {selectedSpot && (
        <div className="absolute bottom-24 left-4 right-4 bg-white rounded-3xl p-6 shadow-2xl z-[1000] animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">{CATEGORY_LABELS[selectedSpot.category]}</span>
              <h3 className="text-xl font-black mt-1">{selectedSpot.name}</h3>
              <p className="text-sm font-bold text-slate-500">{selectedSpot.ipName}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { store.toggleFavorite(user.id, selectedSpot.id); onRefresh(); }} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-rose-500 bg-rose-50' : 'text-slate-300 bg-slate-50'}`}>
                <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => setSelectedSpot(null)}><X size={20} /></button>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-400 mb-4 items-center">
            <span className="flex items-center gap-1"><Users size={12}/> {store.getAllLocalStamps().filter(s => s.spotId === selectedSpot?.id).length}人が巡礼</span>
            {selectedSpot.evidenceUrl && <a href={selectedSpot.evidenceUrl} target="_blank" className="flex items-center gap-1 text-blue-500 underline decoration-2"><Globe size={12}/> 根拠URL</a>}
          </div>
          <p className="text-sm text-slate-600 mb-6 line-clamp-2">{selectedSpot.description}</p>
          <div className="flex gap-2">
            <Button onClick={() => setIsAdding('checkin')} className="flex-1"><CheckCircle2 size={18}/> チェックイン</Button>
            <button onClick={() => { store.reportSpot(selectedSpot.id, '不適切・誤情報', user.id); alert('報告を送信しました。'); }} className="p-4 bg-slate-50 rounded-2xl text-slate-400"><Flag size={20}/></button>
          </div>
        </div>
      )}

      {isAdding === 'spot' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end">
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 max-h-[95%] overflow-y-auto no-scrollbar pb-10">
            <div className="flex justify-between mb-6"><h2 className="text-2xl font-black">場所を登録</h2><button onClick={() => setIsAdding('none')}><X size={24}/></button></div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">場所の特定</label>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="施設名・店舗名などで検索..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleFacilitySearch()}
                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl mt-2 z-20 shadow-2xl max-h-40 overflow-y-auto">
                          {searchResults.map((res, i) => (
                            <button key={i} onClick={() => handleSelectResult(res)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl font-bold text-xs border-b border-slate-50 last:border-0">{res.display_name.split(',')[0]}</button>
                          ))}
                        </div>
                      )}
                   </div>
                   <button onClick={handleFacilitySearch} className="p-4 bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-transform"><Search size={20}/></button>
                </div>
                <Button variant="secondary" onClick={() => setIsAdding('pick_location')} className="bg-slate-50 border-slate-100 mt-2">
                  <MapIcon size={18}/> {pickedLoc ? "指定済み（地図より選択）" : "地図の中心位置を指定する"}
                </Button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">基本情報</label>
                <input type="text" placeholder="名前" value={newSpotData.name} onChange={e => setNewSpotData({...newSpotData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none" />
                <div className="space-y-2">
                  <select value={newSpotData.category} onChange={e => setNewSpotData({...newSpotData, category: e.target.value as any})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold">
                    {Object.entries(CATEGORY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <IpSuggestionInput 
                    placeholder="IP名（作品・アーティスト名）" 
                    value={newSpotData.ipName || ''} 
                    onChange={val => setNewSpotData({...newSpotData, ipName: val})}
                    category={newSpotData.category}
                    spots={spots}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">詳細</label>
                <input type="url" placeholder="根拠URL（SNSや公式サイト）" value={newSpotData.evidenceUrl} onChange={e => setNewSpotData({...newSpotData, evidenceUrl: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-400 outline-none" />
                <textarea placeholder="説明（聖地・思い出の内容）" rows={3} value={newSpotData.description} onChange={e => setNewSpotData({...newSpotData, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="secondary" onClick={() => handleRegisterSpot(false)}>思い出保存</Button>
                <Button onClick={() => handleRegisterSpot(true)}>聖地登録</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdding === 'checkin' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end">
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 max-h-[95%] overflow-y-auto no-scrollbar pb-10">
            <div className="flex justify-between mb-6"><h2 className="text-2xl font-black">記録を残す</h2><button onClick={() => setIsAdding('none')}><X size={24}/></button></div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2">写真（最大3枚）</label>
                <div className="flex gap-2">
                  {checkinForm.photos.map((p, i) => <div key={i} className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden relative"><img src={p} className="w-full h-full object-cover" /><button onClick={() => setCheckinForm(prev => ({...prev, photos: prev.photos.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X size={12}/></button></div>)}
                  {checkinForm.photos.length < 3 && <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 cursor-pointer">
                    <div className="text-center">
                      <Camera size={24} className="mx-auto mb-1"/>
                      <span className="text-[8px] font-black">写真を選択</span>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden"/>
                  </label>}
                </div>
              </div>
              <textarea placeholder="今日の感想を記録しましょう..." rows={3} value={checkinForm.note} onChange={e => setCheckinForm({...checkinForm, note: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-pink-300" />
              <Button onClick={handleSaveCheckin}>この瞬間を記録する</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Exchange Tab ---
const ExchangeView = ({ user, theme, spots }: { user: UserProfile, theme: any, spots: Spot[] }) => {
  const [isPosting, setIsPosting] = useState(false);
  const [formData, setFormData] = useState<Partial<ExchangePost>>({ 
    type: 'exchange', description: '', area: user.prefecture, wantText: '', offerText: '',
    ipName: '', method: 'hand', mailPrefecture: user.prefecture, handPlace: '', handTime: ''
  });
  const [wantImg, setWantImg] = useState('');
  const [offerImg, setOfferImg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!formData.ipName || !formData.description) {
      alert('「IP名」と「詳細」は必須入力です');
      return;
    }
    if (formData.method === 'hand') {
      if (!formData.handPlace || !formData.handTime) {
        alert('手渡しの場合、「受け渡し希望場所」と「受け渡し希望日時」は必須入力です');
        return;
      }
    }
    if (formData.method === 'mail' && !formData.mailPrefecture) {
      alert('郵送の場合、「宛先（都道府県）」の選択が必要です');
      return;
    }

    setLoading(true);
    const newPost: ExchangePost = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id, userName: user.name, type: formData.type as any,
      ipName: formData.ipName || '', method: formData.method as any,
      handPlace: formData.handPlace, handTime: formData.handTime,
      mailPrefecture: formData.mailPrefecture, wantText: formData.wantText,
      offerText: formData.offerText, description: formData.description || '',
      area: formData.area || user.prefecture, wantImageUrl: wantImg,
      offerImageUrl: offerImg, createdAt: Date.now()
    };
    store.saveExchange(newPost);
    setIsPosting(false);
    setWantImg(''); setOfferImg('');
    setFormData({ type: 'exchange', method: 'hand', ipName: '', description: '', area: user.prefecture });
    setLoading(false);
  };

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>, side: 'want' | 'offer') => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 0.2); 
      if (side === 'want') setWantImg(compressed);
      else setOfferImg(compressed);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-black tracking-tight">交換掲示板</h2>
        <button onClick={() => setIsPosting(true)} className={`${theme.colorSet.primary} text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-transform`}><Plus size={24}/></button>
      </div>

      <div className="space-y-4">
        {store.getExchanges().map(post => (
          <div key={post.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className={`${theme.colorSet.secondary} w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${theme.colorSet.text}`}>{post.userName[0]}</div>
                <div>
                  <p className="text-xs font-black">{post.userName}</p>
                  <p className="text-[10px] font-black text-slate-400">{post.ipName}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[9px] font-black flex items-center gap-1 ${post.method === 'hand' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {post.method === 'hand' ? <HandHelping size={10}/> : <Truck size={10}/>}
                {post.method === 'hand' ? '手渡し' : '郵送'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
                <p className="text-[9px] font-black text-rose-500 mb-2 uppercase tracking-widest">求 / Want</p>
                {post.wantImageUrl && <img src={post.wantImageUrl} className="w-full aspect-square object-cover rounded-xl mb-2" />}
                <p className="text-xs font-black text-slate-700 line-clamp-1">{post.wantText || '-'}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-500 mb-2 uppercase tracking-widest">譲 / Offer</p>
                {post.offerImageUrl && <img src={post.offerImageUrl} className="w-full aspect-square object-cover rounded-xl mb-2" />}
                <p className="text-xs font-black text-slate-700 line-clamp-1">{post.offerText || '-'}</p>
              </div>
            </div>

            <div className="text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl space-y-2">
               <p>{post.description}</p>
               <div className="pt-2 border-t border-slate-100 grid grid-cols-1 gap-1 text-[10px] text-slate-400 font-black">
                  {post.method === 'hand' ? (
                    <><p>場所: {post.handPlace}</p><p>日時: {post.handTime}</p></>
                  ) : (
                    <><p>宛先: {post.mailPrefecture}</p><p className="text-rose-400">※郵送費用は発送側負担</p></>
                  )}
               </div>
            </div>
            <div className="flex justify-between items-center pt-2">
               <span className="flex items-center gap-1 text-[10px] font-black text-slate-400"><MapPin size={12}/> {post.area}</span>
               <button className={`${theme.colorSet.secondary} ${theme.colorSet.text} px-4 py-2 rounded-xl text-[10px] font-black uppercase`}>詳細を確認</button>
            </div>
          </div>
        ))}
      </div>

      {isPosting && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end">
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 max-h-[95%] overflow-y-auto no-scrollbar pb-10">
            <div className="flex justify-between mb-6"><h2 className="text-2xl font-black">掲示板投稿</h2><button onClick={() => setIsPosting(false)}><X size={24}/></button></div>
            <div className="space-y-6">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">基本設定</label>
                 <IpSuggestionInput 
                    placeholder="対象のIP名（必須）" 
                    value={formData.ipName || ''} 
                    onChange={val => setFormData({...formData, ipName: val})}
                    spots={spots}
                 />
                 <div className="flex gap-2">
                    <button onClick={() => setFormData({...formData, method: 'hand'})} className={`flex-1 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${formData.method === 'hand' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                       <HandHelping size={18}/> 手渡し
                    </button>
                    <button onClick={() => setFormData({...formData, method: 'mail'})} className={`flex-1 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${formData.method === 'mail' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                       <Truck size={18}/> 郵送
                    </button>
                 </div>
              </div>

              {formData.method === 'hand' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl animate-in slide-in-from-top-2 duration-300 shadow-inner">
                   <input type="text" placeholder="受け渡し場所（必須：例：渋谷駅ハチ公前）" value={formData.handPlace} onChange={e => setFormData({...formData, handPlace: e.target.value})} className="w-full p-3 rounded-xl border-2 border-transparent focus:border-amber-400 outline-none font-bold text-sm" />
                   <input type="text" placeholder="受け渡し希望日時（必須：例：土日の午後）" value={formData.handTime} onChange={e => setFormData({...formData, handTime: e.target.value})} className="w-full p-3 rounded-xl border-2 border-transparent focus:border-amber-400 outline-none font-bold text-sm" />
                </div>
              )}

              {formData.method === 'mail' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl animate-in slide-in-from-top-2 duration-300 shadow-inner">
                   <select value={formData.mailPrefecture} onChange={e => setFormData({...formData, mailPrefecture: e.target.value})} className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-sm">
                      {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                   <p className="text-[10px] font-black text-rose-500 italic px-1">※郵送費用は発送側が負担するものとします。</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">求めているもの</label>
                  <label className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden relative">
                    {wantImg ? <img src={wantImg} className="w-full h-full object-cover" /> : <Camera className="text-slate-300"/>}
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImg(e, 'want')} />
                  </label>
                  <input type="text" placeholder="名前など" value={formData.wantText} onChange={e => setFormData({...formData, wantText: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">譲れるもの</label>
                  <label className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden relative">
                    {offerImg ? <img src={offerImg} className="w-full h-full object-cover" /> : <Camera className="text-slate-300"/>}
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImg(e, 'offer')} />
                  </label>
                  <input type="text" placeholder="名前など" value={formData.offerText} onChange={e => setFormData({...formData, offerText: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                </div>
              </div>
              <textarea placeholder="詳細（募集の経緯、こだわり、注意事項など）" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              <Button onClick={handlePost} disabled={loading}>{loading ? '投稿中...' : '掲示板に投稿する'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'stamps' | 'exchange' | 'settings'>('home');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    const u = store.getStoredUser();
    if (u) {
      setUser(u);
      setSpots(store.getSpots());
      setStamps(store.getStamps(u.id));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbAuth, (fbUser) => {
      if (fbUser) {
        let stored = store.getStoredUser();
        if (!stored || stored.id !== fbUser.uid) {
          stored = { id: fbUser.uid, name: fbUser.email?.split('@')[0] || 'ファン', oshiColor: 'pink', isAnonymous: false, prefecture: '東京都', favoriteSpotIds: [] };
          store.saveUser(stored);
        }
        setUser(stored);
      } else { setUser(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { refresh(); }, [user?.id]);

  const theme = useMemo(() => ({
    color: user?.oshiColor || 'pink',
    colorSet: OSHI_COLORS[user?.oshiColor || 'pink']
  }), [user?.oshiColor]);

  if (loading) return null;
  if (!user) return <AuthOverlay onLoginSuccess={setUser} />;

  const favoriteSpots = spots.filter(s => (user.favoriteSpotIds || []).includes(s.id));

  return (
    <ThemeContext.Provider value={theme}>
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
        <header className="px-6 pt-6 pb-4 bg-white flex justify-between items-center z-10 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <div className={`${theme.colorSet.primary} w-8 h-8 rounded-lg flex items-center justify-center`}><Sparkles className="text-white w-5 h-5" /></div>
            <h1 className="text-2xl font-black italic tracking-tighter">デジ<span className={theme.colorSet.text}>巡</span></h1>
          </div>
          <button onClick={() => setActiveTab('settings')} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white ring-2 ring-slate-100">
            <div className={`${theme.colorSet.primary} w-full h-full flex items-center justify-center text-white font-bold`}>{user.name[0]}</div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto relative pb-24 no-scrollbar">
          {activeTab === 'home' && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">こんにちは、</h2>
                <div className="flex items-center gap-2"><span className="text-3xl font-black text-slate-400">{user.name}</span><span className="text-3xl font-black">さん 👋</span></div>
              </div>
              <div className={`${theme.colorSet.primary} rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden`}>
                <div className="absolute -right-10 -bottom-10 opacity-10"><MapPinned size={200} /></div>
                <div className="relative z-10">
                  <p className="text-white/80 font-bold mb-1 text-xs uppercase tracking-widest">巡礼レベル</p>
                  <p className="text-4xl font-black tracking-tighter mb-4">Lv.{Math.floor(stamps.length / 5) + 1}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <p className="text-[10px] font-black text-white/70 uppercase">スタンプ数</p>
                      <p className="text-xl font-black">{stamps.length}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <p className="text-[10px] font-black text-white/70 uppercase">推しIP</p>
                      <p className="text-sm font-black line-clamp-1">{user.oshiIp || '未設定'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Heart size={20} className="text-rose-500" fill="currentColor"/> 気になるスポット
                </h3>
                {favoriteSpots.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-8 text-center border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400">マップでハートを押して、<br/>行きたい場所をリストアップしましょう！</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {favoriteSpots.map(spot => (
                      <div key={spot.id} onClick={() => { setActiveTab('map'); /* TODO: Focus on map */ }} className="min-w-[200px] bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex-shrink-0 active:scale-95 transition-transform cursor-pointer">
                        <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">{CATEGORY_LABELS[spot.category]}</span>
                        <h4 className="font-black text-sm line-clamp-1 mb-1">{spot.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{spot.ipName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setActiveTab('map')} variant="secondary" className="bg-white h-24 flex-col text-xs uppercase"><MapPin size={24} className={theme.colorSet.text} />聖地を探す</Button>
                <Button onClick={() => setActiveTab('exchange')} variant="secondary" className="bg-white h-24 flex-col text-xs uppercase"><Repeat size={24} className={theme.colorSet.text} />掲示板を見る</Button>
              </div>
            </div>
          )}
          {activeTab === 'map' && <MapView spots={spots} stamps={stamps} user={user} onRefresh={refresh} />}
          {activeTab === 'stamps' && (
            <div className="p-6 space-y-6">
              <h2 className="text-3xl font-black tracking-tight">記録手帳</h2>
              {stamps.length === 0 ? <p className="text-center py-20 text-slate-300 font-black">記録がまだありません</p> : 
                <div className="space-y-4">
                  {stamps.map(stamp => {
                    const spot = spots.find(s => s.id === stamp.spotId);
                    return (
                      <div key={stamp.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                        <div className="flex gap-3">
                          <div className={`${theme.colorSet.secondary} w-12 h-12 rounded-2xl flex items-center justify-center text-xl`}>🌸</div>
                          <div><p className="font-black text-sm">{spot?.name || '未知の場所'}</p><p className="text-[10px] text-slate-400 font-bold">{new Date(stamp.timestamp).toLocaleString()}</p></div>
                        </div>
                        {stamp.note && <p className="text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">{stamp.note}</p>}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">{stamp.photos?.map((p, i) => <img key={i} src={p} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />)}</div>
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          )}
          {activeTab === 'exchange' && <ExchangeView user={user} theme={theme} spots={spots} />}
          {activeTab === 'settings' && (
            <div className="p-6 space-y-6">
              <h2 className="text-3xl font-black tracking-tight">設定</h2>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">ニックネーム</label>
                    <input type="text" value={user.name} onChange={e => { const u = {...user, name: e.target.value}; setUser(u); store.saveUser(u); }} className="w-full p-4 bg-slate-50 rounded-xl font-black outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">推しIP</label>
                    <IpSuggestionInput 
                      placeholder="例: JO1, Snow Man" 
                      value={user.oshiIp || ''} 
                      onChange={val => { const u = {...user, oshiIp: val}; setUser(u); store.saveUser(u); }}
                      spots={spots}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">推しメンバー</label>
                    <input type="text" value={user.oshiMember || ''} placeholder="例: 佐藤景瑚" onChange={e => { const u = {...user, oshiMember: e.target.value}; setUser(u); store.saveUser(u); }} className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none" />
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => signOut(fbAuth)}><LogOut size={18}/> ログアウト</Button>
            </div>
          )}
        </main>

        <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem] h-20 flex items-center justify-around px-2 z-50">
          {[
            { id: 'home', icon: Home, label: 'ホーム' },
            { id: 'map', icon: MapPin, label: '聖地' },
            { id: 'stamps', icon: Book, label: '記録' },
            { id: 'exchange', icon: Repeat, label: '掲示板' },
            { id: 'settings', icon: Settings, label: '設定' },
          ].map((item: any) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-[1.5rem] transition-all ${activeTab === item.id ? `${theme.colorSet.secondary} ${theme.colorSet.text} scale-110` : 'text-slate-400'}`}>
              <item.icon size={activeTab === item.id ? 22 : 20} strokeWidth={2.5} /><span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </ThemeContext.Provider>
  );
}
