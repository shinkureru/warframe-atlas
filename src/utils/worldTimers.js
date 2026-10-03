import { customPhase } from './schedule.js';

const API = 'https://api.warframestat.us/pc/?language=en';
const CACHE_KEY = 'origin-worldstate-v1';
const REFRESH_MS = 5 * 60000;
let inFlight = null;
let retryAfter = 0;

function cached() {
  try { const data = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null'); return data?.savedAt && data?.world ? data : null; }
  catch { return null; }
}

// 同一頁的重複掛載共享 Promise；隱藏分頁不輪詢，五分鐘內的重新整理使用快取。
export async function getWorldTimers(force = false) {
  const previous = cached();
  if (!force && previous && Date.now() - previous.savedAt < REFRESH_MS) return previous;
  if (inFlight) return inFlight;
  if (!force && Date.now() < retryAfter) throw new Error('外部計時器服務暫時無法連線');
  inFlight = (async () => {
    try {
      const response = await fetch(API, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Warframe Status ${response.status}`);
      const world = await response.json();
      if (!world?.cetusCycle?.expiry || !world?.vallisCycle?.expiry) throw new Error('計時器資料格式不符');
      const result = { savedAt: Date.now(), world: {
        cetusCycle: world.cetusCycle, vallisCycle: world.vallisCycle,
        cambionCycle: world.cambionCycle, zarimanCycle: world.zarimanCycle,
      } };
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch { /* 私密視窗可能停用儲存。 */ }
      retryAfter = 0;
      return result;
    } catch (error) { retryAfter = Date.now() + REFRESH_MS; throw error; }
  })().finally(() => { inFlight = null; });
  return inFlight;
}

export function getCachedWorldTimers() { return cached(); }

// 四個世界週期與 Hub 同源；使用到期時間與階段長度在兩次請求間平滑切換。
const worldCycles = [
  { key: 'cetusCycle', name: '地球平原', phases: [{ label: '白天', minutes: 100 }, { label: '夜晚', minutes: 50 }], state: (v) => typeof v.isDay === 'boolean' ? (v.isDay ? 0 : 1) : -1 },
  { key: 'vallisCycle', name: '金星山谷', phases: [{ label: '溫暖', minutes: 6 + 40 / 60 }, { label: '寒冷', minutes: 20 }], state: (v) => typeof v.isWarm === 'boolean' ? (v.isWarm ? 0 : 1) : -1 },
  { key: 'cambionCycle', name: '魔胎之境', phases: [{ label: 'Fass', minutes: 100 }, { label: 'Vome', minutes: 50 }], state: (v) => /fass/i.test(v.active || v.state || '') ? 0 : /vome/i.test(v.active || v.state || '') ? 1 : -1 },
  { key: 'zarimanCycle', name: '扎日曼號', phases: [{ label: 'Corpus', minutes: 120 }, { label: 'Grineer', minutes: 120 }], state: (v) => /corpus/i.test(v.state || v.active || '') ? 0 : /grineer/i.test(v.state || v.active || '') ? 1 : -1 },
];

export function builtInTimers(world, now) {
  const timers = worldCycles.map((cycle) => {
    const value = world?.[cycle.key];
    const expiry = Date.parse(value?.expiry);
    if (!Number.isFinite(expiry)) return { id: cycle.key, name: cycle.name, state: '資料暫不可用', expiry: null };
    const index = cycle.state(value);
    if (index < 0) return { id: cycle.key, name: cycle.name, state: '資料暫不可用', expiry: null };
    // 到期時不再顯示 00:00；計算下一階段並等待 API 下次校正。
    const phase = customPhase({ startAt: new Date(expiry).toISOString(), loop: true,
      phases: [...cycle.phases.slice(index + 1), ...cycle.phases.slice(0, index + 1)] }, now);
    return now < expiry
      ? { id: cycle.key, name: cycle.name, state: cycle.phases[index].label, expiry }
      : { id: cycle.key, name: cycle.name, ...phase };
  });
  const nextUtcMidnight = Math.floor(now / 86400000) * 86400000 + 86400000;
  return [...timers, { id: 'dailyReset', name: '每日重置', state: 'UTC 00:00', expiry: nextUtcMidnight }];
}
