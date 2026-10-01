import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, connectAuthEmulator, GoogleAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch, connectFirestoreEmulator } from 'firebase/firestore/lite';
import { fallbackCategories } from '../data/categories.js';

// 網頁識別碼可公開；真正的存取由 Firebase Auth 與 Firestore 規則控制。
const app = initializeApp({ apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID });
export const auth = getAuth(app);
export const db = getFirestore(app);
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
const siteRef = doc(db, 'settings', 'site');
const postRef = (id) => doc(db, 'posts', id);
export const siteDefaults = {
  brand: 'ORIGIN', brandCaption: 'WARFRAME ARCHIVE', heroEyebrow: 'ORIGIN / WARFRAME FIELD GUIDE',
  heroTitle: '你的星圖，', heroAccent: '從這裡開始。', heroDescription: '把每一次嘗試寫成攻略，讓下一次出發更有方向。',
  heroButton: '開始探索', heroTarget: '/category/frames', heroImage: '', heroImageAlt: '戰甲攻略封面',
  footerText: '獨立製作的非官方攻略網站', categories: fallbackCategories,
  tags: ['Prime', '入門', '支援', '主武器', '副武器', '靈化', '資源', '進階', '系統'], authors: ['編輯團隊'], filters: [], modIcons: [],
};
const friendly = (error) => {
  const messages = { 'auth/invalid-credential': '電子郵件或密碼不正確。', 'auth/email-already-in-use': '此電子郵件已有帳號。',
    'auth/weak-password': '密碼至少需要 6 個字元。', 'auth/invalid-email': '電子郵件格式不正確。',
    'permission-denied': '權限不足；投稿請先驗證電子郵件，管理功能需要管理員身分。',
    'auth/operation-not-allowed': '請先到 Firebase Authentication 啟用 Google 登入。',
    'auth/unauthorized-domain': '此網站網域尚未加入 Firebase Authentication 授權網域。',
    'auth/popup-blocked': '登入視窗被瀏覽器阻擋，請允許此網站開啟彈出視窗。',
    'auth/popup-closed-by-user': 'Google 登入視窗已關閉，尚未完成登入。',
    'auth/account-exists-with-different-credential': '這個信箱已有其他登入方式；請先用原方式登入，再連結 Google 帳號。',
    'auth/credential-already-in-use': '這個 Google 帳號已連結到其他網站帳號，請改用該帳號登入。',
    'auth/provider-already-linked': '這個網站帳號已連結 Google。' };
  return new Error(messages[error?.code] || error?.message || '操作失敗，請稍後再試。');
};
const requireUser = () => { if (!auth.currentUser) throw new Error('請先登入。'); return auth.currentUser; };
export const isAdmin = async (user = auth.currentUser) => Boolean(user && (await getDoc(doc(db, 'admins', user.uid))).data()?.active === true);

// 只檢查一次登入狀態，避免持續監聽文章造成額外用量。
export const checkFirebaseSession = () => new Promise((resolve, reject) => {
  let unsubscribe = () => {};
  unsubscribe = onAuthStateChanged(auth, async (user) => {
    unsubscribe();
    try { resolve({ role: user ? (await isAdmin(user) ? 'admin' : 'viewer') : null }); }
    catch (error) { reject(friendly(error)); }
  }, (error) => { unsubscribe(); reject(friendly(error)); });
});
export async function firebaseLogin(email, password, remember) {
  try { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return { role: await isAdmin(user) ? 'admin' : 'viewer' };
  } catch (error) { throw friendly(error); }
}
// Google 登入透過使用者點擊時直接開啟視窗；完成後套用本機／單次工作階段保存方式。
export async function firebaseGoogleLogin(remember) {
  try {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return { role: await isAdmin(user) ? 'admin' : 'viewer' };
  } catch (error) { throw friendly(error); }
}
// 已授權的管理員在原帳號登入後連結 Google，維持相同 UID 與權限。
export async function linkGoogleAccount() {
  const user = requireUser();
  if (user.providerData.some((provider) => provider.providerId === 'google.com')) throw new Error('這個帳號已連結 Google。');
  try {
    const linked = (await linkWithPopup(user, new GoogleAuthProvider())).user;
    await linked.reload();
    return { uid: linked.uid, email: linked.email };
  } catch (error) { throw friendly(error); }
}
export async function firebaseRegister(email, password, remember) {
  try { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(user);
    return { role: 'viewer', verificationSent: true };
  } catch (error) { throw friendly(error); }
}
export const firebaseLogout = async () => { await signOut(auth); return { ok: true }; };
export async function refreshVerification() { const user = requireUser(); await user.reload(); await user.getIdToken(true); return user.emailVerified; }
export async function getSite() { const snap = await getDoc(siteRef); return { ...siteDefaults, ...(snap.exists() ? snap.data() : {}) }; }

