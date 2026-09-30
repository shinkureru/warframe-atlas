import { useEffect, useRef, useState } from 'react';
import { resolveMedia } from '../utils/firebase.js';

// 圖片靠近視窗才從 Firestore 讀取，同張圖片共用記憶體快取。
export default function MediaImage({ src, alt = '', className = '' }) {
  const node = useRef(null);
  const [visible, setVisible] = useState(false);
  const [resolved, setResolved] = useState('');
  useEffect(() => {
    if (!src) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '250px' });
    if (node.current) observer.observe(node.current);
    return () => observer.disconnect();
  }, [src]);
  useEffect(() => { if (!visible || !src) return; let active = true; resolveMedia(src).then((url) => { if (active) setResolved(url); }); return () => { active = false; }; }, [src, visible]);
  return <span ref={node} className={`media-frame ${className}`}>{resolved ? <img src={resolved} alt={alt} loading="lazy" /> : <span className="media-placeholder" aria-label={alt}>圖片載入中…</span>}</span>;
}
