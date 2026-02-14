
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
  Image as ImageIcon
} from 'lucide-react';
import { UserProfile, OshiColor, Spot, Stamp, ExchangePost, SpotCategory, ExchangeType, ExchangeMethod, OshiItem, SpotType } from './types';
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

/**
 * Compress an image to a reasonable size for MVP storage.
 */
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
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
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

// --- Profile View ---
const UserProfileView = ({ profile, currentUser, spots, stamps, onBack, onRefresh }: { profile: UserProfile, currentUser: UserProfile, spots: Spot[], stamps: Stamp[], onBack: () => void, onRefresh: () => void }) => {
  const theme = useTheme();
  const isFriend = (currentUser.friendIds || []).includes(profile.id);
  const privacy = profile.privacy || { showSpots: true, showHistory: true, showOshis: true };

  const registeredSpots = spots.filter(s => s.createdBy === profile.id);
  const checkinHistory = stamps.filter(s => s.userId === profile.id).map(s => ({ ...s, spot: spots.find(sp => sp.id === s.spotId) })).reverse();

  const spotsByIp = useMemo(() => {
    return registeredSpots.reduce((acc, spot) => {
      acc[spot.ipName] = acc[spot.ipName] || [];
      acc[spot.ipName].push(spot);
      return acc;
    }, {} as Record<string, Spot[]>);
  }, [registeredSpots]);

  const historyByIp = useMemo(() => {
    return checkinHistory.reduce((acc, stamp) => {
      const ip = stamp.spot?.ipName || 'その他';
      acc[ip] = acc[ip] || [];
      acc[ip].push(stamp);
      return acc;
    }, {} as Record<string, any[]>);
  }, [checkinHistory]);

  const handleToggleFriend = () => {
    if (isFriend) {
      store.removeFriend(currentUser.id, profile.id);
    } else {
      store.addFriend(currentUser.id, profile.id);
    }
    onRefresh();
  };

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
            <div>
              <p className="text-xl font-black">{profile.name}</p>
              <p className="text-[10px] font-bold text-pink-600">@{profile.displayId}</p>
              <p className="text-[10px] font-bold text-slate-400">{profile.prefecture} / {profile.age || '年代不明'}</p>
            </div>
          </div>
          <button onClick={handleToggleFriend} className={`p-3 rounded-2xl transition-all ${isFriend ? 'bg-slate-100 text-slate-400' : `${theme.colorSet.secondary} ${theme.colorSet.text}`}`}>
            {isFriend ? <UserMinus size={24}/> : <UserPlus size={24}/>}
          </button>
        </div>

        {privacy.showOshis && (profile.oshis || []).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {profile.oshis?.map((oshi, idx) => (
              <div key={idx} className={`${OSHI_COLORS[profile.oshiColor].secondary} ${OSHI_COLORS[profile.oshiColor].text} px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap`}>
                {oshi.ipName}
              </div>
            ))}
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
                    {spot.photo && (
                      <div className="mt-2 rounded-xl overflow-hidden aspect-square w-full max-w-[120px]">
                        <img src={spot.photo} alt={spot.name} className="w-full h-full object-cover" />
                      </div>
                    )}
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
                      {stamp.photo && (
                        <div className="mt-2 rounded-xl overflow-hidden aspect-square w-24">
                          <img src={stamp.photo} alt="checkin photo" className="w-full h-full object-cover" />
                        </div>
                      )}
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
    const list = allUsers.map(u => {
      const userSpots = allSpots.filter(s => s.createdBy === u.id && (!filterIp || s.ipName === filterIp));
      // Only count 'seichi' stamps for checkin ranking
      const userStamps = allStamps.filter(s => s.userId === u.id && s.type === 'seichi' && (!filterIp || allSpots.find(sp => sp.id === s.spotId)?.ipName === filterIp));
      return {
        ...u,
        count: rankType === 'spots' ? userSpots.length : userStamps.length
      };
    }).filter(u => u.count > 0).sort((a, b) => b.count - a.count);
    return list;
  }, [allUsers, allSpots, allStamps, filterIp, rankType]);

  const uniqueIps = Array.from(new Set(allSpots.map(s => s.ipName))).sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-black tracking-tight">ランキング</h2>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm">
          <button onClick={() => setRankType('spots')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${rankType === 'spots' ? `${theme.colorSet.primary} text-white` : 'text-slate-400'}`}>登録数</button>
          <button onClick={() => setRankType('checkins')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${rankType === 'checkins' ? `${theme.colorSet.primary} text-white` : 'text-slate-400'}`}>巡礼数</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setFilterIp('')} className={`px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap border-2 ${!filterIp ? `${theme.colorSet.text} border-pink-500 bg-pink-50` : 'border-slate-100 bg-white text-slate-400'}`}>すべて</button>
        {uniqueIps.map(ip => (
          <button key={ip} onClick={() => setFilterIp(ip)} className={`px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap border-2 ${filterIp === ip ? `${theme.colorSet.text} border-pink-500 bg-pink-50` : 'border-slate-100 bg-white text-slate-400'}`}>{ip}</button>
        ))}
      </div>

      <div className="space-y-3">
        {ranking.length === 0 ? <p className="text-center py-20 text-slate-300 font-bold italic">該当データがありません</p> : (
          ranking.map((u, idx) => (
            <div key={u.id} className="bg-white p-4 rounded-[2rem] shadow-sm flex items-center justify-between border border-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic ${idx < 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>
                  {idx + 1}
                </div>
                <div className={`${OSHI_COLORS[u.oshiColor].primary} w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black`}>{u.name[0]}</div>
                <div>
                  <p className="text-sm font-black">{u.name}</p>
                  <p className="text-[8px] font-bold text-slate-400">@{u.displayId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${theme.colorSet.text}`}>{u.count}</p>
                <p className="text-[8px] font-black text-slate-300 uppercase">{rankType === 'spots' ? 'spots' : 'checkins'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Auth / Initial Component ---
const AuthOverlay = ({ onLoginSuccess }: { onLoginSuccess: (user: UserProfile) => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ 
    loginId: '', displayId: '', password: '', age: '', gender: '', prefecture: '東京都', terms: false 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.loginId.length < 6 || formData.password.length < 6) {
      setError('IDとパスワードは6文字以上で入力してください');
      return;
    }
    if (mode === 'signup' && !formData.displayId) {
      setError('ユーザーIDを入力してください');
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
        if (store.getUserByDisplayId(formData.displayId)) {
          setError('そのユーザーIDは既に使用されています');
          setLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(fbAuth, email, formData.password);
        const newUser: UserProfile = { 
          id: cred.user.uid, 
          displayId: formData.displayId,
          name: formData.loginId, 
          oshiColor: 'pink', 
          isAnonymous: false,
          prefecture: formData.prefecture,
          age: formData.age,
          gender: formData.gender,
          favoriteSpotIds: [],
          oshis: [],
          friendIds: [],
          privacy: { showSpots: true, showHistory: true, showOshis: true }
        };
        store.saveUser(newUser);
        onLoginSuccess(newUser);
      } else {
        const cred = await signInWithEmailAndPassword(fbAuth, email, formData.password);
        let user = store.getStoredUser();
        if (!user || user.id !== cred.user.uid) {
          user = { id: cred.user.uid, displayId: formData.loginId, name: formData.loginId || 'ファン', oshiColor: 'pink', isAnonymous: false, prefecture: '東京都', favoriteSpotIds: [], oshis: [], friendIds: [], privacy: { showSpots: true, showHistory: true, showOshis: true } };
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
          <input type="text" placeholder="ログイン名 (英数字)" value={formData.loginId} onChange={e => setFormData({...formData, loginId: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-xl outline-none focus:border-pink-400 transition-all font-bold" />
          {mode === 'signup' && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase px-2">ユーザーID (@ID)</p>
              <input type="text" placeholder="例: testtest" value={formData.displayId} onChange={e => setFormData({...formData, displayId: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-xl outline-none focus:border-pink-400 transition-all font-bold" />
            </div>
          )}
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
              <select value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-xl font-bold">
                <option value="">年代（任意）</option>
                <option value="10代">10代</option>
                <option value="20代">20代</option>
                <option value="30代">30代</option>
                <option value="40代">40代</option>
                <option value="50代">50代</option>
                <option value="60代以上">60代以上</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl">
                <input type="checkbox" checked={formData.terms} onChange={e => setFormData({...formData, terms: e.target.checked})} className="w-5 h-5 accent-pink-500" />
                <span className="text-xs font-bold text-slate-500 leading-tight">規約に同意する</span>
              </label>
            </div>
          )}
          {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}</Button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm font-bold text-slate-400">
          {mode === 'login' ? '新規アカウント作成はこちら' : 'ログインはこちら'}
        </button>
      </div>
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

  const refresh = () => {
    const u = store.getStoredUser();
    if (u) {
      setUser(u);
      setSpots(store.getSpots());
      setStamps(store.getAllLocalStamps());
      setAllUsers(store.getAllUsers());
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

  const myRegisteredSpots = spots.filter(s => s.createdBy === user.id);
  const myStamps = stamps.filter(s => s.userId === user.id);
  
  // Only count 'seichi' check-ins for level calculation and display
  const mySeichiStamps = myStamps.filter(s => s.type === 'seichi');
  const checkinHistory = myStamps.map(s => ({ ...s, spot: spots.find(sp => sp.id === s.spotId) })).reverse();

  // IP Grouping Logic
  const mySpotsByIp = myRegisteredSpots.reduce((acc, spot) => {
    acc[spot.ipName] = acc[spot.ipName] || [];
    acc[spot.ipName].push(spot);
    return acc;
  }, {} as Record<string, Spot[]>);

  const myHistoryByIp = checkinHistory.reduce((acc, stamp) => {
    const ip = stamp.spot?.ipName || 'その他';
    acc[ip] = acc[ip] || [];
    acc[ip].push(stamp);
    return acc;
  }, {} as Record<string, any[]>);

  const handleSearchUserByDisplayId = () => {
    const cleanId = searchIdInput.replace('@', '').trim();
    const target = store.getUserByDisplayId(cleanId);
    if (target) {
      setViewingProfile(target);
      setSearchIdInput('');
    } else {
      alert('ユーザーが見つかりませんでした');
    }
  };

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
              {activeTab === 'home' && (
                <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black tracking-tight">こんにちは、<br/><span className="text-slate-400">{user.name}</span>さん 👋</h2>
                  </div>

                  <div className="flex gap-2">
                    <input type="text" placeholder="ユーザーID (@testtest) で検索" value={searchIdInput} onChange={e => setSearchIdInput(e.target.value)} className="flex-1 p-4 bg-white rounded-2xl font-bold text-sm shadow-sm outline-none border border-slate-50" />
                    <button onClick={handleSearchUserByDisplayId} className={`${theme.colorSet.primary} p-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all`}><Search size={20}/></button>
                  </div>
                  
                  {(user.friendIds || []).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> フレンド ({user.friendIds?.length})</h3>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {user.friendIds?.map(id => {
                          const f = store.getUserById(id);
                          if (!f) return null;
                          return (
                            <button key={id} onClick={() => setViewingProfile(f)} className="flex-shrink-0 flex flex-col items-center gap-1 group">
                              <div className={`${OSHI_COLORS[f.oshiColor].primary} w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm group-active:scale-90 transition-all`}>{f.name[0]}</div>
                              <span className="text-[10px] font-bold text-slate-400 truncate w-12 text-center">{f.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={`${theme.colorSet.primary} rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden`}>
                    <div className="absolute -right-10 -bottom-10 opacity-10"><MapPinned size={180} /></div>
                    <div className="relative z-10 flex justify-between items-end">
                      <div>
                        <p className="text-white/80 font-bold mb-1 text-xs uppercase tracking-widest">巡礼レベル</p>
                        <p className="text-4xl font-black tracking-tighter">Lv.{Math.floor(mySeichiStamps.length / 5) + 1}</p>
                      </div>
                      <div className="bg-white/20 px-4 py-2 rounded-2xl border border-white/20 text-xs font-black">
                        {mySeichiStamps.length} チェックイン
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setActiveTab('map'); setEditingSpot(null); }} className={`${theme.colorSet.primary} text-white h-28 flex flex-col items-center justify-center gap-2 rounded-[2rem] shadow-lg shadow-pink-100 font-black text-xs uppercase active:scale-95 transition-all`}>
                      <Plus size={28}/> 聖地を登録
                    </button>
                    <button onClick={() => setActiveTab('ranking')} className="bg-white border-2 border-slate-200 h-28 flex flex-col items-center justify-center gap-2 rounded-[2rem] font-black text-xs uppercase active:scale-95 transition-all">
                      <Trophy size={28} className={theme.colorSet.text}/> ランキング
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2"><MapIcon size={20} className={theme.colorSet.text}/> 登録した聖地</h3>
                    {Object.keys(mySpotsByIp).length === 0 ? (
                      <p className="text-xs font-bold text-slate-300 bg-white p-6 rounded-3xl border border-dashed text-center">まだ聖地を登録していません</p>
                    ) : (
                      <div className="space-y-6">
                        {(Object.entries(mySpotsByIp) as [string, Spot[]][]).map(([ip, ipSpots]) => (
                          <div key={ip} className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{ip}</h4>
                            {(ipSpots as Spot[]).map(spot => (
                              <div key={spot.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="text-[10px] font-black text-slate-300 uppercase">{CATEGORY_LABELS[spot.category]}</p>
                                  <h4 className="font-black text-sm">{spot.name}</h4>
                                  {spot.photo && (
                                    <div className="mt-2 rounded-xl overflow-hidden aspect-square w-20">
                                      <img src={spot.photo} alt={spot.name} className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                                <button onClick={() => { setEditingSpot(spot); setActiveTab('map'); }} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all"><Edit3 size={16}/></button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2"><History size={20} className={theme.colorSet.text}/> チェックイン履歴</h3>
                    {Object.keys(myHistoryByIp).length === 0 ? (
                      <p className="text-xs font-bold text-slate-300 bg-white p-6 rounded-3xl border border-dashed text-center">チェックインの記録がありません</p>
                    ) : (
                      <div className="space-y-6">
                         {(Object.entries(myHistoryByIp) as [string, any[]][]).map(([ip, stamps]) => (
                           <div key={ip} className="space-y-3">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{ip}</h4>
                             {(stamps as any[]).map(stamp => (
                               <div key={stamp.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex gap-4">
                                 <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 font-black italic">✓</div>
                                 <div className="flex-1">
                                   <h4 className="font-black text-sm">{stamp.spot?.name || '削除されたスポット'}</h4>
                                   <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10}/> {new Date(stamp.timestamp).toLocaleString()}</p>
                                   {stamp.photo && (
                                     <div className="mt-2 rounded-xl overflow-hidden aspect-video w-full">
                                       <img src={stamp.photo} alt="visit" className="w-full h-full object-cover" />
                                     </div>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'map' && <MapView spots={spots} stamps={myStamps} user={user} onRefresh={refresh} editingSpot={editingSpot} setEditingSpot={setEditingSpot} />}
              {activeTab === 'exchange' && <ExchangeView user={user} theme={theme} spots={spots} />}
              {activeTab === 'ranking' && <RankingView allUsers={allUsers} allSpots={spots} allStamps={stamps} theme={theme} />}
              {activeTab === 'settings' && (
                <div className="p-6 space-y-6">
                  <SettingsView user={user} theme={theme} spots={spots} onRefresh={refresh} />
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2"><Eye size={16} className={theme.colorSet.text}/> プライバシー設定</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <span className="text-sm font-bold text-slate-600">登録した聖地を公開する</span>
                        <input type="checkbox" checked={user.privacy?.showSpots} onChange={e => store.saveUser({...user, privacy: {...user.privacy!, showSpots: e.target.checked}})} className="w-5 h-5 accent-pink-500" />
                      </label>
                      <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <span className="text-sm font-bold text-slate-600">巡礼履歴を公開する</span>
                        <input type="checkbox" checked={user.privacy?.showHistory} onChange={e => store.saveUser({...user, privacy: {...user.privacy!, showHistory: e.target.checked}})} className="w-5 h-5 accent-pink-500" />
                      </label>
                      <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <span className="text-sm font-bold text-slate-600">推しリストを公開する</span>
                        <input type="checkbox" checked={user.privacy?.showOshis} onChange={e => store.saveUser({...user, privacy: {...user.privacy!, showOshis: e.target.checked}})} className="w-5 h-5 accent-pink-500" />
                      </label>
                    </div>
                  </div>
                </div>
              )}
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
      </div>
    </ThemeContext.Provider>
  );
}

// --- Internal Components ---

const MapView = ({ spots, stamps, user, onRefresh, editingSpot, setEditingSpot }: { 
  spots: Spot[], 
  stamps: Stamp[], 
  user: UserProfile, 
  onRefresh: () => void, 
  editingSpot: Spot | null, 
  setEditingSpot: (s: Spot | null) => void 
}) => {
  const theme = useTheme();
  const mapRef = useRef<any>(null);
  const [isAdding, setIsAdding] = useState<'none' | 'spot' | 'pick_location' | 'checkin'>('none');
  const [newSpot, setNewSpot] = useState<Partial<Spot>>({ 
    name: '', category: 'other', type: 'seichi', ipName: '', description: '', evidenceUrl: '', isPublic: true 
  });
  const [pickedLoc, setPickedLoc] = useState<[number, number] | null>(null);
  const [pickedAddress, setPickedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Checking in states
  const [checkingInSpot, setCheckingInSpot] = useState<Spot | null>(null);
  const [checkinPhoto, setCheckinPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (editingSpot) {
      setNewSpot(editingSpot);
      setPickedLoc([editingSpot.lat, editingSpot.lng]);
      setPickedAddress('登録済みの位置');
      setIsAdding('spot');
    }
  }, [editingSpot]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map-container', { zoomControl: false }).setView([35.6812, 139.7671], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }
    const watchId = navigator.geolocation.watchPosition(pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]));
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.eachLayer((layer: any) => { if (layer instanceof L.Marker || layer instanceof L.Circle) map.removeLayer(layer); });

    spots.forEach(spot => {
      const isMySpot = spot.createdBy === user.id;
      const hasStamped = stamps.some(s => s.spotId === spot.id);
      
      // Determine marker color
      let colorHex = '';
      if (spot.type === 'memory') {
        colorHex = '#6366f1'; // Indigo for memory spots
      } else {
        colorHex = hasStamped ? '#10b981' : OSHI_COLORS[theme.color as OshiColor].hex;
      }
      
      const marker = L.marker([spot.lat, spot.lng], {
        icon: L.divIcon({
          className: 'custom-pin-container',
          html: `<div class="custom-pin" style="background-color: ${colorHex};"><i class="text-white">${spot.type === 'memory' ? '♥' : (hasStamped ? '✓' : '●')}</i></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32]
        })
      }).addTo(map);

      const isMemory = spot.type === 'memory';
      const label = isMemory ? '思い出の場所' : CATEGORY_LABELS[spot.category] || 'Other';
      const dateText = (isMemory && spot.memoryDate) ? `<p class="text-[8px] text-indigo-500 font-black">📅 ${new Date(spot.memoryDate).toLocaleDateString()}</p>` : '';

      marker.bindPopup(`
        <div class="p-2 min-w-[120px]">
          <p class="text-[8px] font-black text-slate-400 uppercase">${label}</p>
          <h4 class="font-black text-xs mb-1">${spot.name}</h4>
          <p class="text-[9px] text-slate-500 mb-1">${spot.ipName}</p>
          ${dateText}
          <div class="mt-2">
            <button class="w-full bg-pink-500 text-white py-1 px-2 rounded-lg text-[9px] font-black checkin-btn" data-id="${spot.id}">チェックイン</button>
          </div>
        </div>
      `);
    });

    const handlePopupOpen = (e: any) => {
      const btn = e.popup._contentNode.querySelector('.checkin-btn');
      if (btn) {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const spot = spots.find(s => s.id === id);
          if (spot) {
            const dist = userLocation ? calculateDistance(userLocation[0], userLocation[1], spot.lat, spot.lng) : Infinity;
            if (dist > CHECKIN_RADIUS_METERS) { alert(`距離が遠すぎます（約${Math.round(dist)}m）。200m以内に入ってからチェックインしてください。`); return; }
            
            setCheckingInSpot(spot);
            setCheckinPhoto(null);
            setIsAdding('checkin');
            map.closePopup();
          }
        };
      }
    };
    map.on('popupopen', handlePopupOpen);
    return () => { map.off('popupopen', handlePopupOpen); };
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

  const handleSelectResult = (res: any) => {
    const lat = parseFloat(res.lat); const lng = parseFloat(res.lon);
    setPickedLoc([lat, lng]); setPickedAddress(res.display_name);
    mapRef.current.setView([lat, lng], 17); setSearchResults([]); setSearchQuery(''); setIsAdding('spot');
  };

  const handleSaveSpot = () => {
    if (!newSpot.name || !newSpot.ipName || !pickedLoc) { alert('「名称」「IP名」「場所指定」は必須です'); return; }
    
    // Validate memory date if it's a memory spot
    if (newSpot.type === 'memory' && !newSpot.memoryDate) {
      alert('「思い出の日時」を入力してください');
      return;
    }

    const spot: Spot = { 
      ...newSpot, 
      id: newSpot.id || `user_${Date.now()}`, 
      lat: pickedLoc[0], 
      lng: pickedLoc[1], 
      isPublic: true, 
      createdBy: user.id, 
      createdAt: newSpot.createdAt || Date.now(), 
      keywords: [] 
    } as Spot;

    if (newSpot.id) store.updateSpot(spot); else store.saveSpot(spot);
    setIsAdding('none'); setEditingSpot(null); setPickedLoc(null); setPickedAddress(''); onRefresh(); 
    alert(`${newSpot.type === 'memory' ? '思い出の場所' : '聖地'}が登録できました！`);
  };

  const handleConfirmCheckin = () => {
    if (!checkingInSpot) return;

    store.saveStamp({ 
      id: Math.random().toString(36).substr(2, 9), 
      userId: user.id, 
      spotId: checkingInSpot.id, 
      timestamp: Date.now(), 
      type: checkingInSpot.type === 'memory' ? 'memory' : 'seichi',
      photo: checkinPhoto || undefined
    });

    onRefresh(); 
    alert(`${checkingInSpot.name} にチェックインしました！`); 
    setIsAdding('none');
    setCheckingInSpot(null);
    setCheckinPhoto(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'spot' | 'checkin') => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const compressed = await compressImage(e.target.files[0]);
      if (target === 'spot') {
        setNewSpot({ ...newSpot, photo: compressed });
      } else {
        setCheckinPhoto(compressed);
      }
    } catch (err) {
      console.error(err);
      alert('画像のアップロードに失敗しました');
    }
  };

  return (
    <div className="h-full relative">
      <div id="map-container" className="h-full w-full z-0"></div>
      
      {isAdding === 'pick_location' && (
        <div className="absolute inset-0 pointer-events-none z-[1001] flex items-center justify-center">
          <div className="text-pink-600 mb-8 animate-bounce"><MapPin size={48} /></div>
          <div className="absolute bottom-10 pointer-events-auto flex gap-3">
             <button onClick={() => setIsAdding('spot')} className="bg-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 border border-slate-100"><X size={18} /> キャンセル</button>
             <button onClick={() => { const center = mapRef.current.getCenter(); setPickedLoc([center.lat, center.lng]); setPickedAddress(`座標指定: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`); setIsAdding('spot'); }} className={`${theme.colorSet.primary} text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2`}><CheckCircle2 size={18}/> ここで決定</button>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => navigator.geolocation.getCurrentPosition(p => mapRef.current.setView([p.coords.latitude, p.coords.longitude], 15))} className="bg-white p-3 rounded-full shadow-lg"><LocateFixed size={24} /></button>
        <button onClick={() => { 
          setIsAdding('spot'); 
          setEditingSpot(null); 
          setNewSpot({ 
            name: '', category: 'other', type: 'seichi', ipName: '', description: '', evidenceUrl: '', isPublic: true, photo: undefined
          }); 
          setPickedLoc(null); setPickedAddress(''); setSearchQuery(''); 
        }} className={`${theme.colorSet.primary} p-4 rounded-full shadow-xl text-white`}><Plus size={28} /></button>
      </div>

      {isAdding === 'spot' && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[2000] p-6 overflow-y-auto no-scrollbar pb-24">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">{newSpot.id ? '場所を編集' : (newSpot.type === 'memory' ? '思い出の場所を登録' : '聖地を登録')}</h2><button onClick={() => { setIsAdding('none'); setEditingSpot(null); }}><X size={24}/></button></div>
          
          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setNewSpot({ ...newSpot, type: 'seichi' })}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newSpot.type === 'seichi' ? `${theme.colorSet.primary} text-white shadow-md` : 'text-slate-400'}`}
              >
                聖地
              </button>
              <button 
                onClick={() => setNewSpot({ ...newSpot, type: 'memory' })}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newSpot.type === 'memory' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400'}`}
              >
                思い出
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">場所を検索</label>
              <div className="flex gap-2">
                 <div className="relative flex-1">
                    <input type="text" placeholder="店舗名、施設名など..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults([]); }} onKeyDown={e => e.key === 'Enter' && handleFacilitySearch()} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none" />
                    {searchQuery && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl mt-2 z-20 shadow-2xl max-h-60 overflow-y-auto">
                        {searchResults.map((res, i) => ( <button key={i} onClick={() => handleSelectResult(res)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl font-bold text-xs border-b border-slate-50 last:border-0">{res.display_name}</button> ))}
                      </div>
                    )}
                 </div>
                 <button onClick={handleFacilitySearch} className="p-4 bg-slate-100 rounded-2xl text-slate-600 active:scale-95 transition-all"><Search size={20}/></button>
              </div>
              {pickedLoc ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-emerald-500 text-white p-2 rounded-xl flex-shrink-0"><MapPinned size={16}/></div>
                    <div className="overflow-hidden"> <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">指定済み</p> <p className="text-xs font-black text-slate-700 truncate">{pickedAddress}</p> </div>
                  </div>
                  <button onClick={() => { setPickedLoc(null); setPickedAddress(''); }} className="p-2 bg-white text-rose-500 rounded-xl shadow-sm active:scale-90 transition-all"><RotateCcw size={16}/></button>
                </div>
              ) : ( <Button variant="secondary" onClick={() => setIsAdding('pick_location')}><MapIcon size={18}/> 地図から位置を指定</Button> )}
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">名称</label>
                <input type="text" placeholder="場所の名称" value={newSpot.name || ''} onChange={e => setNewSpot({...newSpot, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">カテゴリー</label>
                <select value={newSpot.category} onChange={e => setNewSpot({...newSpot, category: e.target.value as SpotCategory})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold"> {Object.entries(CATEGORY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)} </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">IP名（作品・人名）</label>
                <IpSuggestionInput value={newSpot.ipName || ''} onChange={val => setNewSpot({...newSpot, ipName: val})} category={newSpot.category} placeholder="IP名" spots={spots} />
              </div>

              {newSpot.type === 'seichi' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><LinkIcon size={10}/> 情報源 URL (SNS等)</label>
                  <input type="url" placeholder="https://..." value={newSpot.evidenceUrl || ''} onChange={e => setNewSpot({...newSpot, evidenceUrl: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none text-xs" />
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><Calendar size={10}/> 思い出の日時</label>
                    <input 
                      type="date" 
                      value={newSpot.memoryDate ? new Date(newSpot.memoryDate).toISOString().split('T')[0] : ''} 
                      onChange={e => setNewSpot({...newSpot, memoryDate: new Date(e.target.value).getTime()})} 
                      className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><ImageIcon size={10}/> 写真（1枚）</label>
                    <div className="flex flex-col gap-3">
                      <label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-slate-100 transition-all">
                        <Camera size={32} className="text-slate-300" />
                        <span className="text-xs font-black text-slate-400">写真を撮る・選ぶ</span>
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'spot')} className="hidden" />
                      </label>
                      {newSpot.photo && (
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm">
                          <img src={newSpot.photo} alt="Preview" className="w-full h-full object-cover" />
                          <button onClick={() => setNewSpot({...newSpot, photo: undefined})} className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full text-rose-500 shadow-sm"><X size={16}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">説明・メモ</label>
                <textarea placeholder="説明" value={newSpot.description || ''} onChange={e => setNewSpot({...newSpot, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none h-32" />
              </div>
            </div>

            <Button onClick={handleSaveSpot}>{newSpot.id ? '更新する' : '登録する'}</Button>
          </div>
        </div>
      )}

      {isAdding === 'checkin' && checkingInSpot && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[2000] p-6 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <div className={`${theme.colorSet.secondary} w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-pink-500 mb-2`}>
                <MapPinned size={40} />
              </div>
              <h2 className="text-2xl font-black">{checkingInSpot.name}</h2>
              <p className="text-xs font-bold text-slate-400">{checkingInSpot.ipName}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-2"><ImageIcon size={10}/> 写真を一緒に残す (任意/1枚)</label>
                <div className="flex flex-col gap-3">
                  {!checkinPhoto ? (
                    <label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-slate-100 transition-all">
                      <Camera size={40} className="text-slate-300" />
                      <span className="text-xs font-black text-slate-400">撮影・アップロード</span>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'checkin')} className="hidden" />
                    </label>
                  ) : (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl ring-4 ring-pink-50">
                      <img src={checkinPhoto} alt="Check-in preview" className="w-full h-full object-cover" />
                      <button onClick={() => setCheckinPhoto(null)} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-rose-500 shadow-md active:scale-90 transition-all"><X size={18}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleConfirmCheckin}>チェックインを完了する</Button>
              <button onClick={() => { setIsAdding('none'); setCheckingInSpot(null); setCheckinPhoto(null); }} className="w-full py-4 font-black text-slate-400 text-sm">やめる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExchangeView = ({ user, theme, spots }: { user: UserProfile, theme: any, spots: Spot[] }) => {
  const [posts, setPosts] = useState<ExchangePost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState<Partial<ExchangePost>>({ type: 'exchange', ipName: '', method: 'hand', description: '', area: user.prefecture });
  useEffect(() => { setPosts(store.getExchanges()); }, []);
  const handleSavePost = () => {
    if (!newPost.ipName || !newPost.description) { alert('内容を入力してください'); return; }
    const post: ExchangePost = { ...newPost, id: Math.random().toString(36).substr(2, 9), userId: user.id, userName: user.name, createdAt: Date.now() } as ExchangePost;
    store.saveExchange(post); setPosts(store.getExchanges()); setShowForm(false);
    setNewPost({ type: 'exchange', ipName: '', method: 'hand', description: '', area: user.prefecture });
  };
  return (
    <div className="p-6 space-y-6 pb-32">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black tracking-tight">交換掲示板</h2><button onClick={() => setShowForm(true)} className={`${theme.colorSet.primary} text-white px-4 py-2 rounded-2xl font-black text-xs shadow-lg`}>投稿する</button></div>
      <div className="space-y-4">
        {posts.length === 0 ? <p className="text-center py-20 text-slate-300 font-bold italic">投稿がありません</p> : (
          posts.map(post => (
            <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 space-y-3">
              <div className="flex justify-between items-start">
                <div> <div className="flex gap-2 mb-2"> <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${post.type === 'exchange' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}> {post.type === 'exchange' ? '交換希望' : post.type === 'wanted' ? '求む' : '譲る'} </span> <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[8px] font-black uppercase">{post.method === 'hand' ? '手渡し' : '郵送'}</span> </div> <h4 className="font-black text-lg">{post.ipName}</h4> </div>
                <div className="text-right"> <p className="text-[10px] font-black text-slate-300 uppercase">{post.area}</p> </div>
              </div>
              <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{post.description}</p>
              <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2"> <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">{post.userName[0]}</div> <span className="text-[10px] font-bold text-slate-400">{post.userName}</span> </div>
                <span className="text-[9px] text-slate-300 font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">募集を投稿</h2><button onClick={() => setShowForm(false)}><X size={24}/></button></div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <select value={newPost.type} onChange={e => setNewPost({...newPost, type: e.target.value as ExchangeType})} className="p-4 bg-slate-50 rounded-2xl font-bold"> <option value="exchange">交換希望</option> <option value="wanted">求む</option> <option value="offer">譲る</option> </select>
              <select value={newPost.method} onChange={e => setNewPost({...newPost, method: e.target.value as ExchangeMethod})} className="p-4 bg-slate-50 rounded-2xl font-bold"> <option value="hand">手渡し</option> <option value="mail">郵送</option> </select>
            </div>
            <IpSuggestionInput value={newPost.ipName || ''} onChange={val => setNewPost({...newPost, ipName: val})} placeholder="作品名・キャラ名" spots={spots} />
            <select value={newPost.area} onChange={e => setNewPost({...newPost, area: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold"> {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)} </select>
            <textarea placeholder="詳細（譲渡可能なもの、希望するものなど）" value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-40" />
            <Button onClick={handleSavePost}>投稿する</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsView = ({ user, theme, spots, onRefresh }: { user: UserProfile, theme: any, spots: Spot[], onRefresh: () => void }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({ ...user });
  const [addingOshi, setAddingOshi] = useState<Partial<OshiItem> | null>(null);

  const handleSave = () => { 
    store.saveUser(formData); 
    setEditing(false); 
    onRefresh(); 
  };

  const removeOshi = (idx: number) => {
    const nextOshis = [...(formData.oshis || [])];
    nextOshis.splice(idx, 1);
    setFormData({ ...formData, oshis: nextOshis });
  };

  const addOshi = () => {
    if (!addingOshi?.ipName) return;
    const nextOshis = [...(formData.oshis || []), { category: addingOshi.category || 'artist', ipName: addingOshi.ipName }];
    setFormData({ ...formData, oshis: nextOshis.slice(0, 5) });
    setAddingOshi(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tight">設定</h2>
        <div className="flex gap-2">
          {!editing && <button onClick={() => setEditing(true)} className="p-3 bg-slate-100 text-slate-400 rounded-2xl active:scale-90 transition-all"><Edit3 size={20}/></button>}
          <button onClick={() => signOut(fbAuth)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl active:scale-90 transition-all"><LogOut size={20}/></button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex items-center gap-6">
          <div className={`${OSHI_COLORS[user.oshiColor].primary} w-20 h-20 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-lg`}>{user.name[0]}</div>
          <div> 
            <h3 className="text-xl font-black">{user.name}</h3> 
            <p className="text-[10px] font-bold text-pink-600">ID: @{user.displayId}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-6 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">表示名</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">ユーザーID (@ID)</label>
              <input type="text" value={formData.displayId} onChange={e => setFormData({...formData, displayId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-pink-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">年代</label>
                <select value={formData.age || ''} onChange={e => setFormData({ ...formData, age: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl font-bold">
                  <option value="">未設定</option>
                  <option value="10代">10代</option>
                  <option value="20代">20代</option>
                  <option value="30代">30代</option>
                  <option value="40代">40代</option>
                  <option value="50代">50代</option>
                  <option value="60代以上">60代以上</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">性別</label>
                <select value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl font-bold">
                  <option value="">未設定</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">テーマカラー</label>
              <div className="grid grid-cols-6 gap-2"> 
                {(Object.entries(OSHI_COLORS) as [OshiColor, any][]).map(([key, value]) => ( 
                  <button key={key} onClick={() => setFormData({...formData, oshiColor: key})} className={`w-full aspect-square rounded-xl ${value.primary} ${formData.oshiColor === key ? 'ring-4 ring-offset-2 ring-slate-200' : ''}`} /> 
                ))} 
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">都道府県</label>
              <select value={formData.prefecture} onChange={e => setFormData({...formData, prefecture: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold"> 
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)} 
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-2"><Sparkles size={12}/> 推しリスト (最大5つ)</label>
              <div className="space-y-2">
                {(formData.oshis || []).map((oshi, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold">{oshi.ipName}</span>
                    <button onClick={() => removeOshi(i)} className="text-rose-400"><Trash2 size={16}/></button>
                  </div>
                ))}
                {(formData.oshis || []).length < 5 && (
                  <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                    {addingOshi ? (
                      <div className="space-y-2">
                        <IpSuggestionInput placeholder="IP名（作品・人名）" value={addingOshi.ipName || ''} onChange={val => setAddingOshi({...addingOshi, ipName: val})} spots={spots} />
                        <div className="flex gap-2">
                          <button onClick={addOshi} className="flex-1 bg-pink-500 text-white text-xs py-2 rounded-lg font-bold">追加</button>
                          <button onClick={() => setAddingOshi(null)} className="flex-1 bg-white border border-slate-200 text-xs py-2 rounded-lg font-bold">キャンセル</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingOshi({ category: 'artist', ipName: '' })} className="w-full flex items-center justify-center gap-2 text-slate-400 font-bold text-xs py-1">
                        <Plus size={14}/> 推しを追加
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4"> 
              <button onClick={() => { setEditing(false); setFormData({...user}); }} className="flex-1 py-4 font-black text-slate-400">キャンセル</button> 
              <button onClick={handleSave} className={`flex-1 ${theme.colorSet.primary} text-white py-4 rounded-2xl font-black shadow-lg`}>保存</button> 
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
              <Info size={14}/> プロフィール編集から詳細（年代・性別・推し）を設定できます。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
