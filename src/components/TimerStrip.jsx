import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { builtInTimers, getCachedWorldTimers, getWorldTimers } from '../utils/worldTimers.js';
import { countdown, customPhase } from '../utils/schedule.js';

// 秒級更新只讀取 Date.now()；世界狀態最多每五分鐘請求一次外部 API。
export default function TimerStrip({ customTimers = [] }) {
  const [now, setNow] = useState(Date.now());
  const [world, setWorld] = useState(() => getCachedWorldTimers()?.world || null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (document.visibilityState === 'hidden') return;
      getWorldTimers().then((result) => {
        if (mounted) { setWorld(result.world); setError(false); }
      }).catch(() => { if (mounted) setError(true); });
    };
    update();
    const tick = window.setInterval(() => { if (document.visibilityState !== 'hidden') setNow(Date.now()); }, 1000);
    const refresh = window.setInterval(update, 60000);
    const onVisible = () => { setNow(Date.now()); update(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { mounted = false; window.clearInterval(tick); window.clearInterval(refresh); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  const builtIn = builtInTimers(world, now);
  const extra = (Array.isArray(customTimers) ? customTimers : []).map((timer) => ({
    id: timer.id, name: timer.name, ...customPhase(timer, now),
  }));
  return <div className="timer-strip" aria-label="遊戲及自訂計時器">
    <div className="timer-track">
      {[...builtIn, ...extra].map((timer) => <div className="timer-chip" key={timer.id} title={`${timer.name}：${timer.state || '資料暫不可用'}`}>
        <span className="timer-chip-name">{timer.name}</span>
        <span className="timer-chip-phase">{timer.state || '資料暫不可用'}</span>
        <strong className="timer-chip-countdown">{timer.expiry ? countdown(timer.expiry, now) : '—'}</strong>
      </div>)}
      {error && <span className="timer-error" title="外部計時器服務暫時無法連線；顯示快取及本機推算結果。">資料暫停更新</span>}
      <Link className="timer-strip-link" to="/daily-weekly">每日／每週清單 →</Link>
    </div>
  </div>;
}
