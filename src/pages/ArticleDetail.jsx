import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Edit3 } from 'lucide-react';
import { api } from '../state/store.js';
import { makeSeed } from '../data/demo.js';
import { AcquisitionChecklist, ArticleSections, BuildsSection, VersionInfo } from '../components/GuideExtras.jsx';
import Ratings from '../components/Ratings.jsx';
import PostCard from '../components/PostCard.jsx';
import MediaImage from '../components/MediaImage.jsx';

// 文章詳情呈現版本、可勾選取得步驟、結構化配置、原有章節與相關閱讀。
export default function ArticleDetail({ role, categories, posts }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setPost(null); setError(''); (id.startsWith('demo-') ? Promise.resolve(makeSeed().posts.find((item) => item.id === id)) : api(`/api/posts/${encodeURIComponent(id)}`)).then((data) => { if (active) setPost(data); }).catch((err) => { if (active) setError(err.message); }); return () => { active = false; }; }, [id]);
  if (error) return <div className="empty-state"><h2>{error}</h2><Link to="/">返回首頁</Link></div>;
  if (!post) return <div className="app-loader"><span className="spinner-border spinner-border-sm" /> 正在讀取文章…</div>;
  const cat = categories.find((item) => item.slug === post.category);
  const related = posts.filter((item) => item.id !== post.id && item.status !== 'draft').map((item) => ({ item, score: (item.category === post.category ? 2 : 0) + item.tags.filter((tag) => post.tags.includes(tag)).length })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  return <article className="article-page">
    <div className="breadcrumbs"><Link to="/">首頁</Link><span>/</span><Link to={`/category/${post.category}`}>{cat?.label || '分類'}</Link><span>/</span><span>文章</span></div>
    <header className="article-header"><div><span className="eyebrow">{cat?.eyebrow} / FIELD NOTES</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="article-meta">{post.author && <span>作者：{post.author}</span>} 更新於 {new Date(post.updatedAt).toLocaleDateString('zh-TW')} {post.status === 'demo' && <span className="demo-tag">示範內容，請校對資訊</span>}{['draft', 'pending', 'rejected'].includes(post.status) && <span className="demo-tag">{{ draft: '草稿', pending: '待審核', rejected: '已退回' }[post.status]}・只有管理員可見</span>}</div><div className="detail-tags">{post.tags.map((tag) => <span key={tag}># {tag}</span>)}</div></div>{role === 'admin' && post.status !== 'demo' && <Link to={`/editor/${post.id}`} className="outline-button"><Edit3 size={17} /> 編輯文章</Link>}</header>
    <div className="article-cover" style={{ '--tile': cat?.color || '#c6d3dd' }}>{post.coverUrl ? <MediaImage src={post.coverUrl} alt="文章封面" /> : <div className="article-cover-type"><span>{cat?.eyebrow}</span><strong>ORIGIN / {cat?.label}</strong></div>}</div>
    <VersionInfo post={post} />
    {post.category === 'frames' && post.ratings && <section className="article-ratings"><span className="eyebrow">WARFRAME EVALUATION</span><h2>角色評價</h2><Ratings value={post.ratings} /></section>}
    <div className="article-layout"><aside className="toc"><span className="eyebrow">ON THIS PAGE</span>{post.acquisition?.length > 0 && <button type="button" onClick={() => document.getElementById('acquisition')?.scrollIntoView({ behavior: 'smooth' })}>取得清單</button>}{post.builds?.length > 0 && <button type="button" onClick={() => document.getElementById('builds')?.scrollIntoView({ behavior: 'smooth' })}>MOD 配置</button>}{post.sections.map((section, index) => <button type="button" key={index} onClick={() => document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth' })}>{String(index + 1).padStart(2, '0')}　{section.title}</button>)}</aside><div className="article-body"><AcquisitionChecklist post={post} /><BuildsSection builds={post.builds} /><ArticleSections sections={post.sections} /><Link to={`/category/${post.category}`} className="back-link"><ChevronLeft size={18} /> 返回{cat?.label || '分類'}列表</Link></div></div>
    {related.length > 0 && <section className="related-section"><div className="section-heading"><div><span className="eyebrow">MORE TO EXPLORE</span><h2>相關攻略<span className="heading-dot">.</span></h2></div></div><div className="posts-grid">{related.map(({ item }, i) => <PostCard key={item.id} post={item} categories={categories} index={i + 1} />)}</div></section>}
  </article>;
}
