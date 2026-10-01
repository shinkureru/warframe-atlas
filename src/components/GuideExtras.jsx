import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Download, Plus, Trash2, Upload } from 'lucide-react';
import { archiveCall } from '../utils/firebase.js';
import MediaImage from './MediaImage.jsx';
import { RichText } from './RichText.jsx';

// 單篇文章的版本資訊，提醒讀者遊戲更新後需要重新核對內容。
export function VersionInfo({ post }) {
  const days = post.verifiedAt ? Math.floor((Date.now() - new Date(`${post.verifiedAt}T00:00:00`).getTime()) / 86400000) : null;
  return <div className="version-info"><span>適用版本：{post.gameVersion || '尚未標註'}</span><span>最後校對：{post.verifiedAt || '尚未校對'}</span>{days !== null && days > 90 && <strong>建議重新確認</strong>}<a href="https://www.warframe.com/zh-hant/patch-notes" target="_blank" rel="noopener noreferrer">查看官方更新紀錄 <ArrowUpRight size={14} /></a></div>;
}

// 取得步驟的勾選進度儲存在目前瀏覽器；不同讀者互不影響。
export function AcquisitionChecklist({ post, interactive = true }) {
  const steps = post.acquisition || [];
  const key = `origin-checklist-${post.id}`;
  const [done, setDone] = useState([]);
  useEffect(() => {
    if (!interactive || !post.id) return;
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); setDone(Array.isArray(value) ? value : []); }
    catch { setDone([]); }
  }, [key, interactive, post.id]);
  if (!steps.length) return null;
  const toggle = (index) => {
    const next = done.includes(index) ? done.filter((item) => item !== index) : [...done, index];
    setDone(next); localStorage.setItem(key, JSON.stringify(next));
  };
  return <section id="acquisition" className="guide-feature"><div className="feature-heading"><span className="eyebrow">ACQUISITION / 取得流程</span><h2>取得清單</h2><span>{done.filter((index) => index < steps.length).length} / {steps.length} 完成</span></div><div className="acquisition-list">{steps.map((step, index) => <div key={index} className={`acquisition-step ${done.includes(index) ? 'finished' : ''}`}><label><input type="checkbox" checked={interactive && done.includes(index)} disabled={!interactive} onChange={() => toggle(index)} /><span className="step-check"><Check size={15} /></span><span className="step-copy"><strong>{step.title}</strong>{step.detail && <small>{step.detail}</small>}{step.sourceUrl && <a href={step.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>參考來源 <ArrowUpRight size={14} /></a>}</span></label>{step.quantity && <span className="step-quantity">{step.quantity}</span>}</div>)}</div></section>;
}

// 結構化配裝卡保留原始槽位索引，第一格光環、第二格特殊功能槽分別著色。
export function BuildsSection({ builds = [] }) {
  if (!builds.length) return null;
  return <section id="builds" className="guide-feature"><div className="feature-heading"><span className="eyebrow">LOADOUTS / 配裝</span><h2>MOD 配置</h2><span>{builds.length} 套</span></div>
    <div className="builds-stack">{builds.map((build, index) => <div className="build-card" key={index}>
      <div className="build-card-top"><span>BUILD / {String(index + 1).padStart(2, '0')}</span><h3>{build.name}</h3>{build.purpose && <p>{build.purpose}</p>}</div>
      <div className="mod-grid">{(build.mods || []).map((mod, slot) => ({ mod, slot })).filter(({ mod }) => Boolean(mod?.trim())).map(({ mod, slot }) =>
        <div key={slot} className={`mod-slot ${slot === 0 ? 'mod-slot-aura' : slot === 1 ? 'mod-slot-exilus' : ''}`}>
          <div className="mod-slot-copy"><small>{slot === 0 ? 'MOD 01 · 光環' : slot === 1 ? 'MOD 02 · 特殊功能槽' : `MOD ${String(slot + 1).padStart(2, '0')}`}</small><strong>{mod}</strong></div>
          <span className="mod-slot-icon">{build.modImages?.[slot] && <MediaImage className="mod-slot-image" src={build.modImages[slot]} alt={`${mod} 圖案`} />}</span>
        </div>)}</div>
      <div className="build-facts">{build.arcanes?.filter(Boolean).length > 0 && <div><span>賦能 / ARCANE</span><strong>{build.arcanes.filter(Boolean).join('、')}</strong></div>}{build.helminth && <div><span>技能移植 / HELMINTH</span><strong>{build.helminth}</strong></div>}{build.forma && <div><span>Forma</span><strong>{build.forma}</strong></div>}</div>
      {build.notes && <p className="build-notes">{build.notes}</p>}
    </div>)}</div>
  </section>;
}

