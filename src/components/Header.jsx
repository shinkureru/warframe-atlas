import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Plus, Search, X } from 'lucide-react';
import { logout } from '../state/store.js';
import { navItems } from '../data/categories.js';
import TimerStrip from './TimerStrip.jsx';

// 桌面導覽列與手機折疊選單；所有登入者都能投稿。
export default function Header({ role, site = {} }) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const globalQuery = new URLSearchParams(location.search).get('q') || '';
  return <header className="header"><div className="header-inner">
    <Link className="brand" to="/" onClick={() => setOpen(false)}><span className="brand-symbol">✦</span><span>{site.brand || 'ORIGIN'}<small>{site.brandCaption || 'WARFRAME ARCHIVE'}</small></span></Link>
    <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="主要導覽">{navItems.map((item) => <NavLink key={item.to} end={item.to === '/'} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{site.categories?.find((category) => item.to === `/category/${category.slug}`)?.label || item.label}</NavLink>)}</nav>
    <div className="header-actions"><form className="nav-search" role="search" onSubmit={(event) => event.preventDefault()}><Search size={17} /><input type="search" aria-label="導覽列全站即時搜尋" placeholder="全站搜尋攻略" value={location.pathname === '/search' ? globalQuery : ''} onChange={(event) => { navigate(`/search${event.target.value ? `?q=${encodeURIComponent(event.target.value)}` : ''}`, { replace: true }); }} /></form><Link to="/editor/new" className="header-create"><Plus size={17} /> 投稿文章</Link><span className="role-pill">{role === 'admin' ? '管理員' : '閱讀者'}</span><button className="icon-button logout-button" title="登出" aria-label="登出" onClick={async () => { await dispatch(logout()); navigate('/'); }}><LogOut size={18} /></button><button className="icon-button mobile-menu" aria-label={open ? '關閉選單' : '開啟選單'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
  </div><TimerStrip customTimers={site.timers} /></header>;
}
