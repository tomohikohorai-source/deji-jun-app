
import { Spot, Stamp, UserProfile, ExchangePost, Activity } from '../types';
import { INITIAL_SPOTS } from '../constants';

const KEYS = {
  USER: 'oshikatsu_user',
  ALL_USERS: 'oshikatsu_all_users_registry',
  SPOTS: 'oshikatsu_spots',
  STAMPS: 'oshikatsu_stamps',
  EXCHANGES: 'oshikatsu_exchanges',
  ACTIVITIES: 'oshikatsu_activities',
  REPORTS: 'oshikatsu_reports',
};

export const getStoredUser = (): UserProfile | null => {
  const data = localStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveUser = (user: UserProfile) => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  const registryData = localStorage.getItem(KEYS.ALL_USERS);
  const registry: UserProfile[] = registryData ? JSON.parse(registryData) : [];
  const existingIdx = registry.findIndex(u => u.id === user.id);
  if (existingIdx > -1) {
    registry[existingIdx] = user;
  } else {
    registry.push(user);
  }
  localStorage.setItem(KEYS.ALL_USERS, JSON.stringify(registry));
};

export const getAllUsers = (): UserProfile[] => {
  const data = localStorage.getItem(KEYS.ALL_USERS);
  return data ? JSON.parse(data) : [];
};

export const searchUsers = (query: string): UserProfile[] => {
  if (!query) return [];
  const registry = getAllUsers();
  const currentUser = getStoredUser();
  return registry.filter(u => 
    u.id !== currentUser?.id && 
    u.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
};

export const getSpots = (): Spot[] => {
  const data = localStorage.getItem(KEYS.SPOTS);
  const userSpots: Spot[] = data ? JSON.parse(data) : [];
  return [...INITIAL_SPOTS, ...userSpots];
};

export const saveSpot = (spot: Spot) => {
  const data = localStorage.getItem(KEYS.SPOTS);
  const spots: Spot[] = data ? JSON.parse(data) : [];
  spots.push(spot);
  localStorage.setItem(KEYS.SPOTS, JSON.stringify(spots));
};

export const reportSpot = (spotId: string, reason: string, userId: string) => {
  const data = localStorage.getItem(KEYS.REPORTS);
  const reports = data ? JSON.parse(data) : [];
  reports.push({ spotId, reason, userId, timestamp: Date.now() });
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
  console.log(`Report sent for spot ${spotId}: ${reason}`);
};

export const getAllLocalStamps = (): Stamp[] => {
  const data = localStorage.getItem(KEYS.STAMPS);
  return data ? JSON.parse(data) : [];
};

export const getStamps = (userId: string): Stamp[] => {
  const stamps = getAllLocalStamps();
  return stamps.filter(s => s.userId === userId);
};

export const saveStamp = (stamp: Stamp) => {
  const data = localStorage.getItem(KEYS.STAMPS);
  const stamps: Stamp[] = data ? JSON.parse(data) : [];
  stamps.push(stamp);
  
  if (stamp.companionIds && stamp.companionIds.length > 0) {
    stamp.companionIds.forEach(cId => {
      stamps.push({
        ...stamp,
        id: Math.random().toString(36).substr(2, 9),
        userId: cId,
      });
    });
  }

  localStorage.setItem(KEYS.STAMPS, JSON.stringify(stamps));
  
  const user = getStoredUser();
  if (user && stamp.userId === user.id) {
    saveActivity({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      type: 'stamp_earned',
      targetName: 'スポット',
      timestamp: Date.now(),
    });
  }
};

export const getExchanges = (): ExchangePost[] => {
  const data = localStorage.getItem(KEYS.EXCHANGES);
  return data ? JSON.parse(data) : [];
};

export const saveExchange = (post: ExchangePost) => {
  const data = localStorage.getItem(KEYS.EXCHANGES);
  const posts: ExchangePost[] = data ? JSON.parse(data) : [];
  posts.unshift(post);
  localStorage.setItem(KEYS.EXCHANGES, JSON.stringify(posts));
};

export const saveActivity = (activity: Activity) => {
  const data = localStorage.getItem(KEYS.ACTIVITIES);
  const acts: Activity[] = data ? JSON.parse(data) : [];
  acts.unshift(activity);
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(acts.slice(0, 50)));
};
