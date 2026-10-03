import { useEffect, useState } from 'react';
import { auth } from '../utils/firebase.js';
import { checklistDefaults, periodKey } from '../utils/schedule.js';

const readChecks = (key) => {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
};

// 勾選狀態依 UID、裝置、週期儲存；逐項勾選完全不寫入 Firestore。
function TaskList({ title, config, weekly, now, uid }) {
  const period = periodKey(now, config, weekly);
  const storageKey = `origin-checks:${uid}:${weekly ? 'weekly' : 'daily'}:${period}`;
  const [checked, setChecked] = useState(() => readChecks(storageKey));
  useEffect(() => { setChecked(readChecks(storageKey)); }, [storageKey]);
  const items = Array.isArray(config.items) ? config.items : [];
  const done = items.filter((item) => checked.includes(item.id)).length;
  const toggle = (id) => {
    const next = checked.includes(id) ? checked.filter((value) => value !== id) : [...checked, id];
    setChecked(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* 私密瀏覽仍可暫時勾選。 */ }
  };
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][Number(config.weekday ?? 1)];
  return <section className="task-panel" aria-label={`${title}任務`}>
    <div className="task-panel-header"><div><span className="eyebrow">{weekly ? 'WEEKLY / LIST' : 'DAILY / LIST'}</span><h2>{title}任務</h2><p>台灣時間{weekly ? `每週${weekday}` : '每天'} {String(config.hour ?? 8).padStart(2, '0')}:{String(config.minute ?? 0).padStart(2, '0')} 重置</p></div><strong>{done} / {items.length}</strong></div>
    <div className="progress task-progress" role="progressbar" aria-label={`${title}完成進度`} aria-valuenow={done} aria-valuemin="0" aria-valuemax={items.length || 1}><div className="progress-bar" style={{ width: `${items.length ? done / items.length * 100 : 0}%` }} /></div>
    {items.length ? <div className="task-items">{items.map((item) => <label className={`task-item ${checked.includes(item.id) ? 'task-item-done' : ''}`} key={item.id}><input className="form-check-input" type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} /><span>{item.text}</span></label>)}</div> : <p className="panel-note">管理員尚未新增任務。</p>}
  </section>;
}

export default function DailyWeeklyPage({ checklists }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, []);
  const uid = auth.currentUser?.uid || 'visitor';
  return <div className="daily-weekly-page"><div className="page-lead"><span className="eyebrow">ROUTINE / CHECKLIST</span><h1>每日／每週<span className="heading-dot">.</span></h1><p>記錄你的星圖例行任務，清單會在指定的台灣時間開啟新一輪。</p></div><div className="task-grid"><TaskList title="每日" config={checklists?.daily || checklistDefaults.daily} weekly={false} now={now} uid={uid} /><TaskList title="每週" config={checklists?.weekly || checklistDefaults.weekly} weekly now={now} uid={uid} /></div><p className="task-privacy">勾選紀錄保存在這台裝置的瀏覽器；換裝置或清除瀏覽資料後不會同步。</p></div>;
}
