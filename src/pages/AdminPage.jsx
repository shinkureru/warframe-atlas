import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { api, loadContent } from '../state/store.js';
import { archiveCall, auth, linkGoogleAccount } from '../utils/firebase.js';
import { BackupPanel } from '../components/GuideExtras.jsx';
import SiteSettingsPanel from '../components/SiteSettingsPanel.jsx';
import RoutineSettingsPanel from '../components/RoutineSettingsPanel.jsx';

// 管理員工作區：建立文章、管理標籤以及快速編輯或刪除文章。
export default function AdminPage({ posts, tags, authors, categories, site }) {
  const dispatch = useDispatch();
  const [newTag, setNewTag] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(Boolean(auth.currentUser?.providerData.some((provider) => provider.providerId === 'google.com')));
  async function connectGoogle() {
    setBusy(true); setMessage('');
    try { await linkGoogleAccount(); setGoogleLinked(true); setMessage('Google 已連結到目前帳號；管理員 UID 保持不變。'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function addTag(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await api('/api/tags', { method: 'POST', body: JSON.stringify({ name: newTag }) }); setNewTag(''); dispatch(loadContent()); setMessage('標籤已新增。'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function removeTag(tag) {
    if (!window.confirm(`確定移除「${tag}」標籤？文章上使用的這個標籤也會一併移除。`)) return;
    try { await api(`/api/tags/${encodeURIComponent(tag)}`, { method: 'DELETE' }); dispatch(loadContent()); setMessage('標籤已移除。'); }
    catch (error) { setMessage(error.message); }
  }
  // 署名只供投稿時選擇；移除人員不會改掉舊文章上的歷史署名。
  async function changeAuthor(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await archiveCall('addAuthor', { value: newAuthor }); setNewAuthor(''); dispatch(loadContent()); setMessage('署名人員已新增。'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function removeAuthor(name) {
    if (!window.confirm(`確定移除「${name}」？既有文章上的署名會保留。`)) return;
    try { await archiveCall('removeAuthor', { value: name }); dispatch(loadContent()); setMessage('署名人員已移除。'); } catch (error) { setMessage(error.message); }
  }
  async function review(post, action) {
    if (!window.confirm(`確定${action === 'approve' ? '核准發佈' : '退回'}「${post.title}」？`)) return;
    try { await archiveCall(action, { id: post.id }); dispatch(loadContent()); setMessage(action === 'approve' ? '文章已公開。' : '文章已退回。'); } catch (error) { setMessage(error.message); }
  }
  async function removePost(post) {
    if (!window.confirm(`確定永久刪除「${post.title}」？此操作無法還原。`)) return;
    try { await api(`/api/posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' }); dispatch(loadContent()); setMessage('文章已刪除。'); }
    catch (error) { setMessage(error.message); }
  }
  return <div className="admin-page"><div className="page-lead admin-lead"><div><span className="eyebrow">EDITOR WORKSPACE / 001</span><h1>管理員工作區<span className="heading-dot">.</span></h1><p>審核投稿、管理攻略文章、標籤與署名人員。</p></div><Link to="/editor/new" className="btn-primary-custom"><Plus size={18} /> 新增文章</Link></div>
    <div className="admin-stats"><div><span>文章總數</span><strong>{posts.length}</strong></div><div><span>待審文章</span><strong>{posts.filter((post) => post.status === 'pending').length}</strong></div><div><span>目前標籤</span><strong>{tags.length}</strong></div></div>
    <section className="admin-panel admin-account-panel"><div className="panel-heading"><div><span className="eyebrow">ACCOUNT / ACCESS</span><h2>管理員帳號</h2></div></div><p>目前登入：<strong>{auth.currentUser?.email || '未提供電子郵件'}</strong></p><div className="account-uid"><span>Firebase UID</span><code>{auth.currentUser?.uid}</code><button type="button" className="outline-button" onClick={async () => { try { await navigator.clipboard.writeText(auth.currentUser.uid); setMessage('UID 已複製。'); } catch { setMessage('無法自動複製，請選取上方 UID。'); } }}>複製 UID</button></div><p className="panel-note">管理權限以這個 UID 對應 Firestore 的 <code>admins/UID</code> 文件，不由電子郵件地址或登入方式決定。</p>{googleLinked ? <p className="account-linked">✓ Google 帳號已連結</p> : <button type="button" className="outline-button account-link-google" disabled={busy} onClick={connectGoogle}>連結 Google 帳號，沿用目前管理權限</button>}</section>
    <section className="admin-panel review-panel"><div className="panel-heading"><div><span className="eyebrow">00 / REVIEW</span><h2>待審核投稿</h2></div><span>{posts.filter((item) => item.status === 'pending').length} 篇</span></div>{posts.filter((item) => item.status === 'pending').length ? posts.filter((item) => item.status === 'pending').map((post) => <div className="review-row" key={post.id}><div><strong>{post.title}</strong><small>{post.author} · {categories.find((cat) => cat.slug === post.category)?.label}</small></div><div><Link className="outline-button" to={`/article/${post.id}`}>檢視</Link><button className="btn-primary-custom" onClick={() => review(post, 'approve')}>核准</button><button className="outline-button" onClick={() => review(post, 'reject')}>退回</button></div></div>) : <p className="panel-note">目前沒有待審稿。</p>}</section><div className="admin-columns"><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">01 / CONTENT</span><h2>文章管理</h2></div><span>{posts.length} 篇</span></div><div className="admin-post-list">{posts.map((post) => <div className="admin-post-row" key={post.id}><div><span>{categories.find((cat) => cat.slug === post.category)?.label} · {new Date(post.updatedAt).toLocaleDateString('zh-TW')} {['draft', 'pending', 'rejected'].includes(post.status) && <b className="draft-label">{{ draft: '草稿', pending: '待審', rejected: '退回' }[post.status]}</b>}</span><Link to={`/article/${post.id}`}>{post.title}</Link></div><div className="admin-row-actions"><Link to={`/editor/${post.id}`} title="編輯文章" aria-label={`編輯${post.title}`}><Edit3 size={17} /></Link><button title="刪除文章" aria-label={`刪除${post.title}`} onClick={() => removePost(post)}><Trash2 size={17} /></button></div></div>)}</div></section><section className="admin-panel tags-panel"><div className="panel-heading"><div><span className="eyebrow">02 / TAXONOMY</span><h2>標籤管理</h2></div></div><form onSubmit={addTag} className="tag-form"><input className="form-control custom-input" placeholder="輸入新標籤名稱" value={newTag} maxLength={24} onChange={(event) => setNewTag(event.target.value)} required /><button className="btn-primary-custom" disabled={busy} type="submit"><Plus size={17} /> 新增</button></form><div className="tag-list">{tags.map((tag) => <span key={tag} className="tag-item"># {tag}<button type="button" title={`移除${tag}`} aria-label={`移除${tag}`} onClick={() => removeTag(tag)}><X size={15} /></button></span>)}</div><p className="panel-note">移除標籤後，舊文章會保留當時的標籤文字；新文章不可再選用。</p></section></div>
    <section className="admin-panel authors-panel"><div className="panel-heading"><div><span className="eyebrow">03 / BYLINE</span><h2>署名人員</h2></div></div><form className="tag-form" onSubmit={changeAuthor}><input className="form-control custom-input" aria-label="新增署名人員" placeholder="輸入人員名稱" maxLength={50} value={newAuthor} onChange={(event) => setNewAuthor(event.target.value)} required /><button className="btn-primary-custom" disabled={busy} type="submit"><Plus size={17} /> 新增</button></form><div className="tag-list">{authors.map((name) => <span key={name} className="tag-item">{name}<button type="button" onClick={() => removeAuthor(name)} aria-label={`移除${name}`}><X size={15} /></button></span>)}</div><p className="panel-note">移除人員後，舊文章的署名仍保留。</p></section>
    <SiteSettingsPanel site={site} />
    <RoutineSettingsPanel site={site} />
    <BackupPanel onRestored={() => dispatch(loadContent())} />
    {message && <div className="toast-line" role="status">{message}<button onClick={() => setMessage('')} aria-label="關閉通知"><X size={16} /></button></div>}
  </div>;
}
