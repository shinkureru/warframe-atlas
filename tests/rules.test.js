import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

// 模擬器檢驗真正的 Firestore 規則，避免只靠隱藏前端按鈕控制權限。
const env = await initializeTestEnvironment({ projectId: 'demo-warframe', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } });
const admin = env.authenticatedContext('admin-uid', { email_verified: true }).firestore();
const author = env.authenticatedContext('writer-uid', { email_verified: true }).firestore();
const unverified = env.authenticatedContext('new-uid', { email_verified: false }).firestore();
const other = env.authenticatedContext('other-uid', { email_verified: true }).firestore();
const inactive = env.authenticatedContext('inactive-uid', { email_verified: true }).firestore();
const post = { title: 'Narin 星圖筆記', excerpt: '', category: 'frames', tags: ['入門'], author: '編輯團隊',
  ratings: { mobility: 4, defense: 2, versatility: 3 }, coverUrl: '', sections: [], builds: [], acquisition: [],
  gameVersion: '', verifiedAt: '', attributes: {}, status: 'pending', submittedBy: 'writer-uid', createdAt: '2026-09-30', updatedAt: '2026-09-30' };
try {
  await env.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc('admins/admin-uid').set({ active: true });
    await context.firestore().doc('admins/inactive-uid').set({ active: false });
  });
  await test('驗證者只能送審；未驗證者和一般讀者不能核准', async () => {
    await assertSucceeds(author.doc('posts/article-1').set(post));
    await assertFails(unverified.doc('posts/article-2').set({ ...post, submittedBy: 'new-uid' }));
    await assertFails(author.doc('posts/article-3').set({ ...post, status: 'published' }));
    await assertFails(author.doc('posts/reader-draft').set({ ...post, status: 'draft' }));
    await assertSucceeds(admin.doc('posts/admin-draft').set({ ...post, tags: [], status: 'draft', submittedBy: 'admin-uid' }));
    await assertFails(other.doc('posts/article-1').get());
    await assertFails(author.doc('posts/article-1').update({ status: 'published' }));
    await assertSucceeds(admin.doc('posts/article-1').update({ status: 'published' }));
    assert.equal((await assertSucceeds(other.doc('posts/article-1').get())).data().title, 'Narin 星圖筆記');
  });
  await test('只有管理員可寫設定；投稿標籤需在現有名單', async () => {
    await assertFails(author.doc('admins/writer-uid').set({ active: true }));
    await assertFails(inactive.doc('settings/site').set({ brand: '冒用管理員' }));
    await assertFails(author.doc('settings/site').set({ brand: '假管理員' }));
    await assertSucceeds(admin.doc('settings/site').set({ brand: 'ORIGIN', heroImage: 'media:banner-1', tags: ['入門'], authors: ['編輯團隊'] }));
    await assertFails(author.doc('settings/site').update({ timers: [{ name: '偽造' }] }));
    await assertSucceeds(admin.doc('settings/site').update({ timers: [], checklists: { daily: { hour: 8, minute: 0, items: [] }, weekly: { weekday: 1, hour: 8, minute: 0, items: [] } } }));
    await assertFails(author.doc('posts/invalid-tag').set({ ...post, tags: ['隨意偽造'] }));
  });
  await test('待審圖片作者可看，文章核准後所有登入者可看', async () => {
    const media = { dataUrl: 'data:image/jpeg;base64,/9j/AA==', ownerUid: 'writer-uid', usage: 'post', postId: 'article-4', createdAt: '2026-09-30' };
    await assertSucceeds(author.doc('media/photo-1').set(media));
    await assertSucceeds(author.doc('posts/article-4').set(post));
    await assertFails(other.doc('media/photo-1').get());
    await assertSucceeds(author.doc('media/photo-1').get());
    await assertSucceeds(admin.doc('posts/article-4').update({ status: 'published' }));
    await assertSucceeds(other.doc('media/photo-1').get());
    await assertFails(other.collection('media').get());
  });
  // MOD 圖案可供已登入讀者載入，圖案庫及圖片寫入仍只限管理員。
  await test('MOD 圖案上傳、讀取與圖案庫權限', async () => {
    const icon = { dataUrl: 'data:image/jpeg;base64,/9j/AA==', usage: 'mod-icon', postId: '', createdAt: '2026-10-01' };
    await assertFails(author.doc('media/icon-reader').set({ ...icon, ownerUid: 'writer-uid' }));
    await assertSucceeds(admin.doc('media/icon-1').set({ ...icon, ownerUid: 'admin-uid' }));
    await assertSucceeds(other.doc('media/icon-1').get());
    await assertFails(author.doc('settings/site').update({ modIcons: [{ name: '光環', url: 'media:icon-1' }] }));
    await assertSucceeds(admin.doc('settings/site').update({ modIcons: [{ name: '光環', url: 'media:icon-1' }] }));
    await assertSucceeds(other.doc('settings/site').get());
  });
} finally { await env.cleanup(); }
