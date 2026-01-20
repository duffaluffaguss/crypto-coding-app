import { toast } from './toast';

// Types for offline functionality
export interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

export interface OfflineData {
  key: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface OfflineState {
  isOnline: boolean;
  isVisible: boolean;
  lastSync: number;
}

// Constants
const DB_NAME = 'CryptoDevOfflineDB';
const DB_VERSION = 1;
const ACTIONS_STORE = 'pendingActions';
const DATA_STORE = 'offlineData';
const LESSON_STORE = 'lessonCache';
const CODE_STORE = 'codeCache';

// IndexedDB Helper Class
class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores
        if (!db.objectStoreNames.contains(ACTIONS_STORE)) {
          const actionsStore = db.createObjectStore(ACTIONS_STORE, { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(DATA_STORE)) {
          const dataStore = db.createObjectStore(DATA_STORE, { keyPath: 'key' });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
          dataStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(LESSON_STORE)) {
          const lessonStore = db.createObjectStore(LESSON_STORE, { keyPath: 'id' });
          lessonStore.createIndex('accessed', 'accessed', { unique: false });
        }

        if (!db.objectStoreNames.contains(CODE_STORE)) {
          const codeStore = db.createObjectStore(CODE_STORE, { keyPath: 'key' });
          codeStore.createIndex('modified', 'modified', { unique: false });
        }
      };
    });
  }

  async add(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Offline Manager Class
class OfflineManager {
  private db = new OfflineDB();
  private state: OfflineState = {
    isOnline: true,
    isVisible: true,
    lastSync: Date.now()
  };
  private listeners: Set<(state: OfflineState) => void> = new Set();
  private syncInProgress = false;

  constructor() {
    this.init();
  }

  private async init() {
    await this.db.init();
    this.setupEventListeners();
    this.updateOnlineStatus();
  }

  private setupEventListeners() {
    // Online/offline events
    window.addEventListener('online', () => {
      this.updateOnlineStatus(true);
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.updateOnlineStatus(false);
    });

    // Page visibility
    document.addEventListener('visibilitychange', () => {
      this.state.isVisible = !document.hidden;
      this.notifyListeners();
      
      if (this.state.isVisible && this.state.isOnline) {
        this.syncPendingActions();
      }
    });
  }

  private updateOnlineStatus(online?: boolean) {
    const wasOffline = !this.state.isOnline;
    this.state.isOnline = online !== undefined ? online : navigator.onLine;
    
    if (wasOffline && this.state.isOnline) {
      toast({
        title: 'Back online',
        description: 'Syncing your changes...',
      });
    } else if (!wasOffline && !this.state.isOnline) {
      toast({
        title: 'Offline mode',
        description: 'Changes will sync when you\'re back online',
        variant: 'destructive',
      });
    }

    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Public API
  onStateChange(listener: (state: OfflineState) => void) {
    this.listeners.add(listener);
    listener({ ...this.state });
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): OfflineState {
    return { ...this.state };
  }

  // Queue action for offline sync
  async queueAction(type: string, data: any): Promise<string> {
    const action: OfflineAction = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    await this.db.put(ACTIONS_STORE, action);
    
    if (this.state.isOnline) {
      this.syncPendingActions();
    }

    return action.id;
  }

  // Get pending actions count
  async getPendingActionsCount(): Promise<number> {
    const actions = await this.db.getAll<OfflineAction>(ACTIONS_STORE);
    return actions.length;
  }

  // Sync pending actions
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.state.isOnline) return;

    this.syncInProgress = true;
    
    try {
      const actions = await this.db.getAll<OfflineAction>(ACTIONS_STORE);
      const pendingActions = actions.sort((a, b) => a.timestamp - b.timestamp);

      for (const action of pendingActions) {
        try {
          await this.processAction(action);
          await this.db.delete(ACTIONS_STORE, action.id);
        } catch (error) {
          console.error('Failed to sync action:', action.type, error);
          
          // Increment retries
          action.retries++;
          if (action.retries >= 3) {
            // Remove failed action after 3 retries
            await this.db.delete(ACTIONS_STORE, action.id);
            toast({
              title: 'Sync failed',
              description: `Failed to sync ${action.type} after 3 attempts`,
              variant: 'destructive',
            });
          } else {
            await this.db.put(ACTIONS_STORE, action);
          }
        }
      }

      this.state.lastSync = Date.now();
      this.notifyListeners();

      if (pendingActions.length > 0) {
        toast({
          title: 'Sync complete',
          description: `Synced ${pendingActions.length} offline changes`,
        });
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processAction(action: OfflineAction): Promise<void> {
    const { type, data } = action;

    switch (type) {
      case 'save-code':
        await this.syncCodeSave(data);
        break;
      case 'save-progress':
        await this.syncProgressSave(data);
        break;
      case 'submit-project':
        await this.syncProjectSubmission(data);
        break;
      default:
        console.warn('Unknown action type:', type);
    }
  }

  private async syncCodeSave(data: any): Promise<void> {
    const response = await fetch('/api/code/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }
  }

  private async syncProgressSave(data: any): Promise<void> {
    const response = await fetch('/api/progress/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Progress save failed: ${response.statusText}`);
    }
  }

  private async syncProjectSubmission(data: any): Promise<void> {
    const response = await fetch('/api/projects/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Project submission failed: ${response.statusText}`);
    }
  }

  // Cache lesson content
  async cacheLessonContent(lessonId: string, content: any): Promise<void> {
    await this.db.put(LESSON_STORE, {
      id: lessonId,
      content,
      accessed: Date.now()
    });
  }

  async getCachedLessonContent(lessonId: string): Promise<any | null> {
    const cached = await this.db.get(LESSON_STORE, lessonId);
    return cached?.content || null;
  }

  // Code storage for offline editing
  async saveCodeOffline(key: string, code: string): Promise<void> {
    await this.db.put(CODE_STORE, {
      key,
      code,
      modified: Date.now(),
      synced: false
    });

    // Also queue for sync if online
    if (this.state.isOnline) {
      await this.queueAction('save-code', { key, code });
    }
  }

  async getOfflineCode(key: string): Promise<string | null> {
    const cached = await this.db.get(CODE_STORE, key);
    return cached?.code || null;
  }

  async getUnsyncedCode(): Promise<Array<{ key: string; code: string; modified: number }>> {
    const allCode = await this.db.getAll(CODE_STORE);
    return allCode.filter(item => !item.synced);
  }

  // Clear old cached data
  async clearOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAge;
    
    // Clear old lessons
    const lessons = await this.db.getAll(LESSON_STORE);
    for (const lesson of lessons) {
      if (lesson.accessed < cutoff) {
        await this.db.delete(LESSON_STORE, lesson.id);
      }
    }

    // Clear synced code older than cutoff
    const codes = await this.db.getAll(CODE_STORE);
    for (const code of codes) {
      if (code.synced && code.modified < cutoff) {
        await this.db.delete(CODE_STORE, code.key);
      }
    }
  }
}

// Create global instance
const offlineManager = new OfflineManager();

// Export utilities
export default offlineManager;

export const useOffline = () => {
  return offlineManager;
};

// LocalStorage helpers
export const localStorageHelpers = {
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('LocalStorage set failed:', error);
    }
  },

  get: (key: string, defaultValue?: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('LocalStorage get failed:', error);
      return defaultValue;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('LocalStorage remove failed:', error);
    }
  }
};