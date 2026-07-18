import { compileAndRenderCss } from '../app.js';
import { makeElementSortable } from './canvas.js';
import { deselectAll } from './inspector.js';

const STORAGE_KEY_PREFIX = 'layoutcraft_proj_';
const LIST_KEY = 'layoutcraft_project_list';

let currentProjectName = 'Default_Project';

export function initStorage() {
    setupProjectList();
    bindStorageEvents();
    loadProject(currentProjectName); // 預設載入目前選中的專案
}

// 1. 初始化專案清單與下拉選單
function setupProjectList() {
    let list = JSON.parse(localStorage.getItem(LIST_KEY)) || [];
    if (list.length === 0) {
        list.push('Default_Project');
        localStorage.setItem(LIST_KEY, JSON.stringify(list));
    }
    
    const select = document.getElementById('select-project');
    select.innerHTML = '';
    list.forEach(proj => {
        const opt = document.createElement('option');
        opt.value = proj;
        opt.textContent = proj.replace(/_/g, ' ');
        select.appendChild(opt);
    });

    // 讀取上次使用者關閉網頁前停留的專案
    const lastActive = localStorage.getItem('layoutcraft_last_active_proj');
    if (lastActive && list.includes(lastActive)) {
        currentProjectName = lastActive;
        select.value = lastActive;
    }
}

function bindStorageEvents() {
    const select = document.getElementById('select-project');
    const btnNew = document.getElementById('btn-new-project');
    const btnSave = document.getElementById('btn-save-project');

    // 切換專案下拉選單
    select.addEventListener('change', () => {
        // 切換前自動幫舊專案存檔防呆
        saveProject(currentProjectName, false); 
        currentProjectName = select.value;
        localStorage.setItem('layoutcraft_last_active_proj', currentProjectName);
        loadProject(currentProjectName);
    });

    // 建立新專案
    btnNew.addEventListener('click', () => {
        const name = prompt('Enter new project name:');
        if (!name) return;
        const formattedName = name.trim().replace(/\s+/g, '_');
        
        let list = JSON.parse(localStorage.getItem(LIST_KEY)) || [];
        if (list.includes(formattedName)) {
            alert('Project name already exists!');
            return;
        }

        list.push(formattedName);
        localStorage.setItem(LIST_KEY, JSON.stringify(list));
        
        // 切換到新專案並清空畫布
        saveProject(currentProjectName, false);
        currentProjectName = formattedName;
        localStorage.setItem('layoutcraft_last_active_proj', currentProjectName);
        
        // 初始化新專案資料
        window.activeCssData = {}; 
        document.getElementById('canvas').innerHTML = '<div class="canvas-placeholder">Drag and drop elements here to start building...</div>';
        
        setupProjectList();
        select.value = currentProjectName;
        saveProject(currentProjectName, true);
    });

    // 手動點擊儲存按鈕
    btnSave.addEventListener('click', () => {
        saveProject(currentProjectName, true);
    });
}

// 2. 🖨️ 專案存檔實作
export function saveProject(projName, showAlert = false) {
    deselectAll(); // 存檔前清除選取狀態，避免將外框選取類別寫入存檔
    
    const canvasHtml = document.getElementById('canvas').innerHTML;
    const projectData = {
        html: canvasHtml,
        cssData: window.activeCssData || {}
    };

    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + projName, JSON.stringify(projectData));
        updateStorageMeter(); // 更新記憶體用量計
        if (showAlert) {
            const btn = document.getElementById('btn-save-project');
            btn.textContent = '✅ Saved';
            setTimeout(() => { btn.textContent = '💾 Save'; }, 1200);
        }
    } catch (e) {
        alert('❌ LocalStorage capacity full! Delete some rules or text data.');
    }
}

// 3. 📂 專案載入與 HTML 結構重建
export function loadProject(projName) {
    const rawData = localStorage.getItem(STORAGE_KEY_PREFIX + projName);
    const canvas = document.getElementById('canvas');
    const visualCssContainer = document.getElementById('visual-css-container');
    
    visualCssContainer.innerHTML = ''; // 清空右側圖形化 CSS 介面

    if (!rawData) {
        window.activeCssData = {};
        canvas.innerHTML = '<div class="canvas-placeholder">Drag and drop elements here to start building...</div>';
        compileAndRenderCss();
        updateStorageMeter();
        return;
    }

    const projectData = JSON.parse(rawData);
    canvas.innerHTML = projectData.html;
    window.activeCssData = projectData.cssData || {};

    // 💡 關鍵重構：恢復被載入 HTML 的拖拽與排序基因 (Sortable)
    const containerTags = ['div', 'section', 'header', 'footer', 'main', 'aside', 'nav', 'form', 'ul', 'ol', 'table', 'tr'];
    containerTags.forEach(tag => {
        canvas.querySelectorAll(tag).forEach(el => makeElementSortable(el));
    });
    makeElementSortable(canvas); // 畫布本體也要重新綁定

    // 💡 關鍵重構：從資料庫撈出 CSS 重新在右側渲染出對應的「圖形積木大盒子」
    // 這個方法是由 app.js 提供的全域還原介面
    if (window.rebuildCssRulesUI) {
        window.rebuildCssRulesUI();
    }

    compileAndRenderCss();
    updateStorageMeter();
}

// 4. 📊 核心記憶體計量器（精準測量 LocalStorage 總體積，預防炸掉）
export function updateStorageMeter() {
    let totalBytes = 0;
    // 遍歷所有 LocalStorage 鍵值，計算總體積
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        totalBytes += (key.length + val.length) * 2; // 瀏覽器使用 UTF-16 編碼，每個字元佔 2 Bytes
    }

    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const percentage = Math.min((totalBytes / (5 * 1024 * 1024)) * 100, 100).toFixed(1); // 假設標準上限為 5MB

    const textEl = document.getElementById('storage-text');
    const barEl = document.getElementById('storage-bar');

    if (textEl && barEl) {
        textEl.textContent = `${totalMB} MB / 5.00 MB (${percentage}%)`;
        barEl.style.width = `${percentage}%`;

        // 警示色切換
        if (percentage > 85) {
            barEl.style.backgroundColor = '#ef4444'; // 超過 85% 變紅，警告快炸了
        } else if (percentage > 60) {
            barEl.style.backgroundColor = '#f59e0b'; // 超過 60% 變橘
        } else {
            barEl.style.backgroundColor = '#2563eb'; // 安全範圍藍色
        }
    }
}