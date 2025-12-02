import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  loginTime: Timestamp;
  lastActivity: Timestamp;
  isActive: boolean;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface UserActivity {
  userId: string;
  sessionId: string;
  activityType: 'text_generation' | 'text_refinement' | 'text_analysis' | 'style_change' | 'settings_change';
  timestamp: Timestamp;
  details?: Record<string, any>;
}

export interface UserStats {
  totalLogins: number;
  lastLogin: Timestamp;
  totalActivities: number;
  totalTextGenerated: number;
  totalTextAnalyzed: number;
  totalTextRefined: number;
  accountCreated: Timestamp;
}

/**
 * Service pour tracker les connexions et activités utilisateurs
 */
export const analyticsService = {
  /**
   * Enregistrer une nouvelle connexion utilisateur
   */
  async trackLogin(userId: string, name: string, email: string): Promise<string | null> {
    if (!isFirebaseConfigured() || !db) {
      console.warn('Firebase not configured. Skipping login tracking.');
      return null;
    }

    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const sessionData: UserSession = {
        userId,
        name,
        email,
        loginTime: serverTimestamp() as Timestamp,
        lastActivity: serverTimestamp() as Timestamp,
        isActive: true,
        sessionId,
        userAgent: navigator.userAgent
      };

      // Enregistrer la session
      await setDoc(doc(db, 'sessions', sessionId), sessionData);

      // Mettre à jour les stats utilisateur
      const userStatsRef = doc(db, 'userStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);

      if (userStatsDoc.exists()) {
        await updateDoc(userStatsRef, {
          totalLogins: (userStatsDoc.data().totalLogins || 0) + 1,
          lastLogin: serverTimestamp()
        });
      } else {
        const initialStats: UserStats = {
          totalLogins: 1,
          lastLogin: serverTimestamp() as Timestamp,
          totalActivities: 0,
          totalTextGenerated: 0,
          totalTextAnalyzed: 0,
          totalTextRefined: 0,
          accountCreated: serverTimestamp() as Timestamp
        };
        await setDoc(userStatsRef, initialStats);
      }

      console.log(`✅ Login tracked for user ${userId}`);
      return sessionId;
    } catch (error) {
      console.error('Error tracking login:', error);
      return null;
    }
  },

  /**
   * Enregistrer une déconnexion
   */
  async trackLogout(sessionId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db || !sessionId) return;

    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        lastActivity: serverTimestamp()
      });
      console.log(`✅ Logout tracked for session ${sessionId}`);
    } catch (error) {
      console.error('Error tracking logout:', error);
    }
  },

  /**
   * Mettre à jour l'activité de la session (heartbeat)
   */
  async updateActivity(sessionId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db || !sessionId) return;

    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  },

  /**
   * Enregistrer une activité utilisateur
   */
  async trackActivity(
    userId: string,
    sessionId: string,
    activityType: UserActivity['activityType'],
    details?: Record<string, any>
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db || !sessionId) return;

    try {
      const activity: UserActivity = {
        userId,
        sessionId,
        activityType,
        timestamp: serverTimestamp() as Timestamp,
        details
      };

      await addDoc(collection(db, 'activities'), activity);

      // Mettre à jour les stats
      const userStatsRef = doc(db, 'userStats', userId);
      const updates: Partial<UserStats> = {
        totalActivities: (await getDoc(userStatsRef)).data()?.totalActivities || 0 + 1
      };

      if (activityType === 'text_generation') {
        updates.totalTextGenerated = ((await getDoc(userStatsRef)).data()?.totalTextGenerated || 0) + 1;
      } else if (activityType === 'text_analysis') {
        updates.totalTextAnalyzed = ((await getDoc(userStatsRef)).data()?.totalTextAnalyzed || 0) + 1;
      } else if (activityType === 'text_refinement') {
        updates.totalTextRefined = ((await getDoc(userStatsRef)).data()?.totalTextRefined || 0) + 1;
      }

      await updateDoc(userStatsRef, updates as any);

      // Mettre à jour l'activité de la session
      await this.updateActivity(sessionId);
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  },

  /**
   * Obtenir le nombre d'utilisateurs actifs
   */
  async getActiveUsersCount(): Promise<number> {
    if (!isFirebaseConfigured() || !db) return 0;

    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const q = query(
        collection(db, 'sessions'),
        where('isActive', '==', true),
        where('lastActivity', '>', Timestamp.fromDate(fiveMinutesAgo))
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting active users:', error);
      return 0;
    }
  },

  /**
   * Obtenir les statistiques d'un utilisateur
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    if (!isFirebaseConfigured() || !db) return null;

    try {
      const userStatsDoc = await getDoc(doc(db, 'userStats', userId));
      if (userStatsDoc.exists()) {
        return userStatsDoc.data() as UserStats;
      }
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  },

  /**
   * Obtenir les sessions actives en temps réel
   */
  subscribeToActiveSessions(callback: (sessions: UserSession[]) => void): () => void {
    if (!isFirebaseConfigured() || !db) {
      return () => {};
    }

    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const q = query(
        collection(db, 'sessions'),
        where('isActive', '==', true),
        where('lastActivity', '>', Timestamp.fromDate(fiveMinutesAgo)),
        orderBy('lastActivity', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessions: UserSession[] = [];
        snapshot.forEach((doc) => {
          sessions.push(doc.data() as UserSession);
        });
        callback(sessions);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to active sessions:', error);
      return () => {};
    }
  },

  /**
   * Obtenir les activités récentes
   */
  async getRecentActivities(userId?: string, limitCount: number = 50): Promise<UserActivity[]> {
    if (!isFirebaseConfigured() || !db) return [];

    try {
      let q = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (userId) {
        q = query(
          collection(db, 'activities'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      const activities: UserActivity[] = [];
      snapshot.forEach((doc) => {
        activities.push(doc.data() as UserActivity);
      });
      return activities;
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }
};
