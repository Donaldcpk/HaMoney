/**
 * HaMoney - 載入動畫管理系統
 * 提供載入動畫、進度條等用戶體驗優化功能
 */

class HaMoneyLoadingManager {
    constructor() {
        this.activeLoadings = new Set();
        this.init();
    }

    init() {
        this.createLoadingStyles();
        this.bindEvents();
    }

    /**
     * 創建載入動畫樣式
     */
    createLoadingStyles() {
        if (document.getElementById('loading-styles')) return;

        const styles = `
            <style id="loading-styles">
                /* 全屏載入遮罩 */
                .hamoney-loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    backdrop-filter: blur(2px);
                }

                /* 載入動畫容器 */
                .hamoney-loading-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    max-width: 300px;
                    width: 90%;
                }

                /* 旋轉載入動畫 */
                .hamoney-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007bff;
                    border-radius: 50%;
                    animation: hamoney-spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes hamoney-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* 脈衝載入動畫 */
                .hamoney-pulse {
                    width: 50px;
                    height: 50px;
                    background-color: #007bff;
                    border-radius: 50%;
                    animation: hamoney-pulse 1.5s ease-in-out infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes hamoney-pulse {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0;
                    }
                }

                /* 進度條 */
                .hamoney-progress {
                    width: 100%;
                    height: 8px;
                    background-color: #f3f3f3;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 1rem 0;
                }

                .hamoney-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #007bff, #0056b3);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                    animation: hamoney-progress-shimmer 1.5s infinite;
                }

                @keyframes hamoney-progress-shimmer {
                    0% { background-position: -200px 0; }
                    100% { background-position: calc(200px + 100%) 0; }
                }

                /* 載入點動畫 */
                .hamoney-dots {
                    display: inline-block;
                }

                .hamoney-dots::after {
                    content: '';
                    animation: hamoney-dots 1.5s steps(4, end) infinite;
                }

                @keyframes hamoney-dots {
                    0%, 20% { content: ''; }
                    40% { content: '.'; }
                    60% { content: '..'; }
                    80%, 100% { content: '...'; }
                }

                /* 內聯載入動畫 */
                .hamoney-inline-loading {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .hamoney-mini-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #007bff;
                    border-radius: 50%;
                    animation: hamoney-spin 1s linear infinite;
                }

                /* 載入骨架屏 */
                .hamoney-skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: hamoney-skeleton-loading 1.5s infinite;
                }

                @keyframes hamoney-skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                .hamoney-skeleton-text {
                    height: 1rem;
                    border-radius: 4px;
                    margin: 0.5rem 0;
                }

                .hamoney-skeleton-title {
                    height: 1.5rem;
                    width: 60%;
                    border-radius: 4px;
                    margin: 1rem 0;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * 顯示全屏載入動畫
     * @param {string} message - 載入訊息
     * @param {string} type - 動畫類型 (spinner, pulse)
     * @returns {string} 載入ID
     */
    showFullScreenLoading(message = '載入中', type = 'spinner') {
        const loadingId = 'loading_' + Date.now();
        
        const animationHTML = type === 'pulse' 
            ? '<div class="hamoney-pulse"></div>'
            : '<div class="hamoney-spinner"></div>';

        const loadingHTML = `
            <div class="hamoney-loading-overlay" id="${loadingId}">
                <div class="hamoney-loading-content">
                    ${animationHTML}
                    <h6 class="mb-2">${message}</h6>
                    <small class="text-muted">請稍候<span class="hamoney-dots"></span></small>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        this.activeLoadings.add(loadingId);

        return loadingId;
    }

