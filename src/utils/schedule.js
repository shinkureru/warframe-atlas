// 站點的任務預設值；既有 settings/site 未含此欄位時仍能立即顯示清單。
export const checklistDefaults = {
  daily: { hour: 8, minute: 0, items: [
    { id: 'daily-login', text: '領取每日登入獎勵' },
    { id: 'daily-sortie', text: '完成每日突擊' },
    { id: 'daily-standing', text: '檢查集團聲望與每日任務' },
  ] },
  weekly: { weekday: 1, hour: 8, minute: 0, items: [
    { id: 'weekly-nightwave', text: '完成午夜電波每週行動' },
    { id: 'weekly-archon', text: '檢查執刑官獵殺與每週任務' },
  ] },
};

const HOUR = 3600000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const TAIWAN_OFFSET = 8 * HOUR;

// 使用 UTC 數值平移到台灣固定時區，無論訪客電腦位於哪個時區，週一 08:00 都相同。
export function periodStart(now, config, weekly = false) {
  const taiwan = now + TAIWAN_OFFSET;
  const hour = Number(config?.hour ?? 8);
  const minute = Number(config?.minute ?? 0);
  const midnight = Math.floor(taiwan / DAY) * DAY;
  let start = midnight + hour * HOUR + minute * 60000;
  if (start > taiwan) start -= DAY;
  if (weekly) {
    const day = new Date(start).getUTCDay();
    const weekday = Number(config?.weekday ?? 1);
    start -= ((day - weekday + 7) % 7) * DAY;
    // 當週指定日期尚未到重置時間，須退回前一週。
    if (start > taiwan) start -= WEEK;
  }
  return start - TAIWAN_OFFSET;
}

// 儲存的是週期起點；時間更改後會由新設定重新計算，不需後端定時工作。
export function periodKey(now, config, weekly = false) {
  return new Date(periodStart(now, config, weekly)).toISOString();
}

// 計算管理員設定的各階段，起點為第一階段開始的絕對時間。
export function customPhase(timer, now) {
  const start = Date.parse(timer.startAt);
  const phases = Array.isArray(timer.phases) ? timer.phases : [];
  if (!Number.isFinite(start) || !phases.length) return null;
  const lengths = phases.map((phase) => Number(phase.minutes) * 60000);
  if (lengths.some((length) => !Number.isFinite(length) || length <= 0)) return null;
  if (now < start) return { state: '尚未開始', expiry: start };
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const elapsed = timer.loop ? (now - start) % total : now - start;
  if (elapsed >= total) return { state: '已結束', expiry: null };
  let passed = 0;
  for (let i = 0; i < phases.length; i += 1) {
    passed += lengths[i];
    if (elapsed < passed) {
      const cycleStart = timer.loop ? now - elapsed : start;
      return { state: phases[i].label, expiry: cycleStart + passed };
    }
  }
  return null;
}

// 格式化本機秒級倒數；不寫 Firebase、不呼叫計時器 API。
export function countdown(expiry, now) {
  if (!Number.isFinite(expiry)) return '—';
  const seconds = Math.max(0, Math.ceil((expiry - now) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours ? `${hours}時 ${String(minutes).padStart(2, '0')}分` : `${minutes}分 ${String(rest).padStart(2, '0')}秒`;
}
