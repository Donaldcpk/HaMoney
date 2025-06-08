/**
 * HaMoney - 分帳流程模組
 * 處理詳細的分帳設定和流程管理
 */

class HaMoneySplitting {
    constructor() {
        this.currentReceipt = null;
        this.currentGroup = null;
        this.splitSettings = {
            participants: [],
            payerId: null,
            splitMethod: 'equal', // equal, percentage, custom, item
            serviceFee: 0,
            serviceFeeType: 'percentage', // percentage, fixed
            tip: 0,
            tipType: 'percentage'
        };
        this.init();
    }

    /**
     * 初始化分帳流程
     */
    init() {
        this.bindEvents();
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 開始分帳按鈕
        document.addEventListener('click', (e) => {
            if (e.target.id === 'proceedToSplitBtn' || e.target.closest('#proceedToSplitBtn')) {
                e.preventDefault();
                this.startSplittingProcess();
            }
        });

        // 分帳設定表單提交
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'splittingForm') {
                e.preventDefault();
                this.processSplitting();
            }
        });

        // 動態更新計算
        document.addEventListener('input', (e) => {
            if (e.target.closest('#splittingSettings')) {
                this.updateCalculation();
            }
        });
    }

    /**
     * 開始分帳流程
     */
    startSplittingProcess() {
        // 獲取掃描結果
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults || analysisResults.classList.contains('d-none')) {
            this.showNotification('請先掃描單據', 'warning');
            return;
        }

        // 檢查用戶是否登入
        if (!window.haMoneyAuth.isSignedIn()) {
            this.showNotification('請先登入以使用分帳功能', 'warning');
            return;
        }

        // 獲取單據資訊
        this.currentReceipt = this.extractReceiptData();
        
        // 顯示分帳設定界面
        this.showSplittingSettings();
    }

    /**
     * 提取單據資料
     */
    extractReceiptData() {
        const totalAmountEl = document.getElementById('totalAmount');
        const receiptDateEl = document.getElementById('receiptDate');
        const storeNameEl = document.getElementById('storeName');
        const itemsListEl = document.getElementById('itemsList');

        const receipt = {
            totalAmount: parseFloat(totalAmountEl.textContent.replace('HK$ ', '').replace(',', '')) || 0,
            date: receiptDateEl.textContent || new Date().toISOString().split('T')[0],
            storeName: storeNameEl.textContent || '未知商店',
            items: []
        };

        // 提取項目清單
        const itemElements = itemsListEl.querySelectorAll('.list-group-item');
        itemElements.forEach(itemEl => {
            const nameEl = itemEl.querySelector('.item-name');
            const priceEl = itemEl.querySelector('.item-price');
            
            if (nameEl && priceEl) {
                receipt.items.push({
                    name: nameEl.textContent,
                    price: parseFloat(priceEl.textContent.replace('HK$ ', '').replace(',', '')) || 0
                });
            }
        });

        return receipt;
    }

    /**
     * 顯示分帳設定界面
     */
    showSplittingSettings() {
        const settingsHTML = `
            <div class="modal fade" id="splittingModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-calculator me-2"></i>分帳設定
                            </h5>
                        </div>
                        <div class="modal-body" id="splittingSettings">
                            <form id="splittingForm">
                                <!-- 基本資訊 -->
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="bi bi-receipt me-2"></i>單據資訊</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-4">
                                                <strong>商店：</strong>${this.currentReceipt.storeName}
                                            </div>
                                            <div class="col-md-4">
                                                <strong>日期：</strong>${this.currentReceipt.date}
                                            </div>
                                            <div class="col-md-4">
                                                <strong>小計：</strong>HK$ ${this.currentReceipt.totalAmount.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 參與者設定 -->
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="bi bi-people me-2"></i>參與者設定</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label class="form-label">選擇群組或新增參與者：</label>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <select class="form-select" id="groupSelect">
                                                        <option value="">選擇已存在的群組</option>
                                                        <!-- 動態載入群組 -->
                                                    </select>
                                                </div>
                                                <div class="col-md-6">
                                                    <button type="button" class="btn btn-outline-primary" id="addParticipantBtn">
                                                        <i class="bi bi-person-plus me-1"></i>新增參與者
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div id="participantsList">
                                            <!-- 動態生成參與者清單 -->
                                        </div>
                                        
                                        <div class="mt-3">
                                            <label class="form-label">誰先付款？</label>
                                            <select class="form-select" id="payerSelect" required>
                                                <option value="">請選擇付款人</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- 額外費用設定 -->
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="bi bi-plus-circle me-2"></i>額外費用</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <label class="form-label">服務費</label>
                                                <div class="input-group">
                                                    <input type="number" class="form-control" id="serviceFee" min="0" step="0.01" value="0">
                                                    <select class="form-select" id="serviceFeeType" style="max-width: 120px;">
                                                        <option value="percentage">%</option>
                                                        <option value="fixed">HK$</option>
                                                    </select>
                                                </div>
                                                <small class="form-text text-muted">通常是10%服務費</small>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">小費</label>
                                                <div class="input-group">
                                                    <input type="number" class="form-control" id="tip" min="0" step="0.01" value="0">
                                                    <select class="form-select" id="tipType" style="max-width: 120px;">
                                                        <option value="percentage">%</option>
                                                        <option value="fixed">HK$</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 分帳方式 -->
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="bi bi-calculator me-2"></i>分帳方式</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="splitMethod" id="equalSplit" value="equal" checked>
                                                    <label class="form-check-label" for="equalSplit">
                                                        <i class="bi bi-distribute-horizontal me-1"></i>平均分攤
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="splitMethod" id="percentageSplit" value="percentage">
                                                    <label class="form-check-label" for="percentageSplit">
                                                        <i class="bi bi-percent me-1"></i>按比例分攤
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="splitMethod" id="customSplit" value="custom">
                                                    <label class="form-check-label" for="customSplit">
                                                        <i class="bi bi-gear me-1"></i>自定義金額
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="splitMethod" id="itemSplit" value="item">
                                                    <label class="form-check-label" for="itemSplit">
                                                        <i class="bi bi-list-check me-1"></i>按項目分攤
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div id="splitDetails" class="mt-3">
                                            <!-- 根據選擇的分帳方式動態生成詳細設定 -->
                                        </div>
                                    </div>
                                </div>

                                <!-- 計算預覽 -->
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <h6 class="mb-0"><i class="bi bi-calculator me-2"></i>費用計算預覽</h6>
                                    </div>
                                    <div class="card-body">
                                        <div id="calculationPreview">
                                            <!-- 動態生成計算結果 -->
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="submit" form="splittingForm" class="btn btn-primary">
                                <i class="bi bi-check-circle me-1"></i>確認分帳
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的modal
        const existingModal = document.getElementById('splittingModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 插入新的modal
        document.body.insertAdjacentHTML('beforeend', settingsHTML);

        // 初始化modal
        const modal = new bootstrap.Modal(document.getElementById('splittingModal'));
        modal.show();

        // 載入資料和綁定事件
        this.loadGroupsAndParticipants();
        this.bindSplittingEvents();
        this.addDefaultParticipant();
    }

    /**
     * 載入群組和參與者資料
     */
    loadGroupsAndParticipants() {
        const groups = window.haMoneyStorage.get('groups') || [];
        const groupSelect = document.getElementById('groupSelect');
        
        // 清空並重新填入群組選項
        groupSelect.innerHTML = '<option value="">選擇已存在的群組</option>';
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = `${group.name} (${group.members.length}人)`;
            groupSelect.appendChild(option);
        });
    }

    /**
     * 綁定分帳設定事件
     */
    bindSplittingEvents() {
        // 新增參與者
        document.getElementById('addParticipantBtn').addEventListener('click', () => {
            this.addParticipant();
        });

        // 群組選擇變化
        document.getElementById('groupSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadGroupMembers(e.target.value);
            }
        });

        // 分帳方式變化
        document.querySelectorAll('input[name="splitMethod"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateSplitDetails();
                this.updateCalculation();
            });
        });

        // 實時計算更新
        ['serviceFee', 'serviceFeeType', 'tip', 'tipType'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateCalculation());
            }
        });
    }

    /**
     * 新增預設參與者（當前用戶）
     */
    addDefaultParticipant() {
        const currentUser = window.haMoneyAuth.getCurrentUser();
        if (currentUser) {
            this.addParticipant(currentUser.displayName, currentUser.uid);
        }
    }

    /**
     * 新增參與者
     */
    addParticipant(name = '', id = null) {
        const participantId = id || 'participant_' + Date.now();
        const participantHTML = `
            <div class="participant-item border rounded p-3 mb-2" data-participant-id="${participantId}">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <input type="text" class="form-control participant-name" placeholder="參與者姓名" value="${name}" required>
                    </div>
                    <div class="col-md-4">
                        <button type="button" class="btn btn-outline-danger btn-sm remove-participant">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('participantsList').insertAdjacentHTML('beforeend', participantHTML);

        // 更新付款人選項
        this.updatePayerOptions();

        // 綁定移除事件
        const removeBtn = document.querySelector(`[data-participant-id="${participantId}"] .remove-participant`);
        removeBtn.addEventListener('click', () => {
            document.querySelector(`[data-participant-id="${participantId}"]`).remove();
            this.updatePayerOptions();
            this.updateCalculation();
        });
    }

    /**
     * 更新付款人選項
     */
    updatePayerOptions() {
        const payerSelect = document.getElementById('payerSelect');
        const participants = document.querySelectorAll('.participant-name');
        
        payerSelect.innerHTML = '<option value="">請選擇付款人</option>';
        
        participants.forEach((input, index) => {
            if (input.value.trim()) {
                const option = document.createElement('option');
                option.value = input.closest('.participant-item').dataset.participantId;
                option.textContent = input.value;
                payerSelect.appendChild(option);
            }
        });
    }

    /**
     * 載入群組成員
     */
    loadGroupMembers(groupId) {
        const groups = window.haMoneyStorage.get('groups') || [];
        const group = groups.find(g => g.id === groupId);
        
        if (group) {
            // 清空現有參與者
            document.getElementById('participantsList').innerHTML = '';
            
            // 添加群組成員
            group.members.forEach(member => {
                this.addParticipant(member.name, member.id);
            });
            
            this.currentGroup = group;
        }
    }

    /**
     * 更新分帳詳細設定
     */
    updateSplitDetails() {
        const splitMethod = document.querySelector('input[name="splitMethod"]:checked').value;
        const splitDetails = document.getElementById('splitDetails');
        
        let detailsHTML = '';
        
        switch (splitMethod) {
            case 'percentage':
                detailsHTML = this.generatePercentageDetails();
                break;
            case 'custom':
                detailsHTML = this.generateCustomDetails();
                break;
            case 'item':
                detailsHTML = this.generateItemDetails();
                break;
            default:
                detailsHTML = '<p class="text-muted">所有參與者平均分攤費用</p>';
        }
        
        splitDetails.innerHTML = detailsHTML;
    }

    /**
     * 生成按比例分攤詳細設定
     */
    generatePercentageDetails() {
        const participants = this.getParticipants();
        let html = '<div class="alert alert-info">請設定每位參與者的分攤比例（總和應為100%）</div>';
        
        participants.forEach(participant => {
            html += `
                <div class="row mb-2 align-items-center">
                    <div class="col-6">
                        <span>${participant.name}</span>
                    </div>
                    <div class="col-6">
                        <div class="input-group">
                            <input type="number" class="form-control percentage-input" 
                                   data-participant-id="${participant.id}" 
                                   min="0" max="100" step="0.1" value="0">
                            <span class="input-group-text">%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '<div id="percentageTotal" class="mt-2 text-muted">總計: 0%</div>';
        
        return html;
    }

    /**
     * 更新計算預覽
     */
    updateCalculation() {
        const participants = this.getParticipants();
        if (participants.length === 0) return;

        const subtotal = this.currentReceipt.totalAmount;
        const serviceFee = this.calculateServiceFee(subtotal);
        const tip = this.calculateTip(subtotal);
        const total = subtotal + serviceFee + tip;

        const splitMethod = document.querySelector('input[name="splitMethod"]:checked').value;
        const splits = this.calculateSplits(total, splitMethod, participants);

        this.displayCalculationPreview(subtotal, serviceFee, tip, total, splits);
    }

    /**
     * 計算服務費
     */
    calculateServiceFee(subtotal) {
        const fee = parseFloat(document.getElementById('serviceFee').value) || 0;
        const type = document.getElementById('serviceFeeType').value;
        
        return type === 'percentage' ? (subtotal * fee / 100) : fee;
    }

    /**
     * 計算小費
     */
    calculateTip(subtotal) {
        const tip = parseFloat(document.getElementById('tip').value) || 0;
        const type = document.getElementById('tipType').value;
        
        return type === 'percentage' ? (subtotal * tip / 100) : tip;
    }

    /**
     * 獲取參與者列表
     */
    getParticipants() {
        const participants = [];
        document.querySelectorAll('.participant-item').forEach(item => {
            const nameInput = item.querySelector('.participant-name');
            if (nameInput.value.trim()) {
                participants.push({
                    id: item.dataset.participantId,
                    name: nameInput.value.trim()
                });
            }
        });
        return participants;
    }

    /**
     * 計算分攤金額
     */
    calculateSplits(total, method, participants) {
        const splits = {};
        
        switch (method) {
            case 'equal':
                const equalAmount = total / participants.length;
                participants.forEach(p => {
                    splits[p.id] = {
                        name: p.name,
                        amount: equalAmount
                    };
                });
                break;
                
            case 'percentage':
                participants.forEach(p => {
                    const percentageInput = document.querySelector(`input[data-participant-id="${p.id}"]`);
                    const percentage = parseFloat(percentageInput?.value) || 0;
                    splits[p.id] = {
                        name: p.name,
                        amount: total * percentage / 100
                    };
                });
                break;
                
            case 'custom':
                participants.forEach(p => {
                    const customInput = document.querySelector(`input[data-participant-id="${p.id}"]`);
                    const amount = parseFloat(customInput?.value) || 0;
                    splits[p.id] = {
                        name: p.name,
                        amount: amount
                    };
                });
                break;
        }
        
        return splits;
    }

    /**
     * 顯示計算預覽
     */
    displayCalculationPreview(subtotal, serviceFee, tip, total, splits) {
        const preview = document.getElementById('calculationPreview');
        
        let html = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="h5 text-muted">小計</div>
                        <div class="h4 text-dark">HK$ ${subtotal.toFixed(2)}</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="h5 text-muted">服務費 + 小費</div>
                        <div class="h4 text-info">HK$ ${(serviceFee + tip).toFixed(2)}</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="h5 text-muted">總計</div>
                        <div class="h4 text-primary">HK$ ${total.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <hr>
            
            <h6 class="text-dark">每人應付金額：</h6>
            <div class="list-group">
        `;
        
        Object.values(splits).forEach(split => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="text-dark">${split.name}</span>
                    <span class="badge bg-primary rounded-pill fs-6">HK$ ${split.amount.toFixed(2)}</span>
                </div>
            `;
        });
        
        html += '</div>';
        
        const totalSplit = Object.values(splits).reduce((sum, split) => sum + split.amount, 0);
        const difference = Math.abs(total - totalSplit);
        
        if (difference > 0.01) {
            html += `
                <div class="alert alert-warning mt-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    注意：分攤總額與實際總額相差 HK$ ${difference.toFixed(2)}
                </div>
            `;
        }
        
        preview.innerHTML = html;
    }

    /**
     * 處理分帳提交
     */
    processSplitting() {
        // 驗證表單
        if (!this.validateSplittingForm()) {
            return;
        }

        // 獲取分帳資料
        const splittingData = this.generateSplittingData();
        
        // 保存分帳記錄
        this.saveSplittingRecord(splittingData);
        
        // 關閉modal並顯示結果
        const modal = bootstrap.Modal.getInstance(document.getElementById('splittingModal'));
        modal.hide();
        
        this.showSplittingResult(splittingData);
    }

    /**
     * 驗證分帳表單
     */
    validateSplittingForm() {
        const participants = this.getParticipants();
        const payerId = document.getElementById('payerSelect').value;
        
        if (participants.length < 2) {
            this.showNotification('至少需要2位參與者才能分帳', 'error');
            return false;
        }
        
        if (!payerId) {
            this.showNotification('請選擇付款人', 'error');
            return false;
        }
        
        return true;
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

    /**
     * 生成分帳資料
     */
    generateSplittingData() {
        const participants = this.getParticipants();
        const payerId = document.getElementById('payerSelect').value;
        const splitMethod = document.querySelector('input[name="splitMethod"]:checked').value;
        
        const subtotal = this.currentReceipt.totalAmount;
        const serviceFee = this.calculateServiceFee(subtotal);  
        const tip = this.calculateTip(subtotal);
        const total = subtotal + serviceFee + tip;
        
        const splits = this.calculateSplits(total, splitMethod, participants);
        
        return {
            id: 'split_' + Date.now(),
            receipt: this.currentReceipt,
            participants: participants,
            payerId: payerId,
            payerName: participants.find(p => p.id === payerId)?.name,
            splitMethod: splitMethod,
            subtotal: subtotal,
            serviceFee: serviceFee,
            tip: tip,
            total: total,
            splits: splits,
            createdAt: new Date().toISOString(),
            createdBy: window.haMoneyAuth.getCurrentUser()?.uid
        };
    }

    /**
     * 保存分帳記錄
     */
    saveSplittingRecord(data) {
        const records = window.haMoneyStorage.get('splittingRecords') || [];
        records.unshift(data); // 新記錄放在前面
        window.haMoneyStorage.set('splittingRecords', records);
        
        // 更新欠款記錄
        this.updateDebtRecords(data);
    }

    /**
     * 更新欠款記錄
     */
    updateDebtRecords(splittingData) {
        if (!window.haMoneyDebtTracker) return;
        
        Object.values(splittingData.splits).forEach(split => {
            if (split.name !== splittingData.payerName) {
                // 尋找對應的參與者ID
                const debtor = splittingData.participants.find(p => p.name === split.name);
                const creditor = splittingData.participants.find(p => p.id === splittingData.payerId);
                
                const debtData = {
                    splittingId: splittingData.id,
                    debtorId: debtor?.id || 'unknown',
                    debtorName: split.name,
                    creditorId: creditor?.id || splittingData.payerId,
                    creditorName: splittingData.payerName,
                    amount: split.amount,
                    description: `${splittingData.receipt.storeName} 分帳`,
                    groupId: splittingData.groupId || null
                };
                
                window.haMoneyDebtTracker.addDebt(debtData);
            }
        });
    }

    /**
     * 顯示分帳結果
     */
    showSplittingResult(data) {
        // 導航到記錄頁面或顯示結果modal
        this.showNotification('分帳完成！記錄已保存', 'success');
        
        // 可以在這裡添加跳轉到記錄頁面的邏輯
        if (window.haMoneyMain) {
            window.haMoneyMain.showSection('records');
        }
    }
}

// 創建全局分帳實例
window.hamoneySplitting = new HaMoneySplitting(); 