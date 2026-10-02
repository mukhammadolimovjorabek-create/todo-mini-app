export interface InvitedFriend {
  id: string;
  name: string;
  avatar: string;
  points: number;
  streak: number;
  joinedAt: string;
}

const FRIENDS_KEY = 'todo_friends_v1';

export const loadFriends = (): InvitedFriend[] => {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return []; // Boshlang'ich holatda 0 ta do'st!
};

export const saveFriends = (friends: InvitedFriend[]) => {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
};

export const addFriend = (friend: InvitedFriend) => {
  const current = loadFriends();
  if (!current.some((f) => f.id === friend.id)) {
    current.push(friend);
    saveFriends(current);
  }
  return current;
};

// Localhostda 1 ta do'st qo'shilishini sinab ko'rish uchun qulay funksiya
export const addDemoFriend = (name = 'Jasur', points = 12): InvitedFriend[] => {
  const current = loadFriends();
  const demoFriends = [
    { id: 'f-1', name: 'Jasur', avatar: 'J', points: 14, streak: 2, joinedAt: 'Bugun' },
    { id: 'f-2', name: 'Malika', avatar: 'M', points: 9, streak: 1, joinedAt: 'Kecha' },
    { id: 'f-3', name: 'Bekzod', avatar: 'B', points: 6, streak: 1, joinedAt: '2 kun oldin' },
  ];
  const nextFriend = demoFriends[current.length % demoFriends.length];
  if (!current.some((f) => f.name === nextFriend.name)) {
    current.push({ ...nextFriend, id: `f-${Date.now()}` });
  } else {
    current.push({
      id: `f-${Date.now()}`,
      name: `${name} ${current.length + 1}`,
      avatar: name[0],
      points,
      streak: 1,
      joinedAt: 'Hozirgina',
    });
  }
  saveFriends(current);
  return current;
};

export const resetFriends = (): InvitedFriend[] => {
  localStorage.removeItem(FRIENDS_KEY);
  return [];
};
