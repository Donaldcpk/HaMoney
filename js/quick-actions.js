/**
 * HaMoney - 快速分帳功能
 * 簡化手機體驗的快速操作
 */

class QuickSplitActions {
    constructor() {
        this.currentReceipt = null;
        this.lastUsedSettings = this.loadLastSettings();
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 快速平分按鈕
        document.addEventListener('click', (e) => {
            if (e.target.id === 'quickEqualSplit' || e.target.closest('#quickEqualSplit')) {
                e.preventDefault();
                this.startQuickEqualSplit();
            }
        });

        // 使用上次設定
        document.addEventListener('click', (e) => {
            if (e.target.id === 'useLastSettings' || e.target.closest('#useLastSettings')) {
                e.preventDefault();
                this.useLastSettings();
            }
        });
    }

    /**
     * 開始快速平分流程
     */
    startQuickEqualSplit() {
        // 檢查是否有掃描結果
        if (!this.validateReceiptData()) {
            return;
        }

        // 提取單據資料
        this.currentReceipt = this.extractReceiptData();

        // 顯示快速群組選擇界面
        this.showQuickGroupSelection();
    }

    /**
     * 驗證單據資料
     */
    validateReceiptData() {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults || analysisResults.classList.contains('d-none')) {
            this.showNotification('請先掃描單據', 'warning');
            return false;
        }

        const totalAmount = document.getElementById('totalAmount');
        if (!totalAmount || parseFloat(totalAmount.textContent.replace(/[^\d.]/g, '')) <= 0) {
            this.showNotification('無效的單據金額', 'error');
            return false;
        }

