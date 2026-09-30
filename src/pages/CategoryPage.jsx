import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import CustomSelect from '../components/CustomSelect.jsx';
import PostCard from '../components/PostCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

// 分類頁提供關鍵字、標籤及排序篩選，畫面會同步顯示結果數量。
export default function CategoryPage({ posts, categories, tags, filters = [], role }) {
  const { slug } = useParams();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('newest');
  const [activeFilters, setActiveFilters] = useState({});
  const relevantFilters = filters.filter((item) => item.category === 'all' || item.category === slug);
  useEffect(() => { setQ(''); setTag(''); setSort('newest'); setActiveFilters({}); }, [slug]);
  const cat = categories.find((item) => item.slug === slug);
  const categoryPosts = posts.filter((post) => post.category === slug && ['published', 'demo'].includes(post.status));
  const availableTags = tags.filter((item) => categoryPosts.some((post) => post.tags.includes(item)));
  const results = useMemo(() => categoryPosts.filter((post) => (!tag || post.tags.includes(tag)) && relevantFilters.every((filter) => !activeFilters[filter.id] || post.attributes?.[filter.id] === activeFilters[filter.id]) && (!q.trim() || `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase()))).sort((a, b) => sort === 'oldest' ? a.updatedAt.localeCompare(b.updatedAt) : sort === 'title' ? a.title.localeCompare(b.title, 'zh-TW') : b.updatedAt.localeCompare(a.updatedAt)), [posts, slug, tag, q, sort, filters, activeFilters]);
  if (!cat) return <Navigate to="/" replace />;
  return <><div className="page-lead"><div><span className="eyebrow">THE ARCHIVE / {cat.eyebrow}</span><h1>{cat.label}<span className="heading-dot">.</span></h1><p>{cat.description}</p></div><span className="page-lead-index">{cat.eyebrow} / {String(categoryPosts.length).padStart(2, '0')}</span></div><div className="catalog-toolbar"><div className="search-field"><Search size={18} /><input type="search" value={q} onChange={(event) => setQ(event.target.value)} placeholder={`搜尋${cat.label}文章`} aria-label={`搜尋${cat.label}文章`} /></div><div className="toolbar-selects"><CustomSelect label="依標籤篩選" icon={SlidersHorizontal} value={tag} onChange={setTag} options={[{ value: '', label: '所有標籤' }, ...availableTags.map((item) => ({ value: item, label: item }))]} />{relevantFilters.map((filter) => <CustomSelect key={filter.id} label={filter.label} value={activeFilters[filter.id] || ''} onChange={(value) => setActiveFilters((previous) => ({ ...previous, [filter.id]: value }))} options={[{ value: '', label: `所有${filter.label}` }, ...filter.options.filter(Boolean).map((option) => ({ value: option, label: option }))]} />)}<CustomSelect label="排序方式" value={sort} onChange={setSort} options={[{ value: 'newest', label: '最近更新' }, { value: 'oldest', label: '最早更新' }, { value: 'title', label: '標題排序' }]} /></div></div><div className="results-bar"><span>顯示 <strong>{results.length}</strong> 篇文章</span><Link to={`/editor/new?category=${slug}`} className="text-link"><Plus size={17} /> 投稿{cat.label}文章</Link></div>{results.length ? <div className="posts-grid catalog-grid">{results.map((post, i) => <PostCard key={post.id} post={post} categories={categories} index={i + 1} />)}</div> : <EmptyState query={Boolean(q || tag)} />}</>;
}
