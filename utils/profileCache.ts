/**
 * Cache LRU simple pour les profils stylométriques
 * Évite le recalcul inutile des profils déjà analysés
 */

import { StylometricProfile } from '../types';

interface CacheEntry {
  profile: StylometricProfile;
  timestamp: number;
  lastAccess: number; // Pour LRU tracking
}

class ProfileCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // Limite de cache
  private maxAge = 1000 * 60 * 10; // 10 minutes
  private accessCounter = 0; // Compteur monotone pour LRU efficace

  private computeHash(text: string): string {
    // Hash simple mais efficace pour les textes
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36) + '-' + text.length;
  }

  get(text: string): StylometricProfile | null {
    const key = this.computeHash(text);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Mettre à jour lastAccess pour LRU (O(1))
    entry.lastAccess = ++this.accessCounter;

    return entry.profile;
  }

  set(text: string, profile: StylometricProfile): void {
    const key = this.computeHash(text);

    // OPTIMISATION: Éviction LRU en O(n) au lieu de O(n log n)
    // On trouve directement le minimum sans sort
    if (this.cache.size >= this.maxSize) {
      let lruKey: string | null = null;
      let minAccess = Infinity;

      for (const [k, entry] of this.cache.entries()) {
        if (entry.lastAccess < minAccess) {
          minAccess = entry.lastAccess;
          lruKey = k;
        }
      }

      if (lruKey) this.cache.delete(lruKey);
    }

    this.cache.set(key, {
      profile,
      timestamp: Date.now(),
      lastAccess: ++this.accessCounter
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

export const profileCache = new ProfileCache();
