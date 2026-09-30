import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { archiveCall, checkFirebaseSession, firebaseLogin, firebaseGoogleLogin, firebaseRegister, firebaseLogout } from '../utils/firebase.js';

// 頁面統一呼叫 Firebase；舊版 URL 僅作為前端的操作名稱，不會發送 HTTP 到本機 Express。
export async function api(url, options = {}) {
  const path = decodeURIComponent(url.split('?')[0]);
  if (path.startsWith('/api/posts/') && !options.method) return archiveCall('detail', { id: path.slice('/api/posts/'.length) });
  if (path === '/api/posts' && options.method === 'POST') {
    const post = JSON.parse(options.body); return archiveCall(post.status === 'draft' ? 'draft' : 'submit', { post });
  }
  if (path.startsWith('/api/posts/') && options.method === 'PUT') {
    const post = JSON.parse(options.body); return archiveCall('update', { id: path.slice('/api/posts/'.length), post, value: post.status });
  }
  if (path.startsWith('/api/posts/') && options.method === 'DELETE') return archiveCall('delete', { id: path.slice('/api/posts/'.length) });
  if (path === '/api/tags' && options.method === 'POST') return archiveCall('addTag', { value: JSON.parse(options.body).name });
  if (path.startsWith('/api/tags/') && options.method === 'DELETE') return archiveCall('removeTag', { value: path.slice('/api/tags/'.length) });
  throw new Error('不支援的操作。');
}

// 身分以 Firebase Auth 簽章權杖的 role 為準；Redux 僅供畫面顯示。
export const checkSession = createAsyncThunk('auth/check', checkFirebaseSession);
export const login = createAsyncThunk('auth/login', ({ email, password, remember }) => firebaseLogin(email, password, remember));
export const googleLogin = createAsyncThunk('auth/googleLogin', ({ remember }) => firebaseGoogleLogin(remember));
export const register = createAsyncThunk('auth/register', ({ email, password, remember }) => firebaseRegister(email, password, remember));
export const logout = createAsyncThunk('auth/logout', firebaseLogout);
const authSlice = createSlice({
  name: 'auth', initialState: { role: null, status: 'checking', error: '' },
  reducers: { clearAuthError(state) { state.error = ''; } },
  extraReducers(builder) {
    builder.addCase(checkSession.fulfilled, (state, action) => { state.role = action.payload.role; state.status = 'ready'; });
    builder.addCase(checkSession.rejected, (state, action) => { state.role = null; state.status = 'ready'; state.error = action.error.message; });
    builder.addCase(register.pending, (state) => { state.error = ''; state.status = 'logging-in'; });
    builder.addCase(register.fulfilled, (state) => { state.role = 'viewer'; state.status = 'ready'; });
    builder.addCase(register.rejected, (state, action) => { state.error = action.error.message; state.status = 'ready'; });
    builder.addCase(login.pending, (state) => { state.error = ''; state.status = 'logging-in'; });
    builder.addCase(login.fulfilled, (state, action) => { state.role = action.payload.role; state.status = 'ready'; });
    builder.addCase(login.rejected, (state, action) => { state.error = action.error.message; state.status = 'ready'; });
    builder.addCase(googleLogin.pending, (state) => { state.error = ''; state.status = 'logging-in'; });
    builder.addCase(googleLogin.fulfilled, (state, action) => { state.role = action.payload.role; state.status = 'ready'; });
    builder.addCase(googleLogin.rejected, (state, action) => { state.error = action.error.message; state.status = 'ready'; });
    builder.addCase(logout.fulfilled, (state) => { state.role = null; state.status = 'ready'; });
  },
});
export const { clearAuthError } = authSlice.actions;

// 進站及完成管理操作才重新載入清單，避免搜尋每字造成 Firebase 讀取。
export const loadContent = createAsyncThunk('content/load', () => archiveCall('list'));
const contentSlice = createSlice({
  name: 'content', initialState: { posts: [], categories: [], tags: [], authors: [], filters: [], site: {}, status: 'idle', error: '' },
  reducers: { resetContent(state) { state.posts = []; state.categories = []; state.tags = []; state.authors = []; state.filters = []; state.site = {}; state.status = 'idle'; } },
  extraReducers(builder) {
    builder.addCase(loadContent.pending, (state) => { state.status = 'loading'; state.error = ''; });
    builder.addCase(loadContent.fulfilled, (state, action) => { const { posts, ...site } = action.payload; Object.assign(state, { ...site, posts, site }); state.status = 'ready'; });
    builder.addCase(loadContent.rejected, (state, action) => { state.status = 'error'; state.error = action.error.message; });
  },
});
export const { resetContent } = contentSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer, content: contentSlice.reducer } });
