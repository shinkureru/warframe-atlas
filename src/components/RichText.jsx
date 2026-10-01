import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';

// 僅允許固定的大小、字重與色票；投稿者不能注入任意 CSS 或 HTML。
const styles = {
  size: { small: 'md-size-small', normal: 'md-size-normal', large: 'md-size-large', huge: 'md-size-huge' },
  weight: { light: 'md-weight-light', medium: 'md-weight-medium', bold: 'md-weight-bold' },
  color: { ink: 'md-color-ink', blue: 'md-color-blue', red: 'md-color-red', green: 'md-color-green', gold: 'md-color-gold' },
};

// 將 :color[文字]{value=blue} 這類受控 Markdown 指令轉成安全的 CSS class。
function remarkTextStyle() {
  return (tree) => {
    function walk(node) {
      if (node.type === 'textDirective' && Object.hasOwn(styles, node.name)) {
        const value = node.attributes?.value;
        if (Object.hasOwn(styles[node.name], value)) {
          node.data ||= {};
          node.data.hName = 'span';
          node.data.hProperties = { className: styles[node.name][value] };
        }
      }
      node.children?.forEach(walk);
    }
    walk(tree);
  };
}
const plugins = [remarkGfm, remarkDirective, remarkTextStyle];

// 預覽與公開文章共用相同轉換規則；不解析原始 HTML，圖片請用文章插圖上傳。
export function RichText({ text = '' }) {
  return <div className="markdown-content"><ReactMarkdown remarkPlugins={plugins} disallowedElements={['img']}>{text}</ReactMarkdown></div>;
}

// Markdown 工具列直接包住選取文字，並保留 textarea 的游標位置。
export function MarkdownEditor({ value = '', onChange, label }) {
  const ref = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  function insert(before, after = '', placeholder = '文字', mode = 'inline') {
    const field = ref.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end } = field;
    const selected = value.slice(start, end) || placeholder;
    const prefix = mode === 'line' && start > 0 && value[start - 1] !== '\n' ? '\n' : '';
    const content = `${prefix}${before}${selected}${after}`;
    onChange(value.slice(0, start) + content + value.slice(end));
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + prefix.length + before.length, start + prefix.length + before.length + selected.length);
    });
  }
  function insertTemplate(content) {
    const field = ref.current;
    if (!field) return;
    const start = field.selectionStart;
    const prefix = start > 0 && value[start - 1] !== '\n' ? '\n' : '';
    onChange(value.slice(0, start) + prefix + content + value.slice(field.selectionEnd));
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + prefix.length, start + prefix.length); });
  }
  return <div className="markdown-editor">
    <div className="markdown-toolbar" aria-label={`${label} 排版工具列`}>
      <button type="button" title="小標題" onClick={() => insert('## ', '', '小標題', 'line')}>H2</button>
      <button type="button" title="粗體" onClick={() => insert('**', '**')}><strong>B</strong></button>
      <button type="button" title="斜體" onClick={() => insert('*', '*')}><em>I</em></button>
      <button type="button" title="刪除線" onClick={() => insert('~~', '~~')}><s>S</s></button>
      <button type="button" title="項目符號" onClick={() => insert('- ', '', '清單項目', 'line')}>• 清單</button>
      <button type="button" title="引用" onClick={() => insert('> ', '', '引用內容', 'line')}>❝ 引用</button>
      <button type="button" title="連結" onClick={() => insert('[', '](https://example.com)', '連結文字')}>連結</button>
      <button type="button" title="行內程式碼" onClick={() => insert('`', '`')}>{'</>'}</button>
      <button type="button" title="表格" onClick={() => insertTemplate('\n| 欄位 | 內容 |\n| --- | --- |\n| 名稱 | 說明 |\n')}>表格</button>
      <select aria-label="字體大小" defaultValue="" onChange={(event) => { if (event.target.value) insert(`:size[`, `]{value=${event.target.value}}`); event.target.value = ''; }}><option value="">字體大小</option><option value="small">小</option><option value="normal">標準</option><option value="large">大</option><option value="huge">特大</option></select>
      <select aria-label="字體粗細" defaultValue="" onChange={(event) => { if (event.target.value) insert(':weight[', `]{value=${event.target.value}}`); event.target.value = ''; }}><option value="">字體粗細</option><option value="light">細</option><option value="medium">中</option><option value="bold">粗</option></select>
      <select aria-label="文字顏色" defaultValue="" onChange={(event) => { if (event.target.value) insert(':color[', `]{value=${event.target.value}}`); event.target.value = ''; }}><option value="">文字顏色</option><option value="ink">深墨</option><option value="blue">藍色</option><option value="red">紅色</option><option value="green">綠色</option><option value="gold">金色</option></select>
      <button type="button" className="markdown-preview-toggle" aria-pressed={showPreview} onClick={() => setShowPreview((current) => !current)}>{showPreview ? '收起預覽' : '即時預覽'}</button>
    </div>
    <textarea ref={ref} className="form-control custom-input" aria-label={label} rows={7} value={value} onChange={(event) => onChange(event.target.value)} placeholder="寫下攻略內容；選取文字後可用工具列排版，也可直接輸入 Markdown…" />
    {showPreview && <div className="markdown-live-preview"><small>預覽</small><RichText text={value || '這裡會顯示排版後的內容。'} /></div>}
  </div>;
}
