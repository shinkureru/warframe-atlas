import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Edit3, Eye, ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { api, loadContent } from '../state/store.js';
import { AcquisitionChecklist, ArticleSections, BuildsSection, EditorGuideFields, VersionInfo } from '../components/GuideExtras.jsx';
import Ratings from '../components/Ratings.jsx';
import MediaImage from '../components/MediaImage.jsx';
import { MarkdownEditor } from '../components/RichText.jsx';
import { auth, refreshVerification, uploadImage as uploadFirestoreImage } from '../utils/firebase.js';

// 依分類建立文章的預設章節，管理員可再新增、刪除或改名。
const characterSections = ['故事介紹', '取得方式', 'MOD 配置（含賦能）', '推薦武器', '關卡表現評論'];
const otherSections = ['取得方式', '補充筆記'];
const createSections = (category) => (category === 'frames' ? characterSections : otherSections).map((title) => ({ title, blocks: [{ type: 'text', text: '' }] }));

// 編輯器使用區塊式段落與圖片；上傳完成後圖片 URL 插入目前章節。
export default function EditorPage({ role, categories, tags, authors, filters = [], modIcons = [] }) {
  const { id } = useParams();
  const newPostId = useMemo(() => crypto.randomUUID(), []);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const chosenCategory = categories.some((cat) => cat.slug === initialCategory) ? initialCategory : 'frames';
  const [form, setForm] = useState({ id: id || newPostId, title: '', excerpt: '', category: chosenCategory, tags: [], author: authors[0] || '', attributes: {}, ratings: { mobility: 3, defense: 3, versatility: 3 }, coverUrl: '', sections: createSections(chosenCategory), builds: [], acquisition: [], gameVersion: '', verifiedAt: '' });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState('');
  const [verified, setVerified] = useState(Boolean(auth.currentUser?.emailVerified));
  const storageKey = `origin-autosave-${auth.currentUser?.uid || 'guest'}-${id || 'new'}`;
  useEffect(() => {
    let active = true;
    const local = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
    if (!id) {
      if (local?.form) { setForm(local.form); setAutosavedAt(local.savedAt || ''); }
      return;
    }
    api(`/api/posts/${encodeURIComponent(id)}`).then((post) => {
      if (!active) return;
      // 只有本機版本比伺服器更新時才接續上次未儲存的編輯內容。
      if (local?.form && Date.parse(local.savedAt) > Date.parse(post.updatedAt)) { setForm(local.form); setAutosavedAt(local.savedAt); }
      else setForm(post);
      setLoading(false);
    }).catch((err) => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [id, storageKey]);
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      try { const savedAt = new Date().toISOString(); localStorage.setItem(storageKey, JSON.stringify({ form, savedAt })); setAutosavedAt(savedAt); }
      catch { setError('瀏覽器儲存空間不足，請先儲存草稿到伺服器。'); }
    }, 1200);
    return () => clearTimeout(timer);
  }, [form, loading, storageKey]);
  useEffect(() => { if (!previewOpen) return; const close = (event) => { if (event.key === 'Escape') setPreviewOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [previewOpen]);

  // 深複製巢狀章節後更新，讓 React 能正確偵測段落及圖片變化。
  function updateSections(callback) { setForm((prev) => { const sections = structuredClone(prev.sections); callback(sections); return { ...prev, sections }; }); }
  function changeCategory(category) { setForm((prev) => ({ ...prev, category, sections: id ? prev.sections : createSections(category) })); }
  async function uploadImage(file, sectionIndex = null) {
    if (!file) return;
    setError(''); setUploading(true);
    try {
      const result = await uploadFirestoreImage(file, 'post', id || form.id || newPostId);
      if (sectionIndex === null) setForm((prev) => ({ ...prev, coverUrl: result.url }));
      else updateSections((sections) => sections[sectionIndex].blocks.push({ type: 'image', url: result.url, caption: '' }));
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }
  async function save(event, status = 'published') {
    event?.preventDefault();
    if (!form.title.trim()) { setError('請先填寫文章標題。'); return; }
    if (status !== 'draft' && !form.tags.length) { setError('發布前請至少勾選一個標籤。'); return; }
    if (status !== 'draft' && !authors.includes(form.author)) { setError('發布前請選擇署名人員。'); return; }
    setSaving(true); setError('');
    try {
      const saved = await api(id ? `/api/posts/${encodeURIComponent(id)}` : '/api/posts', { method: id ? 'PUT' : 'POST', body: JSON.stringify({ ...form, status }) });
      try { localStorage.removeItem(storageKey); } catch { /* 伺服器已儲存成功，即使瀏覽器禁止本機儲存也能繼續。 */ }
      dispatch(loadContent()); navigate(role === 'admin' ? '/admin' : `/submission/${saved.id}`);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  if (loading) return <div className="app-loader"><span className="spinner-border spinner-border-sm" /> 正在載入編輯器…</div>;
  return <div className="editor-page"><div className="breadcrumbs"><Link to="/">首頁</Link><span>/</span><span>{id ? '編輯文章' : '新增文章'}</span></div><div className="editor-heading"><div><span className="eyebrow">EDITOR / {id ? 'UPDATE RECORD' : 'NEW RECORD'}</span><h1>{id ? '編輯文章' : '撰寫新文章'}<span className="heading-dot">.</span></h1></div><span>投稿後需經管理員核准</span></div>
    <form onSubmit={save} className="editor-grid"><div className="editor-main"><section className="editor-panel"><span className="eyebrow">01 / 基本資訊</span><label className="field-label" htmlFor="article-title">文章標題 *</label><input id="article-title" className="form-control custom-input large-input" maxLength={120} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例如：Gauss Prime｜高速戰甲入門" /><label className="field-label" htmlFor="article-excerpt">文章摘要</label><textarea id="article-excerpt" className="form-control custom-input" rows={3} maxLength={300} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="簡單介紹這篇攻略會談到什麼…" /><label className="field-label" htmlFor="article-category">文章分類 *</label><select id="article-category" className="form-select custom-input" value={form.category} onChange={(event) => changeCategory(event.target.value)}>{categories.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.label}</option>)}</select><label className="field-label" htmlFor="article-author">文章署名 *</label><select id="article-author" className="form-select custom-input" value={form.author || ''} onChange={(event) => setForm({ ...form, author: event.target.value })} required><option value="">選擇署名人員</option>{authors.map((name) => <option key={name} value={name}>{name}</option>)}</select><div className="field-label">文章封面</div><label className="upload-zone"><ImagePlus size={21} /><span>{uploading ? '圖片上傳中…' : form.coverUrl ? '更換封面圖片' : '點此上傳封面圖片'}</span><small>JPG、PNG、WebP、GIF · 最大 8 MB</small><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => { uploadImage(event.target.files[0]); event.target.value = ''; }} /></label>{form.coverUrl && <div className="cover-preview"><MediaImage src={form.coverUrl} alt="封面預覽" /><button type="button" onClick={() => setForm({ ...form, coverUrl: '' })}>移除封面</button></div>}</section>
      <section className="editor-panel"><div className="editor-section-heading"><div><span className="eyebrow">02 / 正文內容</span><h2>文章章節</h2></div><button type="button" className="outline-button" onClick={() => updateSections((sections) => sections.push({ title: '', blocks: [{ type: 'text', text: '' }] }))}><Plus size={16} /> 新增章節</button></div>{form.sections.map((section, si) => <div className="section-editor" key={si}><div className="section-editor-top"><span>章節 {String(si + 1).padStart(2, '0')}</span><button type="button" className="subtle-delete" onClick={() => updateSections((sections) => sections.splice(si, 1))} aria-label={`刪除章節${si + 1}`}><Trash2 size={16} /> 刪除章節</button></div><input className="form-control custom-input section-title-input" aria-label={`章節${si + 1}標題`} value={section.title} onChange={(event) => updateSections((sections) => { sections[si].title = event.target.value; })} placeholder="章節標題" maxLength={100} />{section.blocks.map((block, bi) => <div className="block-editor" key={bi}>{block.type === 'image' ? <><MediaImage src={block.url} alt="文章插圖預覽" /><input className="form-control custom-input" aria-label="圖片說明" placeholder="圖片說明（選填）" value={block.caption} maxLength={180} onChange={(event) => updateSections((sections) => { sections[si].blocks[bi].caption = event.target.value; })} /></> : <MarkdownEditor label={`${section.title || '章節'}段落${bi + 1}`} value={block.text} onChange={(text) => updateSections((sections) => { sections[si].blocks[bi].text = text; })} />}<button type="button" className="remove-block" onClick={() => updateSections((sections) => sections[si].blocks.splice(bi, 1))} aria-label="移除這個內容區塊"><X size={16} /></button></div>)}<div className="block-actions"><button type="button" onClick={() => updateSections((sections) => sections[si].blocks.push({ type: 'text', text: '' }))}><Plus size={16} /> 新增段落</button><label><ImagePlus size={16} /> 插入圖片<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => { uploadImage(event.target.files[0], si); event.target.value = ''; }} /></label></div></div>)}</section><EditorGuideFields form={form} setForm={setForm} modIcons={modIcons} />{filters.some((filter) => filter.category === 'all' || filter.category === form.category) && <section className="editor-panel"><span className="eyebrow">CUSTOM FIELDS</span><h2>分類篩選欄位</h2><p className="field-hint">填寫後讀者可在分類頁的下拉選單找到這篇文章。</p><div className="compact-fields">{filters.filter((filter) => filter.category === 'all' || filter.category === form.category).map((filter) => <label key={filter.id}>{filter.label}<select className="form-select custom-input" value={form.attributes?.[filter.id] || ''} onChange={(event) => setForm((previous) => ({ ...previous, attributes: { ...previous.attributes, [filter.id]: event.target.value } }))}><option value="">不指定</option>{filter.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}</div></section>}{form.category === 'frames' && <section className="editor-panel"><span className="eyebrow">WARFRAME EVALUATION</span><h2>角色評價（最高五顆星）</h2><Ratings value={form.ratings || {}} onChange={(key, score) => setForm((prev) => ({ ...prev, ratings: { ...prev.ratings, [key]: score } }))} /></section>}</div>
      <aside className="editor-aside"><section className="editor-panel"><span className="eyebrow">06 / 文章標籤</span><h2>選擇標籤</h2><p>讓讀者更容易找到相關攻略。</p><div className="editor-tags">{tags.map((tag) => <label key={tag} className={form.tags.includes(tag) ? 'selected' : ''}><input type="checkbox" checked={form.tags.includes(tag)} onChange={() => setForm((prev) => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag] }))} />{form.tags.includes(tag) && <Check size={14} />} # {tag}</label>)}</div>{role === 'admin' && <Link to="/admin" className="aside-link">在管理員頁面管理標籤 <ArrowUpRight size={16} /></Link>}</section><div className="publish-panel"><span className="eyebrow">READY TO PUBLISH?</span>{role !== 'admin' && !verified && <div className="verify-note">投稿前請先點開註冊信中的驗證連結。<button type="button" onClick={async () => { try { setVerified(await refreshVerification()); setError(''); } catch (err) { setError(err.message); } }}>我已驗證，重新檢查</button></div>}<p>送出後會進入管理員待審清單；核准前不會公開。</p>{autosavedAt && <p className="autosave-status"><Check size={14} /> 本機自動儲存於 {new Date(autosavedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</p>}{error && <div className="form-error" role="alert">{error}</div>}<button type="button" className="outline-button w-100" onClick={() => setPreviewOpen(true)}><Eye size={17} /> 預覽文章</button>{role === 'admin' && <button type="button" className="outline-button w-100" onClick={() => save(null, 'draft')} disabled={saving || uploading}><Save size={17} /> 儲存草稿</button>}<button type="submit" className="btn-primary-custom w-100" disabled={saving || uploading}>{saving ? '送出中…' : '送出審核'} <ArrowRight size={17} /></button><button type="button" className="cancel-button" onClick={() => navigate(id ? `/article/${id}` : '/')}>暫時離開</button></div></aside></form>
    {previewOpen && <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="文章預覽"><div className="preview-window"><div className="preview-toolbar"><strong>文章預覽 · 目前尚未發佈的內容</strong><button type="button" onClick={() => setPreviewOpen(false)} aria-label="關閉預覽"><X size={22} /></button></div><div className="preview-content"><span className="eyebrow">{categories.find((cat) => cat.slug === form.category)?.label} / PREVIEW</span><h1>{form.title || '未命名文章'}</h1><p className="preview-excerpt">{form.excerpt}</p>{form.coverUrl && <MediaImage className="preview-cover" src={form.coverUrl} alt="文章封面預覽" />}<VersionInfo post={form} />{form.category === 'frames' && <Ratings value={form.ratings || {}} />}<AcquisitionChecklist post={form} interactive={false} /><BuildsSection builds={form.builds} /><ArticleSections sections={form.sections} /></div></div></div>}
  </div>;
}
