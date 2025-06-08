/**
 * HaMoney - 主程式模組
 * 協調所有功能模組並處理用戶界面邏輯
 */

class HaMoneyMain {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    /**
     * 初始化應用程式
     */
    init() {
        // 等待DOM載入完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    /**
     * DOM載入完成後的初始化
     */
    onDOMReady() {
        // 初始化語言選擇器
        this.initLanguageSelector();
        
        this.initNavigation();
        this.initEventListeners();
        this.loadInitialData();
        this.showSection('home');
        
        console.log('HaMoney 應用程式已載入');
        this.showNotification('歡迎使用 HaMoney！', 'success');
    }

    /**
     * 初始化語言選擇器
     */
    initLanguageSelector() {
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector && window.haMoneyLanguageManager) {
            languageSelector.innerHTML = window.haMoneyLanguageManager.generateLanguageSelector();
        }
    }

    /**
     * 初始化導航功能
     */
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    this.showSection(sectionId);
                }
            });
        });
    }

    /**
     * 初始化事件監聽器
     */
    initEventListeners() {
        // 開始分帳按鈕
        const proceedToSplitBtn = document.getElementById('proceedToSplitBtn');
        if (proceedToSplitBtn) {
            proceedToSplitBtn.addEventListener('click', () => this.proceedToSplit());
        }

        // 功能卡片點擊
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const sections = ['scanner', 'calculator', 'records'];
                if (sections[index]) {
                    this.showSection(sections[index]);
                }
            });
        });

        // 登入登出按鈕事件
        document.addEventListener('click', (e) => {
            if (e.target.id === 'loginButton' || e.target.closest('#loginButton')) {
                e.preventDefault();
                this.handleLogin();
            }
            
            if (e.target.id === 'logoutButton' || e.target.closest('#logoutButton')) {
                e.preventDefault();
                this.handleLogout();
            }
        });
    }

    /**
     * 載入初始數據
     */
    loadInitialData() {
        try {
            // 檢查本地存儲
            const stats = window.haMoneyStorage.getStorageStats();
            console.log('存儲統計:', stats);

            // 載入設置
            const settings = window.haMoneyStorage.getSettings();
            console.log('應用設置:', settings);

            // 測試API連接（可選）
            this.testAPIConnection();

        } catch (error) {
            console.error('載入初始數據失敗:', error);
            this.showNotification('載入數據時發生錯誤', 'warning');
        }
    }

    /**
     * 測試API連接
     */
    async testAPIConnection() {
        try {
            const isConnected = await window.haMoneyAPI.testConnection();
            if (isConnected) {
                console.log('API連接正常');
            } else {
                console.warn('API連接異常');
            }
        } catch (error) {
            console.warn('API連接測試失敗:', error);
        }
    }

    /**
     * 顯示指定區域
     * @param {string} sectionId - 區域ID
     */
    showSection(sectionId) {
        // 隱藏所有區域
        const sections = document.querySelectorAll('.section-container');
        sections.forEach(section => {
            section.classList.add('d-none');
        });

        // 顯示指定區域
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('d-none');
            this.currentSection = sectionId;

            // 更新導航狀態
            this.updateNavigation(sectionId);

            // 根據區域執行特定初始化
            this.onSectionShow(sectionId);
        }
    }

    /**
     * 更新導航狀態
     * @param {string} activeSection - 活動區域ID
     */
    updateNavigation(activeSection) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeSection}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * 區域顯示時的回調
     * @param {string} sectionId - 區域ID
     */
    onSectionShow(sectionId) {
        switch (sectionId) {
            case 'scanner':
                this.onScannerShow();
                break;
            case 'groups':
                this.onGroupsShow();
                break;
            case 'records':
                this.onRecordsShow();
                break;
            case 'reports':
                this.onReportsShow();
                break;
        }
    }

    /**
     * 掃描區域顯示時的處理
     */
    onScannerShow() {
        // 重置掃描器狀態
        if (window.haMoneyScanner) {
            window.haMoneyScanner.reset();
        }
    }

    /**
     * 群組區域顯示時的處理
     */
    onGroupsShow() {
        // 載入並顯示群組列表
        this.loadGroups();
    }

    /**
     * 記錄區域顯示時的處理
     */
    onRecordsShow() {
        // 載入並顯示分帳記錄和欠款追蹤
        this.loadRecords();
        this.loadDebtTracking();
    }

    /**
     * 報告區域顯示時的處理
     */
    onReportsShow() {
        // 載入並顯示視覺報告
        this.loadReports();
    }

    /**
     * 進入分帳流程
     */
    proceedToSplit() {
        const analysisResult = window.haMoneyScanner.getCurrentAnalysisResult();
        if (!analysisResult) {
            this.showNotification('請先完成單據分析', 'warning');
            return;
        }

        // 創建一個簡單的分帳示例
        this.showSplitDemo(analysisResult);
    }

    /**
     * 顯示分帳示例
     * @param {Object} analysisResult - 分析結果
     */
    showSplitDemo(analysisResult) {
        // 創建示例成員
        const demoMembers = [
            { id: 'member1', name: '張三' },
            { id: 'member2', name: '李四' },
            { id: 'member3', name: '王五' }
        ];

        try {
            // 計算平均分帳
            const splitResult = window.haMoneyCalculator.calculateEqualSplit(
                analysisResult.totalAmount,
                demoMembers
            );

            // 顯示結果
            this.showSplitResult(splitResult, analysisResult);

        } catch (error) {
            console.error('分帳計算失敗:', error);
            this.showNotification(`分帳失敗: ${error.message}`, 'error');
        }
    }

    /**
     * 顯示分帳結果
     * @param {Object} splitResult - 分帳結果
     * @param {Object} originalData - 原始數據
     */
    showSplitResult(splitResult, originalData) {
        const summary = window.haMoneyCalculator.generateSummary(splitResult);
        
        // 創建模態框顯示結果
        const modalHtml = `
            <div class="modal fade" id="splitResultModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">分帳結果</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>單據資訊</h6>
                                    <p><strong>商店:</strong> ${originalData.storeName}</p>
                                    <p><strong>日期:</strong> ${originalData.date}</p>
                                    <p><strong>總金額:</strong> <span class="text-success fs-5">HK$ ${originalData.totalAmount.toFixed(2)}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <h6>分帳詳情</h6>
                                    ${splitResult.members.map(member => `
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>${member.name}:</span>
                                            <strong class="text-primary">HK$ ${member.amount.toFixed(2)}</strong>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <hr>
                            <div class="alert alert-info">
                                <h6>摘要</h6>
                                <pre style="white-space: pre-wrap; font-family: inherit;">${summary}</pre>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                            <button type="button" class="btn btn-success" onclick="haMoneyMain.saveSplitRecord('${JSON.stringify(splitResult).replace(/"/g, '&quot;')}', '${JSON.stringify(originalData).replace(/"/g, '&quot;')}')">保存記錄</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的模態框
        const oldModal = document.getElementById('splitResultModal');
        if (oldModal) {
            oldModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('splitResultModal'));
        modal.show();
    }

    /**
     * 保存分帳記錄
     * @param {string} splitResultJson - 分帳結果JSON
     * @param {string} originalDataJson - 原始數據JSON
     */
    saveSplitRecord(splitResultJson, originalDataJson) {
        try {
            const splitResult = JSON.parse(splitResultJson.replace(/&quot;/g, '"'));
            const originalData = JSON.parse(originalDataJson.replace(/&quot;/g, '"'));

            // 創建記錄對象
            const record = {
                title: `${originalData.storeName} - ${originalData.date}`,
                receiptData: originalData,
                splitResult: splitResult,
                status: 'active'
            };

            // 保存到存儲
            window.haMoneyStorage.addRecord(record);

            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('splitResultModal'));
            if (modal) {
                modal.hide();
            }

            this.showNotification('分帳記錄已保存！', 'success');

            // 跳轉到記錄頁面
            setTimeout(() => {
                this.showSection('records');
            }, 1000);

        } catch (error) {
            console.error('保存記錄失敗:', error);
            this.showNotification('保存失敗，請重試', 'error');
        }
    }

    /**
     * 載入群組列表
     */
    loadGroups() {
        if (window.haMoneyGroupManager) {
            const groupContainer = document.getElementById('group-management-content');
            if (groupContainer) {
                groupContainer.innerHTML = window.haMoneyGroupManager.generateGroupManagementUI();
            }
        }
    }

    /**
     * 載入欠款追蹤
     */
    loadDebtTracking() {
        if (window.haMoneyDebtTracker) {
            const debtContainer = document.getElementById('debt-tracking-content');
            if (debtContainer) {
                debtContainer.innerHTML = window.haMoneyDebtTracker.generateDebtTrackingUI();
            }
        }
    }

    /**
     * 載入視覺報告
     */
    loadReports() {
        if (window.haMoneyChartManager) {
            const reportsContainer = document.getElementById('reports-content');
            if (reportsContainer) {
                reportsContainer.innerHTML = window.haMoneyChartManager.generateReportsUI();
                // 載入圖表
                setTimeout(() => {
                    window.haMoneyChartManager.loadAllCharts();
                }, 100);
            }
        }
    }

    /**
     * 載入分帳記錄
     */
    loadRecords() {
        const records = window.haMoneyStorage.getRecords();
        console.log('載入記錄:', records);
        
        const recordsContainer = document.querySelector('#records .text-center');
        if (recordsContainer && records.length > 0) {
            recordsContainer.innerHTML = `
                <h2><i class="bi bi-list-ul"></i> 分帳記錄</h2>
                <div class="row">
                    ${records.slice(0, 5).map(record => `
                        <div class="col-md-6 mb-3">
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title">${record.title}</h6>
                                    <p class="card-text">
                                        總金額: <strong class="text-success">HK$ ${record.splitResult.totalAmount.toFixed(2)}</strong><br>
                                        參與人數: ${record.splitResult.members.length}人<br>
                                        日期: ${new Date(record.createdAt).toLocaleDateString('zh-HK')}
                                    </p>
                                    <span class="badge bg-${record.status === 'active' ? 'success' : 'secondary'}">${record.status === 'active' ? '進行中' : '已完成'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${records.length > 5 ? `<p class="text-muted mt-3">顯示最近 5 筆記錄，共 ${records.length} 筆</p>` : ''}
            `;
        }
    }

    /**
     * 顯示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知類型
     */
    showNotification(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.getElementById('notificationToast');
        
        if (!toast || !toastContainer) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }

        // 設置圖標和顏色
        const iconMap = {
            success: 'bi-check-circle text-success',
            error: 'bi-exclamation-triangle text-danger',
            warning: 'bi-exclamation-triangle text-warning',
            info: 'bi-info-circle text-primary'
        };

        const icon = toast.querySelector('.toast-header i');
        const body = toast.querySelector('.toast-body');
        
        if (icon) {
            icon.className = `bi ${iconMap[type] || iconMap.info} me-2`;
        }
        
        if (body) {
            body.textContent = message;
        }

        // 顯示通知
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: type === 'error' ? 5000 : 3000
        });
        bsToast.show();
    }

    /**
     * 獲取當前區域
     * @returns {string} 當前區域ID
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * 重置應用程式
     */
    reset() {
        this.showSection('home');
        if (window.haMoneyScanner) {
            window.haMoneyScanner.reset();
        }
    }

    /**
     * 處理用戶登入
     */
    async handleLogin() {
        try {
            await window.haMoneyAuth.signInWithGoogle();
        } catch (error) {
            console.error('登入處理失敗:', error);
        }
    }

    /**
     * 處理用戶登出
     */
    async handleLogout() {
        try {
            await window.haMoneyAuth.signOut();
        } catch (error) {
            console.error('登出處理失敗:', error);
        }
    }
}

// 創建全局主程式實例
window.haMoneyMain = new HaMoneyMain(); 