// 將編輯器資料整理成固定欄位；權限和標籤仍由 Firestore 規則再次檢查。
function cleanPost(input, publishing = true) {
  const str = (value, max) => String(value ?? '').trim().slice(0, max);
  const category = str(input.category, 40);
  const ratings = category === 'frames' ? Object.fromEntries(['mobility', 'defense', 'versatility'].map((key) => [key, Math.min(5, Math.max(1, Number(input.ratings?.[key]) || 3))])) : {};
  const tags = [...new Set(Array.isArray(input.tags) ? input.tags.map((tag) => str(tag, 24)) : [])].slice(0, 12);
  if (!str(input.title, 120) || !str(input.author, 50) || (publishing && !tags.length)) throw new Error('請填標題、選擇署名；送審前至少選擇一個標籤。');
  const entry = { title: str(input.title, 120), excerpt: str(input.excerpt, 300), category, tags, author: str(input.author, 50),
    ratings, coverUrl: str(input.coverUrl, 100), sections: Array.isArray(input.sections) ? input.sections.slice(0, 20) : [],
    builds: Array.isArray(input.builds) ? input.builds.slice(0, 10) : [], acquisition: Array.isArray(input.acquisition) ? input.acquisition.slice(0, 40) : [],
    gameVersion: str(input.gameVersion, 40), verifiedAt: str(input.verifiedAt, 10), attributes: input.attributes && typeof input.attributes === 'object' ? input.attributes : {} };
  if (JSON.stringify(entry).length > 130000) throw new Error('文章文字過長，請精簡內容。圖片需先上傳再插入。');
  return entry;
}

