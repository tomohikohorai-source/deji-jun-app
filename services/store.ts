
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

export const toggleFavorite = (userId: string, spotId: string) => {
  const user = getStoredUser();
  if (!user || user.id !== userId) return;
  
  const favs = user.favoriteSpotIds || [];
  const index = favs.indexOf(spotId);
  if (index > -1) {
    favs.splice(index, 1);
  } else {
    favs.push(spotId);
  }
  
  saveUser({ ...user, favoriteSpotIds: favs });
};

export const getAllUsers = (): UserProfile[] => {
  const data = localStorage.getItem(KEYS.ALL_USERS);
  return data ? JSON.parse(data) : [];
};

export const getUserById = (userId: string): UserProfile | null => {
  const registry = getAllUsers();
  return registry.find(u => u.id === userId) || null;
};

export const getUserByDisplayId = (displayId: string): UserProfile | null => {
  const registry = getAllUsers();
  return registry.find(u => u.displayId === displayId) || null;
};

export const addFriend = (userId: string, friendId: string) => {
  const user = getUserById(userId);
  if (!user) return;
  const friends = user.friendIds || [];
  if (!friends.includes(friendId)) {
    friends.push(friendId);
    saveUser({ ...user, friendIds: friends });
  }
};

export const removeFriend = (userId: string, friendId: string) => {
  const user = getUserById(userId);
  if (!user) return;
  const friends = (user.friendIds || []).filter(id => id !== friendId);
  saveUser({ ...user, friendIds: friends });
};

export const getSpots = (): Spot[] => {
  const data = localStorage.getItem(KEYS.SPOTS);
  const userSpots: Spot[] = data ? JSON.parse(data) : [];
  const allSpots = [...INITIAL_SPOTS];
  userSpots.forEach(us => {
    if (!allSpots.find(s => s.id === us.id)) {
      allSpots.push(us);
    }
  });
  return allSpots;
};

export const getAllSpots = (): Spot[] => {
  return getSpots();
};

export const saveSpot = (spot: Spot) => {
  const data = localStorage.getItem(KEYS.SPOTS);
  const spots: Spot[] = data ? JSON.parse(data) : [];
  spots.push(spot);
  localStorage.setItem(KEYS.SPOTS, JSON.stringify(spots));
};

export const updateSpot = (spot: Spot) => {
  const data = localStorage.getItem(KEYS.SPOTS);
  let spots: Spot[] = data ? JSON.parse(data) : [];
  const index = spots.findIndex(s => s.id === spot.id);
  if (index > -1) {
    spots[index] = spot;
  } else {
    spots.push(spot);
  }
  localStorage.setItem(KEYS.SPOTS, JSON.stringify(spots));
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
  localStorage.setItem(KEYS.STAMPS, JSON.stringify(stamps));
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
