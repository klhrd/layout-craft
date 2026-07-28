# 🛠️ LayoutCraft Studio

一個基於原生 JavaScript 打造的低代碼（No-code / Low-code）網頁圖形化編輯器。支援元件拖拽排版、視覺化 CSS 積木堆疊、即時作用域偵測（閃爍提示），以及多專案 LocalStorage 儲存空間管理。

---

## 📂 專案資料夾樹結構 (Directory Tree)

```text
layoutcraft-studio/
├── index.html                  # 應用程式主入口 (工作區基礎 HTML 結構)
├── README.md                   # 專案說明文件
└── src/
    ├── css/
    │   ├── canvas-preview.css  # 畫布元件渲染與預覽模式樣式
    │   └── editor.css          # 編輯器介面、CSS 積木、閃爍動畫等 UI 樣式
    └── js/
        ├── app.js              # 主程式進入點 (負責初始化、全域編譯與事件分配)
        ├── config/
        │   ├── cssDictionary.js# CSS 屬性積木字典配置 (定義屬性名與預設值)
        │   └── elements.js     # 畫布元件庫配置 (Layout, Typography, Forms 等)
        └── modules/
            ├── canvas.js       # 畫布核心模組 (處理 HTML 元件拖放、Sortable 排序)
            ├── exporter.js     # 匯出與預覽模組 (打包 HTML/CSS 並下載 zip/檔案)
            ├── inspector.js    # 屬性檢察官 (點擊元件編輯 ID、Class、文字與動態屬性)
            └── storage.js      # 儲存管理器 (多專案快照、自動存檔、LocalStorage 容量監測)

```

---

## 🚀 核心功能特點

### 1. 🧱 雙重編輯模式

- **🎨 Visual Mode (視覺模式)**：專注於網頁骨架排版。可從左側拉入 Layout、Typography、Forms 等元件，並透過右側 `Inspector` 直接修改文字或 ID/Class。
- **💻 CSS Expert Mode (CSS 專家模式)**：點擊建立 CSS 選擇器大盒子（如 `.card`），即可從左側將 CSS 屬性像積木一樣拖入盒子中，完全不需手寫代碼。

### 2. 填入數值的格子 (Visual Property Inputs)

- CSS 積木拖入指定選擇器後，會自動長出專屬的**輸入欄位**。
- 支援毫秒級的 `input` 即時監聽，修改數值（如 `padding: 20px`）時，畫布上的元件會立刻同步變形、變色。

### 3. 🎯 作用域雷達偵測 (Blinking / Detector)

- 每個 CSS 規則盒子右上角皆有 `🎯 Detect` 開關。
- 開啟後，畫布上所有**符合該 CSS 選擇器條件的元件會立刻進入高亮並啟動呼吸閃爍動畫**，讓操作者明確知道該樣式正在影響誰。

### 4. 📊 多專案管理與記憶體防炸機制 (Storage Manager)

- 支援 **+ New** 建立多個獨立專案，並可透過下拉選單隨時切換。
- 內建每 30 秒自動靜默存檔防呆。
- 右上角配備 **Storage Use 監測進度條**，精確計算 UTF-16 位元組大小，超過 85% 自動變紅警告，防止瀏覽器 LocalStorage（5MB）配額爆滿。

---

## 🛠️ 開發與安裝

本專案採用 **原生 ES Module (JavaScript)**，並透過 **Vite** 提供開發伺服器與生產打包。SortableJS 仍由 CDN 引入，其餘原始碼由 Vite 直接打包。

### 前置需求

- Node.js 20+（含 npm）

### 快速開始

1. 安裝相依套件：

```bash
npm install
```

2. 啟動開發伺服器（熱重載）：

```bash
npm run dev
```

3. 瀏覽器開啟 Vite 提示的網址（預設 `http://localhost:5173`）即可開始創作。

### 其他常用指令

```bash
# 打包生產版本到 dist/
npm run build

# 本機預覽打包結果
npm run preview

# 執行 ESLint
npm run lint

# 執行 Prettier 格式檢查
npm run format:check

# 執行單元測試
npm test
```

### 部署

`master` 分支推送後，GitHub Actions 會自動執行 `npm ci && npm run build`
並將 `dist/` 部署到 GitHub Pages。