// 清單有上限並在 Redux 快取；搜尋及篩選不向 Firestore 逐字查詢。
export async function archiveCall(action, payload = {}) {
  try {
    const user = requireUser();
    if (action === 'list') {
      const admin = await isAdmin(user);
      const [siteSnap, postsSnap] = await Promise.all([getDoc(siteRef), getDocs(admin
        ? query(collection(db, 'posts'), limit(200))
        : query(collection(db, 'posts'), where('status', '==', 'published'), limit(200)))]);
      const site = { ...siteDefaults, ...(siteSnap.exists() ? siteSnap.data() : {}) };
      return { ...site, posts: postsSnap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
    }
    if (action === 'detail') { const snap = await getDoc(postRef(payload.id)); if (!snap.exists()) throw new Error('找不到這篇文章。'); return { id: snap.id, ...snap.data() }; }
    if (action === 'submit' || action === 'draft') {
      if (action === 'draft' && !await isAdmin(user)) throw new Error('只有管理員可以儲存草稿。');
      if (action === 'submit' && !user.emailVerified && !await isAdmin(user)) throw new Error('請先完成電子郵件驗證，再送出投稿。');
      const now = new Date().toISOString(); const safeId = /^[A-Za-z0-9_-]{1,80}$/.test(payload.post?.id || '') ? payload.post.id : doc(collection(db, 'posts')).id;
      const ref = postRef(safeId);
      const entry = { ...cleanPost(payload.post, action === 'submit'), status: action === 'draft' ? 'draft' : 'pending', submittedBy: user.uid, createdAt: now, updatedAt: now };
      await setDoc(ref, entry); return { id: ref.id, ...entry };
    }
    if (action === 'update') {
      const ref = postRef(payload.id); const original = await getDoc(ref);
      if (!original.exists()) throw new Error('找不到這篇文章。');
      const entry = { ...cleanPost(payload.post, payload.value !== 'draft'), status: payload.value === 'draft' ? 'draft' : 'pending', updatedAt: new Date().toISOString() };
      await updateDoc(ref, entry); return { id: ref.id, ...original.data(), ...entry };
    }
    if (action === 'approve' || action === 'reject') {
      const ref = postRef(payload.id); await updateDoc(ref, { status: action === 'approve' ? 'published' : 'rejected', updatedAt: new Date().toISOString() }); return { ok: true };
    }
    if (action === 'delete') { await deleteDoc(postRef(payload.id)); return { ok: true }; }
    if (['addTag', 'removeTag', 'addAuthor', 'removeAuthor'].includes(action)) {
      if (!await isAdmin(user)) throw new Error('只有管理員可以修改名單。');
      const site = await getSite(); const field = action.endsWith('Tag') ? 'tags' : 'authors';
      const value = String(payload.value || '').trim().slice(0, field === 'tags' ? 24 : 50);
      const items = site[field] || [];
      if (action.startsWith('add') && (!value || items.some((item) => item.toLowerCase() === value.toLowerCase()))) throw new Error('名稱不可空白或重複。');
      if (action.startsWith('remove') && field === 'authors' && items.length <= 1) throw new Error('至少保留一位署名者。');
      await setDoc(siteRef, { ...site, [field]: action.startsWith('add') ? [...items, value] : items.filter((item) => item !== value) }); return { ok: true };
    }
    if (action === 'saveSite') {
      if (!await isAdmin(user)) throw new Error('只有管理員可以修改網站設定。');
      const site = await getSite(); await setDoc(siteRef, { ...site, ...payload.value }); return { ok: true };
    }
    if (action === 'export') {
      if (!await isAdmin(user)) throw new Error('只有管理員可以匯出。');
      const data = await archiveCall('list');
      return { format: 'origin-spark-archive', version: 3, exportedAt: new Date().toISOString(),
        posts: data.posts, site: Object.fromEntries(Object.keys(siteDefaults).map((key) => [key, data[key]])) };
    }
    if (action === 'import') {
      if (!await isAdmin(user)) throw new Error('只有管理員可以匯入。');
      const data = payload.value;
      if (data?.format !== 'origin-spark-archive' || data.version !== 3 || !Array.isArray(data.posts) || data.posts.length > 100) throw new Error('備份格式無效或文章超過 100 篇。');
      const old = await getDocs(query(collection(db, 'posts'), limit(101)));
      if (old.size > 100) throw new Error('既有文章超過 100 篇，無法安全還原。');
      const batch = writeBatch(db); old.docs.forEach((item) => batch.delete(item.ref));
      data.posts.forEach((post) => { if (!/^[\w-]{1,80}$/.test(post.id || '')) throw new Error('備份文章 ID 無效。');
        batch.set(postRef(post.id), { ...cleanPost(post, post.status === 'published'), status: ['draft', 'pending', 'published', 'rejected'].includes(post.status) ? post.status : 'draft',
          submittedBy: user.uid, createdAt: String(post.createdAt || new Date().toISOString()), updatedAt: String(post.updatedAt || new Date().toISOString()) }); });
      batch.set(siteRef, { ...siteDefaults, ...data.site }); await batch.commit(); return { posts: data.posts.length, tags: data.site?.tags?.length || 0 };
    }
    throw new Error('不支援的操作。');
  } catch (error) { throw friendly(error); }
}

// Spark 方案不使用 Cloud Storage；MOD 圖案縮到 256px，與文章圖片同存獨立 Firestore 文件。
export async function uploadImage(file, usage = 'post', postId = '') {
  const user = requireUser();
  if (!file?.type?.startsWith('image/')) throw new Error('請選擇圖片檔。');
  if (file.size > 8 * 1024 * 1024) throw new Error('原始圖片不能超過 8 MB。');
  if (usage === 'post' && !/^[A-Za-z0-9_-]{1,80}$/.test(postId)) throw new Error('圖片缺少文章識別碼，請重新開啟編輯器。');
  if (usage === 'post' && !user.emailVerified && !await isAdmin(user)) throw new Error('請先驗證電子郵件才能上傳圖片。');
  if (usage === 'mod-icon' && !await isAdmin(user)) throw new Error('只有管理員可以上傳 MOD 圖案。');
  if (!['post', 'site', 'mod-icon'].includes(usage)) throw new Error('不支援的圖片用途。');
  const image = await createImageBitmap(file);
  const scale = Math.min(1, (usage === 'mod-icon' ? 256 : 1200) / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext('2d'); context.fillStyle = '#f5f7f8'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
  let dataUrl = '';
  for (const quality of [0.8, 0.65, 0.5]) { dataUrl = canvas.toDataURL('image/jpeg', quality); if (dataUrl.length <= 220000) break; }
  if (dataUrl.length > 220000) throw new Error('圖片壓縮後仍過大，請先縮小圖片再上傳。');
  const ref = doc(collection(db, 'media'));
  await setDoc(ref, { dataUrl, ownerUid: user.uid, usage, postId, createdAt: new Date().toISOString() });
  return { url: `media:${ref.id}` };
}

// 同一頁相同圖片只讀一次，元件在圖片靠近視窗時才呼叫。
const mediaCache = new Map();
export async function resolveMedia(url) {
  if (!url?.startsWith('media:')) return url || '';
  const id = url.slice(6);
  if (!mediaCache.has(id)) mediaCache.set(id, getDoc(doc(db, 'media', id)).then((snap) => snap.exists() ? snap.data().dataUrl : '').catch(() => ''));
  return mediaCache.get(id);
}
