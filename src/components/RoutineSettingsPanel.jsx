import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { archiveCall } from '../utils/firebase.js';
import { checklistDefaults } from '../utils/schedule.js';
import { loadContent } from '../state/store.js';

const localDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const uniqueId = () => crypto.randomUUID();

// 管理員一次儲存計時器及清單設定；草稿輸入不觸發任何 Firebase 請求。
export default function RoutineSettingsPanel({ site }) {
  const dispatch = useDispatch();
  const [timers, setTimers] = useState(site.timers || []);
  const [checklists, setChecklists] = useState(site.checklists || checklistDefaults);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setTimers(site.timers || []); setChecklists(site.checklists || checklistDefaults); }, [site.timers, site.checklists]);
  const editTimer = (id, patch) => setTimers((old) => old.map((timer) => timer.id === id ? { ...timer, ...patch } : timer));
  const editPhase = (timer, index, patch) => editTimer(timer.id, { phases: timer.phases.map((phase, i) => i === index ? { ...phase, ...patch } : phase) });
  const editList = (key, patch) => setChecklists((old) => ({ ...old, [key]: { ...old[key], ...patch } }));
  async function save(event) {
    event.preventDefault(); setMessage('');
    try {
      if (timers.length > 8 || timers.some((timer) => !timer.name.trim() || !Number.isFinite(Date.parse(timer.startAt)) || !timer.phases.length || timer.phases.length > 8 || timer.phases.some((phase) => !phase.label.trim() || !Number.isFinite(Number(phase.minutes)) || Number(phase.minutes) < 0.1 || Number(phase.minutes) > 10080))) throw new Error('計時器需填名稱、開始時間，以及 0.1 至 10080 分鐘的有效階段（最多 8 個計時器、各 8 階段）。');
      for (const key of ['daily', 'weekly']) {
        const list = checklists[key];
        if (!Number.isInteger(Number(list.hour)) || Number(list.hour) < 0 || Number(list.hour) > 23 || !Number.isInteger(Number(list.minute)) || Number(list.minute) < 0 || Number(list.minute) > 59 || list.items.length > 40 || list.items.some((item) => !item.text.trim())) throw new Error('重置時間不正確，或有空白任務／超過 40 項。');
      }
      setBusy(true);
      await archiveCall('saveSite', { value: { timers, checklists } });
      await dispatch(loadContent()).unwrap();
      setMessage('計時器和清單設定已儲存；其他訪客重新整理後生效。');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <form className="admin-panel routine-settings-panel" onSubmit={save}>
    <div className="panel-heading"><div><span className="eyebrow">05 / ROUTINE</span><h2>計時器與任務清單</h2></div></div>
    <p className="panel-note">上方四個世界週期由 Warframe Status 更新，每日重置按 UTC 00:00 計算。此處可追加自訂計時器；輸入時間使用你的電腦時區，儲存後換算為固定時間點。</p>
    <div className="editor-section-heading"><h3>自訂計時器</h3><button type="button" className="outline-button" disabled={timers.length >= 8} onClick={() => setTimers([...timers, { id: uniqueId(), name: '', startAt: new Date().toISOString(), loop: true, phases: [{ label: '階段一', minutes: 100 }, { label: '階段二', minutes: 50 }] }])}><Plus size={16} /> 新增計時器</button></div>
    {timers.map((timer) => <div className="routine-editor" key={timer.id}><div className="routine-editor-head"><label>名稱<input className="form-control custom-input" maxLength={36} required value={timer.name} onChange={(event) => editTimer(timer.id, { name: event.target.value })} /></label><button type="button" className="subtle-delete" onClick={() => setTimers(timers.filter((entry) => entry.id !== timer.id))}><Trash2 size={16} /> 移除</button></div><div className="routine-fields"><label>第一階段開始<input className="form-control custom-input" type="datetime-local" required value={localDateTime(timer.startAt)} onChange={(event) => editTimer(timer.id, { startAt: event.target.value ? new Date(event.target.value).toISOString() : '' })} /></label><label className="routine-checkbox"><input className="form-check-input" type="checkbox" checked={Boolean(timer.loop)} onChange={(event) => editTimer(timer.id, { loop: event.target.checked })} /> 持續循環</label></div><div className="routine-phases">{timer.phases.map((phase, index) => <div key={index} className="routine-phase"><label>階段 {index + 1} 名稱<input className="form-control custom-input" maxLength={24} required value={phase.label} onChange={(event) => editPhase(timer, index, { label: event.target.value })} /></label><label>持續分鐘<input className="form-control custom-input" type="number" min="0.1" max="10080" step="any" required value={phase.minutes} onChange={(event) => editPhase(timer, index, { minutes: event.target.value })} /></label><button type="button" aria-label={`移除階段 ${index + 1}`} disabled={timer.phases.length === 1} onClick={() => editTimer(timer.id, { phases: timer.phases.filter((_, i) => i !== index) })}><Trash2 size={16} /></button></div>)}</div><button type="button" className="outline-button" disabled={timer.phases.length >= 8} onClick={() => editTimer(timer.id, { phases: [...timer.phases, { label: '', minutes: 50 }] })}><Plus size={16} /> 新增階段</button></div>)}
    {['daily', 'weekly'].map((key) => { const list = checklists[key] || checklistDefaults[key]; return <div className="routine-list-settings" key={key}><h3>{key === 'daily' ? '每日' : '每週'}清單</h3><div className="routine-fields">{key === 'weekly' && <label>重置星期<select className="form-select custom-input" value={list.weekday} onChange={(event) => editList(key, { weekday: Number(event.target.value) })}>{['日', '一', '二', '三', '四', '五', '六'].map((day, index) => <option value={index} key={day}>週{day}</option>)}</select></label>}<label>台灣時間 小時<input className="form-control custom-input" type="number" min="0" max="23" required value={list.hour} onChange={(event) => editList(key, { hour: Number(event.target.value) })} /></label><label>分鐘<input className="form-control custom-input" type="number" min="0" max="59" required value={list.minute} onChange={(event) => editList(key, { minute: Number(event.target.value) })} /></label></div><div className="routine-tasks">{list.items.map((item) => <div className="routine-task-row" key={item.id}><input className="form-control custom-input" aria-label="任務名稱" maxLength={120} required value={item.text} onChange={(event) => editList(key, { items: list.items.map((entry) => entry.id === item.id ? { ...entry, text: event.target.value } : entry) })} /><button type="button" className="subtle-delete" aria-label={`移除${item.text}`} onClick={() => editList(key, { items: list.items.filter((entry) => entry.id !== item.id) })}><Trash2 size={16} /></button></div>)}</div><button type="button" className="outline-button" disabled={list.items.length >= 40} onClick={() => editList(key, { items: [...list.items, { id: uniqueId(), text: '' }] })}><Plus size={16} /> 新增任務</button></div>; })}
    {message && <p className="backup-message" role="status">{message}</p>}
    <button type="submit" className="btn-primary-custom" disabled={busy}><Save size={17} /> {busy ? '儲存中…' : '儲存計時器與清單'}</button>
  </form>;
}
