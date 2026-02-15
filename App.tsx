
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, 
  MapPin, 
  Repeat, 
  Settings, 
  Plus, 
  CheckCircle2, 
  X,
  MapPinned,
  Map as MapIcon,
  LocateFixed,
  Sparkles,
  Camera,
  Search,
  Users,
  FileText,
  Globe,
  Flag,
  Heart,
  Truck,
  HandHelping,
  LogOut,
  Edit3,
  ChevronRight,
  Clock,
  History,
  Trash2,
  Save,
  User,
  RotateCcw,
  Trophy,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  UserCheck,
  Link as LinkIcon,
  Info,
  Calendar,
  Image as ImageIcon,
  ShieldCheck,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { UserProfile, OshiColor, Spot, Stamp, ExchangePost, SpotCategory, ExchangeType, ExchangeMethod, OshiItem, SpotType, CookieConsent } from './types';
import { OSHI_COLORS, CHECKIN_RADIUS_METERS, CATEGORY_LABELS, PREFECTURES } from './constants';
import * as store from './services/store';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from './legal';
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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.onerror = (error) => reject(error);
  });
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

const IpSuggestionInput = ({ value, onChange, category, placeholder, spots }: { value: string, onChange: (val: string) => void, category?: SpotCategory, placeholder: string, spots: Spot[] }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const suggestions = useMemo(() => {
    let ips = spots.map(s => s.ipName);
    if (category) ips = spots.filter(s => s.category === category).map(s => s.ipName);
    const uniqueIps = Array.from(new Set(ips)).sort((a, b) => a.localeCompare(b, 'ja'));
    if (!query) return uniqueIps;
    return uniqueIps.filter(name => name.toLowerCase().includes(query.toLowerCase()));
  }, [spots, category, query]);
  return (
    <div className="relative w-full">
      <input 
        type="text" placeholder={placeholder} value={value} 
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

// --- Cookie Banner Components ---
const CookieBanner = ({ onAcceptAll, onAcceptEssential, onShowAdvanced }: { 
  onAcceptAll: () => void, 
  onAcceptEssential: () => void, 
  onShowAdvanced: () => void 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[5000] p-4 sm:p-6 animate-in slide-in-from-bottom-full duration-500 pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 border border-white/10 max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto pointer-events-auto overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500 rounded-xl flex-shrink-0"><ShieldCheck size={20}/></div>
          <h3 className="font-black text-base sm:text-lg">Cookie利用設定</h3>
        </div>
        <p className="text-[11px] sm:text-xs leading-relaxed text-slate-300 font-bold">
          当サービスでは、機能提供、利用状況分析、広告配信および体験向上の目的でCookieおよび類似技術（SDK、広告識別子等）を使用しています。
          これらは端末情報、閲覧履歴、位置情報等を取得する場合があります。詳細はプライバシーポリシーをご確認ください。
          同意はいつでも設定画面から変更できます。
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={onAcceptAll} className="w-full py-4 bg-pink-600 rounded-2xl font-black text-sm active:scale-95 transition-all">すべて同意する</button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onAcceptEssential} className="py-3 bg-slate-800 rounded-xl font-black text-[10px] text-slate-400 active:scale-95 transition-all">必須のみ同意</button>
            <button onClick={onShowAdvanced} className="py-3 bg-slate-800 rounded-xl font-black text-[10px] text-slate-400 active:scale-95 transition-all">詳細設定</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvancedCookieModal = ({ consent, onSave, onClose }: { consent: CookieConsent, onSave: (c: CookieConsent) => void, onClose: () => void }) => {
  const [local, setLocal] = useState<CookieConsent>(consent);
  return (
    <div className="fixed inset-0 z-[6000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black">Cookie詳細設定</h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
        </div>
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div><p className="font-black text-sm">必須のCookie</p><p className="text-[10px] text-slate-400 font-bold">認証や設定保存に必要です</p></div>
            <div className="w-12 h-6 bg-slate-200 rounded-full relative opacity-50 cursor-not-allowed"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="font-black text-sm">分析用Cookie</p><p className="text-[10px] text-slate-400 font-bold">サービスの改善に利用します</p></div>
            <button onClick={() => setLocal({...local, analytics: !local.analytics})} className={`w-12 h-6 rounded-full relative transition-all ${local.analytics ? 'bg-pink-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${local.analytics ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="font-black text-sm">広告・マーケティング</p><p className="text-[10px] text-slate-400 font-bold">適切な広告提供に利用します</p></div>
            <button onClick={() => setLocal({...local, marketing: !local.marketing})} className={`w-12 h-6 rounded-full relative transition-all ${local.marketing ? 'bg-pink-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${local.marketing ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
        <button onClick={() => onSave(local)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black active:scale-95 transition-all">設定を保存</button>
      </div>
    </div>
  );
};

// --- Legal Modal Component ---
const LegalModal = ({ title, content, onClose }: { title: string, content: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[3000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white w-full max-w-lg rounded-[2.5rem] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <h3 className="text-lg font-black">{title}</h3>
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
      </div>
      <div className="p-8 overflow-y-auto text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium no-scrollbar">
        {content}
      </div>
      <div className="p-6 border-t border-slate-100 bg-slate-50">
        <Button onClick={onClose}>閉じる</Button>
      </div>
    </div>
  </div>
);

// --- User Profile View ---
const UserProfileView = ({ profile, currentUser, spots, stamps, onBack, onRefresh }: { profile: UserProfile, currentUser: UserProfile, spots: Spot[], stamps: Stamp[], onBack: () => void, onRefresh: () => void }) => {
  const theme = useTheme();
  const isFriend = (currentUser.friendIds || []).includes(profile.id);
  const privacy = profile.privacy || { showSpots: true, showHistory: true, showOshis: true };
  const registeredSpots = spots.filter(s => s.createdBy === profile.id);
  const checkinHistory = stamps.filter(s => s.userId === profile.id).map(s => ({ ...s, spot: spots.find(sp => sp.id === s.spotId) })).reverse();
  const spotsByIp = useMemo(() => {
    return registeredSpots.reduce((acc, spot) => { acc[spot.ipName] = acc[spot.ipName] || []; acc[spot.ipName].push(spot); return acc; }, {} as Record<string, Spot[]>);
  }, [registeredSpots]);
  const historyByIp = useMemo(() => {
    return checkinHistory.reduce((acc, stamp) => { const ip = stamp.spot?.ipName || 'その他'; acc[ip] = acc[ip] || []; acc[ip].push(stamp); return acc; }, {} as Record<string, any[]>);
  }, [checkinHistory]);
  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm"><X size={20}/></button>
        <h2 className="text-xl font-black">ユーザープロフィール</h2>
      </div>
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`${OSHI_COLORS[profile.oshiColor].primary} w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-black`}>{profile.name[0]}</div>
            <div><p className="text-xl font-black">{profile.name}</p><p className="text-[10px] font-bold text-pink-600">@{profile.displayId}</p><p className="text-[10px] font-bold text-slate-400">{profile.prefecture} / {profile.age || '年代不明'}</p></div>
          </div>
          <button onClick={() => { if (isFriend) store.removeFriend(currentUser.id, profile.id); else store.addFriend(currentUser.id, profile.id); onRefresh(); }} className={`p-3 rounded-2xl transition-all ${isFriend ? 'bg-slate-100 text-slate-400' : `${theme.colorSet.secondary} ${theme.colorSet.text}`}`}>
            {isFriend ? <UserMinus size={24}/> : <UserPlus size={24}/>}
          </button>
        </div>
        {privacy.showOshis && (profile.oshis || []).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {profile.oshis?.map((oshi, idx) => (<div key={idx} className={`${OSHI_COLORS[profile.oshiColor].secondary} ${OSHI_COLORS[profile.oshiColor].text} px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap`}>{oshi.ipName}</div>))}
          </div>
        )}
      </div>
      {privacy.showSpots && (
        <div className="space-y-4">
          <h3 className="text-lg font-black flex items-center gap-2"><MapPinned size={20} className={theme.colorSet.text}/> 登録した聖地</h3>
          {Object.keys(spotsByIp).length === 0 ? <p className="text-xs text-slate-300 italic">公開設定がオフ、または未登録です</p> : (
            (Object.entries(spotsByIp) as [string, Spot[]][]).map(([ip, ipSpots]) => (
              <div key={ip} className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{ip}</h4>
                {(ipSpots as Spot[]).map(spot => (
                  <div key={spot.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
                    <h5 className="font-black text-sm">{spot.name}</h5>
                    {spot.photo && (<div className="mt-2 rounded-xl overflow-hidden aspect-square w-full max-w-[120px]"><img src={spot.photo} alt={spot.name} className="w-full h-full object-cover" /></div>)}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
      {privacy.showHistory && (
        <div className="space-y-4">
          <h3 className="text-lg font-black flex items-center gap-2"><History size={20} className={theme.colorSet.text}/> チェックイン履歴</h3>
          {Object.keys(historyByIp).length === 0 ? <p className="text-xs text-slate-300 italic">公開設定がオフ、または未記録です</p> : (
            (Object.entries(historyByIp) as [string, any[]][]).map(([ip, stamps]) => (
              <div key={ip} className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{ip}</h4>
                {(stamps as any[]).map(stamp => (
                  <div key={stamp.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center font-black italic">✓</div>
                    <div className="flex-1">
                      <h5 className="font-black text-sm">{stamp.spot?.name || '不明なスポット'}</h5>
                      <p className="text-[9px] text-slate-400 font-bold">{new Date(stamp.timestamp).toLocaleDateString()}</p>
                      {stamp.photo && (<div className="mt-2 rounded-xl overflow-hidden aspect-square w-24"><img src={stamp.photo} alt="checkin photo" className="w-full h-full object-cover" /></div>)}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// --- Ranking Tab ---
const RankingView = ({ allUsers, allSpots, allStamps, theme }: { allUsers: UserProfile[], allSpots: Spot[], allStamps: Stamp[], theme: any }) => {
  const [filterIp, setFilterIp] = useState('');
  const [rankType, setRankType] = useState<'spots' | 'checkins'>('spots');
  const ranking = useMemo(() => {
    return allUsers.map(u => {
      const userSpots = allSpots.filter(s => s.createdBy === u.id && (!filterIp || s.ipName === filterIp));
      const userStamps = allStamps.filter(s => s.userId === u.id && s.type === 'seichi' && (!filterIp || allSpots.find(sp => sp.id === s.spotId)?.ipName === filterIp));
      return { ...u, count: rankType === 'spots' ? userSpots.length : userStamps.length };
    }).filter(u => u.count > 0).sort((a, b) => b.count - a.count);
  }, [allUsers, allSpots, allStamps, filterIp, rankType]);
  const uniqueIps = Array.from(new Set(allSpots.map(s => s.ipName))).sort();
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end"><h2 className="text-3xl font-black tracking-tight">ランキング</h2><div className="flex bg-white p-1 rounded-2xl shadow-sm"><button onClick={() => setRankType('spots')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${rankType === 'spots' ? `${theme.colorSet.primary} text-white` : 'text-slate-400'}`}>登録数</button><button onClick={() => setRankType('checkins')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${rankType === 'checkins' ? `${theme.colorSet.primary} text-white` : 'text-slate-400'}`}>巡礼数</button></div></div>
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"><button onClick={() => setFilterIp('')} className={`px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap border-2 ${!filterIp ? `${theme.colorSet.text} border-pink-500 bg-pink-50` : 'border-slate-100 bg-white text-slate-400'}`}>すべて</button>{uniqueIps.map(ip => (<button key={ip} onClick={() => setFilterIp(ip)} className={`px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap border-2 ${filterIp === ip ? `${theme.colorSet.text} border-pink-500 bg-pink-50` : 'border-slate-100 bg-white text-slate-400'}`}>{ip}</button>))}</div>
      <div className="space-y-3">
        {ranking.length === 0 ? <p className="text-center py-20 text-slate-300 font-bold italic">該当データがありません</p> : (
          ranking.map((u, idx) => (
            <div key={u.id} className="bg-white p-4 rounded-[2rem] shadow-sm flex items-center justify-between border border-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic ${idx < 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>{idx + 1}</div>
                <div className={`${OSHI_COLORS[u.oshiColor].primary} w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black`}>{u.name[0]}</div>
                <div><p className="text-sm font-black">{u.name}</p><p className="text-[8px] font-bold text-slate-400">@{u.displayId}</p></div>
              </div>
              <div className="text-right"><p className={`text-xl font-black ${theme.colorSet.text}`}>{u.count}</p><p className="text-[8px] font-black text-slate-300 uppercase">{rankType === 'spots' ? 'spots' : 'checkins'}</p></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Exchange View Component (Fix for line 516 error) ---
const ExchangeView = ({ user, theme, spots }: any) => {
  const [posts, setPosts] = useState<ExchangePost[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPost, setNewPost] = useState<Partial<ExchangePost>>({
    type: 'wanted',
    method: 'hand',
    ipName: '',
    description: '',
    area: user.prefecture,
  });

  useEffect(() => {
    setPosts(store.getExchanges());
  }, []);

  const handleSave = () => {
    if (!newPost.ipName || !newPost.description) {
      alert('入力内容が不足しています');
      return;
    }
    const post: ExchangePost = {
      ...newPost,
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      createdAt: Date.now(),
    } as ExchangePost;
    store.saveExchange(post);
    setPosts(store.getExchanges());
    setIsAdding(false);
    setNewPost({ type: 'wanted', method: 'hand', ipName: '', description: '', area: user.prefecture });
    alert('投稿しました！');
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-black tracking-tight">掲示板</h2>
        <button onClick={() => setIsAdding(true)} className={`${theme.colorSet.primary} p-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all`}>
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
              <Repeat size={40} />
            </div>
            <p className="text-slate-300 font-bold italic">まだ投稿がありません</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    post.type === 'wanted' ? 'bg-rose-100 text-rose-600' : 
                    post.type === 'offer' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {post.type === 'wanted' ? '譲求' : post.type === 'offer' ? '譲渡' : '交換'}
                  </span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{post.area}</span>
                </div>
                <div className="text-slate-300"><Clock size={14} /></div>
              </div>
              <div>
                <h4 className="font-black text-lg">{post.ipName}</h4>
                <p className="text-sm font-bold text-slate-600 leading-relaxed mt-1">{post.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                    {post.userName[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-400">{post.userName}</span>
                </div>
                <div className="flex items-center gap-3">
                  {post.method === 'hand' ? (
                    <div className="flex items-center gap-1 text-amber-500 font-black text-[10px]"><HandHelping size={14}/> 手渡し</div>
                  ) : (
                    <div className="flex items-center gap-1 text-blue-500 font-black text-[10px]"><Truck size={14}/> 郵送</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[5000] bg-white p-6 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black">投稿を作成</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-50 rounded-full"><X size={24}/></button>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">募集の種類</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                {(['wanted', 'offer', 'exchange'] as ExchangeType[]).map(t => (
                  <button key={t} onClick={() => setNewPost({...newPost, type: t})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newPost.type === t ? `${theme.colorSet.primary} text-white shadow-md` : 'text-slate-400'}`}>
                    {t === 'wanted' ? '求める' : t === 'offer' ? '譲る' : '交換'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">対象のIP・作品</label>
              <IpSuggestionInput value={newPost.ipName || ''} onChange={val => setNewPost({...newPost, ipName: val})} placeholder="例: Aimer, ガルパン..." spots={spots} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">交換方法</label>
                 <select value={newPost.method} onChange={e => setNewPost({...newPost, method: e.target.value as ExchangeMethod})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">
                   <option value="hand">手渡し</option>
                   <option value="mail">郵送</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">エリア</label>
                 <select value={newPost.area} onChange={e => setNewPost({...newPost, area: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">
                   {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">募集詳細</label>
              <textarea placeholder="詳しい条件やアイテム名を記入してください" value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none h-40 resize-none" />
            </div>
            <Button onClick={handleSave}>投稿を公開する</Button>
            <button onClick={() => setIsAdding(false)} className="w-full py-4 font-black text-slate-300 text-sm">キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Auth / Initial Component ---
const AuthOverlay = ({ onLoginSuccess }: { onLoginSuccess: (user: UserProfile) => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ loginId: '', displayId: '', password: '', age: '', gender: '', prefecture: '東京都', oshiColor: 'pink' as OshiColor, oshis: [] as string[], terms: false });
  const [oshiInput, setOshiInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalView, setLegalView] = useState<'none' | 'tos' | 'privacy'>('none');
  const addOshi = () => { if (oshiInput.trim() && formData.oshis.length < 5) { setFormData({ ...formData, oshis: [...formData.oshis, oshiInput.trim()] }); setOshiInput(''); } };
  const removeOshi = (index: number) => { const next = [...formData.oshis]; next.splice(index, 1); setFormData({ ...formData, oshis: next }); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.loginId.length < 6 || formData.password.length < 6) { setError('IDとパスワードは6文字以上で入力してください'); return; }
    if (mode === 'signup' && !formData.displayId) { setError('ユーザーIDを入力してください'); return; }
    if (mode === 'signup' && !formData.terms) { setError('利用規約とプライバシーポリシーに同意してください'); return; }
    setLoading(true);
    const email = `${formData.loginId.toLowerCase()}@dejijun.app`;
    try {
      if (mode === 'signup') {
        if (store.getUserByDisplayId(formData.displayId)) { setError('そのユーザーIDは既に使用されています'); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(fbAuth, email, formData.password);
        const newUser: UserProfile = { id: cred.user.uid, displayId: formData.displayId, name: formData.loginId, oshiColor: formData.oshiColor, isAnonymous: false, prefecture: formData.prefecture, age: formData.age, gender: formData.gender, favoriteSpotIds: [], oshis: formData.oshis.map(name => ({ category: 'other', ipName: name })), friendIds: [], privacy: { showSpots: true, showHistory: true, showOshis: true } };
        store.saveUser(newUser); onLoginSuccess(newUser);
      } else {
        const cred = await signInWithEmailAndPassword(fbAuth, email, formData.password);
        let user = store.getStoredUser();
        if (!user || user.id !== cred.user.uid) { user = { id: cred.user.uid, displayId: formData.loginId, name: formData.loginId || 'ファン', oshiColor: 'pink', isAnonymous: false, prefecture: '東京都', favoriteSpotIds: [], oshis: [], friendIds: [], privacy: { showSpots: true, showHistory: true, showOshis: true } }; store.saveUser(user); }
        onLoginSuccess(user);
      }
    } catch (e: any) { setError('ログインに失敗しました。内容を確認してください。'); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900 flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative my-auto">
        <h1 className="text-3xl font-black text-center text-slate-800 mb-8 tracking-tighter italic">デジ<span className="text-pink-600">巡</span></h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="ログイン名 (英数字)" value={formData.loginId} onChange={e => setFormData({...formData, loginId: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-pink-400 transition-all font-bold" />
          {mode === 'signup' && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase px-2">ユーザーID (@ID)</p>
              <input type="text" placeholder="例: testtest" value={formData.displayId} onChange={e => setFormData({...formData, displayId: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-pink-400 transition-all font-bold" />
            </div>
          )}
          <input type="password" placeholder="パスワード" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-pink-400 transition-all font-bold" />
          {mode === 'signup' && (
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase px-2">推しカラー設定</p>
                <div className="grid grid-cols-6 gap-2">
                  {(Object.entries(OSHI_COLORS) as [OshiColor, any][]).map(([key, value]) => (<button key={key} type="button" onClick={() => setFormData({...formData, oshiColor: key})} className={`w-full aspect-square rounded-xl ${value.primary} ${formData.oshiColor === key ? 'ring-4 ring-offset-2 ring-slate-200' : ''}`} />))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase px-2">推しを登録 (最大5つ)</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="アーティスト・作品名" value={oshiInput} onChange={e => setOshiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOshi())} className="flex-1 p-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:border-pink-400 font-bold text-sm" />
                  <button type="button" onClick={addOshi} disabled={formData.oshis.length >= 5} className="bg-pink-500 text-white p-3 rounded-xl disabled:opacity-50"><Plus size={20}/></button>
                </div>
                <div className="flex flex-wrap gap-2">{formData.oshis.map((name, i) => (<div key={i} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">{name} <button type="button" onClick={() => removeOshi(i)} className="text-slate-400 hover:text-rose-500"><X size={12}/></button></div>))}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={formData.prefecture} onChange={e => setFormData({...formData, prefecture: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold">{PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold"><option value="">性別（任意）</option><option value="male">男性</option><option value="female">女性</option><option value="other">その他</option></select>
              </div>
              <select value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold"><option value="">年代（任意）</option><option value="10代">10代</option><option value="20代">20代</option><option value="30代">30代</option><option value="40代">40代</option><option value="50代">50代</option><option value="60代以上">60代以上</option></select>
              <div className="space-y-2 p-2 bg-slate-50 rounded-2xl"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.terms} onChange={e => setFormData({...formData, terms: e.target.checked})} className="w-5 h-5 accent-pink-500 rounded" /><span className="text-xs font-bold text-slate-500 leading-tight"><button type="button" onClick={() => setLegalView('tos')} className="text-pink-600 underline">利用規約</button>と<button type="button" onClick={() => setLegalView('privacy')} className="text-pink-600 underline ml-1">プライバシーポリシー</button>に同意する</span></label></div>
            </div>
          )}
          {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}</Button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-sm font-bold text-slate-400 active:scale-95 transition-all">{mode === 'login' ? '新規アカウント作成はこちら' : 'ログインはこちら'}</button>
      </div>
      {legalView === 'tos' && <LegalModal title="利用規約" content={TERMS_OF_SERVICE} onClose={() => setLegalView('none')} />}
      {legalView === 'privacy' && <LegalModal title="プライバシーポリシー" content={PRIVACY_POLICY} onClose={() => setLegalView('none')} />}
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'exchange' | 'ranking' | 'settings'>('home');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [cookieConsent, setCookieConsent] = useState<CookieConsent | null>(null);
  const [showAdvancedCookies, setShowAdvancedCookies] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('oshikatsu_cookie_consent');
    if (saved) setCookieConsent(JSON.parse(saved));
  }, []);

  const saveCookieConsent = (c: CookieConsent) => {
    setCookieConsent(c);
    localStorage.setItem('oshikatsu_cookie_consent', JSON.stringify(c));
    setShowAdvancedCookies(false);
  };

  const refresh = () => {
    const u = store.getStoredUser();
    if (u) {
      setUser(u); setSpots(store.getSpots()); setStamps(store.getAllLocalStamps()); setAllUsers(store.getAllUsers());
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbAuth, (fbUser) => {
      if (fbUser) {
        let stored = store.getStoredUser();
        if (!stored || stored.id !== fbUser.uid) {
          stored = { id: fbUser.uid, displayId: fbUser.email?.split('@')[0] || 'fan', name: fbUser.email?.split('@')[0] || 'ファン', oshiColor: 'pink', isAnonymous: false, prefecture: '東京都', favoriteSpotIds: [], oshis: [], friendIds: [], privacy: { showSpots: true, showHistory: true, showOshis: true } };
          store.saveUser(stored);
        }
        setUser(stored);
      } else { setUser(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { refresh(); }, [user?.id, activeTab]);

  const theme = useMemo(() => ({ color: user?.oshiColor || 'pink', colorSet: OSHI_COLORS[user?.oshiColor || 'pink'] }), [user?.oshiColor]);

  if (loading) return null;
  if (!user) return <AuthOverlay onLoginSuccess={setUser} />;

  return (
    <ThemeContext.Provider value={theme}>
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
        <header className="px-6 pt-6 pb-4 bg-white flex justify-between items-center z-10 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <div className={`${theme.colorSet.primary} w-8 h-8 rounded-lg flex items-center justify-center`}><Sparkles className="text-white w-5 h-5" /></div>
            <h1 className="text-2xl font-black italic">デジ<span className={theme.colorSet.text}>巡</span></h1>
          </div>
          <button onClick={() => setActiveTab('settings')} className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-slate-100 text-xs font-black">{user.name[0]}</button>
        </header>

        <main className="flex-1 overflow-y-auto relative pb-24 no-scrollbar">
          {viewingProfile ? (
            <UserProfileView profile={viewingProfile} currentUser={user} spots={spots} stamps={stamps} onBack={() => setViewingProfile(null)} onRefresh={refresh} />
          ) : (
            <>
              {activeTab === 'home' && <HomeView user={user} spots={spots} stamps={stamps} theme={theme} onEditSpot={s => { setEditingSpot(s); setActiveTab('map'); }} setViewingProfile={setViewingProfile} searchIdInput={searchIdInput} setSearchIdInput={setSearchIdInput} refresh={refresh} setActiveTab={setActiveTab} />}
              {activeTab === 'map' && <MapView spots={spots} stamps={stamps.filter(s => s.userId === user.id)} user={user} onRefresh={refresh} editingSpot={editingSpot} setEditingSpot={setEditingSpot} />}
              {activeTab === 'exchange' && <ExchangeView user={user} theme={theme} spots={spots} />}
              {activeTab === 'ranking' && <RankingView allUsers={allUsers} allSpots={spots} allStamps={stamps} theme={theme} />}
              {activeTab === 'settings' && <SettingsTab user={user} theme={theme} spots={spots} refresh={refresh} onManageCookies={() => setShowAdvancedCookies(true)} />}
            </>
          )}
        </main>

        <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem] h-20 flex items-center justify-around px-2 z-50">
          {[
            { id: 'home', icon: Home, label: 'ホーム' },
            { id: 'map', icon: MapPin, label: '聖地' },
            { id: 'ranking', icon: Trophy, label: '順位' },
            { id: 'exchange', icon: Repeat, label: '掲示板' },
            { id: 'settings', icon: Settings, label: '設定' },
          ].map((item: any) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setViewingProfile(null); if(item.id !== 'map') setEditingSpot(null); }} className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-[1.5rem] transition-all ${activeTab === item.id ? `${theme.colorSet.secondary} ${theme.colorSet.text} scale-110` : 'text-slate-400'}`}>
              <item.icon size={activeTab === item.id ? 22 : 20} strokeWidth={2.5} /><span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>

        {!cookieConsent && <CookieBanner 
          onAcceptAll={() => saveCookieConsent({ essential: true, analytics: true, marketing: true, agreedAt: Date.now() })} 
          onAcceptEssential={() => saveCookieConsent({ essential: true, analytics: false, marketing: false, agreedAt: Date.now() })} 
          onShowAdvanced={() => setShowAdvancedCookies(true)} 
        />}
        {showAdvancedCookies && <AdvancedCookieModal 
          consent={cookieConsent || { essential: true, analytics: false, marketing: false, agreedAt: 0 }} 
          onSave={saveCookieConsent} 
          onClose={() => setShowAdvancedCookies(false)} 
        />}
      </div>
    </ThemeContext.Provider>
  );
}

// --- Home View Component ---
const HomeView = ({ user, spots, stamps, theme, onEditSpot, setViewingProfile, searchIdInput, setSearchIdInput, refresh, setActiveTab }: any) => {
  const myRegisteredSpots = spots.filter((s: Spot) => s.createdBy === user.id);
  const myStamps = stamps.filter((s: Stamp) => s.userId === user.id);
  const mySeichiStamps = myStamps.filter((s: Stamp) => s.type === 'seichi');
  const checkinHistory = myStamps.map((s: Stamp) => ({ ...s, spot: spots.find((sp: Spot) => sp.id === s.spotId) })).reverse();
  const mySpotsByIp = myRegisteredSpots.reduce((acc: any, spot: Spot) => { acc[spot.ipName] = acc[spot.ipName] || []; acc[spot.ipName].push(spot); return acc; }, {} as Record<string, Spot[]>);
  const myHistoryByIp = checkinHistory.reduce((acc: any, stamp: any) => { const ip = stamp.spot?.ipName || 'その他'; acc[ip] = acc[ip] || []; acc[ip].push(stamp); return acc; }, {} as Record<string, any[]>);
  const handleSearchUserByDisplayId = () => { const cleanId = searchIdInput.replace('@', '').trim(); const target = store.getUserByDisplayId(cleanId); if (target) { setViewingProfile(target); setSearchIdInput(''); } else { alert('ユーザーが見つかりませんでした'); } };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-start"><h2 className="text-3xl font-black tracking-tight">こんにちは、<br/><span className="text-slate-400">{user.name}</span>さん 👋</h2></div>
      <div className="flex gap-2">
        <input type="text" placeholder="ユーザーID (@testtest) で検索" value={searchIdInput} onChange={e => setSearchIdInput(e.target.value)} className="flex-1 p-4 bg-white rounded-2xl font-bold text-sm shadow-sm outline-none border border-slate-50" />
        <button onClick={handleSearchUserByDisplayId} className={`${theme.colorSet.primary} p-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all`}><Search size={20}/></button>
      </div>
      {(user.friendIds || []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> フレンド ({user.friendIds?.length})</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {user.friendIds?.map((id: string) => {
              const f = store.getUserById(id); if (!f) return null;
              return (<button key={id} onClick={() => setViewingProfile(f)} className="flex-shrink-0 flex flex-col items-center gap-1 group"><div className={`${OSHI_COLORS[f.oshiColor].primary} w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm group-active:scale-90 transition-all`}>{f.name[0]}</div><span className="text-[10px] font-bold text-slate-400 truncate w-12 text-center">{f.name}</span></button>);
            })}
          </div>
        </div>
      )}
      <div className={`${theme.colorSet.primary} rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute -right-10 -bottom-10 opacity-10"><MapPinned size={180} /></div>
        <div className="relative z-10 flex justify-between items-end">
          <div><p className="text-white/80 font-bold mb-1 text-xs uppercase tracking-widest">巡礼レベル</p><p className="text-4xl font-black tracking-tighter">Lv.{Math.floor(mySeichiStamps.length / 5) + 1}</p></div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl border border-white/20 text-xs font-black">{mySeichiStamps.length} チェックイン</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => { setActiveTab('map'); }} className={`${theme.colorSet.primary} text-white h-28 flex flex-col items-center justify-center gap-2 rounded-[2rem] shadow-lg shadow-pink-100 font-black text-xs uppercase active:scale-95 transition-all`}><Plus size={28}/> 聖地を登録</button>
        <button onClick={() => setActiveTab('ranking')} className="bg-white border-2 border-slate-200 h-28 flex flex-col items-center justify-center gap-2 rounded-[2rem] font-black text-xs uppercase active:scale-95 transition-all"><Trophy size={28} className={theme.colorSet.text}/> ランキング</button>
      </div>
      <div>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2"><MapIcon size={20} className={theme.colorSet.text}/> 登録した聖地</h3>
        {Object.keys(mySpotsByIp).length === 0 ? <p className="text-xs font-bold text-slate-300 bg-white p-6 rounded-3xl border border-dashed text-center">まだ聖地を登録していません</p> : (
          <div className="space-y-6">{(Object.entries(mySpotsByIp) as [string, Spot[]][]).map(([ip, ipSpots]) => (
            <div key={ip} className="space-y-3"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{ip}</h4>{ipSpots.map(spot => (
              <div key={spot.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex justify-between items-center"><div className="flex-1"><p className="text-[10px] font-black text-slate-300 uppercase">{CATEGORY_LABELS[spot.category]}</p><h4 className="font-black text-sm">{spot.name}</h4>{spot.photo && (<div className="mt-2 rounded-xl overflow-hidden aspect-square w-20"><img src={spot.photo} alt={spot.name} className="w-full h-full object-cover" /></div>)}</div><button onClick={() => onEditSpot(spot)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all"><Edit3 size={16}/></button></div>
            ))}</div>
          ))}</div>
        )}
      </div>
      <div>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2"><History size={20} className={theme.colorSet.text}/> チェックイン履歴</h3>
        {Object.keys(myHistoryByIp).length === 0 ? <p className="text-xs font-bold text-slate-300 bg-white p-6 rounded-3xl border border-dashed text-center">チェックインの記録がありません</p> : (
          <div className="space-y-6">{(Object.entries(myHistoryByIp) as [string, any[]][]).map(([ip, stamps]) => (
            <div key={ip} className="space-y-3"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{ip}</h4>{stamps.map(stamp => (
              <div key={stamp.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex gap-4"><div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 font-black italic">✓</div><div className="flex-1"><h4 className="font-black text-sm">{stamp.spot?.name || '削除されたスポット'}</h4><p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10}/> {new Date(stamp.timestamp).toLocaleString()}</p>{stamp.photo && (<div className="mt-2 rounded-xl overflow-hidden aspect-video w-full"><img src={stamp.photo} alt="visit" className="w-full h-full object-cover" /></div>)}</div></div>
            ))}</div>
          ))}</div>
        )}
      </div>
    </div>
  );
};

// --- Settings View Component (Fix for line 619 error) ---
const SettingsView = ({ user, theme, onRefresh }: any) => {
  const [formData, setFormData] = useState({
    name: user.name,
    oshiColor: user.oshiColor as OshiColor,
    prefecture: user.prefecture,
    age: user.age || '',
    gender: user.gender || '',
  });

  const handleSave = () => {
    if (!formData.name.trim()) return alert('名前を入力してください');
    store.saveUser({ ...user, ...formData });
    onRefresh();
    alert('プロフィールを更新しました！');
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm space-y-8 animate-in fade-in">
      <div className="flex items-center gap-4">
        <div className={`${OSHI_COLORS[formData.oshiColor].primary} w-20 h-20 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-lg`}>
          {formData.name[0] || '?'}
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">ニックネーム</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-pink-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">推しカラー設定</p>
          <div className="grid grid-cols-6 gap-3">
            {(Object.entries(OSHI_COLORS) as [OshiColor, any][]).map(([key, value]) => (
              <button 
                key={key} 
                type="button" 
                onClick={() => setFormData({...formData, oshiColor: key})} 
                className={`w-full aspect-square rounded-xl ${value.primary} transition-all ${formData.oshiColor === key ? 'ring-4 ring-offset-2 ring-slate-200 scale-110 shadow-md' : 'opacity-60 hover:opacity-100'}`} 
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">居住地</p>
            <select value={formData.prefecture} onChange={e => setFormData({...formData, prefecture: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none appearance-none">
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">年代</p>
            <select value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none appearance-none">
              <option value="">未設定</option>
              {['10代', '20代', '30代', '40代', '50代', '60代以上'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={handleSave} variant="primary"><Save size={18}/> 設定を保存する</Button>
        <button onClick={() => signOut(fbAuth)} className="w-full flex items-center justify-center gap-2 py-4 text-rose-500 font-bold text-sm active:scale-95 transition-all opacity-60 hover:opacity-100">
          <LogOut size={18} /> アカウントからログアウト
        </button>
      </div>
    </div>
  );
};

// --- Settings Tab Component ---
const SettingsTab = ({ user, theme, spots, refresh, onManageCookies }: any) => {
  return (
    <div className="p-6 space-y-6">
      <SettingsView user={user} theme={theme} spots={spots} onRefresh={refresh} />
      <div className="bg-white p-6 rounded-[2rem] shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2"><Eye size={16} className={theme.colorSet.text}/> プライバシー設定</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer"><span className="text-sm font-bold text-slate-600">登録した聖地を公開する</span><input type="checkbox" checked={user.privacy?.showSpots} onChange={e => store.saveUser({...user, privacy: {...user.privacy!, showSpots: e.target.checked}})} className="w-5 h-5 accent-pink-500" /></label>
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer"><span className="text-sm font-bold text-slate-600">巡礼履歴を公開する</span><input type="checkbox" checked={user.privacy?.showHistory} onChange={e => store.saveUser({...user, privacy: {...user.privacy!, showHistory: e.target.checked}})} className="w-5 h-5 accent-pink-500" /></label>
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer"><span className="text-sm font-bold text-slate-600">推しリストを公開する</span><input type="checkbox" checked={user.privacy?.showOshis} onChange={e => store.saveUser({...user, privacy: {...user.privacy!, showOshis: e.target.checked}})} className="w-5 h-5 accent-pink-500" /></label>
        </div>
      </div>
      <button onClick={onManageCookies} className="w-full flex items-center justify-between p-6 bg-white rounded-[2rem] shadow-sm active:scale-95 transition-all"><div className="flex items-center gap-3 text-slate-600 font-bold text-sm"><ShieldCheck size={20} className="text-pink-500"/> Cookie利用設定</div><ChevronRight size={16} className="text-slate-300"/></button>
    </div>
  );
};

// --- Spot Detail Modal ---
const SpotDetailModal = ({ spot, userLocation, onCheckin, onEdit, onClose, isMySpot, theme }: { spot: Spot, userLocation: [number, number] | null, onCheckin: (s: Spot) => void, onEdit: (s: Spot) => void, onClose: () => void, isMySpot: boolean, theme: any }) => {
  const dist = userLocation ? calculateDistance(userLocation[0], userLocation[1], spot.lat, spot.lng) : null;
  const isMemory = spot.type === 'memory';
  return (
    <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
      <div className="bg-white w-full max-h-[92vh] sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-t-[3rem] overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300">
        <div className="relative h-56 sm:h-64 bg-slate-100 flex-shrink-0">
          {spot.photo ? (
            <img src={spot.photo} alt={spot.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={64}/></div>
          )}
          <button onClick={onClose} className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 sm:p-3 bg-black/20 backdrop-blur rounded-full text-white active:scale-90 transition-all"><X size={24}/></button>
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black/70 to-transparent text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{isMemory ? '思い出の場所' : CATEGORY_LABELS[spot.category]}</p>
            <h2 className="text-xl sm:text-2xl font-black line-clamp-2">{spot.name}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-8 no-scrollbar pb-32">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-slate-50 p-4 rounded-3xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">IP名 / 作品名</p>
              <p className="font-black text-sm">{spot.ipName}</p>
            </div>
            {dist !== null && (
              <div className="bg-slate-50 p-4 rounded-3xl flex items-center justify-between sm:flex-col sm:justify-center sm:min-w-[100px]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest sm:mb-1">現在地からの距離</p>
                <p className="font-black text-sm text-pink-600">~{(dist / 1000).toFixed(1)}km</p>
              </div>
            )}
          </div>
          
          {spot.address && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> 住所</h3>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{spot.address}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><FileText size={14}/> 説明・メモ</h3>
            <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">{spot.description || '説明はありません'}</p>
          </div>
          
          {isMemory && spot.memoryDate && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> 思い出の日時</h3>
              <p className="text-sm font-bold text-slate-600">{new Date(spot.memoryDate).toLocaleDateString()}</p>
            </div>
          )}
          
          {!isMemory && spot.evidenceUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><LinkIcon size={14}/> 情報源</h3>
              <a href={spot.evidenceUrl} target="_blank" rel="noopener" className="text-sm font-black text-pink-600 underline flex items-center gap-1">
                <span className="truncate max-w-[200px] sm:max-w-none">{spot.evidenceUrl}</span>
                <ExternalLink size={12} className="flex-shrink-0" />
              </a>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => onCheckin(spot)} className={`${theme.colorSet.primary} text-white py-5 rounded-[2rem] font-black shadow-lg shadow-pink-100 flex items-center justify-center gap-2 active:scale-95 transition-all`}>
              <MapPinned size={20}/> チェックイン
            </button>
            {isMySpot && (
              <button onClick={() => onEdit(spot)} className="bg-slate-50 text-slate-600 py-5 rounded-[2rem] font-black border border-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Edit3 size={20}/> 編集
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Map View Component ---
const MapView = ({ spots, stamps, user, onRefresh, editingSpot, setEditingSpot }: { spots: Spot[], stamps: Stamp[], user: UserProfile, onRefresh: () => void, editingSpot: Spot | null, setEditingSpot: (s: Spot | null) => void }) => {
  const theme = useTheme();
  const mapRef = useRef<any>(null);
  const [isAdding, setIsAdding] = useState<'none' | 'spot' | 'pick_location' | 'checkin'>('none');
  const [newSpot, setNewSpot] = useState<Partial<Spot>>({ name: '', category: 'other', type: 'seichi', ipName: '', description: '', evidenceUrl: '', isPublic: true });
  const [pickedLoc, setPickedLoc] = useState<[number, number] | null>(null);
  const [pickedAddress, setPickedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [checkingInSpot, setCheckingInSpot] = useState<Spot | null>(null);
  const [checkinPhoto, setCheckinPhoto] = useState<string | null>(null);
  const [selectedSpotForDetail, setSelectedSpotForDetail] = useState<Spot | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isSearchingInternal, setIsSearchingInternal] = useState(false);

  useEffect(() => { if (editingSpot) { setNewSpot(editingSpot); setPickedLoc([editingSpot.lat, editingSpot.lng]); setPickedAddress('登録済みの位置'); setIsAdding('spot'); } }, [editingSpot]);
  useEffect(() => {
    if (!mapRef.current) { mapRef.current = L.map('map-container', { zoomControl: false }).setView([35.6812, 139.7671], 13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current); }
    const watchId = navigator.geolocation.watchPosition(pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]));
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return; const map = mapRef.current;
    map.eachLayer((layer: any) => { if (layer instanceof L.Marker || layer instanceof L.Circle) map.removeLayer(layer); });
    spots.forEach(spot => {
      const hasStamped = stamps.some(s => s.spotId === spot.id);
      let colorHex = spot.type === 'memory' ? '#6366f1' : (hasStamped ? '#10b981' : OSHI_COLORS[theme.color as OshiColor].hex);
      const marker = L.marker([spot.lat, spot.lng], {
        icon: L.divIcon({ className: 'custom-pin-container', html: `<div class="custom-pin" style="background-color: ${colorHex};"><i class="text-white">${spot.type === 'memory' ? '♥' : (hasStamped ? '✓' : '●')}</i></div>`, iconSize: [32, 32], iconAnchor: [16, 32] })
      }).addTo(map);
      marker.on('click', () => { setSelectedSpotForDetail(spot); });
    });
  }, [spots, stamps, user.id, userLocation, theme.color]);

  const handleFacilitySearch = async () => {
    if (!searchQuery) { setSearchResults([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=20&countrycodes=jp,my`);
      let data = await res.json();
      if (userLocation) data = data.sort((a: any, b: any) => calculateDistance(userLocation[0], userLocation[1], parseFloat(a.lat), parseFloat(a.lon)) - calculateDistance(userLocation[0], userLocation[1], parseFloat(b.lat), parseFloat(b.lon)));
      setSearchResults(data);
    } catch (e) { console.error(e); }
  };

  const handleSelectResult = (res: any) => { const lat = parseFloat(res.lat); const lng = parseFloat(res.lon); setPickedLoc([lat, lng]); setPickedAddress(res.display_name); mapRef.current.setView([lat, lng], 17); setSearchResults([]); setSearchQuery(''); setIsAdding('spot'); };

  const handleSaveSpot = () => {
    if (!newSpot.name || !newPost.ipName || !pickedLoc) { alert('「名称」「IP名」「場所指定」は必須です'); return; }
    if (newSpot.type === 'memory' && !newSpot.memoryDate) { alert('「思い出の日時」を入力してください'); return; }
    const spot: Spot = { ...newSpot, id: newSpot.id || `user_${Date.now()}`, lat: pickedLoc[0], lng: pickedLoc[1], isPublic: true, createdBy: user.id, createdAt: newSpot.createdAt || Date.now(), keywords: [] } as Spot;
    if (newSpot.id) store.updateSpot(spot); else store.saveSpot(spot);
    setIsAdding('none'); setEditingSpot(null); setPickedLoc(null); setPickedAddress(''); onRefresh(); alert(`${newSpot.type === 'memory' ? '思い出の場所' : '聖地'}が登録できました！`);
  };

  const handleConfirmCheckin = () => {
    if (!checkingInSpot) return;
    store.saveStamp({ id: Math.random().toString(36).substr(2, 9), userId: user.id, spotId: checkingInSpot.id, timestamp: Date.now(), type: checkingInSpot.type === 'memory' ? 'memory' : 'seichi', photo: checkinPhoto || undefined });
    onRefresh(); alert(`${checkingInSpot.name} にチェックインしました！`); setIsAdding('none'); setCheckingInSpot(null); setCheckinPhoto(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'spot' | 'checkin') => {
    if (!e.target.files || e.target.files.length === 0) return;
    try { const compressed = await compressImage(e.target.files[0]); if (target === 'spot') setNewSpot({ ...newSpot, photo: compressed }); else setCheckinPhoto(compressed); } catch (err) { alert('画像のアップロードに失敗しました'); }
  };

  const filteredInternalSpots = useMemo(() => {
    if (!internalSearchQuery) return [];
    const q = internalSearchQuery.toLowerCase();
    return spots.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.ipName.toLowerCase().includes(q) || 
      (s.address && s.address.toLowerCase().includes(q)) ||
      s.description.toLowerCase().includes(q)
    );
  }, [spots, internalSearchQuery]);

  return (
    <div className="h-full relative">
      <div id="map-container" className="h-full w-full z-0"></div>
      
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1001] space-y-2">
        <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-2 shadow-xl flex items-center gap-2 border border-white/50">
          <div className="p-3 text-slate-400"><Search size={20}/></div>
          <input 
            type="text" placeholder="作品名・場所・住所で検索..." value={internalSearchQuery} 
            onChange={e => { setInternalSearchQuery(e.target.value); setIsSearchingInternal(true); }}
            onFocus={() => setIsSearchingInternal(true)}
            className="flex-1 py-3 bg-transparent outline-none font-bold text-sm" 
          />
          {internalSearchQuery && (
            <button onClick={() => { setInternalSearchQuery(''); setIsSearchingInternal(false); }} className="p-3 text-slate-300"><X size={18}/></button>
          )}
        </div>
        {isSearchingInternal && internalSearchQuery && (
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] max-h-64 overflow-y-auto shadow-2xl border border-slate-50 animate-in fade-in slide-in-from-top-2 no-scrollbar">
            {filteredInternalSpots.length === 0 ? (
              <p className="p-6 text-center text-xs font-bold text-slate-400">見つかりませんでした</p>
            ) : (
              filteredInternalSpots.map(s => (
                <button key={s.id} onClick={() => { mapRef.current.setView([s.lat, s.lng], 17); setSelectedSpotForDetail(s); setIsSearchingInternal(false); }} className="w-full text-left p-4 hover:bg-pink-50 flex items-center gap-4 border-b border-slate-50 last:border-0 transition-colors">
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black ${s.type === 'memory' ? 'bg-indigo-500' : theme.colorSet.primary}`}>{s.name[0]}</div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-sm text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{s.ipName}{s.address ? ` • ${s.address}` : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {isAdding === 'pick_location' && (
        <div className="absolute inset-0 pointer-events-none z-[1001] flex items-center justify-center">
          <div className="text-pink-600 mb-8 animate-bounce"><MapPin size={48} /></div>
          <div className="absolute bottom-10 pointer-events-auto flex gap-3">
             <button onClick={() => setIsAdding('spot')} className="bg-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 border border-slate-100"><X size={18} /> キャンセル</button>
             <button onClick={() => { const center = mapRef.current.getCenter(); setPickedLoc([center.lat, center.lng]); setPickedAddress(`座標指定: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`); setIsAdding('spot'); }} className={`${theme.colorSet.primary} text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2`}><CheckCircle2 size={18}/> ここで決定</button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000] mb-24">
        <button onClick={() => navigator.geolocation.getCurrentPosition(p => mapRef.current.setView([p.coords.latitude, p.coords.longitude], 15))} className="bg-white p-4 rounded-full shadow-xl text-slate-600 active:scale-90 transition-all border border-slate-50"><LocateFixed size={24} /></button>
        <button onClick={() => { setIsAdding('spot'); setEditingSpot(null); setNewSpot({ name: '', category: 'other', type: 'seichi', ipName: '', description: '', evidenceUrl: '', isPublic: true }); setPickedLoc(null); setPickedAddress(''); setSearchQuery(''); }} className={`${theme.colorSet.primary} p-5 rounded-full shadow-2xl text-white active:scale-95 transition-all shadow-pink-200`}><Plus size={32} /></button>
      </div>

      {isAdding === 'spot' && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[2000] p-6 overflow-y-auto no-scrollbar pb-24">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">{newSpot.id ? '場所を編集' : (newSpot.type === 'memory' ? '思い出の場所を登録' : '聖地を登録')}</h2><button onClick={() => { setIsAdding('none'); setEditingSpot(null); }}><X size={24}/></button></div>
          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setNewSpot({ ...newSpot, type: 'seichi' })} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newSpot.type === 'seichi' ? `${theme.colorSet.primary} text-white shadow-md` : 'text-slate-400'}`}>聖地</button>
              <button onClick={() => setNewSpot({ ...newSpot, type: 'memory' })} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newSpot.type === 'memory' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400'}`}>思い出</button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">場所を検索</label>
              <div className="flex gap-2">
                 <div className="relative flex-1">
                    <input type="text" placeholder="店舗名、施設名など..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults([]); }} onKeyDown={e => e.key === 'Enter' && handleFacilitySearch()} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none" />
                    {searchQuery && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl mt-2 z-20 shadow-2xl max-h-60 overflow-y-auto">{searchResults.map((res, i) => ( <button key={i} onClick={() => handleSelectResult(res)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl font-bold text-xs border-b border-slate-50 last:border-0">{res.display_name}</button> ))}</div>
                    )}
                 </div>
                 <button onClick={handleFacilitySearch} className="p-4 bg-slate-100 rounded-2xl text-slate-600 active:scale-95 transition-all"><Search size={20}/></button>
              </div>
              {pickedLoc ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3 overflow-hidden"><div className="bg-emerald-500 text-white p-2 rounded-xl flex-shrink-0"><MapPinned size={16}/></div><div className="overflow-hidden"> <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">指定済み</p> <p className="text-xs font-black text-slate-700 truncate">{pickedAddress}</p> </div></div>
                  <button onClick={() => { setPickedLoc(null); setPickedAddress(''); }} className="p-2 bg-white text-rose-500 rounded-xl shadow-sm active:scale-90 transition-all"><RotateCcw size={16}/></button>
                </div>
              ) : ( <Button variant="secondary" onClick={() => setIsAdding('pick_location')}><MapIcon size={18}/> 地図から位置を指定</Button> )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">名称</label><input type="text" placeholder="場所の名称" value={newSpot.name || ''} onChange={e => setNewSpot({...newSpot, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">カテゴリー</label><select value={newSpot.category} onChange={e => setNewSpot({...newSpot, category: e.target.value as SpotCategory})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold">{Object.entries(CATEGORY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">IP名（アーティスト・作品名など）</label><IpSuggestionInput value={newSpot.ipName || ''} onChange={val => setNewSpot({...newSpot, ipName: val})} category={newSpot.category} placeholder="IP名" spots={spots} /></div>
              {newSpot.type === 'seichi' ? (
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><LinkIcon size={10}/> 情報源 URL (SNS等)</label><input type="url" placeholder="https://..." value={newSpot.evidenceUrl || ''} onChange={e => setNewSpot({...newSpot, evidenceUrl: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none text-xs" /></div>
              ) : (
                <><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><Calendar size={10}/> 思い出の日時</label><input type="date" value={newSpot.memoryDate ? new Date(newSpot.memoryDate).toISOString().split('T')[0] : ''} onChange={e => setNewSpot({...newSpot, memoryDate: new Date(e.target.value).getTime()})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><ImageIcon size={10}/> 写真（1枚）</label><div className="flex flex-col gap-3"><label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-slate-100 transition-all"><Camera size={32} className="text-slate-300" /><span className="text-xs font-black text-slate-400">写真を撮る・選ぶ</span><input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'spot')} className="hidden" /></label>{newSpot.photo && (<div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm"><img src={newSpot.photo} alt="Preview" className="w-full h-full object-cover" /><button onClick={() => setNewSpot({...newSpot, photo: undefined})} className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full text-rose-500 shadow-sm"><X size={16}/></button></div>)}</div></div></>
              )}
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">説明・メモ</label><textarea placeholder="説明" value={newSpot.description || ''} onChange={e => setNewSpot({...newSpot, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none h-32" /></div>
            </div>
            <Button onClick={handleSaveSpot}>{newSpot.id ? '更新する' : '登録する'}</Button>
          </div>
        </div>
      )}

      {isAdding === 'checkin' && checkingInSpot && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[2000] p-6 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2"><div className={`${theme.colorSet.secondary} w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-pink-500 mb-2`}><MapPinned size={40} /></div><h2 className="text-2xl font-black">{checkingInSpot.name}</h2><p className="text-xs font-bold text-slate-400">{checkingInSpot.ipName}</p></div>
            <div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><ImageIcon size={10}/> 写真を一緒に残す (任意/1枚)</label><div className="flex flex-col gap-3">{!checkinPhoto ? (<label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-slate-100 transition-all"><Camera size={40} className="text-slate-300" /><span className="text-xs font-black text-slate-400">撮影・アップロード</span><input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'checkin')} className="hidden" /></label>) : (<div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl ring-4 ring-pink-50"><img src={checkinPhoto} alt="Check-in preview" className="w-full h-full object-cover" /><button onClick={() => setCheckinPhoto(null)} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-rose-500 shadow-md active:scale-90 transition-all"><X size={18}/></button></div>)}</div></div></div>
            <div className="flex flex-col gap-2"><Button onClick={handleConfirmCheckin}>チェックインを完了する</Button><button onClick={() => { setIsAdding('none'); setCheckingInSpot(null); setCheckinPhoto(null); }} className="w-full py-4 font-black text-slate-400 text-sm">やめる</button></div>
          </div>
        </div>
      )}

      {selectedSpotForDetail && (
        <SpotDetailModal 
          spot={selectedSpotForDetail} 
          userLocation={userLocation} 
          onClose={() => setSelectedSpotForDetail(null)} 
          onCheckin={(s) => { 
            const dist = userLocation ? calculateDistance(userLocation[0], userLocation[1], s.lat, s.lng) : Infinity;
            if (dist > CHECKIN_RADIUS_METERS) { alert(`距離が遠すぎます（約${Math.round(dist)}m）。200m以内に入ってからチェックインしてください。`); return; }
            setCheckingInSpot(s); setCheckinPhoto(null); setIsAdding('checkin'); setSelectedSpotForDetail(null); 
          }}
          onEdit={(s) => { setEditingSpot(s); setIsAdding('spot'); setSelectedSpotForDetail(null); }}
          isMySpot={selectedSpotForDetail.createdBy === user.id}
          theme={theme}
        />
      )}
    </div>
  );
};
