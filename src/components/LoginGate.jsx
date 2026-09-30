import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { clearAuthError, login, googleLogin, register } from '../state/store.js';

// Spark 沒有安全的共用密碼伺服器，使用 Firebase 個別帳號保護投稿與管理功能。
export default function LoginGate() {
  const dispatch = useDispatch();
  const { error, status } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState('login');
  async function submit(event) { event.preventDefault(); await dispatch((mode === 'register' ? register : login)({ email, password, remember })); }
  return <div className="gate-page">
    <div className="gate-top"><span className="brand-symbol">✦</span> ORIGIN <span className="gate-top-right">WARFRAME FIELD NOTES / 001</span></div>
    <div className="gate-layout">
      <div className="gate-intro"><span className="eyebrow">THE TENNO ARCHIVE · COMMUNITY</span><h1>每一次出發，<br />都有跡可循。</h1><p>角色、武器、關卡與那些值得記下來的心得，都收在同一個地方。</p><div className="gate-line"><span>EXPLORE</span><span>COLLECT</span><span>REMEMBER</span></div></div>
      <form className="gate-form" onSubmit={submit}>
        <div className="gate-icon"><LockKeyhole size={24} strokeWidth={1.6} /></div><span className="eyebrow">ACCESS / 01</span>
        <h2>{mode === 'register' ? '建立攻略帳號' : '登入攻略圖鑑'}</h2><p>{mode === 'register' ? '註冊後請到信箱完成驗證，才能投稿文章。' : '使用你的電子郵件帳號進入圖鑑。'}</p>
        <label htmlFor="gate-email" className="form-label">電子郵件</label><input id="gate-email" className="form-control custom-input" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error) dispatch(clearAuthError()); }} required placeholder="you@example.com" />
        <label htmlFor="gate-password" className="form-label mt-3">密碼</label><input id="gate-password" className="form-control custom-input" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(e) => { setPassword(e.target.value); if (error) dispatch(clearAuthError()); }} required placeholder="至少 6 個字元" />
        <label className="remember-row"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>在這台電腦保持登入</span></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn-primary-custom w-100" disabled={status === 'logging-in'} type="submit">{status === 'logging-in' ? '處理中…' : mode === 'register' ? '建立帳號' : '進入圖鑑'} <ArrowRight size={17} /></button>
        <div className="gate-divider"><span>或</span></div>
        <button className="google-login-button" type="button" disabled={status === 'logging-in'} onClick={() => dispatch(googleLogin({ remember }))}><span className="google-mark" aria-hidden="true">G</span> 使用 Google 帳號繼續</button>
        <button className="gate-switch" type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); dispatch(clearAuthError()); }}>{mode === 'register' ? '已有帳號？返回登入' : '第一次來？建立帳號'}</button>
        <small>Google 帳號無須另設網站密碼。管理權限仍由站長授權。</small>
      </form>
    </div><div className="gate-bottom">AN INDEPENDENT WARFRAME GUIDE JOURNAL <span>© ORIGIN ARCHIVE</span></div>
  </div>;
}
