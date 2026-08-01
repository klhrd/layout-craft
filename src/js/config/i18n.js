/**
 * i18n dictionary module for LayoutCraft Studio.
 *
 * Centralizes all user-facing strings so future locales can be added without
 * touching component code. English is the default (`en`) and the only fully
 * populated locale at the moment; a Traditional Chinese (`zh-TW`) entry is
 * started as a reference for future translation work.
 *
 * Usage:
 *   import { t } from './config/i18n.js';
 *   t('ui.save');           // -> 'Save'
 *   t('ui.storage.full');   // -> '...capacity full!...'
 *
 * Switch the active locale at runtime via:
 *   import { setLocale } from './config/i18n.js';
 *   setLocale('zh-TW');
 */

const DEFAULT_LOCALE = 'en';
let currentLocale = DEFAULT_LOCALE;

const DICTIONARY = {
    en: {
        ui: {
            brand: 'LayoutCraft Studio',
            mode: {
                visual: '🎨 Visual Mode',
                css: '💻 CSS Expert Mode',
            },
            project: {
                storageUse: 'Storage Use',
                new: '+ New',
                save: '💾 Save',
                saved: '✅ Saved',
                preview: '👁️ Preview',
                export: '💾 Export Project',
                newPrompt: 'Enter new project name:',
                existsAlert: 'Project name already exists!',
                exportProject: '📤 Export Project (.lcproj)',
                importProject: '📥 Import Project (.lcproj)',
                importSuccess: 'Project imported: {0}',
                importInvalid: 'Invalid .lcproj file — nothing was imported.',
            },
            panels: {
                cssBlocks: 'CSS Blocks',
                layoutCraft: 'LayoutCraft',
                canvasPlaceholder: 'Drag and drop elements here to start building...',
                inspector: 'Inspector',
                noSelection: 'Select an element on the canvas to edit its properties.',
                selectedElement: 'Selected Element',
                deleteElement: 'Delete Element',
                components: '🧩 Components',
                visualCssRules: 'Visual CSS Rules',
                visualCssHint: 'Create a selector, then drag CSS blocks inside it.',
                addSelectorPlaceholder: 'e.g., .my-card or h1:hover',
                addRule: '+ Add Rule',
            },
            labels: {
                id: 'ID',
                classes: 'Classes',
                textContent: 'Text Content',
                idPlaceholder: 'e.g., hero-section',
                classPlaceholder: 'e.g., container text-center',
                textPlaceholder: 'Enter inner text...',
            },
            detection: {
                detect: '🎯 Detect',
                blinking: '🎯 Blinking',
                selectorExistsAlert: 'Name exists!',
                collapse: 'Collapse rule',
                expand: 'Expand rule',
            },
            tokens: {
                title: 'Design Tokens',
                add: 'Add token',
                delete: 'Delete token',
                namePrompt: 'Enter token name (must start with --, e.g., --color-primary):',
                invalidName: 'Token names must start with --',
                exists: 'This token already exists',
                empty: 'No tokens yet. Click + to add a design token.',
                pickerTitle: 'Insert or save a design token',
                pickerEmpty: 'No tokens yet. Use "Save as token" to create one.',
                saveAsToken: 'Save as token',
            },
            inspector: {
                enterAttrPlaceholder: (attr) => `Enter ${attr}...`,
                styles: 'Styles',
                color: 'Color',
                bgColor: 'Background',
                fontSize: 'Font Size',
                fontWeight: 'Font Weight',
                textAlign: 'Text Align',
                padding: 'Padding',
                margin: 'Margin',
                borderRadius: 'Border Radius',
                fontFamily: 'Font Family',
                width: 'Width',
                height: 'Height',
                gap: 'Gap',
                opacity: 'Opacity',
                boxShadow: 'Box Shadow',
            },
            storage: {
                meterLabel: (used, total, pct) => `${used} MB / ${total} MB (${pct}%)`,
                capacityFull: '❌ LocalStorage capacity full! Delete some rules or text data.',
                defaultProject: 'Default_Project',
                newInnerText: 'Type something...',
                placeholderImageAlt: 'Placeholder Image',
            },
            backToEditor: '⬅️ Back to Editor',
            newElementText: (tag) => `New ${tag}`,
            history: {
                undo: '↶ Undo',
                redo: '↷ Redo',
            },
            canvas: {
                showOutlines: '🔲 Outlines',
                hideOutlines: '🔲 Outlines',
            },
            cloud: {
                signIn: 'Sign in',
                signOut: 'Sign out',
                signInWithEmail: 'Sign in with Email',
                signInWithGitHub: 'Sign in with GitHub',
                signInPrompt: 'Enter your email to receive a magic link:',
                sendMagicLink: 'Send magic link',
                syncing: 'Syncing...',
                saved: 'Cloud saved',
                offline: 'Offline',
                notInitialized: 'Cloud sync is not configured',
                conflictTitle: 'Cloud conflict',
                conflictMessage: 'A newer version of this project exists in the cloud.',
                pullFromCloud: 'Pull from cloud',
                keepLocal: 'Keep local',
                emailPlaceholder: 'you@example.com',
            },
            templates: {
                button: '📋 Templates',
                title: 'Template Gallery',
                searchPlaceholder: 'Search templates...',
                categoryAll: 'All',
                categoryMarketing: 'Marketing',
                categoryAppShell: 'App Shell',
                categoryForms: 'Forms',
                categoryEcommerce: 'E-commerce',
                replaceCanvas: 'Replace Canvas',
                appendToCanvas: 'Append to Canvas',
                cancel: 'Cancel',
                noTemplates: 'No templates match your search.',
            },
            ai: {
                title: 'AI Assistant',
                settings: 'Settings',
                baseUrl: 'Base URL',
                model: 'Model',
                apiKey: 'API key',
                settingsNote:
                    'Bring your own key — stored only in this browser, never in the project file. Works with any OpenAI-compatible endpoint (OpenRouter, Ollama, LM Studio...).',
                send: 'Generate',
                replace: 'Replace Canvas',
                insert: 'Insert Below',
                cancel: 'Cancel',
                working: 'Generating…',
                noKey: 'Set an API key in Settings first.',
                requestError: 'Request failed',
                emptyReply: 'The model returned an empty reply.',
                badReply: 'Could not parse the model reply — expected JSON with html + cssData.',
                applied: 'Applied to canvas.',
            },
        },
    },

    'zh-TW': {
        ui: {
            brand: 'LayoutCraft Studio',
            mode: {
                visual: '🎨 視覺模式',
                css: '💻 CSS 專家模式',
            },
            project: {
                storageUse: '儲存使用量',
                new: '+ 新建',
                save: '💾 儲存',
                saved: '✅ 已儲存',
                preview: '👁️ 預覽',
                export: '💾 匯出專案',
                newPrompt: '輸入新專案名稱：',
                existsAlert: '專案名稱已存在！',
                exportProject: '📤 匯出專案 (.lcproj)',
                importProject: '📥 匯入專案 (.lcproj)',
                importSuccess: '專案已匯入：{0}',
                importInvalid: '無效的 .lcproj 檔案 — 未匯入任何內容。',
            },
            panels: {
                cssBlocks: 'CSS 區塊',
                layoutCraft: 'LayoutCraft',
                canvasPlaceholder: '將元素拖放到此處開始構建...',
                inspector: '檢查器',
                noSelection: '在畫布上選擇一個元素以編輯其屬性。',
                selectedElement: '已選擇元素',
                deleteElement: '刪除元素',
                components: '🧩 元件庫',
                visualCssRules: '視覺化 CSS 規則',
                visualCssHint: '建立選擇器，然後將 CSS 區塊拖入其中。',
                addSelectorPlaceholder: '例如 .my-card 或 h1:hover',
                addRule: '+ 新增規則',
            },
            labels: {
                id: 'ID',
                classes: '類別',
                textContent: '文字內容',
                idPlaceholder: '例如 hero-section',
                classPlaceholder: '例如 container text-center',
                textPlaceholder: '輸入內部文字...',
            },
            detection: {
                detect: '🎯 檢測',
                blinking: '🎯 閃爍',
                selectorExistsAlert: '名稱已存在！',
                collapse: '收闔規則',
                expand: '展開規則',
            },
            tokens: {
                title: '設計 Token',
                add: '新增 Token',
                delete: '刪除 Token',
                namePrompt: '輸入 Token 名稱（須以 -- 開頭，例如 --color-primary）：',
                invalidName: 'Token 名稱必須以 -- 開頭',
                exists: '此 Token 已存在',
                empty: '尚無 Token。按 + 新增設計 Token。',
                pickerTitle: '插入或另存為設計 Token',
                pickerEmpty: '尚無 Token。用「另存為 Token」建立一個。',
                saveAsToken: '另存為 Token',
            },
            inspector: {
                enterAttrPlaceholder: (attr) => `輸入 ${attr}...`,
                styles: '樣式',
                color: '顏色',
                bgColor: '背景',
                fontSize: '字體大小',
                fontWeight: '字體粗細',
                textAlign: '文字對齊',
                padding: '內距',
                margin: '外距',
                borderRadius: '圓角',
                fontFamily: '字體',
                width: '寬度',
                height: '高度',
                gap: '間距',
                opacity: '不透明度',
                boxShadow: '陰影',
            },
            storage: {
                meterLabel: (used, total, pct) => `${used} MB / ${total} MB (${pct}%)`,
                capacityFull: '❌ LocalStorage 容量已滿！請刪除一些規則或文字資料。',
                defaultProject: 'Default_Project',
                newInnerText: '輸入一些內容...',
                placeholderImageAlt: '佔位圖片',
            },
            backToEditor: '⬅️ 返回編輯器',
            newElementText: (tag) => `新 ${tag}`,
            history: {
                undo: '↶ 復原',
                redo: '↷ 重做',
            },
            canvas: {
                showOutlines: '🔲 輪廓',
                hideOutlines: '🔲 輪廓',
            },
            cloud: {
                signIn: '登入',
                signOut: '登出',
                signInWithEmail: '使用電子郵件登入',
                signInWithGitHub: '使用 GitHub 登入',
                signInPrompt: '輸入您的電子郵件以接收魔法連結：',
                sendMagicLink: '發送魔法連結',
                syncing: '同步中...',
                saved: '雲端已儲存',
                offline: '離線',
                notInitialized: '雲端同步未設定',
                conflictTitle: '雲端衝突',
                conflictMessage: '此專案在雲端有較新的版本。',
                pullFromCloud: '從雲端拉取',
                keepLocal: '保留本地',
                emailPlaceholder: 'you@example.com',
            },
            templates: {
                button: '📋 模板',
                title: '模板庫',
                searchPlaceholder: '搜索模板...',
                categoryAll: '全部',
                categoryMarketing: '行銷',
                categoryAppShell: '應用外殼',
                categoryForms: '表單',
                categoryEcommerce: '電子商務',
                replaceCanvas: '替換畫布',
                appendToCanvas: '附加到畫布',
                cancel: '取消',
                noTemplates: '沒有符合搜索條件的模板。',
            },
            ai: {
                title: 'AI 助手',
                settings: '設定',
                baseUrl: 'Base URL',
                model: '模型',
                apiKey: 'API 金鑰',
                settingsNote:
                    '自備金鑰 — 僅儲存在此瀏覽器，絕不會寫入專案檔。相容任何 OpenAI 格式的端點（OpenRouter、Ollama、LM Studio...）。',
                send: '生成',
                replace: '替換畫布',
                insert: '插入到下方',
                cancel: '取消',
                working: '生成中…',
                noKey: '請先在設定中填入 API 金鑰。',
                requestError: '請求失敗',
                emptyReply: '模型回覆為空。',
                badReply: '無法解析模型回覆 — 預期為包含 html 與 cssData 的 JSON。',
                applied: '已套用到畫布。',
            },
        },
    },

    ja: {
        ui: {
            brand: 'LayoutCraft Studio',
            mode: {
                visual: '🎨 ビジュアルモード',
                css: '💻 CSS エキスパートモード',
            },
            project: {
                storageUse: 'ストレージ使用量',
                new: '+ 新規',
                save: '💾 保存',
                saved: '✅ 保存完了',
                preview: '👁️ プレビュー',
                export: '💾 プロジェクトをエクスポート',
                newPrompt: '新しいプロジェクト名を入力：',
                existsAlert: 'プロジェクト名は既に存在します！',
                exportProject: '📤 プロジェクトをエクスポート (.lcproj)',
                importProject: '📥 プロジェクトをインポート (.lcproj)',
                importSuccess: 'プロジェクトをインポートしました：{0}',
                importInvalid: '無効な .lcproj ファイル — 何もインポートされませんでした。',
            },
            panels: {
                cssBlocks: 'CSS ブロック',
                layoutCraft: 'LayoutCraft',
                canvasPlaceholder: '要素をここにドラッグ＆ドロップして構築を開始...',
                inspector: 'インスペクター',
                noSelection: 'キャンバス上の要素を選択してプロパティを編集します。',
                selectedElement: '選択された要素',
                deleteElement: '要素を削除',
                components: '🧩 コンポーネント',
                visualCssRules: 'ビジュアル CSS ルール',
                visualCssHint: 'セレクターを作成し、CSS ブロックをその中にドラッグします。',
                addSelectorPlaceholder: '例: .my-card または h1:hover',
                addRule: '+ ルールを追加',
            },
            labels: {
                id: 'ID',
                classes: 'クラス',
                textContent: 'テキスト内容',
                idPlaceholder: '例: hero-section',
                classPlaceholder: '例: container text-center',
                textPlaceholder: '内部テキストを入力...',
            },
            detection: {
                detect: '🎯 検出',
                blinking: '🎯 点滅',
                selectorExistsAlert: '名前は既に存在します！',
                collapse: 'ルールを折りたたむ',
                expand: 'ルールを展開',
            },
            tokens: {
                title: 'デザイントークン',
                add: 'トークンを追加',
                delete: 'トークンを削除',
                namePrompt: 'トークン名を入力（-- で始まる必要があります。例: --color-primary）：',
                invalidName: 'トークン名は -- で始まる必要があります',
                exists: 'このトークンは既に存在します',
                empty: 'トークンはまだありません。+ をクリックしてデザイントークンを追加。',
                pickerTitle: 'デザイントークンを挿入または保存',
                pickerEmpty: 'トークンはまだありません。「トークンとして保存」で作成できます。',
                saveAsToken: 'トークンとして保存',
            },
            inspector: {
                enterAttrPlaceholder: (attr) => `${attr} を入力...`,
                styles: 'スタイル',
                color: '色',
                bgColor: '背景',
                fontSize: 'フォントサイズ',
                fontWeight: 'フォントの太さ',
                textAlign: 'テキスト配置',
                padding: 'パディング',
                margin: 'マージン',
                borderRadius: '角丸',
                fontFamily: 'フォントファミリー',
                width: '幅',
                height: '高さ',
                gap: 'ギャップ',
                opacity: '不透明度',
                boxShadow: '影',
            },
            storage: {
                meterLabel: (used, total, pct) => `${used} MB / ${total} MB (${pct}%)`,
                capacityFull: '❌ LocalStorage の容量がいっぱいです！ルールまたはテキストデータを削除してください。',
                defaultProject: 'Default_Project',
                newInnerText: '何か入力してください...',
                placeholderImageAlt: 'プレースホルダー画像',
            },
            backToEditor: '⬅️ エディターに戻る',
            newElementText: (tag) => `新しい ${tag}`,
            history: {
                undo: '↶ 元に戻す',
                redo: '↷ やり直す',
            },
            canvas: {
                showOutlines: '🔲 アウトライン',
                hideOutlines: '🔲 アウトライン',
            },
            cloud: {
                signIn: 'サインイン',
                signOut: 'サインアウト',
                signInWithEmail: 'メールでサインイン',
                signInWithGitHub: 'GitHub でサインイン',
                signInPrompt: 'マジックリンクを受け取るメールアドレスを入力：',
                sendMagicLink: 'マジックリンクを送信',
                syncing: '同期中...',
                saved: 'クラウドに保存済み',
                offline: 'オフライン',
                notInitialized: 'クラウド同期が設定されていません',
                conflictTitle: 'クラウド競合',
                conflictMessage: 'このプロジェクトの新しいバージョンがクラウドにあります。',
                pullFromCloud: 'クラウドから取得',
                keepLocal: 'ローカルを維持',
                emailPlaceholder: 'you@example.com',
            },
            templates: {
                button: '📋 テンプレート',
                title: 'テンプレートギャラリー',
                searchPlaceholder: 'テンプレートを検索...',
                categoryAll: 'すべて',
                categoryMarketing: 'マーケティング',
                categoryAppShell: 'アプリシェル',
                categoryForms: 'フォーム',
                categoryEcommerce: 'Eコマース',
                replaceCanvas: 'キャンバスを置換',
                appendToCanvas: 'キャンバスに追加',
                cancel: 'キャンセル',
                noTemplates: '検索条件に一致するテンプレートがありません。',
            },
            ai: {
                title: 'AI アシスタント',
                settings: '設定',
                baseUrl: 'Base URL',
                model: 'モデル',
                apiKey: 'API キー',
                settingsNote:
                    'ご自身のキーをお使いください — このブラウザにのみ保存され、プロジェクトファイルには書き込まれません。OpenAI 互換のエンドポイント（OpenRouter、Ollama、LM Studio...）で動作します。',
                send: '生成',
                replace: 'キャンバスを置換',
                insert: '下に挿入',
                cancel: 'キャンセル',
                working: '生成中…',
                noKey: '先に設定で API キーを入力してください。',
                requestError: 'リクエストに失敗しました',
                emptyReply: 'モデルの応答が空でした。',
                badReply: 'モデルの応答を解析できませんでした — html と cssData を含む JSON が必要です。',
                applied: 'キャンバスに適用しました。',
            },
        },
    },
};

/**
 * Look up a dotted path in the active locale dictionary.
 * Supports nested keys via dots (e.g. 'ui.mode.visual').
 * If the function-shaped leaf receives args, it is invoked and its return
 * value used; otherwise the value is returned as-is for strings/numbers.
 *
 * Falls back to the default locale (`en`) when a key is missing for the
 * active locale, and ultimately to the raw key path when neither has it.
 */
export function t(path, ...args) {
    const lookup = (locale) => {
        const parts = path.split('.');
        let node = DICTIONARY[locale];
        for (const part of parts) {
            if (node && typeof node === 'object' && part in node) node = node[part];
            else return undefined;
        }
        return node;
    };

    let value = lookup(currentLocale);
    if (value === undefined) value = lookup(DEFAULT_LOCALE);
    if (value === undefined) return path;

    return typeof value === 'function' ? value(...args) : value;
}

export function setLocale(locale) {
    if (DICTIONARY[locale]) currentLocale = locale;
}

export function getLocale() {
    return currentLocale;
}
