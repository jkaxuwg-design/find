
import { HistoryItem } from '../types';

// 如果你有了 Supabase 地址，填在这里，或者通过 process.env 注入
// 这是一个“真后端”接口模拟，你可以随时接入真正的 Supabase SDK
const SUPABASE_URL = (window as any)._ENV_?.SUPABASE_URL || '';
const SUPABASE_KEY = (window as any)._ENV_?.SUPABASE_KEY || '';

const LOCAL_STORE = 'divination_history';

export const storageProvider = {
  /**
   * 保存记录到后端
   * 如果配置了 SUPABASE，则发送 REST 请求，否则存入 localStorage
   */
  async save(item: HistoryItem): Promise<void> {
    console.log('📡 [Backend] Synchronizing data...');
    
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/divination_history`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            id: item.id,
            item_name: item.input.itemName,
            data: item
          })
        });
        if (!response.ok) throw new Error('Remote sync failed');
        console.log('✅ [Backend] Cloud storage successful');
      } catch (e) {
        console.error('❌ [Backend] Fallback to local:', e);
        this.saveToLocal(item);
      }
    } else {
      this.saveToLocal(item);
    }
  },

  /**
   * 获取所有历史记录
   */
  async getAll(): Promise<HistoryItem[]> {
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/divination_history?select=data&order=created_at.desc&limit=20`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        const json = await response.json();
        return json.map((row: any) => row.data);
      } catch (e) {
        return this.getLocal();
      }
    }
    return this.getLocal();
  },

  // Fix: Removed 'private' modifier as it's not allowed in object literals
  saveToLocal(item: HistoryItem) {
    const history = this.getLocalSync();
    const updated = [item, ...history].slice(0, 50);
    localStorage.setItem(LOCAL_STORE, JSON.stringify(updated));
  },

  // Fix: Removed 'private' modifier as it's not allowed in object literals
  getLocal(): Promise<HistoryItem[]> {
    return Promise.resolve(this.getLocalSync());
  },

  // Fix: Removed 'private' modifier as it's not allowed in object literals
  getLocalSync(): HistoryItem[] {
    const saved = localStorage.getItem(LOCAL_STORE);
    return saved ? JSON.parse(saved) : [];
  }
};