// 文字段落在公開頁與發佈前預覽共用 Markdown 元件，舊文章的純文字照常顯示。
export function ArticleSections({ sections = [] }) {
  return sections.length ? sections.map((section, index) => <section key={index} id={`section-${index}`} className="article-section"><span className="section-number">/ {String(index + 1).padStart(2, '0')}</span><h2>{section.title}</h2>{section.blocks.map((block, i) => block.type === 'image' ? <figure key={i}><MediaImage src={block.url} alt={block.caption || section.title} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure> : <RichText key={i} text={block.text} />)}</section>) : <p>這篇文章尚未新增詳細內容。</p>;
}

// 編輯器的版本、取得步驟與 MOD 配置表單；變更交由主編輯器的表單狀態管理。
export function EditorGuideFields({ form, setForm, modIcons = [] }) {
  const updateList = (name, callback) => setForm((previous) => { const list = structuredClone(previous[name] || []); callback(list); return { ...previous, [name]: list }; });
  return <>
    <section className="editor-panel"><span className="eyebrow">03 / 版本紀錄</span><h2>版本與校對日期</h2><div className="compact-fields"><label>適用遊戲版本<input className="form-control custom-input" maxLength={40} value={form.gameVersion || ''} onChange={(event) => setForm((previous) => ({ ...previous, gameVersion: event.target.value }))} placeholder="例如：Update 44" /></label><label>最後校對日期<input type="date" className="form-control custom-input" value={form.verifiedAt || ''} onChange={(event) => setForm((previous) => ({ ...previous, verifiedAt: event.target.value }))} /></label></div><p className="field-hint">實際核對取得方式或配置後，再更新這個日期。</p></section>
    <section className="editor-panel"><div className="editor-section-heading"><div><span className="eyebrow">04 / ACQUISITION</span><h2>取得流程清單</h2></div><button type="button" className="outline-button" onClick={() => updateList('acquisition', (items) => items.push({ title: '', detail: '', quantity: '', sourceUrl: '' }))}><Plus size={16} /> 新增步驟</button></div><p className="field-hint">可寫前置任務、節點與材料；讀者可在自己的裝置勾選進度。</p>{(form.acquisition || []).map((step, i) => <div className="guide-edit-card" key={i}><div className="section-editor-top"><span>步驟 {i + 1}</span><button type="button" className="subtle-delete" onClick={() => updateList('acquisition', (items) => items.splice(i, 1))}><Trash2 size={15} /> 移除</button></div><input className="form-control custom-input" aria-label={`步驟${i + 1}名稱`} placeholder="例如：完成前置任務" value={step.title} onChange={(event) => updateList('acquisition', (items) => { items[i].title = event.target.value; })} maxLength={120} /><textarea className="form-control custom-input" aria-label={`步驟${i + 1}說明`} placeholder="步驟說明或推薦節點" value={step.detail} onChange={(event) => updateList('acquisition', (items) => { items[i].detail = event.target.value; })} maxLength={300} rows={2} /><div className="compact-fields"><input className="form-control custom-input" aria-label={`步驟${i + 1}數量`} placeholder="數量，例如：10 個" value={step.quantity} onChange={(event) => updateList('acquisition', (items) => { items[i].quantity = event.target.value; })} maxLength={50} /><input type="url" className="form-control custom-input" aria-label={`步驟${i + 1}來源網址`} placeholder="參考來源網址（選填）" value={step.sourceUrl} onChange={(event) => updateList('acquisition', (items) => { items[i].sourceUrl = event.target.value; })} /></div></div>)}</section>
    <section className="editor-panel"><div className="editor-section-heading"><div><span className="eyebrow">05 / LOADOUTS</span><h2>MOD 配置卡</h2></div><button type="button" className="outline-button" onClick={() => updateList('builds', (items) => items.push({ name: '', purpose: '', mods: Array(10).fill(''), modImages: Array(10).fill(''), arcanes: ['', ''], helminth: '', forma: '', notes: '' }))}><Plus size={16} /> 新增配置</button></div><p className="field-hint">可分別建立一般任務、鋼韌之道或農場配置；空白欄位不會顯示。</p>{(form.builds || []).map((build, i) => <div className="guide-edit-card" key={i}><div className="section-editor-top"><span>配置 {i + 1}</span><button type="button" className="subtle-delete" onClick={() => updateList('builds', (items) => items.splice(i, 1))}><Trash2 size={15} /> 移除</button></div><input className="form-control custom-input" aria-label={`配置${i + 1}名稱`} placeholder="配置名稱，例如：鋼韌之道生存" value={build.name} onChange={(event) => updateList('builds', (items) => { items[i].name = event.target.value; })} maxLength={80} /><input className="form-control custom-input" aria-label={`配置${i + 1}用途`} placeholder="用途或玩法定位" value={build.purpose} onChange={(event) => updateList('builds', (items) => { items[i].purpose = event.target.value; })} maxLength={100} /><div className="edit-mod-grid">{Array.from({ length: 10 }, (_, mi) => <div className={`edit-mod-slot ${mi === 0 ? 'edit-mod-aura' : mi === 1 ? 'edit-mod-exilus' : ''}`} key={mi}><label htmlFor={`build-${i}-mod-${mi}`}>{mi === 0 ? '光環 MOD' : mi === 1 ? '特殊功能槽 MOD' : `一般 MOD ${mi - 1}`}</label><input id={`build-${i}-mod-${mi}`} className="form-control custom-input" aria-label={`配置${i + 1} MOD ${mi + 1}`} placeholder={`MOD ${mi + 1} 名稱`} value={build.mods?.[mi] || ''} onChange={(event) => updateList('builds', (items) => { items[i].mods ||= []; items[i].mods[mi] = event.target.value; })} maxLength={70} /><div className="mod-icon-select">{build.modImages?.[mi] && <MediaImage src={build.modImages[mi]} alt="已選 MOD 圖案" />}<select className="form-select custom-input" aria-label={`配置${i + 1} MOD ${mi + 1} 圖案`} value={build.modImages?.[mi] || ''} onChange={(event) => updateList('builds', (items) => { items[i].modImages ||= Array(10).fill(''); items[i].modImages[mi] = event.target.value; })}><option value="">不使用圖案</option>{build.modImages?.[mi] && !modIcons.some((icon) => icon.url === build.modImages[mi]) && <option value={build.modImages[mi]}>原文章圖案（已從圖案庫移除）</option>}{modIcons.map((icon) => <option key={icon.url} value={icon.url}>{icon.name}</option>)}</select></div></div>)}</div><div className="compact-fields">{[0, 1].map((ai) => <input key={ai} className="form-control custom-input" aria-label={`配置${i + 1}賦能${ai + 1}`} placeholder={`賦能 ${ai + 1}`} value={build.arcanes?.[ai] || ''} onChange={(event) => updateList('builds', (items) => { items[i].arcanes ||= []; items[i].arcanes[ai] = event.target.value; })} maxLength={70} />)}</div><div className="compact-fields"><input className="form-control custom-input" aria-label={`配置${i + 1}技能移植`} placeholder="Helminth 技能移植" value={build.helminth || ''} onChange={(event) => updateList('builds', (items) => { items[i].helminth = event.target.value; })} maxLength={90} /><input className="form-control custom-input" aria-label={`配置${i + 1}Forma`} placeholder="Forma 數量／極性" value={build.forma || ''} onChange={(event) => updateList('builds', (items) => { items[i].forma = event.target.value; })} maxLength={40} /></div><textarea className="form-control custom-input" aria-label={`配置${i + 1}備註`} placeholder="配置原理、替換選項或注意事項" value={build.notes || ''} onChange={(event) => updateList('builds', (items) => { items[i].notes = event.target.value; })} rows={3} maxLength={2000} /></div>)}</section>
  </>;
}

