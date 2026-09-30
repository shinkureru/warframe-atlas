# ORIGIN｜Warframe 社群攻略圖鑑

這是以 **React + Vite + Bootstrap + Redux Toolkit + React Router** 製作的 Warframe 社群攻略網站。網站畫面部署在 **GitHub Pages**；登入、文章投稿與審核、網站設定和小尺寸圖片由 **Firebase Spark 免費方案**處理。

> 本版為 `0.4.1`。網站沒有使用 Firebase Hosting、Cloud Functions 或 Cloud Storage，也不需要為這些功能升級 Blaze。舊版共用密碼 `1111`／`101231` 已停用：靜態網站的前端程式人人可檢視，無法安全地藏共用管理密碼。現在每位使用者用自己的 Google 帳號或電子郵件／密碼登入；管理員由站長根據 Firebase **UID** 個別授權。

## 目錄

- [網站功能](#網站功能)
- [開始前準備](#開始前準備)
- [步驟一：設定 Firebase](#步驟一設定-firebase)
- [步驟二：在 VS Code 啟動與部署規則](#步驟二在-vs-code-啟動與部署規則)
- [步驟三：部署 GitHub Pages](#步驟三部署-github-pages)
- [步驟四：建立第一位管理員](#步驟四建立第一位管理員)
- [網站操作與修改位置](#網站操作與修改位置)
- [測試、用量與資料備份](#測試用量與資料備份)
- [常見問題](#常見問題)

## 網站功能

| 區域 | 功能 |
| --- | --- |
| 首頁 | 封面 Banner、六個分類入口、近期新增文章 |
| 分類頁 | 角色、武器、同伴、素材、關卡攻略、知識百科；卡片列表、分類內搜尋、標籤與自訂篩選 |
| 全站搜尋 | 導覽列輸入中文或英文時立即顯示符合的文章；搜尋與篩選在已載入資料中進行，不會每打一字就查 Firebase |
| 文章 | 詳細章節、取得方式、圖片、MOD 配置與賦能；角色另有機動性、防禦守點、泛用度三組 1～5 星評價 |
| 投稿 | 已登入且符合信箱驗證要求的使用者可投稿，必須選擇現有標籤與署名；送出後先進待審區 |
| 管理員 | 核准／退回與編輯文章、管理標籤和署名、修改 Banner、網站名稱、頁尾、分類文字與顏色、自訂篩選欄位 |

第一次使用且 Firestore 尚無文章時，網站會顯示本機示範卡供預覽版型；示範內容沒有寫入 Firebase。

## 開始前準備

- [Node.js](https://nodejs.org/) **20 以上**（GitHub Actions 使用 Node.js 22）。
- VS Code、GitHub 帳號、[Firebase 帳號與專案](https://console.firebase.google.com/)。
- 若要在本機跑 Firestore 模擬器測試，安裝 Java（建議 JDK 21）。
- 在 VS Code 開啟解壓後的 **`warframe-atlas` 專案資料夾**。`package.json`、`firebase.json`、`firestore.rules` 應直接在這個資料夾內。

### 資料與畫面如何分工

- **GitHub Pages** 只提供 React 編譯後的靜態檔案。
- **Firebase Authentication** 負責個別帳號與 Google 登入。
- **Firestore** 存文章、待審狀態、管理員名單、網站設定與壓縮小圖。
- **Firestore Security Rules** 在資料庫端檢查讀寫權限。隱藏前端按鈕本身不能保護資料。

## 步驟一：設定 Firebase

### 1. 建立專案與網頁應用程式

1. 開啟 [Firebase 主控台](https://console.firebase.google.com/)，建立 Firebase 專案並維持 **Spark** 方案。
2. 在 **專案設定 → 一般 → 你的應用程式** 新增「網頁」應用程式，取得 Firebase 設定中的 `apiKey`、`authDomain`、`projectId`、`appId`。
3. 這四項是前端公開的**專案識別資訊**；不要把 Google 帳號密碼、服務帳戶 JSON 或私鑰放在 `VITE_` 變數與 React 檔案中。

### 2. 啟用登入方式

到 **Authentication → Sign-in method**：

1. 啟用 **Email/Password**。
2. 啟用 **Google**，完成主控台要求的專案支援電子郵件設定並儲存。
3. 到 **Authentication → Settings → Authorized domains** 加入你的 Pages 網域，例如 `你的GitHub帳號.github.io`。只填網域，不填 `https://`、`/儲存庫名稱/` 或 `#`。使用自訂網域時也要加入它。
4. 本機開發若 Google 彈出視窗提示網域未授權，也將目前 Vite 網址的主機加入，例如 `127.0.0.1`。正式網站仍使用 HTTPS 的 GitHub Pages 網域。

讀者在網站按「使用 Google 帳號繼續」，Firebase Authentication 會為他們建立或辨識網站帳號。**讀者不需要進 Firebase 主控台辦帳號。**電子郵件／密碼註冊者須點選驗證信中的連結才能投稿；實際投稿權限以 Firebase 權杖中的 `email_verified` 和資料庫規則為準。

### 3. 建立 Firestore 資料庫

到 **Firestore Database** 建立資料庫並選擇合適地區。若建立過程提供測試模式，務必在開放網站前完成下方的 `firestore.rules` 部署。**本版不需要 Cloud Storage bucket。**

## 步驟二：在 VS Code 啟動與部署規則

在 VS Code 的終端機確認目前位於 `warframe-atlas`（執行 `dir` 或 `ls` 看得到 `package.json`），再執行：

```bash
npm ci
```

複製環境變數範例：

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

macOS／Linux 可用 `cp .env.example .env.local`。在 `.env.local` 填入剛才取得的四個值：

```dotenv
VITE_FIREBASE_API_KEY=你的_apiKey
VITE_FIREBASE_AUTH_DOMAIN=你的_authDomain
VITE_FIREBASE_PROJECT_ID=你的_projectId
VITE_FIREBASE_APP_ID=你的_appId
VITE_USE_EMULATORS=false
```

接著登入 Firebase CLI，選擇**與 `.env.local` 相同的專案**並部署規則：

```bash
npx firebase login
npx firebase use --add
npx firebase deploy --only firestore:rules
npm run dev
```

`firebase use --add` 建立本機 `.firebaserc`；別名可填 `default`。`npm run dev` 會顯示本機網址。本機一般模式使用你設定的正式 Firebase 專案，因此測試投稿也會寫入該專案。此處部署的是 **Firestore 規則**，不是 Firebase Hosting；不要執行舊版的 `firebase deploy --only functions,storage,hosting`。

`.env.local` 和 `.firebaserc` 已列入 `.gitignore`，不用上傳到 GitHub。

## 步驟三：部署 GitHub Pages

1. 在 GitHub 建立儲存庫，例如 `warframe-atlas`，並將**解壓後 `warframe-atlas` 資料夾內的內容**推送到儲存庫的 `main` 分支。儲存庫根目錄應直接有 `package.json`，且保留 `.github/workflows/deploy.yml`。
2. 到儲存庫的 **Settings → Secrets and variables → Actions → Variables**，建立以下四個 **Repository variables**，值與 `.env.local` 相同：

   | 變數名稱 | 對應 Firebase 設定 |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

   這些值會編進公開網站，所以只能放 Firebase 網頁識別碼。不要上傳 `.env.local`、服務帳戶 JSON、私鑰或個人登入密碼。

3. 到 **Settings → Pages → Build and deployment**，將 **Source** 選為 **GitHub Actions**。
4. 推送 `main` 或到 **Actions** 手動執行「部署攻略網站到 GitHub Pages」。待工作流程成功，開啟 Pages 顯示的網址。
5. 一般儲存庫的網站網址為 `https://你的GitHub帳號.github.io/warframe-atlas/`。若儲存庫本身叫 `你的GitHub帳號.github.io`，網站在根網址。`vite.config.js` 已依儲存庫名稱設定資源路徑；特殊路徑可另設 Actions variable `VITE_BASE_PATH`。

網站使用 `HashRouter`，內頁網址會有 `#`，例如 `https://你的GitHub帳號.github.io/warframe-atlas/#/category/frames`。這能讓 GitHub Pages 上的內頁連結在重新整理後繼續使用。**網站網址是 GitHub Pages，不是 `<project>.web.app`。**

## 步驟四：建立第一位管理員

Google 登入或電子郵件／密碼登入**只表示你是使用者，不會自動成為管理員**。請依下列方式為自己授權：

1. 在新網站使用你以後要用的 Google 帳號登入。若偏好電子郵件／密碼，先在網站註冊並驗證信箱。
2. 到 Firebase 主控台 **Authentication → Users** 找到剛登入的帳號，複製它的 **User UID**。請核對電子郵件與 UID，勿只憑顯示名稱判斷。
3. 到 **Firestore Database → Data** 建立集合 `admins`，再建立一個文件：

   ```text
   集合 ID：admins
   文件 ID：貼上你的 User UID
   欄位名稱：active
   欄位類型：boolean
   欄位值：true
   ```

4. 登出再登入網站；導覽列會顯示管理員身分，並可使用「管理員」頁面。管理員頁面也會顯示目前登入者的 UID，方便核對。

授予其他管理員時，重複上述 UID 文件步驟。若要撤銷某人的權限，將其 `active` 改成布林 `false` 或刪除該文件；資料庫規則會拒絕其後續管理操作。一般使用者不能透過網站自行建立 `admins` 文件。

### 已有電子郵件／密碼管理員，想改用 Google？

先用**原本的電子郵件／密碼帳號**登入「管理員」，在「管理員帳號」區按「連結 Google 帳號」。成功後 UID 不變，原本的管理權限也會保留。若先用 Google 建立了另一個獨立帳號，兩個帳號可能有不同 UID；請先核對 UID，不要直接假設同一信箱就是同一個管理員，也不要在不確定資料歸屬時刪除帳號。

## 網站操作與修改位置

- **一般讀者**：閱讀已核准的文章、即時搜尋、篩選與檢視詳情。可以投稿，但不能核准或編輯其他人的文章。
- **投稿者**：在導覽列按「投稿文章」，選分類、現有署名及至少一個標籤，填入正文與可選圖片，送出後等待審核。編輯器會在本機暫存文字；上傳圖片會寫入 Firestore。
- **管理員**：進入「管理員」核准／退回文章、管理標籤與署名，編輯首頁 Banner、分類資料和自訂篩選。儲存設定後，其他讀者重新整理即可看到。

例如要新增「武器種類」下拉選項：**管理員 → 網站外觀與選項 → 自訂篩選欄位 → 新增欄位**，設定名稱、適用分類及選項並儲存。之後在武器文章編輯器填寫對應欄位，核准後文章才會出現在相符篩選結果。既有文章的舊選項值不會在改名後自動更新。

更多「在哪個檔案或管理頁面修改」的對照表見 [EDITING_GUIDE.md](EDITING_GUIDE.md)。版型、登入流程、真正的分類識別碼及資料庫權限需要修改程式，不適合讓管理員在網站上任意執行程式碼。

## 測試、用量與資料備份

```bash
npm run build       # 編譯正式版
npm test            # 用 Firestore 模擬器測試資料庫規則
npm run emulators   # 啟動 Auth 和 Firestore 本機模擬器
```

若要用模擬器開發，在 `.env.local` 設 `VITE_USE_EMULATORS=true`，啟動模擬器與 `npm run dev`；模擬器資料與正式 Firebase 資料分開。**Google OAuth 彈出登入與 GitHub Pages 實際網址仍需在正式部署後手動測試。**

- 首次進站最多讀取 **200 篇文章**；搜尋、標籤及自訂選項在已載入資料中篩選。超過上限需實作分頁，否則較舊文章可能不在列表。
- 圖片在瀏覽器轉成 JPEG，最長邊最多 1200 px；壓縮後的 data URL 需在 **220,000 字元**內，約 165 KB 圖片資料。大圖若仍超限，先自行縮小再上傳。每張圖占 Firestore 容量且讀取圖片文件也計入用量；請查看 Firebase 主控台 Usage。
- 本版刻意不使用 Cloud Storage：Firebase 對該服務要求 Blaze 方案。小圖片放 Firestore 適合初期、低流量的社群站；若未來有大量文章、圖片與訪客，應另規劃儲存和分頁。
- 管理員的 JSON 匯出包含文章、網站設定和 `media:<id>` **圖片引用**，**不含 Firestore `media` 集合中的圖片本體**。匯入只適用同一專案，最多 100 篇，會取代現有文章與網站設定。跨 Firebase 專案搬遷前請另外備份並遷移圖片。
- 舊版 Express `data/`、Cloud Functions／Storage 資料不會自動轉換；先保留舊資料備份。上傳後放棄文章可能留下未被引用的媒體文件。

此版已完成 `npm run build` 與 Firestore 規則模擬測試。**尚未連接你的 GitHub／Firebase 專案進行實際線上端對端測試**；上線後請依序測試 Google 登入、一般帳號投稿、管理員審核、文章圖片與手機版。

## 常見問題

| 情況 | 檢查方式 |
| --- | --- |
| Google 登入顯示 `unauthorized-domain` | 在 Firebase Authentication 的 Authorized domains 加入實際網站網域；本機用 Vite 的主機名 |
| Google 登入視窗沒有出現 | 檢查 Google 提供者是否已啟用，並允許瀏覽器開啟彈出視窗 |
| 登入成功卻不是管理員 | 比對目前帳號 UID 與 `admins/{UID}` 文件 ID，確認 `active` 是 **boolean `true`**；再登出並登入 |
| 投稿或儲存時出現 `permission-denied` | 確認部署了正確 Firebase 專案的 `firestore.rules`；電子郵件／密碼使用者先驗證信箱；確認有選現有標籤和署名 |
| GitHub Pages 空白或資源 404 | 檢查 Actions 四個變數、工作流程紀錄、儲存庫根目錄的 `package.json` 和 Pages Source；內頁使用含 `#` 的網址 |
| 圖片太大 | 先縮小圖片；網站會再壓成 JPEG 小圖，無法保留 GIF 動畫 |
| 擔心 Firebase 免費額度 | 查看 Firestore Usage；圖片讀取、文章載入與重新整理都計入用量。不要頻繁刷新或把本站當大量圖片空間 |

## 專案結構

```text
warframe-atlas/
├─ .github/workflows/deploy.yml  # GitHub Pages 自動部署
├─ src/
│  ├─ components/               # 導覽、卡片、選單與管理設定
│  ├─ data/                     # 預設分類與示範文章
│  ├─ images/                   # 程式內靜態圖片預留位置
│  ├─ pages/                    # 首頁、分類、搜尋、文章、投稿、管理員
│  ├─ router/                   # React Router 與登入閘門
│  ├─ state/                    # Redux Toolkit 共用狀態
│  ├─ styles/                   # 淺色主題與響應式設計
│  └─ utils/firebase.js        # Firebase Auth、Firestore 與圖片處理
├─ firestore.rules             # 資料庫端讀寫權限
├─ tests/rules.test.js         # 規則模擬測試
├─ firebase.json              # 規則和模擬器設定
├─ vite.config.js             # GitHub Pages 資源路徑
├─ .env.example               # 本機公開設定範本
└─ EDITING_GUIDE.md           # 可修改項目與對應位置
```

此站是非官方 Warframe 社群攻略原型。示範文章與正式攻略的遊戲資訊仍需人工校對。
