import { useEffect, useRef, useState } from 'react';
import { auth } from '../utils/firebase.js';
import { checklistDefaults, periodKey } from '../utils/schedule.js';

// 全站監看台灣時間跨越重置點；只寫瀏覽器 localStorage，不啟動 Firebase 排程。
export default function ResetNotice({ checklists }) {
  const [notice, setNotice] = useState('');
  const closeButton = useRef(null);
  const daily = checklists?.daily || checklistDefaults.daily;
  const weekly = checklists?.weekly || checklistDefaults.weekly;
  const uid = auth.currentUser?.uid;
  useEffect(() => {
    if (!uid) return undefined;
    const check = () => {
      const now = Date.now();
      const changed = [];
      for (const [name, config, isWeekly] of [['每日', daily, false], ['每週', weekly, true]]) {
        const key = `origin-reset-seen:${uid}:${isWeekly ? 'weekly' : 'daily'}`;
        const current = periodKey(now, config, isWeekly);
        try {
          const previous = localStorage.getItem(key);
          if (previous !== current) {
            if (previous) changed.push(name);
            localStorage.setItem(key, current);
          }
        } catch { /* 儲存空間遭停用時，仍可在當前頁面使用清單。 */ }
      }
      if (changed.length) setNotice(`${changed.join('與')}清單已重置，可以開始新的任務了。`);
    };
    check();
    const interval = window.setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', check); };
  }, [uid, daily, weekly]);
  useEffect(() => {
    if (!notice) return undefined;
    const oldFocus = document.activeElement;
    closeButton.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') setNotice(''); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); oldFocus?.focus?.(); };
  }, [notice]);
  if (!notice) return null;
  return <><div className="modal-backdrop fade show" /><div className="modal fade show reset-modal" style={{ display: 'block' }} role="dialog" aria-modal="true" aria-labelledby="reset-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setNotice(''); }}>
    <div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h2 className="modal-title fs-5" id="reset-modal-title">任務清單重置</h2><button ref={closeButton} type="button" className="btn-close" aria-label="關閉" onClick={() => setNotice('')} /></div><div className="modal-body"><p className="mb-0">{notice}</p></div><div className="modal-footer"><button type="button" className="btn btn-primary" onClick={() => setNotice('')}>我知道了</button></div></div></div>
  </div></>;
}
