
// 頁尾保留簡短導航與非官方聲明。
export default function Footer({ site = {} }) { return <footer className="footer"><div className="footer-inner"><div className="footer-brand"><span className="brand-symbol">✦</span><strong>{site.brand || 'ORIGIN'}</strong><small>你的 Warframe 攻略筆記</small></div><div className="footer-right"><span>{site.footerText || '獨立製作的非官方攻略網站'}</span><span>WARFRAME FIELD GUIDE / © 2026</span></div></div></footer>; }
