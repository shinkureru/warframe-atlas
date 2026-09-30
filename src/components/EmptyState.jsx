import { BookOpen } from 'lucide-react';

export default function EmptyState({ query = false }) { return <div className="empty-state"><BookOpen size={30} strokeWidth={1.4} /><h3>{query ? '沒有符合條件的文章' : '這裡還沒有文章'}</h3><p>{query ? '試試其他關鍵字或標籤。' : '文章經管理員核准後，就會顯示在這裡。'}</p></div>; }