    /**
     * 顯示帶進度條的載入動畫
     * @param {string} message - 載入訊息
     * @param {number} progress - 進度百分比 (0-100)
     * @returns {string} 載入ID
     */
    showProgressLoading(message = '處理中', progress = 0) {
        const loadingId = 'progress_' + Date.now();

        const loadingHTML = `
            <div class="hamoney-loading-overlay" id="${loadingId}">
                <div class="hamoney-loading-content">
                    <div class="hamoney-spinner"></div>
                    <h6 class="mb-2">${message}</h6>
                    <div class="hamoney-progress">
                        <div class="hamoney-progress-bar" id="${loadingId}_bar" style="width: ${progress}%"></div>
                    </div>
                    <small class="text-muted" id="${loadingId}_text">${progress}%</small>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        this.activeLoadings.add(loadingId);

        return loadingId;
    }

    /**
     * 更新進度條
     * @param {string} loadingId - 載入ID
     * @param {number} progress - 進度百分比
     * @param {string} message - 更新訊息
     */
    updateProgress(loadingId, progress, message = null) {
        const progressBar = document.getElementById(`${loadingId}_bar`);
        const progressText = document.getElementById(`${loadingId}_text`);

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `${progress}%`;
        }

        if (message) {
            const loadingElement = document.getElementById(loadingId);
            const messageElement = loadingElement?.querySelector('h6');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    /**
     * 顯示內聯載入動畫
     * @param {HTMLElement} element - 目標元素
     * @param {string} message - 載入訊息
     */
    showInlineLoading(element, message = '載入中') {
        if (!element) return;

        const originalContent = element.innerHTML;
        element.dataset.originalContent = originalContent;

        element.innerHTML = `
            <div class="hamoney-inline-loading">
                <div class="hamoney-mini-spinner"></div>
                <span>${message}</span>
            </div>
        `;

        element.disabled = true;
    }

    /**
     * 顯示骨架屏載入
     * @param {string} containerId - 容器ID
     * @param {number} lines - 骨架行數
     */
    showSkeletonLoading(containerId, lines = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const skeletonHTML = Array(lines).fill(0).map((_, index) => {
            if (index === 0) {
                return '<div class="hamoney-skeleton hamoney-skeleton-title"></div>';
            }
            return '<div class="hamoney-skeleton hamoney-skeleton-text"></div>';
        }).join('');

        container.innerHTML = `<div class="p-3">${skeletonHTML}</div>`;
    }

    /**
     * 隱藏載入動畫
     * @param {string} loadingId - 載入ID
     */
    hideLoading(loadingId) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
            this.activeLoadings.delete(loadingId);
        }
    }

    /**
     * 恢復內聯載入元素
     * @param {HTMLElement} element - 目標元素
     */
    hideInlineLoading(element) {
        if (!element) return;

        const originalContent = element.dataset.originalContent;
        if (originalContent) {
            element.innerHTML = originalContent;
            element.disabled = false;
            delete element.dataset.originalContent;
        }
    }

    /**
     * 隱藏所有載入動畫
     */
    hideAllLoading() {
        this.activeLoadings.forEach(loadingId => {
            this.hideLoading(loadingId);
        });
        this.activeLoadings.clear();
    }

    /**
     * AI分析專用載入動畫
     * @param {string} imageUrl - 圖片URL
     * @returns {string} 載入ID
     */
    showAIAnalysisLoading(imageUrl = null) {
        const loadingId = 'ai_analysis_' + Date.now();

        const imageHTML = imageUrl 
            ? `<img src="${imageUrl}" alt="分析中的圖片" class="img-fluid rounded mb-3" style="max-height: 150px;">`
            : '';

        const loadingHTML = `
            <div class="hamoney-loading-overlay" id="${loadingId}">
                <div class="hamoney-loading-content">
                    ${imageHTML}
                    <div class="hamoney-pulse"></div>
                    <h6 class="mb-2">AI 正在分析您的帳單</h6>
                    <div class="hamoney-progress">
                        <div class="hamoney-progress-bar" id="${loadingId}_bar" style="width: 0%"></div>
                    </div>
                    <small class="text-muted" id="${loadingId}_status">正在上傳圖片...</small>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        this.activeLoadings.add(loadingId);

        // 模擬AI分析進度
        this.simulateAIProgress(loadingId);

        return loadingId;
    }

    /**
     * 模擬AI分析進度
     * @param {string} loadingId - 載入ID
     */
    simulateAIProgress(loadingId) {
        const stages = [
            { progress: 20, message: '圖片上傳完成...' },
            { progress: 40, message: '正在識別文字...' },
            { progress: 60, message: '正在解析金額...' },
            { progress: 80, message: '正在識別項目...' },
            { progress: 95, message: '即將完成...' }
        ];

        let currentStage = 0;

        const updateStage = () => {
            if (currentStage < stages.length) {
                const stage = stages[currentStage];
                this.updateProgress(loadingId, stage.progress);
                
                const statusElement = document.getElementById(`${loadingId}_status`);
                if (statusElement) {
                    statusElement.textContent = stage.message;
                }

                currentStage++;
                setTimeout(updateStage, 1000 + Math.random() * 1000);
            }
        };

        setTimeout(updateStage, 500);
    }

    /**
     * 顯示成功動畫
     * @param {string} message - 成功訊息
     * @param {number} duration - 顯示時長(毫秒)
     */
    showSuccessAnimation(message = '操作成功', duration = 2000) {
        const loadingId = 'success_' + Date.now();

        const loadingHTML = `
            <div class="hamoney-loading-overlay" id="${loadingId}">
                <div class="hamoney-loading-content">
                    <div class="text-success mb-3">
                        <i class="bi bi-check-circle" style="font-size: 3rem;"></i>
                    </div>
                    <h6 class="text-success">${message}</h6>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        this.activeLoadings.add(loadingId);

        setTimeout(() => {
            this.hideLoading(loadingId);
        }, duration);

        return loadingId;
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 監聽頁面載入
        document.addEventListener('DOMContentLoaded', () => {
            this.hideAllLoading();
        });

        // 監聽頁面卸載
        window.addEventListener('beforeunload', () => {
            this.hideAllLoading();
        });
    }

    /**
     * 為異步操作添加載入動畫
     * @param {Function} asyncFunction - 異步函數
     * @param {Object} options - 選項
     * @returns {Promise} 包裝後的Promise
     */
    async withLoading(asyncFunction, options = {}) {
        const {
            message = '載入中',
            type = 'spinner',
            showProgress = false
        } = options;

        let loadingId;
        
        if (showProgress) {
            loadingId = this.showProgressLoading(message);
        } else {
            loadingId = this.showFullScreenLoading(message, type);
        }

        try {
            const result = await asyncFunction();
            this.hideLoading(loadingId);
            return result;
        } catch (error) {
            this.hideLoading(loadingId);
            throw error;
        }
    }
}

// 創建全局載入管理實例
window.haMoneyLoadingManager = new HaMoneyLoadingManager(); 