// 管理員匯出 Firebase JSON 備份；圖片位於 Firestore media 集合，須另行備份。
export function BackupPanel({ onRestored }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function download() {
    setBusy(true); setMessage('');
    try {
      const archive = await archiveCall('export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `origin-spark-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMessage('文章及名單已下載。圖片保存在 Firestore 的 media 文件中，需另行備份。');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function restore(file) {
    if (!file || !window.confirm('匯入將取代目前文章和名單。請先下載現有備份，再確認繼續。')) return;
    setBusy(true); setMessage('');
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('備份不可超過 8 MB。');
      const data = JSON.parse(await file.text());
      const result = await archiveCall('import', { value: data });
      onRestored(); setMessage(`還原完成：${result.posts} 篇文章、${result.tags} 個標籤。`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <section className="admin-panel backup-panel"><div className="panel-heading"><div><span className="eyebrow">04 / BACKUP</span><h2>備份與還原</h2></div></div><p>下載 JSON 包含文章、標籤、署名與圖片連結。圖片放在 Firestore 的 media 集合，JSON 不含圖片本體；此匯入只適用同一專案，最多 100 篇。</p><div className="backup-actions"><button className="outline-button" type="button" disabled={busy} onClick={download}><Download size={17} /> 下載 JSON 備份</button><label className="outline-button"><Upload size={17} /> 匯入 JSON<input type="file" accept=".json,application/json" disabled={busy} onChange={(event) => { restore(event.target.files?.[0]); event.target.value = ''; }} /></label></div>{message && <p className="backup-message" role="status">{message}</p>}</section>;
}
