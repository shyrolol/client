import axios from 'axios';

const API_URL = 'http://localhost:3001';

export interface Friend {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
}

export interface BlockedUser {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
}

export const friendsService = {
  getFriends: async (): Promise<Friend[]> => {
    const res = await axios.get(`${API_URL}/friends`, { withCredentials: true });
    return res.data;
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await axios.delete(`${API_URL}/friends/${friendId}`, {
      withCredentials: true,
    });
  },

  blockUser: async (userId: string): Promise<void> => {
    await axios.post(
      `${API_URL}/friends/block`,
      { userId },
      { withCredentials: true }
    );
  },

  unblockUser: async (userId: string): Promise<void> => {
    await axios.delete(`${API_URL}/friends/block/${userId}`, {
      withCredentials: true,
    });
  },

  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    const res = await axios.get(`${API_URL}/friends/blocked`, {
      withCredentials: true,
    });
    return res.data;
  },
};
