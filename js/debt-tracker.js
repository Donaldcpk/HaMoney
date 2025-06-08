/**
 * HaMoney - 欠款追蹤管理系統
 * 處理欠款記錄、計算和歷史管理
 */

class HaMoneyDebtTracker {
    constructor() {
        this.currentUser = null;
        this.debts = [];
        this.payments = [];
        this.monthlyStatistics = {};
        this.init();
    }

    /**
     * 初始化欠款追蹤系統
     */
    init() {
        this.loadData();
        this.bindEvents();
    }

    /**
     * 載入數據
     */
    loadData() {
        this.debts = window.haMoneyStorage.get('debts') || [];
        this.payments = window.haMoneyStorage.get('payments') || [];
        this.calculateMonthlyStatistics();
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 標記為已還款按鈕
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mark-paid-btn')) {
                const debtId = e.target.dataset.debtId;
                this.markAsPaid(debtId);
            }
            
            // 催收按鈕
            if (e.target.classList.contains('remind-btn')) {
                const debtId = e.target.dataset.debtId;
                this.sendReminder(debtId);
            }
            
            // 查看詳細記錄
            if (e.target.classList.contains('view-detail-btn')) {
                const debtId = e.target.dataset.debtId;
                this.showDebtDetail(debtId);
            }
        });
    }

    /**
     * 新增欠款記錄
     * @param {Object} debtData - 欠款數據
     */
    addDebt(debtData) {
        const debt = {
            id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            splittingId: debtData.splittingId,
            debtorId: debtData.debtorId,
            debtorName: debtData.debtorName,
            creditorId: debtData.creditorId,
            creditorName: debtData.creditorName,
            amount: debtData.amount,
            description: debtData.description,
            category: debtData.category || 'general', // general, food, transport, entertainment
            groupId: debtData.groupId,
            status: 'pending', // pending, paid, overdue
            createdAt: new Date().toISOString(),
            dueDate: debtData.dueDate || this.calculateDueDate(),
            reminders: []
        };

        this.debts.push(debt);
        this.saveDebts();
        this.calculateMonthlyStatistics();
        
        return debt;
    }

    /**
     * 標記欠款為已還清
     * @param {string} debtId - 欠款ID
     */
    markAsPaid(debtId) {
        const debt = this.debts.find(d => d.id === debtId);
        if (!debt) return;

        // 更新欠款狀態
        debt.status = 'paid';
        debt.paidAt = new Date().toISOString();

        // 創建還款記錄
        const payment = {
            id: 'payment_' + Date.now(),
            debtId: debtId,
            amount: debt.amount,
            payerId: debt.debtorId,
            payerName: debt.debtorName,
            receiverId: debt.creditorId,
            receiverName: debt.creditorName,
            paidAt: new Date().toISOString(),
            description: `還款：${debt.description}`
        };

        this.payments.push(payment);
        this.saveDebts();
        this.savePayments();
        this.calculateMonthlyStatistics();

        this.showNotification(`✅ ${debt.debtorName} 已還款 HK$ ${debt.amount.toFixed(2)}`, 'success');
        this.refreshDebtDisplay();
    }

    /**
     * 計算到期日
     */
    calculateDueDate() {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30天後到期
        return dueDate.toISOString();
    }

    /**
     * 計算每月統計數據
     */
    calculateMonthlyStatistics() {
        this.monthlyStatistics = {};
        
        // 按月份分組計算
        this.debts.forEach(debt => {
            const monthKey = debt.createdAt.substring(0, 7); // YYYY-MM
            
            if (!this.monthlyStatistics[monthKey]) {
                this.monthlyStatistics[monthKey] = {
                    totalAmount: 0,
                    paidAmount: 0,
                    pendingAmount: 0,
                    debtCount: 0,
                    paidCount: 0,
                    pendingCount: 0,
                    creditors: {},
                    debtors: {}
                };
            }
            
            const monthStats = this.monthlyStatistics[monthKey];
            monthStats.totalAmount += debt.amount;
            monthStats.debtCount++;
            
            if (debt.status === 'paid') {
                monthStats.paidAmount += debt.amount;
                monthStats.paidCount++;
            } else {
                monthStats.pendingAmount += debt.amount;
                monthStats.pendingCount++;
            }
            
            // 統計債權人
            if (!monthStats.creditors[debt.creditorName]) {
                monthStats.creditors[debt.creditorName] = 0;
            }
            monthStats.creditors[debt.creditorName] += debt.amount;
            
            // 統計債務人
            if (!monthStats.debtors[debt.debtorName]) {
                monthStats.debtors[debt.debtorName] = 0;
            }
            monthStats.debtors[debt.debtorName] += debt.amount;
        });
    }

    /**
     * 獲取用戶相關的欠款
     * @param {string} userId - 用戶ID
     */
    getUserDebts(userId) {
        return {
            owedByMe: this.debts.filter(d => d.debtorId === userId && d.status === 'pending'),
            owedToMe: this.debts.filter(d => d.creditorId === userId && d.status === 'pending'),
            myPayments: this.payments.filter(p => p.payerId === userId),
            receivedPayments: this.payments.filter(p => p.receiverId === userId)
        };
    }

    /**
     * 計算用戶餘額
     * @param {string} userId - 用戶ID
     */
    calculateUserBalance(userId) {
        const userDebts = this.getUserDebts(userId);
        
        const totalOwedByMe = userDebts.owedByMe.reduce((sum, debt) => sum + debt.amount, 0);
        const totalOwedToMe = userDebts.owedToMe.reduce((sum, debt) => sum + debt.amount, 0);
        
        return {
            balance: totalOwedToMe - totalOwedByMe,
            totalOwedByMe,
            totalOwedToMe,
            netPosition: totalOwedToMe - totalOwedByMe > 0 ? 'creditor' : 'debtor'
        };
    }

    /**
     * 獲取逾期欠款
     */
    getOverdueDebts() {
        const now = new Date();
        return this.debts.filter(debt => {
            if (debt.status !== 'pending') return false;
            const dueDate = new Date(debt.dueDate);
            return dueDate < now;
        });
    }

    /**
     * 發送提醒
     * @param {string} debtId - 欠款ID
     */
    sendReminder(debtId) {
        const debt = this.debts.find(d => d.id === debtId);
        if (!debt) return;

        const reminder = {
            sentAt: new Date().toISOString(),
            type: 'manual',
            message: `提醒：您欠 ${debt.creditorName} HK$ ${debt.amount.toFixed(2)} (${debt.description})`
        };

        debt.reminders.push(reminder);
        this.saveDebts();
        
        this.showNotification(`已發送提醒給 ${debt.debtorName}`, 'info');
    }

    /**
     * 顯示欠款詳細記錄
     * @param {string} debtId - 欠款ID
     */
    showDebtDetail(debtId) {
        const debt = this.debts.find(d => d.id === debtId);
        if (!debt) return;

        const modalHTML = `
            <div class="modal fade" id="debtDetailModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-receipt me-2"></i>欠款詳細記錄
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>基本資訊</h6>
                                    <table class="table table-sm">
                                        <tr><td>債務人：</td><td><strong>${debt.debtorName}</strong></td></tr>
                                        <tr><td>債權人：</td><td><strong>${debt.creditorName}</strong></td></tr>
                                        <tr><td>金額：</td><td><strong class="text-danger">HK$ ${debt.amount.toFixed(2)}</strong></td></tr>
                                        <tr><td>描述：</td><td>${debt.description}</td></tr>
                                        <tr><td>狀態：</td><td>${this.getStatusBadge(debt.status)}</td></tr>
                                        <tr><td>創建時間：</td><td>${new Date(debt.createdAt).toLocaleString('zh-HK')}</td></tr>
                                        <tr><td>到期日：</td><td>${new Date(debt.dueDate).toLocaleDateString('zh-HK')}</td></tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6>提醒記錄</h6>
                                    <div class="reminder-list" style="max-height: 200px; overflow-y: auto;">
                                        ${debt.reminders.length > 0 ? 
                                            debt.reminders.map(reminder => `
                                                <div class="alert alert-sm alert-info">
                                                    <small>
                                                        <i class="bi bi-bell me-1"></i>
                                                        ${new Date(reminder.sentAt).toLocaleString('zh-HK')}<br>
                                                        ${reminder.message}
                                                    </small>
                                                </div>
                                            `).join('') :
                                            '<p class="text-muted">尚無提醒記錄</p>'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                            ${debt.status === 'pending' ? `
                                <button type="button" class="btn btn-warning remind-btn" data-debt-id="${debt.id}">
                                    <i class="bi bi-bell me-1"></i>發送提醒
                                </button>
                                <button type="button" class="btn btn-success mark-paid-btn" data-debt-id="${debt.id}">
                                    <i class="bi bi-check-circle me-1"></i>標記已還款
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊modal
        const existingModal = document.getElementById('debtDetailModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('debtDetailModal'));
        modal.show();
    }

    /**
     * 獲取狀態徽章
     */
    getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge bg-warning">待還款</span>',
            paid: '<span class="badge bg-success">已還款</span>',
            overdue: '<span class="badge bg-danger">逾期</span>'
        };
        return badges[status] || badges.pending;
    }

    /**
     * 生成欠款追蹤界面
     */
    generateDebtTrackingUI() {
        const currentUser = window.haMoneyAuth.getCurrentUser();
        if (!currentUser) {
            return '<div class="alert alert-warning">請先登入以查看欠款記錄</div>';
        }

        const userDebts = this.getUserDebts(currentUser.uid);
        const userBalance = this.calculateUserBalance(currentUser.uid);
        const overdueDebts = this.getOverdueDebts();

        return `
            <div class="debt-tracking-container">
                <!-- 總覽卡片 -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-wallet2 text-primary mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">我的淨餘額</h6>
                                <h4 class="${userBalance.balance >= 0 ? 'text-success' : 'text-danger'}">
                                    ${userBalance.balance >= 0 ? '+' : ''}HK$ ${Math.abs(userBalance.balance).toFixed(2)}
                                </h4>
                                <small class="text-muted">${userBalance.netPosition === 'creditor' ? '別人欠我' : '我欠別人'}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-arrow-down-circle text-danger mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">我要還的錢</h6>
                                <h4 class="text-danger">HK$ ${userBalance.totalOwedByMe.toFixed(2)}</h4>
                                <small class="text-muted">${userDebts.owedByMe.length} 筆欠款</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-arrow-up-circle text-success mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">別人欠我的錢</h6>
                                <h4 class="text-success">HK$ ${userBalance.totalOwedToMe.toFixed(2)}</h4>
                                <small class="text-muted">${userDebts.owedToMe.length} 筆欠款</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-exclamation-triangle text-warning mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">逾期欠款</h6>
                                <h4 class="text-warning">${overdueDebts.length}</h4>
                                <small class="text-muted">筆逾期</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 欠款清單 -->
                <div class="row">
                    <!-- 我要還的錢 -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-danger text-white">
                                <h6 class="mb-0"><i class="bi bi-arrow-down-circle me-2"></i>我要還的錢</h6>
                            </div>
                            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                                ${userDebts.owedByMe.length > 0 ? 
                                    userDebts.owedByMe.map(debt => `
                                        <div class="debt-item border rounded p-3 mb-2 ${new Date(debt.dueDate) < new Date() ? 'border-danger' : ''}">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 class="mb-1">${debt.creditorName}</h6>
                                                    <p class="text-muted mb-1">${debt.description}</p>
                                                    <small class="text-muted">
                                                        到期：${new Date(debt.dueDate).toLocaleDateString('zh-HK')}
                                                    </small>
                                                </div>
                                                <div class="text-end">
                                                    <h5 class="text-danger mb-1">HK$ ${debt.amount.toFixed(2)}</h5>
                                                    <div class="btn-group-vertical btn-group-sm">
                                                        <button class="btn btn-success btn-sm mark-paid-btn" data-debt-id="${debt.id}">
                                                            <i class="bi bi-check"></i> 已還款
                                                        </button>
                                                        <button class="btn btn-outline-info btn-sm view-detail-btn" data-debt-id="${debt.id}">
                                                            <i class="bi bi-eye"></i> 詳細
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') :
                                    '<p class="text-center text-muted">沒有待還款項目 👍</p>'
                                }
                            </div>
                        </div>
                    </div>

                    <!-- 別人欠我的錢 -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="bi bi-arrow-up-circle me-2"></i>別人欠我的錢</h6>
                            </div>
                            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                                ${userDebts.owedToMe.length > 0 ? 
                                    userDebts.owedToMe.map(debt => `
                                        <div class="debt-item border rounded p-3 mb-2 ${new Date(debt.dueDate) < new Date() ? 'border-warning' : ''}">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 class="mb-1">${debt.debtorName}</h6>
                                                    <p class="text-muted mb-1">${debt.description}</p>
                                                    <small class="text-muted">
                                                        到期：${new Date(debt.dueDate).toLocaleDateString('zh-HK')}
                                                    </small>
                                                </div>
                                                <div class="text-end">
                                                    <h5 class="text-success mb-1">HK$ ${debt.amount.toFixed(2)}</h5>
                                                    <div class="btn-group-vertical btn-group-sm">
                                                        <button class="btn btn-warning btn-sm remind-btn" data-debt-id="${debt.id}">
                                                            <i class="bi bi-bell"></i> 提醒
                                                        </button>
                                                        <button class="btn btn-outline-info btn-sm view-detail-btn" data-debt-id="${debt.id}">
                                                            <i class="bi bi-eye"></i> 詳細
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') :
                                    '<p class="text-center text-muted">沒有應收款項目</p>'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 月度統計 -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="bi bi-bar-chart me-2"></i>月度統計</h6>
                            </div>
                            <div class="card-body">
                                ${this.generateMonthlyStatistics()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成月度統計
     */
    generateMonthlyStatistics() {
        const months = Object.keys(this.monthlyStatistics).sort().reverse().slice(0, 6);
        
        if (months.length === 0) {
            return '<p class="text-center text-muted">暫無統計數據</p>';
        }

        return `
            <div class="row">
                ${months.map(month => {
                    const stats = this.monthlyStatistics[month];
                    return `
                        <div class="col-md-4 mb-3">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title">${month}</h6>
                                    <div class="row text-center">
                                        <div class="col-4">
                                            <div class="text-primary">
                                                <strong>HK$ ${stats.totalAmount.toFixed(2)}</strong>
                                                <br><small>總金額</small>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="text-success">
                                                <strong>${stats.paidCount}</strong>
                                                <br><small>已還</small>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="text-warning">
                                                <strong>${stats.pendingCount}</strong>
                                                <br><small>待還</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * 刷新欠款顯示
     */
    refreshDebtDisplay() {
        const debtContainer = document.getElementById('debt-tracking-content');
        if (debtContainer) {
            debtContainer.innerHTML = this.generateDebtTrackingUI();
        }
    }

    /**
     * 保存欠款數據
     */
    saveDebts() {
        window.haMoneyStorage.set('debts', this.debts);
    }

    /**
     * 保存還款數據
     */
    savePayments() {
        window.haMoneyStorage.set('payments', this.payments);
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        if (window.haMoneyMain && window.haMoneyMain.showNotification) {
            window.haMoneyMain.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 創建全局欠款追蹤實例
window.haMoneyDebtTracker = new HaMoneyDebtTracker(); 