import { lazy, Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import { checkSession, loadContent, resetContent } from '../state/store.js';
import { fallbackCategories } from '../data/categories.js';
import { makeSeed } from '../data/demo.js';
import LoginGate from '../components/LoginGate.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ResetNotice from '../components/ResetNotice.jsx';
const Home = lazy(() => import('../pages/Home.jsx'));
const CategoryPage = lazy(() => import('../pages/CategoryPage.jsx'));
const SearchPage = lazy(() => import('../pages/SearchPage.jsx'));
const ArticleDetail = lazy(() => import('../pages/ArticleDetail.jsx'));
const AdminPage = lazy(() => import('../pages/AdminPage.jsx'));
const EditorPage = lazy(() => import('../pages/EditorPage.jsx'));
const AccessDenied = lazy(() => import('../pages/AccessDenied.jsx'));
const SubmissionReceipt = lazy(() => import('../pages/SubmissionReceipt.jsx'));
const DailyWeeklyPage = lazy(() => import('../pages/DailyWeeklyPage.jsx'));

const demoPosts = makeSeed().posts;

// 首次讀取登入狀態；登入後才向伺服器請求受保護的內容。
export default function App() {
  const dispatch = useDispatch();
  const { role, status } = useSelector((state) => state.auth);
  const content = useSelector((state) => state.content);
  useEffect(() => { dispatch(checkSession()); }, [dispatch]);
  useEffect(() => { if (role) dispatch(loadContent()); else dispatch(resetContent()); }, [role, dispatch]);
  const categories = content.categories.length ? content.categories : fallbackCategories;
  // 尚未建立雲端文章時顯示本機示範卡；示範資料不會被上傳或送審。
  const visiblePosts = content.posts.length ? content.posts : demoPosts;

  if (status === 'checking') return <div className="app-loader"><span className="spinner-border spinner-border-sm" /> 正在載入攻略圖鑑…</div>;
  if (!role) return <LoginGate />;
  if (content.status === 'idle' || (content.status === 'loading' && !content.posts.length)) return <div className="app-loader"><span className="spinner-border spinner-border-sm" /> 正在讀取攻略內容…</div>;
  return (
    <div className="site-shell">
      <Header role={role} site={content.site} />
      <ResetNotice checklists={content.site.checklists} />
      <main className="main-wrap">
        {content.status === 'error' && <div className="alert alert-danger mt-3" role="alert">{content.error} <button className="btn btn-link" onClick={() => dispatch(loadContent())}>重試</button></div>}
        <Suspense fallback={<div className="app-loader"><span className="spinner-border spinner-border-sm" /> 正在載入頁面…</div>}><Routes>
          <Route path="/" element={<Home posts={visiblePosts} categories={categories} role={role} site={content.site} />} />
          <Route path="/category/:slug" element={<CategoryPage posts={visiblePosts} categories={categories} tags={content.tags} filters={content.filters} role={role} />} />
          <Route path="/search" element={<SearchPage posts={visiblePosts} categories={categories} />} />
          <Route path="/daily-weekly" element={<DailyWeeklyPage checklists={content.site.checklists} />} />
          <Route path="/article/:id" element={<ArticleDetail role={role} categories={categories} posts={visiblePosts} />} />
          <Route path="/submission/:id" element={<SubmissionReceipt />} />
          <Route path="/admin" element={role === 'admin' ? <AdminPage posts={content.posts} tags={content.tags} authors={content.authors} categories={categories} site={content.site} /> : <AccessDenied />} />
          <Route path="/editor/new" element={<EditorPage role={role} categories={categories} tags={content.tags} authors={content.authors} filters={content.filters} modIcons={content.site.modIcons || []} />} />
          <Route path="/editor/:id" element={role === 'admin' ? <EditorPage role={role} categories={categories} tags={content.tags} authors={content.authors} filters={content.filters} modIcons={content.site.modIcons || []} /> : <AccessDenied />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Suspense>
      </main>
      <Footer site={content.site} />
    </div>
  );
}
