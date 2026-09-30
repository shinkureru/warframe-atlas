import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import PostCard from '../components/PostCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

// 全站搜尋同時比對標題、標籤、正文、取得步驟和 MOD 配置內容。
export default function SearchPage({ posts, categories }) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);
  const [category, setCategory] = useState('');
  useEffect(() => { setInput(q); }, [q]);
  const results = useMemo(() => posts.filter((post) => ['published', 'demo'].includes(post.status) && (!category || post.category === category) && (!input.trim() || [post.title, post.excerpt, ...post.tags, ...(post.sections || []).flatMap((section) => [section.title, ...section.blocks.map((block) => block.text || block.caption || '')]), ...(post.acquisition || []).flatMap((step) => [step.title, step.detail]), ...(post.builds || []).flatMap((build) => [build.name, build.purpose, ...(build.mods || []), ...(build.arcanes || []), build.helminth])].join(' ').toLocaleLowerCase().includes(input.trim().toLocaleLowerCase()))), [posts, input, category]);
  return <div className="search-page"><div className="page-lead"><div><span className="eyebrow">SEARCH / THE ARCHIVE</span><h1>搜尋攻略<span className="heading-dot">.</span></h1><p>搜尋戰甲、武器、MOD、取得流程或內文。</p></div></div><form className="global-search-form" onSubmit={(event) => { event.preventDefault(); setParams(input.trim() ? { q: input.trim() } : {}, { replace: true }); }}><Search size={23} /><input aria-label="搜尋全站文章" placeholder="例如：Gauss Prime、賦能、鋼韌之道" value={input} onChange={(event) => { setInput(event.target.value); setParams(event.target.value ? { q: event.target.value } : {}, { replace: true }); }} /><button type="submit">搜尋 <ArrowRight size={17} /></button></form><div className="search-filters"><button type="button" className={!category ? 'active' : ''} onClick={() => setCategory('')}>全部</button>{categories.map((cat) => <button type="button" key={cat.slug} className={category === cat.slug ? 'active' : ''} onClick={() => setCategory(cat.slug)}>{cat.label}</button>)}</div><div className="results-bar">{q ? <>「{q}」找到 <strong>{results.length}</strong> 篇文章</> : <>共 <strong>{results.length}</strong> 篇文章</>}</div>{results.length ? <div className="posts-grid catalog-grid">{results.map((post, i) => <PostCard key={post.id} post={post} categories={categories} index={i + 1} />)}</div> : <EmptyState query />}</div>;
}
