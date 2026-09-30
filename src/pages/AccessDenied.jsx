import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

// 閱讀者點選管理員導覽時，明確告知權限；伺服器仍會獨立擋下修改請求。
export default function AccessDenied() { return <div className="empty-state denied-state"><Shield size={32} strokeWidth={1.4} /><h2>這裡是管理員工作區</h2><p>目前帳號可以閱讀攻略，文章編輯與標籤管理需要管理員權限。</p><Link to="/" className="btn-primary-custom">回到首頁 <ArrowRight size={17} /></Link></div>; }
