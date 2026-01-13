
import { Product, Sale, CloudUser, CloudProvider } from '../types';

class CloudProviderBase {
  async sync(key: string, data: any, user: CloudUser): Promise<boolean> {
    return true;
  }
  async fetch(key: string, user: CloudUser): Promise<any> {
    return null;
  }
}

class PocketBaseProvider extends CloudProviderBase {
  private baseUrl: string = 'http://127.0.0.1:8090';

  setBaseUrl(url: string) {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `http://${formattedUrl}`;
    }
    this.baseUrl = formattedUrl.endsWith('/') ? formattedUrl.slice(0, -1) : formattedUrl;
  }

  async sync(collectionName: string, items: any[]): Promise<boolean> {
    try {
      const lastItem = items[items.length - 1]; 
      if (!lastItem) return true;
      const response = await fetch(`${this.baseUrl}/api/collections/${collectionName}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastItem)
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async fetch(collectionName: string): Promise<any> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/collections/${collectionName}/records?perPage=500&sort=-created`);
      if (resp.ok) {
        const result = await resp.json();
        return result.items;
      }
    } catch (e) { return null; }
  }
}

class FirebaseProvider extends CloudProviderBase {
  async sync(key: string, data: any, user: CloudUser): Promise<boolean> {
    if (!user.firebaseConfig?.authDomain) return false; // Using authDomain field to store Database URL
    
    try {
      const dbUrl = user.firebaseConfig.authDomain.endsWith('/') 
        ? user.firebaseConfig.authDomain 
        : `${user.firebaseConfig.authDomain}/`;
        
      // In Firebase RTDB, a PUT request to a path creates it automatically.
      const response = await fetch(`${dbUrl}${key}.json?auth=${user.firebaseConfig.apiKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      console.error("Firebase Sync Error:", e);
      return false;
    }
  }

  async fetch(key: string, user: CloudUser): Promise<any> {
    if (!user.firebaseConfig?.authDomain) return null;
    try {
      const dbUrl = user.firebaseConfig.authDomain.endsWith('/') 
        ? user.firebaseConfig.authDomain 
        : `${user.firebaseConfig.authDomain}/`;
        
      const response = await fetch(`${dbUrl}${key}.json?auth=${user.firebaseConfig.apiKey}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      return null;
    }
  }
}

// Global instances
const pb = new PocketBaseProvider();
const fb = new FirebaseProvider();

export const StorageService = {
  saveLocal: (key: string, data: any) => {
    localStorage.setItem(`medflow_${key}`, JSON.stringify(data));
  },

  getLocal: (key: string) => {
    const data = localStorage.getItem(`medflow_${key}`);
    return data ? JSON.parse(data) : null;
  },

  syncToCloud: async (key: string, data: any, user: CloudUser | null): Promise<boolean> => {
    if (!user || user.provider === 'none') return true;
    
    if (user.provider === 'pocketbase' && user.pocketBaseUrl) {
      pb.setBaseUrl(user.pocketBaseUrl);
      const items = Array.isArray(data) ? data : [data];
      return await pb.sync(key, items);
    }

    if (user.provider === 'firebase' && user.firebaseConfig) {
      return await fb.sync(key, data, user);
    }
    
    return true;
  },

  fetchFromCloud: async (key: string, user: CloudUser | null): Promise<any | null> => {
    if (!user || user.provider === 'none') return null;

    if (user.provider === 'pocketbase' && user.pocketBaseUrl) {
      pb.setBaseUrl(user.pocketBaseUrl);
      return await pb.fetch(key);
    }

    if (user.provider === 'firebase' && user.firebaseConfig) {
      return await fb.fetch(key, user);
    }
    
    return null;
  },

  login: async (email: string, provider: CloudProvider = 'none', config?: any): Promise<CloudUser> => {
    return {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email: email,
      pharmacyName: 'My Medical Store',
      isLoggedIn: provider !== 'none',
      provider: provider,
      pocketBaseUrl: provider === 'pocketbase' ? config : undefined,
      firebaseConfig: provider === 'firebase' ? config : undefined
    };
  }
};
