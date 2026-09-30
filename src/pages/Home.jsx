import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import PostCard from '../components/PostCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import MediaImage from '../components/MediaImage.jsx';

// 首頁封面 Banner、六個分類與近期新增文章。
export default function Home({ posts, categories, role, site = {} }) {
  const latest = posts.filter((post) => ['published', 'demo'].includes(post.status)).slice(0, 4);
  return <>
    <section className="hero"><div className="hero-copy"><span className="eyebrow light">{site.heroEyebrow || 'ORIGIN / WARFRAME FIELD GUIDE'}</span><h1>{site.heroTitle || '你的星圖，'}<br /><em>{site.heroAccent || '從這裡開始。'}</em></h1><p>{site.heroDescription || '把每一次嘗試寫成攻略，讓下一次出發更有方向。'}</p><Link to={site.heroTarget || '/category/frames'} className="hero-link">{site.heroButton || '開始探索'} <ArrowUpRight size={19} /></Link></div><div className={`hero-art ${site.heroImage ? 'hero-art-upload' : ''}`} aria-hidden="true">{site.heroImage ? <MediaImage src={site.heroImage} alt={site.heroImageAlt || '首頁 Banner'} /> : <><div className="hero-art-top">ARCHIVE NO. 001 <span>●　●　●</span></div><div className="hero-art-main">O<span>R</span><br />IGIN</div><div className="hero-art-bottom"><span>TENNO RECORDS</span><span>2026 — ∞</span></div></>}</div><div className="hero-index">01 / THE ARCHIVE</div></section>
    <section className="content-section category-section"><div className="section-heading"><div><span className="eyebrow">DISCOVER THE ARCHIVE / 01</span><h2>探索分類<span className="heading-dot">.</span></h2></div><span className="section-aside">從裝備到任務，找到你現在需要的答案。</span></div><div className="category-grid">{categories.map((cat, i) => <Link key={cat.slug} to={`/category/${cat.slug}`} className="category-tile" style={{ '--tile': cat.color }}><span className="tile-num">0{i + 1} / {cat.eyebrow}</span><span className="tile-bottom"><strong>{cat.label}</strong><ArrowUpRight size={22} /></span></Link>)}</div></section>
    <section className="content-section recent-section"><div className="section-heading"><div><span className="eyebrow">LATEST RECORDS / 02</span><h2>近期新增文章<span className="heading-dot">.</span></h2></div><Link className="text-link" to="/category/frames">瀏覽分類 <ArrowRight size={17} /></Link></div>{latest.length ? <div className="posts-grid">{latest.map((post, i) => <PostCard key={post.id} post={post} categories={categories} index={i + 1} />)}</div> : <EmptyState />}</section>
    <div className="admin-prompt"><div><span className="eyebrow">FOR THE EDITOR</span><h3>有新的實戰心得嗎？</h3><p>提交文章後由管理員審核，核准才會公開。</p></div><Link to="/editor/new" className="btn-primary-custom">撰寫文章 <ArrowRight size={18} /></Link></div>
  </>;
}
