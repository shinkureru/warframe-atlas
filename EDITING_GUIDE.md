# 管理員修改指南

**內容與篩選選項**可直接登入網站進入「管理員」修改，存於 Firestore；其他人重新整理會看到。**版型、流程與安全權限**必須在 VS Code 修改並重新部署，不能安全地讓管理員頁面任意更改執行中的程式碼。

| 想修改 | 在哪裡 | 提醒 |
| --- | --- | --- |
| 網站名稱、英文副標、頁尾聲明 | 管理員 → 網站外觀與選項 | 修改後按「儲存網站設定」 |
| 首頁 Banner 標題、說明、按鈕文字和前往分類 | 同頁 → 首頁封面 Banner | 按鈕連結從六種分類選擇 |
| Banner 圖片及替代文字 | 同頁 → 上傳圖片、圖片替代文字 | 上傳後仍需按儲存；大圖壓縮後太大會要求先縮圖 |
| 六個分類的導覽名稱、首頁卡片名稱、英文名、說明與顏色 | 同頁 → 六個分類 | 分類 `slug` 固定，已張貼文章不受名稱變更影響 |
| 增加下拉篩選及選項 | 同頁 → 自訂篩選欄位 → 新增欄位／新增選項 | 選適用分類；儲存後到文章編輯器填對應欄位並核准，才有卡片符合新選項 |
| 標籤與投稿署名 | 管理員 → 標籤管理／署名人員 | 移除後舊文章仍保留歷史文字；投稿須選現有值 |
| 文章、封面、內文圖、取得流程、MOD 與星等 | 管理員 → 文章管理／新增文章 | 編輯已公開文章後重新待審；角色才有三組星等 |
| 待審投稿核准與退回 | 管理員 → 待審核投稿 | 一般讀者不能自行核准 |
| 查看自己的管理員 UID、連結 Google | 管理員 → 管理員帳號 | 先以原方式登入再連結，UID 不變；授權仍由 Firebase 主控台控制 |

例如新增「武器種類」：到「自訂篩選欄位」新增欄位，名稱填「武器種類」，適用分類選「武器」，加上「步槍」「霰彈槍」等選項並儲存；接著編輯武器文章，選擇種類並送審，核准後該文章才能被此選項篩到。若日後改名或刪除選項，**既有文章的舊值不會自動改寫**，需逐篇更新。

## 需要打開 VS Code 的項目

| 想修改 | 主要檔案 | 後續動作 |
| --- | --- | --- |
| 預設分類、導覽頁面 | `src/data/categories.js`、`src/router/AppRoutes.jsx` | 新增真正的分類也要同步改編輯器和 `firestore.rules` 允許的分類 |
| 預設標籤、Banner 文案 | `src/utils/firebase.js` 的 `siteDefaults` | 已存在的雲端網站設定優先；現有網站請用管理員頁面 |
| 分類內建排序（最新／最早／標題） | `src/pages/CategoryPage.jsx` | 內容型篩選優先用管理員的自訂欄位 |
| 預設文章章節 | `src/pages/EditorPage.jsx` 的 `characterSections`、`otherSections` | 只影響新文章；既有章節在文章編輯器修改 |
| 首頁固定區塊及文字 | `src/pages/Home.jsx` | Banner 已能從管理員頁面修改 |
| 版型、色彩、字體、RWD 與下拉樣式 | `src/styles/main.css` | 先 `npm run dev` 預覽，再推送 GitHub `main` |
| 文章列表上限、媒體壓縮與 Firestore 操作 | `src/utils/firebase.js` | 提高上限前評估 Spark 用量並規劃分頁 |
| 投稿、閱讀、管理、圖片安全規則 | `firestore.rules` | 跑 `npm test`；再執行 `npx firebase deploy --only firestore:rules` |
| Firebase 專案識別碼 | 本機 `.env.local`、GitHub Actions Repository variables | 本機重啟 Vite；GitHub 重新執行 Actions |
| 網站路徑及部署流程 | `vite.config.js`、`.github/workflows/deploy.yml` | 推送 `main` 由 Actions 編譯與部署 |

程式修改後 `npm run build`，再推送 GitHub `main`。管理員權限必須由站長於 Firebase 主控台建立 `admins/{UID}`，欄位 `active: true`；不要把「授予自己管理員」做成一般人可用的網站功能。新增 Google 登入後，請在 Firebase Authentication 啟用 Google 提供者並加入 GitHub Pages 授權網域；使用者只需在網站上選擇自己的 Google 帳號。

管理員 JSON 備份不含 Firestore `media` 圖片本體；搬遷到其他 Firebase 專案時，圖片需另外備份和遷移。