        return true;
    }

    /**
     * 提取單據資料
     */
    extractReceiptData() {
        const totalAmountEl = document.getElementById('totalAmount');
        const receiptDateEl = document.getElementById('receiptDate');
        const storeNameEl = document.getElementById('storeName');

        return {
            totalAmount: parseFloat(totalAmountEl.textContent.replace(/[^\d.]/g, '')) || 0,
            date: receiptDateEl.textContent || new Date().toLocaleDateString('zh-TW'),
            storeName: storeNameEl.textContent || '未知商店',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 顯示快速群組選擇界面
     */
    showQuickGroupSelection() {
        const recentGroups = this.getRecentGroups();
        const suggestedMembers = this.getSuggestedMembers();

        const modalHTML = `
            <div class="modal fade" id="quickSplitModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-lightning-fill me-2"></i>快速平分
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- 單據摘要 -->
                            <div class="alert alert-info mb-4">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <strong>商店</strong><br>
                                        <span class="text-muted">${this.currentReceipt.storeName}</span>
                                    </div>
                                    <div class="col-4">
                                        <strong>總金額</strong><br>
                                        <span class="text-success fs-5">HK$ ${this.currentReceipt.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div class="col-4">
                                        <strong>日期</strong><br>
                                        <span class="text-muted">${this.currentReceipt.date}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 智能群組建議 -->
                            ${recentGroups.length > 0 ? `
                            <div class="mb-4">
                                <h6><i class="bi bi-clock-history me-2"></i>最近使用的群組</h6>
                                <div class="row g-2">
                                    ${recentGroups.map(group => `
                                        <div class="col-6 col-md-4">
                                            <button class="btn btn-outline-primary w-100 recent-group-btn" 
                                                    data-group-id="${group.id}">
                                                <i class="bi bi-people me-1"></i>
                                                ${group.name}
                                                <br><small class="text-muted">${group.memberCount}人</small>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}

                            <!-- 快速選擇參與者 -->
                            <div class="mb-4">
                                <h6><i class="bi bi-people me-2"></i>選擇參與者</h6>
                                <div id="quickParticipants">
                                    <!-- 動態生成參與者選項 -->
                                </div>
                                
                                <!-- 手動新增參與者 -->
                                <div class="mt-3">
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="newParticipantName" 
                                               placeholder="新增參與者姓名">
                                        <button class="btn btn-outline-secondary" type="button" id="addQuickParticipant">
                                            <i class="bi bi-plus-lg"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- 付款人選擇 -->
                            <div class="mb-4">
                                <h6><i class="bi bi-credit-card me-2"></i>誰先付款？</h6>
                                <select class="form-select" id="quickPayerSelect">
                                    <option value="">請選擇付款人</option>
                                </select>
                            </div>

                            <!-- 即時計算預覽 -->
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6><i class="bi bi-calculator me-2"></i>分帳預覽</h6>
                                    <div id="quickCalculationPreview">
                                        <div class="text-center text-muted">
                                            請選擇參與者查看分帳結果
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-success" id="confirmQuickSplit" disabled>
                                <i class="bi bi-check-lg me-1"></i>確認分帳
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 插入模態框
        const existingModal = document.getElementById('quickSplitModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('quickSplitModal'));
        modal.show();

        // 綁定模態框事件
        this.bindQuickSplitEvents();

        // 載入建議的參與者
        this.loadSuggestedParticipants();
    }

    /**
     * 綁定快速分帳模態框事件
     */
    bindQuickSplitEvents() {
        const modal = document.getElementById('quickSplitModal');

        // 選擇最近使用群組
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('recent-group-btn')) {
                const groupId = e.target.dataset.groupId;
                this.loadGroupMembers(groupId);
            }
        });

        // 新增參與者
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'addQuickParticipant') {
                this.addQuickParticipant();
            }
        });

        // 參與者選擇變化
        modal.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.name === 'participant') {
                this.updateQuickCalculation();
            }
        });

        // 付款人選擇變化
        modal.addEventListener('change', (e) => {
            if (e.target.id === 'quickPayerSelect') {
                this.validateQuickForm();
            }
        });

        // 確認分帳
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmQuickSplit') {
                this.processQuickSplit();
            }
        });

        // Enter鍵新增參與者
        modal.addEventListener('keypress', (e) => {
            if (e.target.id === 'newParticipantName' && e.key === 'Enter') {
                e.preventDefault();
                this.addQuickParticipant();
            }
        });
    }

    /**
     * 載入建議的參與者
     */
    loadSuggestedParticipants() {
        const participantsHtml = `
            <div class="row g-2" id="participantCheckboxes">
                <!-- 如果有最近使用的參與者，在這裡顯示 -->
            </div>
        `;
        
        document.getElementById('quickParticipants').innerHTML = participantsHtml;
        
        // 載入最近使用的參與者
        if (this.lastUsedSettings.participants && this.lastUsedSettings.participants.length > 0) {
            this.lastUsedSettings.participants.forEach(participant => {
                this.addParticipantCheckbox(participant.name, participant.id);
            });
        } else {
            // 添加當前用戶作為預設參與者
            const currentUser = window.haMoneyAuth?.getCurrentUser();
            if (currentUser) {
                this.addParticipantCheckbox(currentUser.displayName || '我', currentUser.uid);
            }
        }
    }

    /**
     * 新增參與者複選框
     */
    addParticipantCheckbox(name, id = null) {
        const participantId = id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const container = document.getElementById('participantCheckboxes');
        
        const checkboxHtml = `
            <div class="col-6 col-md-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="participant" 
                           value="${participantId}" id="participant_${participantId}"
                           data-name="${name}">
                    <label class="form-check-label" for="participant_${participantId}">
                        ${name}
                    </label>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', checkboxHtml);
        this.updatePayerOptions();
    }

    /**
     * 新增快速參與者
     */
    addQuickParticipant() {
        const nameInput = document.getElementById('newParticipantName');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showNotification('請輸入參與者姓名', 'warning');
            return;
        }

        // 檢查是否重複
        const existingLabels = document.querySelectorAll('#participantCheckboxes label');
        for (let label of existingLabels) {
            if (label.textContent.trim() === name) {
                this.showNotification('此參與者已存在', 'warning');
                nameInput.focus();
                return;
            }
        }

        this.addParticipantCheckbox(name);
        nameInput.value = '';
        nameInput.focus();
    }

    /**
     * 更新付款人選項
     */
    updatePayerOptions() {
        const payerSelect = document.getElementById('quickPayerSelect');
        const checkboxes = document.querySelectorAll('input[name="participant"]');
        
        // 保存當前選擇
        const currentPayer = payerSelect.value;
        
        // 清空選項
        payerSelect.innerHTML = '<option value="">請選擇付款人</option>';
        
        // 添加所有參與者為付款人選項
        checkboxes.forEach(checkbox => {
            const option = document.createElement('option');
            option.value = checkbox.value;
            option.textContent = checkbox.dataset.name;
            payerSelect.appendChild(option);
        });
        
        // 恢復之前的選擇
        if (currentPayer) {
            payerSelect.value = currentPayer;
        }
    }

    /**
     * 更新快速計算
     */
    updateQuickCalculation() {
        const selectedParticipants = this.getSelectedParticipants();
        const previewContainer = document.getElementById('quickCalculationPreview');
        
        if (selectedParticipants.length === 0) {
            previewContainer.innerHTML = '<div class="text-center text-muted">請選擇參與者查看分帳結果</div>';
            document.getElementById('confirmQuickSplit').disabled = true;
            return;
        }

        const totalAmount = this.currentReceipt.totalAmount;
        const amountPerPerson = totalAmount / selectedParticipants.length;

        const previewHtml = `
            <div class="row text-center">
                <div class="col-4">
                    <small class="text-muted">參與人數</small><br>
                    <strong class="text-primary">${selectedParticipants.length} 人</strong>
                </div>
                <div class="col-4">
                    <small class="text-muted">每人應付</small><br>
                    <strong class="text-success">HK$ ${amountPerPerson.toFixed(2)}</strong>
                </div>
                <div class="col-4">
                    <small class="text-muted">總金額</small><br>
                    <strong class="text-info">HK$ ${totalAmount.toFixed(2)}</strong>
                </div>
            </div>
            
            <hr class="my-3">
            
            <div class="row g-2">
                ${selectedParticipants.map(participant => `
                    <div class="col-6">
                        <div class="d-flex justify-content-between align-items-center">
                            <span>${participant.name}</span>
                            <strong class="text-success">HK$ ${amountPerPerson.toFixed(2)}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        previewContainer.innerHTML = previewHtml;
        this.validateQuickForm();
    }

    /**
     * 獲取選中的參與者
     */
    getSelectedParticipants() {
        const checkboxes = document.querySelectorAll('input[name="participant"]:checked');
        return Array.from(checkboxes).map(checkbox => ({
            id: checkbox.value,
            name: checkbox.dataset.name
        }));
    }

    /**
     * 驗證快速表單
     */
    validateQuickForm() {
        const selectedParticipants = this.getSelectedParticipants();
        const payerSelect = document.getElementById('quickPayerSelect');
        const confirmBtn = document.getElementById('confirmQuickSplit');
        
        const isValid = selectedParticipants.length >= 2 && payerSelect.value;
        confirmBtn.disabled = !isValid;
    }

    /**
     * 處理快速分帳
     */
    processQuickSplit() {
        const selectedParticipants = this.getSelectedParticipants();
        const payerId = document.getElementById('quickPayerSelect').value;
        const payer = selectedParticipants.find(p => p.id === payerId);

        if (!payer) {
            this.showNotification('請選擇付款人', 'error');
            return;
        }

        const totalAmount = this.currentReceipt.totalAmount;
        const amountPerPerson = totalAmount / selectedParticipants.length;

        // 生成分帳結果
        const splitData = {
            id: `quick_${Date.now()}`,
            type: 'quick_equal',
            receipt: this.currentReceipt,
            participants: selectedParticipants,
            payer: payer,
            splits: selectedParticipants.map(participant => ({
                participantId: participant.id,
                participantName: participant.name,
                amount: amountPerPerson,
                paid: participant.id === payerId
            })),
            totalAmount: totalAmount,
            splitAmount: totalAmount,
            serviceFee: 0,
            tip: 0,
            timestamp: new Date().toISOString(),
            method: 'equal'
        };

        // 顯示修訂界面
        this.showRevisionInterface(splitData);
    }

    /**
     * 顯示修訂界面
     */
    showRevisionInterface(splitData) {
        // 關閉當前模態框
        const quickModal = bootstrap.Modal.getInstance(document.getElementById('quickSplitModal'));
        quickModal.hide();

        // 顯示修訂界面
        setTimeout(() => {
            this.showSplitRevision(splitData);
        }, 300);
    }

    /**
     * 顯示分帳修訂界面
     */
    showSplitRevision(splitData) {
        const revisionHTML = `
            <div class="modal fade" id="splitRevisionModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-pencil-square me-2"></i>確認並修訂分帳結果
                            </h5>
                        </div>
                        <div class="modal-body">
                            <!-- 分帳摘要 -->
                            <div class="alert alert-info">
                                <div class="row text-center">
                                    <div class="col-3">
                                        <strong>商店</strong><br>
                                        <span class="text-muted">${splitData.receipt.storeName}</span>
                                    </div>
                                    <div class="col-3">
                                        <strong>總金額</strong><br>
                                        <span class="text-success">HK$ ${splitData.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div class="col-3">
                                        <strong>參與人數</strong><br>
                                        <span class="text-primary">${splitData.participants.length} 人</span>
                                    </div>
                                    <div class="col-3">
                                        <strong>付款人</strong><br>
                                        <span class="text-info">${splitData.payer.name}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 可編輯的分帳詳情 -->
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">
                                        <i class="bi bi-list-ul me-2"></i>分帳詳情
                                        <small class="text-muted ms-2">(點擊金額可修改)</small>
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div id="editableSplits">
                                        ${splitData.splits.map((split, index) => `
                                            <div class="row align-items-center mb-3 split-row" data-index="${index}">
                                                <div class="col-6">
                                                    <div class="d-flex align-items-center">
                                                        ${split.paid ? '<i class="bi bi-credit-card text-success me-2"></i>' : ''}
                                                        <strong>${split.participantName}</strong>
                                                        ${split.paid ? '<small class="text-success ms-2">(付款人)</small>' : ''}
                                                    </div>
                                                </div>
                                                <div class="col-4">
                                                    <div class="input-group">
                                                        <span class="input-group-text">HK$</span>
                                                        <input type="number" class="form-control split-amount" 
                                                               value="${split.amount.toFixed(2)}" 
                                                               min="0" step="0.01"
                                                               data-original="${split.amount.toFixed(2)}">
                                                    </div>
                                                </div>
                                                <div class="col-2">
                                                    <button class="btn btn-sm btn-outline-secondary reset-amount" 
                                                            data-index="${index}" title="重置金額">
                                                        <i class="bi bi-arrow-clockwise"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <!-- 總計驗證 -->
                                    <hr>
                                    <div class="row">
                                        <div class="col-6">
                                            <strong>分帳總和：</strong>
                                        </div>
                                        <div class="col-6 text-end">
                                            <span id="currentTotal" class="fs-5">HK$ ${splitData.totalAmount.toFixed(2)}</span>
                                            <div id="totalWarning" class="text-danger small d-none">
                                                <i class="bi bi-exclamation-triangle me-1"></i>
                                                總額不符，請修正
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="backToQuickSplit">
                                <i class="bi bi-arrow-left me-1"></i>返回
                            </button>
                            <button type="button" class="btn btn-success" id="confirmFinalSplit">
                                <i class="bi bi-check-lg me-1"></i>確認分帳
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 插入模態框
        const existingModal = document.getElementById('splitRevisionModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', revisionHTML);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('splitRevisionModal'));
        modal.show();

        // 綁定修訂事件
        this.bindRevisionEvents(splitData);
    }

    /**
     * 綁定修訂界面事件
     */
    bindRevisionEvents(splitData) {
        const modal = document.getElementById('splitRevisionModal');

        // 金額輸入變化
        modal.addEventListener('input', (e) => {
            if (e.target.classList.contains('split-amount')) {
                this.updateTotalCalculation();
            }
        });

        // 重置金額
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('reset-amount')) {
                const index = e.target.dataset.index;
                const amountInput = modal.querySelector(`.split-row[data-index="${index}"] .split-amount`);
                amountInput.value = amountInput.dataset.original;
                this.updateTotalCalculation();
            }
        });

        // 返回快速分帳
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'backToQuickSplit') {
                const revisionModal = bootstrap.Modal.getInstance(modal);
                revisionModal.hide();
                setTimeout(() => this.showQuickGroupSelection(), 300);
            }
        });

        // 確認最終分帳
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmFinalSplit') {
                this.confirmFinalSplit(splitData);
            }
        });
    }

    /**
     * 更新總計算
     */
    updateTotalCalculation() {
        const amountInputs = document.querySelectorAll('.split-amount');
        let total = 0;
        
        amountInputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });

        const currentTotalEl = document.getElementById('currentTotal');
        const warningEl = document.getElementById('totalWarning');
        const confirmBtn = document.getElementById('confirmFinalSplit');
        
        currentTotalEl.textContent = `HK$ ${total.toFixed(2)}`;
        
        const originalTotal = this.currentReceipt.totalAmount;
        const difference = Math.abs(total - originalTotal);
        
        if (difference > 0.01) {
            currentTotalEl.className = 'fs-5 text-danger';
            warningEl.classList.remove('d-none');
            confirmBtn.disabled = true;
        } else {
            currentTotalEl.className = 'fs-5 text-success';
            warningEl.classList.add('d-none');
            confirmBtn.disabled = false;
        }
    }

    /**
     * 確認最終分帳
     */
    confirmFinalSplit(originalSplitData) {
        // 收集修訂後的金額
        const amountInputs = document.querySelectorAll('.split-amount');
        const updatedSplits = [];
        
        amountInputs.forEach((input, index) => {
            const split = originalSplitData.splits[index];
            updatedSplits.push({
                ...split,
                amount: parseFloat(input.value) || 0
            });
        });

        // 更新分帳資料
        const finalSplitData = {
            ...originalSplitData,
            splits: updatedSplits,
            splitAmount: updatedSplits.reduce((sum, split) => sum + split.amount, 0)
        };

        // 保存分帳記錄
        this.saveSplitRecord(finalSplitData);

        // 更新欠款記錄
        this.updateDebtRecords(finalSplitData);

        // 保存最後使用的設定
        this.saveLastSettings(finalSplitData);

        // 顯示成功結果
        this.showSplitSuccess(finalSplitData);
    }

    /**
     * 保存分帳記錄
     */
    saveSplitRecord(splitData) {
        try {
            const records = JSON.parse(localStorage.getItem('splittingRecords') || '[]');
            records.unshift(splitData);
            
            // 保留最近100條記錄
            if (records.length > 100) {
                records.splice(100);
            }
            
            localStorage.setItem('splittingRecords', JSON.stringify(records));
        } catch (error) {
            console.error('保存分帳記錄失敗:', error);
        }
    }

    /**
     * 更新欠款記錄
     */
    updateDebtRecords(splitData) {
        try {
            const currentUser = window.haMoneyAuth?.getCurrentUser();
            if (!currentUser) return;

            const debts = JSON.parse(localStorage.getItem('debtRecords') || '[]');
            
            // 為每個非付款人創建欠款記錄
            splitData.splits.forEach(split => {
                if (!split.paid && split.amount > 0) {
                    debts.push({
                        id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        fromUserId: split.participantId,
                        fromUserName: split.participantName,
                        toUserId: splitData.payer.id,
                        toUserName: splitData.payer.name,
                        amount: split.amount,
                        description: `${splitData.receipt.storeName} - 快速分帳`,
                        splittingRecordId: splitData.id,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天後到期
                    });
                }
            });

            localStorage.setItem('debtRecords', JSON.stringify(debts));
        } catch (error) {
            console.error('更新欠款記錄失敗:', error);
        }
    }

    /**
     * 保存最後使用的設定
     */
    saveLastSettings(splitData) {
        const settings = {
            participants: splitData.participants,
            payer: splitData.payer,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('lastQuickSplitSettings', JSON.stringify(settings));
        this.lastUsedSettings = settings;
    }

    /**
     * 載入最後使用的設定
     */
    loadLastSettings() {
        try {
            const settings = localStorage.getItem('lastQuickSplitSettings');
            return settings ? JSON.parse(settings) : { participants: [] };
        } catch (error) {
            console.error('載入上次設定失敗:', error);
            return { participants: [] };
        }
    }

    /**
     * 獲取最近使用的群組
     */
    getRecentGroups() {
        try {
            const groups = JSON.parse(localStorage.getItem('groups') || '[]');
            const records = JSON.parse(localStorage.getItem('splittingRecords') || '[]');
            
            // 統計群組使用頻率
            const groupUsage = {};
            records.forEach(record => {
                if (record.groupId) {
                    groupUsage[record.groupId] = (groupUsage[record.groupId] || 0) + 1;
                }
            });

            // 排序並返回最常用的前3個群組
            return groups
                .filter(group => groupUsage[group.id])
                .sort((a, b) => (groupUsage[b.id] || 0) - (groupUsage[a.id] || 0))
                .slice(0, 3)
                .map(group => ({
                    ...group,
                    memberCount: group.members ? group.members.length : 0
                }));
        } catch (error) {
            console.error('獲取最近群組失敗:', error);
            return [];
        }
    }

    /**
     * 顯示成功結果
     */
    showSplitSuccess(splitData) {
        // 關閉修訂模態框
        const revisionModal = bootstrap.Modal.getInstance(document.getElementById('splitRevisionModal'));
        revisionModal.hide();

        // 顯示成功通知
        this.showNotification('分帳完成！欠款記錄已自動創建', 'success');

        // 可選：顯示詳細結果頁面
        setTimeout(() => {
            this.showDetailedResult(splitData);
        }, 1000);
    }

    /**
     * 顯示詳細結果
     */
    showDetailedResult(splitData) {
        // 這裡可以顯示一個詳細的結果頁面或跳轉到記錄頁面
        const resultHTML = `
            <div class="modal fade" id="splitResultModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-check-circle me-2"></i>分帳完成
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="mb-4">
                                <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                                <h4 class="mt-3">分帳成功！</h4>
                                <p class="text-muted">所有欠款記錄已自動創建</p>
                            </div>
                            
                            <div class="alert alert-info">
                                <strong>${splitData.receipt.storeName}</strong><br>
                                總金額：HK$ ${splitData.totalAmount.toFixed(2)}<br>
                                參與人數：${splitData.participants.length} 人
                            </div>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                                <i class="bi bi-list me-1"></i>查看記錄
                            </button>
                            <button type="button" class="btn btn-success" data-bs-dismiss="modal">
                                <i class="bi bi-plus-lg me-1"></i>繼續分帳
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 插入並顯示結果模態框
        const existingModal = document.getElementById('splitResultModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', resultHTML);

        const modal = new bootstrap.Modal(document.getElementById('splitResultModal'));
        modal.show();
    }

    /**
     * 使用上次設定
     */
    useLastSettings() {
        if (!this.lastUsedSettings.participants || this.lastUsedSettings.participants.length === 0) {
            this.showNotification('沒有找到上次的設定', 'warning');
            return;
        }

        // 觸發快速分帳，但使用上次的設定
        if (this.validateReceiptData()) {
            this.currentReceipt = this.extractReceiptData();
            this.showQuickGroupSelection();
            
            // 延遲載入上次設定，等模態框完全顯示後
            setTimeout(() => {
                this.applyLastSettings();
            }, 500);
        }
    }

    /**
     * 應用上次設定
     */
    applyLastSettings() {
        // 添加上次的參與者
        this.lastUsedSettings.participants.forEach(participant => {
            this.addParticipantCheckbox(participant.name, participant.id);
        });

        // 自動選中所有參與者
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('input[name="participant"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });

            // 設定上次的付款人
            if (this.lastUsedSettings.payer) {
                const payerSelect = document.getElementById('quickPayerSelect');
                payerSelect.value = this.lastUsedSettings.payer.id;
            }

            this.updateQuickCalculation();
        }, 100);
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        // 使用現有的通知系統
        if (window.haMoneyLoadingManager) {
            window.haMoneyLoadingManager.showNotification(message, type);
        } else {
            // 簡單的 alert 備用方案
            alert(message);
        }
    }
}

// 初始化快速分帳功能
document.addEventListener('DOMContentLoaded', () => {
    window.haMoneyQuickSplit = new QuickSplitActions();
}); 