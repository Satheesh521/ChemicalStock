/**
 * Session Storage Utility
 * Handles persistent storage and retrieval of session data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'chemical_stock_session';
const USER_KEY = 'chemical_stock_user';
const TOKEN_KEY = 'chemical_stock_auth_token';

export interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
}

export const SessionStorage = {
  /**
   * Save session data to AsyncStorage
   */
  async saveSession(session: StoredSession): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },

  /**
   * Retrieve session data from AsyncStorage
   */
  async getSession(): Promise<StoredSession | null> {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  },

  /**
   * Save user data to AsyncStorage
   */
  async saveUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  /**
   * Retrieve user data from AsyncStorage
   */
  async getUser(): Promise<any | null> {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error retrieving user:', error);
      return null;
    }
  },

  /**
   * Save auth token to AsyncStorage
   */
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  /**
   * Retrieve auth token from AsyncStorage
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  /**
   * Clear all session data
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SESSION_KEY, USER_KEY, TOKEN_KEY]);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  /**
   * Check if session exists and is valid
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) return false;

      // Check if token is expired
      if (session.expiresAt) {
        return session.expiresAt > Date.now();
      }

      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },
};
