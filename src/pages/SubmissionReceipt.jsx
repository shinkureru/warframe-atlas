import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

// 閱讀者投稿成功後顯示送審收據，待審稿不會出現在公開搜尋結果。
export default function SubmissionReceipt() { return <div className="empty-state denied-state"><Check size={38} /><h2>文章已送交審核</h2><p>管理員核准後才會公開顯示在分類與全站搜尋。</p><Link to="/" className="btn-primary-custom">返回首頁 <ArrowRight size={17} /></Link></div>; }
