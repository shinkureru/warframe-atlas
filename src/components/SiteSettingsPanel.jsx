import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { archiveCall, uploadImage } from '../utils/firebase.js';
import { loadContent } from '../state/store.js';
import MediaImage from './MediaImage.jsx';

// 管理員以表單修改網站文字、Banner、分類和內容篩選，欄位存入 settings/site。
export default function SiteSettingsPanel({ site }) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(site);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setDraft(site); }, [site]);
  const change = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const categories = draft.categories || [];
  const filters = draft.filters || [];
  const updateCategory = (slug, field, value) => change('categories', categories.map((cat) => cat.slug === slug ? { ...cat, [field]: value } : cat));
  const updateFilter = (id, patch) => change('filters', filters.map((filter) => filter.id === id ? { ...filter, ...patch } : filter));
  async function uploadBanner(file) {
    if (!file) return; setBusy(true); setMessage('');
    try { const result = await uploadImage(file, 'site'); change('heroImage', result.url); setMessage('圖片已上傳，請再按「儲存網站設定」才會對讀者顯示。'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (filters.some((filter) => !filter.label.trim() || !filter.options?.length || filter.options.some((option) => !option.trim()))) throw new Error('每個篩選欄位和選項都不能空白。');
      await archiveCall('saveSite', { value: {
        brand: draft.brand, brandCaption: draft.brandCaption, footerText: draft.footerText,
        heroEyebrow: draft.heroEyebrow, heroTitle: draft.heroTitle, heroAccent: draft.heroAccent,
        heroDescription: draft.heroDescription, heroButton: draft.heroButton, heroTarget: draft.heroTarget,
        heroImage: draft.heroImage || '', heroImageAlt: draft.heroImageAlt || '',
        categories: draft.categories, filters: draft.filters,
      } });
      await dispatch(loadContent()).unwrap(); setMessage('網站設定已儲存，讀者重新載入後會看到新內容。');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <form className="admin-panel site-settings-panel" onSubmit={save}>
    <div className="panel-heading"><div><span className="eyebrow">04 / SITE CONTENT</span><h2>網站外觀與選項</h2></div></div>
    <p className="panel-note">內容可在這裡修改。版型、登入流程和資料庫權限需用 VS Code 修改並重新部署。</p>
    <div className="settings-grid">{[['brand','網站名稱',30],['brandCaption','名稱下方英文',50],['footerText','頁尾聲明',100]].map(([key,label,max]) => <label key={key}>{label}<input className="form-control custom-input" maxLength={max} value={draft[key] || ''} onChange={(e) => change(key, e.target.value)} /></label>)}</div>
    <h3>首頁封面 Banner</h3>
    <div className="settings-grid">{[['heroEyebrow','上方小字',80],['heroTitle','主標題第一行',40],['heroAccent','主標題第二行',40],['heroButton','按鈕文字',30],['heroImageAlt','圖片替代文字',100]].map(([key,label,max]) => <label key={key}>{label}<input className="form-control custom-input" maxLength={max} value={draft[key] || ''} onChange={(e) => change(key, e.target.value)} /></label>)}<label>按鈕前往分類<select className="form-select custom-input" value={draft.heroTarget || '/category/frames'} onChange={(e) => change('heroTarget', e.target.value)}>{categories.map((cat) => <option key={cat.slug} value={`/category/${cat.slug}`}>{cat.label}</option>)}</select></label></div>
    <label className="settings-long">Banner 說明<textarea className="form-control custom-input" rows={2} maxLength={180} value={draft.heroDescription || ''} onChange={(e) => change('heroDescription', e.target.value)} /></label>
    <label className="upload-zone settings-upload"><ImagePlus size={18} /> {busy ? '上傳中…' : '選擇 Banner 圖片（會壓縮至小圖）'}<input type="file" accept="image/*" disabled={busy} onChange={(e) => { uploadBanner(e.target.files?.[0]); e.target.value = ''; }} /></label>
    {draft.heroImage && <div className="settings-banner-preview"><MediaImage src={draft.heroImage} alt="Banner 預覽" /><button type="button" className="outline-button" onClick={() => change('heroImage', '')}>移除 Banner 圖片</button></div>}
    <h3>六個分類</h3><p className="panel-note">可改顯示名稱、說明與卡片底色；分類識別碼固定，既有文章不會遺失。</p>
    <div className="settings-categories">{categories.map((cat) => <div key={cat.slug}><strong>{cat.slug}</strong>{[['label','顯示名稱',20],['eyebrow','英文名稱',30],['description','說明',100]].map(([field,label,max]) => <input key={field} className="form-control custom-input" aria-label={`${cat.slug} ${label}`} maxLength={max} value={cat[field]} onChange={(e) => updateCategory(cat.slug, field, e.target.value)} />)}<label>底色 <input type="color" value={cat.color} onChange={(e) => updateCategory(cat.slug, 'color', e.target.value)} /></label></div>)}</div>
    <div className="editor-section-heading settings-filter-heading"><div><h3>自訂篩選欄位</h3><p className="panel-note">新增後，投稿編輯器與分類頁會出現相同的選項。</p></div><button type="button" className="outline-button" onClick={() => change('filters', [...filters, { id: `f_${crypto.randomUUID().slice(0, 12)}`, label: '新篩選', category: 'frames', options: ['選項一'] }])}><Plus size={16} /> 新增欄位</button></div>
    {filters.map((filter) => <div className="settings-filter" key={filter.id}><div className="settings-grid"><label>欄位名稱<input className="form-control custom-input" maxLength={24} value={filter.label} onChange={(e) => updateFilter(filter.id, { label: e.target.value })} /></label><label>適用分類<select className="form-select custom-input" value={filter.category} onChange={(e) => updateFilter(filter.id, { category: e.target.value })}><option value="all">全部分類</option>{categories.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.label}</option>)}</select></label></div><div className="settings-options">{filter.options.map((option, i) => <label key={i}>選項 {i + 1}<input className="form-control custom-input" maxLength={30} value={option} onChange={(e) => updateFilter(filter.id, { options: filter.options.map((v, n) => n === i ? e.target.value : v) })} /><button type="button" aria-label={`移除選項${i + 1}`} onClick={() => updateFilter(filter.id, { options: filter.options.filter((_, n) => n !== i) })}><Trash2 size={15} /></button></label>)}</div><div className="settings-filter-actions"><button type="button" className="outline-button" onClick={() => updateFilter(filter.id, { options: [...filter.options, ''] })}><Plus size={15} /> 新增選項</button><button type="button" className="subtle-delete" onClick={() => change('filters', filters.filter((item) => item.id !== filter.id))}><Trash2 size={15} /> 移除欄位</button></div></div>)}
    {message && <p className="backup-message" role="status">{message}</p>}
    <button type="submit" className="btn-primary-custom" disabled={busy}><Save size={17} /> 儲存網站設定</button>
  </form>;
}
