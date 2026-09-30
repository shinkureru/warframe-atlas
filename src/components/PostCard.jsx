import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import MediaImage from './MediaImage.jsx';

// 卡片可顯示上傳封面，沒有圖片時以分類色和編號建立一致的圖鑑視覺。
export default function PostCard({ post, categories, index }) {
  const cat = categories.find((item) => item.slug === post.category) || categories[0];
  return <Link to={`/article/${post.id}`} className="post-card"><div className="card-visual" style={{ '--tile': cat?.color || '#c6d3dd' }}>{post.coverUrl ? <MediaImage src={post.coverUrl} alt="" /> : <><span className="card-visual-type">{cat?.eyebrow}</span><span className="card-visual-num">{String(index).padStart(2, '0')}</span></>}<span className="card-arrow"><ArrowUpRight size={19} /></span></div><div className="card-content"><span className="card-meta">{cat?.label} <span>·</span> {new Date(post.updatedAt).toLocaleDateString('zh-TW')}</span><h3>{post.title}</h3><p>{post.excerpt || '點開閱讀完整攻略內容。'}</p><div className="card-tags">{post.tags.slice(0, 3).map((tag) => <span key={tag}># {tag}</span>)}{post.status === 'demo' && <span className="demo-tag">示範</span>}</div></div></Link>;
}
