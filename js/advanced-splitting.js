/**
 * HaMoney - 高級分帳系統
 * 支援按項目分帳、多人參與、靈活分配等高級功能
 */

class HaMoneyAdvancedSplitting {
    constructor() {
        this.currentReceipt = null;
        this.selectedGroup = null;
        this.participants = new Map(); // 參與者資料
        this.participantSelections = new Set(); // 選中的參與者
        this.itemAssignments = new Map(); // 項目分配記錄 {itemId: {userId: amount}}
        this.splitMode = 'item'; // item, equal, percentage, custom
        this.serviceFee = 0;
        this.tip = 0;
        this.livePreview = {}; // 即時預覽數據
        this.init();
    }

    init() {
        this.bindEvents();
    }

    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        document.addEventListener('click', (e) => {
            // 開始高級分帳
            if (e.target.id === 'startAdvancedSplitting') {
                this.startAdvancedSplitting();
            }
            
            // 項目分配按鈕
            if (e.target.classList.contains('assign-item-btn')) {
                const itemId = e.target.dataset.itemId;
                this.showItemAssignmentModal(itemId);
            }
            
            // 參與者選擇
            if (e.target.classList.contains('participant-checkbox')) {
                this.updateParticipantSelection(e.target);
            }
            
            // 分帳方式切換
            if (e.target.name === 'splitMode') {
                this.splitMode = e.target.value;
                this.updateSplitDetails();
            }

            // 重置分配
            if (e.target.id === 'resetAssignments') {
                this.resetAllAssignments();
            }

            // 自動平均分配
            if (e.target.id === 'autoAssignEqual') {
                this.autoAssignEqual();
            }

            // 確認分帳
            if (e.target.id === 'confirmAdvancedSplit') {
                this.confirmAdvancedSplit();
            }
        });

        document.addEventListener('input', (e) => {
            // 實時更新預覽
            if (e.target.closest('.advanced-splitting-modal')) {
                this.updateLivePreview();
            }
        });
    }

    /**
     * 開始高級分帳流程
     */
    startAdvancedSplitting() {
        // 獲取當前單據數據
        this.currentReceipt = this.extractReceiptData();
        if (!this.currentReceipt) {
            this.showNotification('請先掃描單據', 'warning');
            return;
        }

        // 檢查登入狀態
        if (!window.haMoneyAuth?.isSignedIn()) {
            this.showNotification('請先登入使用分帳功能', 'warning');
            return;
        }

        // 顯示高級分帳界面
        this.showAdvancedSplittingModal();
    }

    /**
     * 提取單據數據
     */
    extractReceiptData() {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults || analysisResults.classList.contains('d-none')) {
            return null;
        }

        const totalAmountEl = document.getElementById('totalAmount');
        const receiptDateEl = document.getElementById('receiptDate');
        const storeNameEl = document.getElementById('storeName');
        const itemsListEl = document.getElementById('itemsList');

        const receipt = {
            id: 'receipt_' + Date.now(),
            totalAmount: parseFloat(totalAmountEl?.textContent?.replace(/[^\d.]/g, '') || '0'),
            date: receiptDateEl?.textContent || new Date().toISOString().split('T')[0],
            storeName: storeNameEl?.textContent || '未知商店',
            items: []
        };

        // 提取項目列表
        const itemElements = itemsListEl?.querySelectorAll('.list-group-item') || [];
        itemElements.forEach((itemEl, index) => {
            const nameEl = itemEl.querySelector('.fw-bold') || itemEl.querySelector('span');
            const priceEl = itemEl.querySelector('.text-success') || itemEl.querySelector('.text-end');
            
            if (nameEl && priceEl) {
                const itemText = nameEl.textContent.trim();
                const priceText = priceEl.textContent.trim();
                
                // 解析項目名稱和數量
                const quantityMatch = itemText.match(/(.+?)\s*(\d+)\s*份?/);
                const name = quantityMatch ? quantityMatch[1].trim() : itemText;
                const quantity = quantityMatch ? parseInt(quantityMatch[2]) : 1;
                const price = parseFloat(priceText.replace(/[^\d.]/g, '') || '0');

                receipt.items.push({
                    id: 'item_' + index,
                    name: name,
                    quantity: quantity,
                    unitPrice: quantity > 1 ? price / quantity : price,
                    totalPrice: price,
                    originalText: itemText
                });
            }
        });

        return receipt;
    }

    /**
     * 顯示高級分帳模態框
     */
    showAdvancedSplittingModal() {
        const modalHtml = this.generateAdvancedSplittingModal();
        
        // 移除舊模態框
        const existingModal = document.getElementById('advancedSplittingModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新模態框
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('advancedSplittingModal'));
        modal.show();

        // 初始化內容
        this.loadGroupsForSelection();
        this.initializeItemAssignments();
        this.updateLivePreview();
    }

    /**
     * 生成高級分帳模態框HTML
     */
    generateAdvancedSplittingModal() {
        return `
            <div class="modal fade advanced-splitting-modal" id="advancedSplittingModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-calculator-fill me-2"></i>高級分帳 - ${this.currentReceipt.storeName}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- 左側：群組和參與者選擇 -->
                                <div class="col-lg-4">
                                    ${this.generateParticipantSection()}
                                </div>
                                
                                <!-- 中間：項目分配 -->
                                <div class="col-lg-5">
                                    ${this.generateItemSection()}
                                </div>
                                
                                <!-- 右側：即時預覽 -->
                                <div class="col-lg-3">
                                    ${this.generatePreviewSection()}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div class="me-auto">
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-outline-secondary" id="resetAssignments">
                                        <i class="bi bi-arrow-clockwise me-1"></i>重置
                                    </button>
                                    <button type="button" class="btn btn-outline-primary" id="autoAssignEqual">
                                        <i class="bi bi-magic me-1"></i>平均分配
                                    </button>
                                </div>
                            </div>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-success" id="confirmAdvancedSplit">
                                <i class="bi bi-check-circle me-1"></i>確認分帳
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成參與者選擇區域
     */
    generateParticipantSection() {
        return `
            <div class="card h-100">
                <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-people me-2"></i>選擇參與者</h6>
                </div>
                <div class="card-body">
                    <!-- 群組選擇 -->
                    <div class="mb-3">
                        <label class="form-label">從群組選擇：</label>
                        <select class="form-select" id="groupSelector">
                            <option value="">選擇群組</option>
                        </select>
                    </div>
                    
                    <!-- 參與者清單 -->
                    <div class="mb-3">
                        <label class="form-label">參與者：</label>
                        <div id="participantCheckboxes" class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                            <p class="text-muted text-center">請先選擇群組</p>
                        </div>
                    </div>
                    
                    <!-- 付款人選擇 -->
                    <div class="mb-3">
                        <label class="form-label">誰先付款？</label>
                        <select class="form-select" id="payerSelector">
                            <option value="">選擇付款人</option>
                        </select>
                    </div>
                    
                    <!-- 額外費用 -->
                    <div class="border-top pt-3">
                        <h6>額外費用</h6>
                        <div class="row">
                            <div class="col-6">
                                <label class="form-label">服務費</label>
                                <div class="input-group">
                                    <input type="number" class="form-control form-control-sm" id="serviceFeeInput" value="0" min="0" step="0.01">
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label">小費</label>
                                <div class="input-group">
                                    <input type="number" class="form-control form-control-sm" id="tipInput" value="0" min="0" step="0.01">
                                    <span class="input-group-text">HK$</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成項目分配區域
     */
    generateItemSection() {
        const itemsHtml = this.currentReceipt.items.map(item => `
            <div class="card mb-2 item-card" data-item-id="${item.id}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">${item.name}</h6>
                            <small class="text-muted">
                                ${item.quantity > 1 ? `${item.quantity} 份 × HK$ ${item.unitPrice.toFixed(2)}` : ''}
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold text-success">HK$ ${item.totalPrice.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div class="item-assignment" id="assignment_${item.id}">
                        <div class="text-muted text-center py-2">
                            <i class="bi bi-person-plus"></i> 點擊分配給參與者
                        </div>
                    </div>
                    
                    <button class="btn btn-outline-primary btn-sm w-100 assign-item-btn mt-2" data-item-id="${item.id}">
                        <i class="bi bi-person-plus-fill me-1"></i>分配項目
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0"><i class="bi bi-list-ul me-2"></i>項目分配</h6>
                    <small class="text-muted">總計: HK$ ${this.currentReceipt.totalAmount.toFixed(2)}</small>
                </div>
                <div class="card-body p-2" style="max-height: 500px; overflow-y: auto;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    /**
     * 生成即時預覽區域
     */
    generatePreviewSection() {
        return `
            <div class="card h-100">
                <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-eye me-2"></i>即時預覽</h6>
                </div>
                <div class="card-body">
                    <div id="livePreviewContent">
                        <div class="text-muted text-center py-4">
                            <i class="bi bi-calculator"></i>
                            <p class="mb-0">選擇參與者後顯示預覽</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 載入群組列表
     */
    loadGroupsForSelection() {
        const groupSelector = document.getElementById('groupSelector');
        if (!groupSelector) return;

        const groups = window.haMoneyGroupManager?.getAllGroups() || [];
        
        groupSelector.innerHTML = '<option value="">選擇群組</option>';
        groups.forEach(group => {
            groupSelector.innerHTML += `<option value="${group.id}">${group.name} (${group.members.length}人)</option>`;
        });

        // 綁定群組選擇事件
        groupSelector.addEventListener('change', (e) => {
            this.loadGroupParticipants(e.target.value);
        });
    }

    /**
     * 載入群組參與者
     */
    loadGroupParticipants(groupId) {
        const participantCheckboxes = document.getElementById('participantCheckboxes');
        if (!participantCheckboxes) return;

        if (!groupId) {
            participantCheckboxes.innerHTML = '<p class="text-muted text-center">請先選擇群組</p>';
            return;
        }

        const group = window.haMoneyGroupManager?.getGroupById(groupId);
        if (!group) return;

        this.selectedGroup = group;
        this.participants.clear();
        this.participantSelections.clear();

        // 生成參與者複選框
        const checkboxesHtml = group.members.map(member => `
            <div class="form-check">
                <input class="form-check-input participant-checkbox" type="checkbox" 
                       value="${member.id}" id="participant_${member.id}">
                <label class="form-check-label" for="participant_${member.id}">
                    ${member.name}
                    ${member.email ? `<small class="text-muted d-block">${member.email}</small>` : ''}
                </label>
            </div>
        `).join('');

        participantCheckboxes.innerHTML = checkboxesHtml;

        // 重置付款人選項
        this.updatePayerOptions();
    }

    /**
     * 更新參與者選擇
     */
    updateParticipantSelection(checkbox) {
        const memberId = checkbox.value;
        const member = this.selectedGroup?.members.find(m => m.id === memberId);
        
        if (!member) return;

        if (checkbox.checked) {
            this.participantSelections.add(memberId);
            this.participants.set(memberId, member);
        } else {
            this.participantSelections.delete(memberId);
            this.participants.delete(memberId);
        }

        this.updatePayerOptions();
        this.updateItemAssignmentOptions();
        this.updateLivePreview();
    }

    /**
     * 更新付款人選項
     */
    updatePayerOptions() {
        const payerSelector = document.getElementById('payerSelector');
        if (!payerSelector) return;

        payerSelector.innerHTML = '<option value="">選擇付款人</option>';
        
        this.participants.forEach((member, memberId) => {
            payerSelector.innerHTML += `<option value="${memberId}">${member.name}</option>`;
        });
    }

    /**
     * 顯示項目分配模態框
     */
    showItemAssignmentModal(itemId) {
        if (this.participants.size === 0) {
            this.showNotification('請先選擇參與者', 'warning');
            return;
        }

        const item = this.currentReceipt.items.find(i => i.id === itemId);
        if (!item) return;

        const modalHtml = this.generateItemAssignmentModal(item);
        
        // 移除舊模態框
        const existingModal = document.getElementById('itemAssignmentModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('itemAssignmentModal'));
        modal.show();

        this.initItemAssignmentModal(item);
    }

    /**
     * 生成項目分配模態框
     */
    generateItemAssignmentModal(item) {
        const participantsHtml = Array.from(this.participants.values()).map(member => `
            <div class="row align-items-center mb-2">
                <div class="col-4">
                    <div class="form-check">
                        <input class="form-check-input item-participant" type="checkbox" 
                               value="${member.id}" id="item_${item.id}_${member.id}">
                        <label class="form-check-label" for="item_${item.id}_${member.id}">
                            ${member.name}
                        </label>
                    </div>
                </div>
                <div class="col-4">
                    <input type="number" class="form-control form-control-sm participant-quantity" 
                           placeholder="數量" min="0" max="${item.quantity}" step="1" 
                           data-member-id="${member.id}" ${item.quantity === 1 ? 'style="display:none"' : ''}>
                </div>
                <div class="col-4">
                    <input type="number" class="form-control form-control-sm participant-amount" 
                           placeholder="金額" min="0" max="${item.totalPrice}" step="0.01" 
                           data-member-id="${member.id}">
                </div>
            </div>
        `).join('');

        return `
            <div class="modal fade" id="itemAssignmentModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">分配項目: ${item.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <strong>項目資訊：</strong><br>
                                ${item.quantity > 1 ? `數量: ${item.quantity} 份, ` : ''}
                                總金額: HK$ ${item.totalPrice.toFixed(2)}
                                ${item.quantity > 1 ? `, 單價: HK$ ${item.unitPrice.toFixed(2)}` : ''}
                            </div>
                            
                            <div class="mb-3">
                                <div class="row">
                                    <div class="col-4"><strong>參與者</strong></div>
                                    <div class="col-4"><strong>${item.quantity > 1 ? '數量' : ''}</strong></div>
                                    <div class="col-4"><strong>金額 (HK$)</strong></div>
                                </div>
                                <hr>
                                ${participantsHtml}
                            </div>
                            
                            <div class="d-flex justify-content-between">
                                <button type="button" class="btn btn-outline-secondary btn-sm" id="splitEquallyBtn">
                                    平均分攤
                                </button>
                                <div>
                                    <span class="text-muted">剩餘: HK$ </span>
                                    <span id="remainingAmount" class="fw-bold">${item.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="saveItemAssignment">確認分配</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 初始化項目分配模態框
     */
    initItemAssignmentModal(item) {
        const modal = document.getElementById('itemAssignmentModal');
        
        // 載入現有分配
        const existingAssignment = this.itemAssignments.get(item.id) || {};
        
        Object.entries(existingAssignment).forEach(([memberId, data]) => {
            const checkbox = modal.querySelector(`#item_${item.id}_${memberId}`);
            const quantityInput = modal.querySelector(`input[data-member-id="${memberId}"].participant-quantity`);
            const amountInput = modal.querySelector(`input[data-member-id="${memberId}"].participant-amount`);
            
            if (checkbox) checkbox.checked = true;
            if (quantityInput) quantityInput.value = data.quantity || '';
            if (amountInput) amountInput.value = data.amount || '';
        });

        // 綁定事件
        this.bindItemAssignmentEvents(item);
        this.updateRemainingAmount(item);
    }

    /**
     * 綁定項目分配事件
     */
    bindItemAssignmentEvents(item) {
        const modal = document.getElementById('itemAssignmentModal');
        
        // 平均分攤按鈕
        modal.querySelector('#splitEquallyBtn')?.addEventListener('click', () => {
            const selectedParticipants = modal.querySelectorAll('.item-participant:checked');
            if (selectedParticipants.length === 0) return;
            
            const amountPerPerson = item.totalPrice / selectedParticipants.length;
            const quantityPerPerson = item.quantity / selectedParticipants.length;
            
            selectedParticipants.forEach(checkbox => {
                const memberId = checkbox.value;
                const amountInput = modal.querySelector(`input[data-member-id="${memberId}"].participant-amount`);
                const quantityInput = modal.querySelector(`input[data-member-id="${memberId}"].participant-quantity`);
                
                if (amountInput) amountInput.value = amountPerPerson.toFixed(2);
                if (quantityInput && item.quantity > 1) quantityInput.value = quantityPerPerson.toFixed(1);
            });
            
            this.updateRemainingAmount(item);
        });

        // 實時計算
        modal.addEventListener('input', () => {
            this.updateRemainingAmount(item);
        });

        modal.addEventListener('change', () => {
            this.updateRemainingAmount(item);
        });

        // 保存分配
        modal.querySelector('#saveItemAssignment')?.addEventListener('click', () => {
            this.saveItemAssignment(item);
        });
    }

    /**
     * 更新剩餘金額顯示
     */
    updateRemainingAmount(item) {
        const modal = document.getElementById('itemAssignmentModal');
        const remainingAmountEl = modal.querySelector('#remainingAmount');
        
        let totalAssigned = 0;
        const amountInputs = modal.querySelectorAll('.participant-amount');
        
        amountInputs.forEach(input => {
            const amount = parseFloat(input.value) || 0;
            totalAssigned += amount;
        });
        
        const remaining = item.totalPrice - totalAssigned;
        remainingAmountEl.textContent = remaining.toFixed(2);
        
        // 顏色提示
        if (remaining < 0) {
            remainingAmountEl.className = 'fw-bold text-danger';
        } else if (remaining === 0) {
            remainingAmountEl.className = 'fw-bold text-success';
        } else {
            remainingAmountEl.className = 'fw-bold text-warning';
        }
    }

    /**
     * 保存項目分配
     */
    saveItemAssignment(item) {
        const modal = document.getElementById('itemAssignmentModal');
        const assignment = {};
        
        const checkedParticipants = modal.querySelectorAll('.item-participant:checked');
        
        checkedParticipants.forEach(checkbox => {
            const memberId = checkbox.value;
            const amountInput = modal.querySelector(`input[data-member-id="${memberId}"].participant-amount`);
            const quantityInput = modal.querySelector(`input[data-member-id="${memberId}"].participant-quantity`);
            
            const amount = parseFloat(amountInput?.value) || 0;
            const quantity = parseFloat(quantityInput?.value) || (item.quantity === 1 ? 1 : 0);
            
            if (amount > 0) {
                assignment[memberId] = {
                    amount: amount,
                    quantity: quantity,
                    memberName: this.participants.get(memberId)?.name || ''
                };
            }
        });

        // 驗證分配
        const totalAssigned = Object.values(assignment).reduce((sum, data) => sum + data.amount, 0);
        if (Math.abs(totalAssigned - item.totalPrice) > 0.01) {
            this.showNotification('分配金額與項目總額不符，請檢查', 'warning');
            return;
        }

        // 保存分配
        this.itemAssignments.set(item.id, assignment);
        
        // 更新UI顯示
        this.updateItemAssignmentDisplay(item.id);
        
        // 關閉模態框
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance?.hide();
        
        // 更新預覽
        this.updateLivePreview();
        
        this.showNotification('項目分配已保存', 'success');
    }

    /**
     * 更新項目分配顯示
     */
    updateItemAssignmentDisplay(itemId) {
        const assignmentEl = document.getElementById(`assignment_${itemId}`);
        const assignment = this.itemAssignments.get(itemId);
        
        if (!assignmentEl) return;

        if (!assignment || Object.keys(assignment).length === 0) {
            assignmentEl.innerHTML = `
                <div class="text-muted text-center py-2">
                    <i class="bi bi-person-plus"></i> 點擊分配給參與者
                </div>
            `;
            return;
        }

        const assignmentHtml = Object.entries(assignment).map(([memberId, data]) => `
            <div class="d-flex justify-content-between align-items-center py-1">
                <small>${data.memberName}</small>
                <small class="text-success">HK$ ${data.amount.toFixed(2)}</small>
            </div>
        `).join('');

        assignmentEl.innerHTML = assignmentHtml;
    }

    /**
     * 初始化項目分配
     */
    initializeItemAssignments() {
        this.itemAssignments.clear();
        this.currentReceipt.items.forEach(item => {
            this.updateItemAssignmentDisplay(item.id);
        });
    }

    /**
     * 更新項目分配選項
     */
    updateItemAssignmentOptions() {
        // 更新所有項目的可分配狀態
        this.currentReceipt.items.forEach(item => {
            this.updateItemAssignmentDisplay(item.id);
        });
    }

    /**
     * 更新即時預覽
     */
    updateLivePreview() {
        const previewEl = document.getElementById('livePreviewContent');
        if (!previewEl) return;

        if (this.participants.size === 0) {
            previewEl.innerHTML = `
                <div class="text-muted text-center py-4">
                    <i class="bi bi-calculator"></i>
                    <p class="mb-0">選擇參與者後顯示預覽</p>
                </div>
            `;
            return;
        }

        // 計算每人欠款
        const debts = this.calculateDebts();
        const serviceFee = this.calculateServiceFee();
        const tip = this.calculateTip();
        const totalAmount = this.currentReceipt.totalAmount + serviceFee + tip;

        // 生成預覽HTML
        const previewHtml = `
            <div class="mb-3">
                <h6 class="border-bottom pb-2">費用明細</h6>
                <div class="d-flex justify-content-between mb-1">
                    <span>項目小計:</span>
                    <span>HK$ ${this.currentReceipt.totalAmount.toFixed(2)}</span>
                </div>
                ${serviceFee > 0 ? `
                <div class="d-flex justify-content-between mb-1">
                    <span>服務費:</span>
                    <span>HK$ ${serviceFee.toFixed(2)}</span>
                </div>
                ` : ''}
                ${tip > 0 ? `
                <div class="d-flex justify-content-between mb-1">
                    <span>小費:</span>
                    <span>HK$ ${tip.toFixed(2)}</span>
                </div>
                ` : ''}
                <hr>
                <div class="d-flex justify-content-between fw-bold">
                    <span>總計:</span>
                    <span class="text-success">HK$ ${totalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <div>
                <h6 class="border-bottom pb-2">各人應付</h6>
                ${Object.entries(debts).map(([memberId, amount]) => {
                    const member = this.participants.get(memberId);
                    return `
                        <div class="d-flex justify-content-between mb-2">
                            <span>${member?.name || '未知'}</span>
                            <span class="fw-bold text-primary">HK$ ${amount.toFixed(2)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        previewEl.innerHTML = previewHtml;
    }

    /**
     * 計算債務分配
     */
    calculateDebts() {
        const debts = {};
        
        // 初始化每人欠款為0
        this.participants.forEach((member, memberId) => {
            debts[memberId] = 0;
        });

        // 累計每項目的分配
        this.itemAssignments.forEach((assignment, itemId) => {
            Object.entries(assignment).forEach(([memberId, data]) => {
                if (debts.hasOwnProperty(memberId)) {
                    debts[memberId] += data.amount;
                }
            });
        });

        // 添加服務費和小費的分攤
        const serviceFee = this.calculateServiceFee();
        const tip = this.calculateTip();
        const extraFees = serviceFee + tip;
        
        if (extraFees > 0 && this.participants.size > 0) {
            const extraFeePerPerson = extraFees / this.participants.size;
            Object.keys(debts).forEach(memberId => {
                debts[memberId] += extraFeePerPerson;
            });
        }

        return debts;
    }

    /**
     * 計算服務費
     */
    calculateServiceFee() {
        const serviceFeeInput = document.getElementById('serviceFeeInput');
        const serviceFeePercent = parseFloat(serviceFeeInput?.value) || 0;
        return this.currentReceipt.totalAmount * (serviceFeePercent / 100);
    }

    /**
     * 計算小費
     */
    calculateTip() {
        const tipInput = document.getElementById('tipInput');
        return parseFloat(tipInput?.value) || 0;
    }

    /**
     * 重置所有分配
     */
    resetAllAssignments() {
        this.itemAssignments.clear();
        this.currentReceipt.items.forEach(item => {
            this.updateItemAssignmentDisplay(item.id);
        });
        this.updateLivePreview();
        this.showNotification('已重置所有分配', 'info');
    }

    /**
     * 自動平均分配
     */
    autoAssignEqual() {
        if (this.participants.size === 0) {
            this.showNotification('請先選擇參與者', 'warning');
            return;
        }

        const participantIds = Array.from(this.participants.keys());
        
        this.currentReceipt.items.forEach(item => {
            const assignment = {};
            const amountPerPerson = item.totalPrice / participantIds.length;
            const quantityPerPerson = item.quantity / participantIds.length;

            participantIds.forEach(memberId => {
                assignment[memberId] = {
                    amount: amountPerPerson,
                    quantity: quantityPerPerson,
                    memberName: this.participants.get(memberId)?.name || ''
                };
            });

            this.itemAssignments.set(item.id, assignment);
            this.updateItemAssignmentDisplay(item.id);
        });

        this.updateLivePreview();
        this.showNotification('已自動平均分配所有項目', 'success');
    }

    /**
     * 確認分帳
     */
    async confirmAdvancedSplit() {
        // 驗證
        if (this.participants.size === 0) {
            this.showNotification('請選擇參與者', 'warning');
            return;
        }

        const payerSelector = document.getElementById('payerSelector');
        if (!payerSelector?.value) {
            this.showNotification('請選擇付款人', 'warning');
            return;
        }

        // 檢查所有項目是否已分配
        let totalAssigned = 0;
        this.itemAssignments.forEach(assignment => {
            Object.values(assignment).forEach(data => {
                totalAssigned += data.amount;
            });
        });

        if (Math.abs(totalAssigned - this.currentReceipt.totalAmount) > 0.01) {
            this.showNotification('項目分配不完整，請檢查所有項目是否已正確分配', 'warning');
            return;
        }

        // 顯示載入動畫
        const loadingId = window.haMoneyLoadingManager?.showFullScreenLoading('正在保存分帳記錄...', 'spinner');

        try {
            // 生成分帳數據
            const splittingData = this.generateSplittingData();
            
            // 保存分帳記錄
            await this.saveSplittingRecord(splittingData);
            
            // 更新欠款記錄
            await this.updateDebtRecords(splittingData);
            
            // 隱藏載入動畫
            if (loadingId) window.haMoneyLoadingManager?.hideLoading(loadingId);
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('advancedSplittingModal'));
            modal?.hide();
            
            // 顯示成功
            window.haMoneyLoadingManager?.showSuccessAnimation('分帳完成！');
            
            // 顯示結果
            this.showSplittingResult(splittingData);
            
        } catch (error) {
            console.error('分帳保存失敗:', error);
            if (loadingId) window.haMoneyLoadingManager?.hideLoading(loadingId);
            this.showNotification('分帳保存失敗，請重試', 'error');
        }
    }

    /**
     * 生成分帳數據
     */
    generateSplittingData() {
        const debts = this.calculateDebts();
        const serviceFee = this.calculateServiceFee();
        const tip = this.calculateTip();
        const totalAmount = this.currentReceipt.totalAmount + serviceFee + tip;
        const payerId = document.getElementById('payerSelector')?.value;

        const splittingData = {
            id: 'split_' + Date.now(),
            receipt: this.currentReceipt,
            group: this.selectedGroup,
            participants: Array.from(this.participants.values()),
            itemAssignments: Object.fromEntries(this.itemAssignments),
            debts: debts,
            serviceFee: serviceFee,
            tip: tip,
            totalAmount: totalAmount,
            payerId: payerId,
            payerName: this.participants.get(payerId)?.name || '',
            createdAt: new Date().toISOString(),
            createdBy: window.haMoneyAuth?.getCurrentUser()?.uid || 'guest'
        };

        return splittingData;
    }

    /**
     * 保存分帳記錄
     */
    async saveSplittingRecord(data) {
        // 保存到本地存儲
        const records = window.haMoneyStorage?.get('splittingRecords') || [];
        records.push({
            id: data.id,
            title: `${data.receipt.storeName} - ${data.receipt.date}`,
            total: data.totalAmount,
            participants: data.participants.length,
            createdAt: data.createdAt,
            receipt: data.receipt,
            splits: data.debts,
            groupId: data.group?.id,
            status: 'active'
        });
        
        window.haMoneyStorage?.set('splittingRecords', records);

        // 如果有Firebase，也保存到雲端
        if (window.haMoneyAuth?.db && window.haMoneyAuth?.isSignedIn()) {
            try {
                await window.haMoneyAuth.db.collection('splitting_records').add(data);
            } catch (error) {
                console.warn('雲端保存失敗:', error);
            }
        }
    }

    /**
     * 更新欠款記錄
     */
    async updateDebtRecords(splittingData) {
        if (!window.haMoneyDebtTracker) return;

        const payerId = splittingData.payerId;
        
        // 為每個參與者創建欠款記錄
        Object.entries(splittingData.debts).forEach(([memberId, amount]) => {
            if (memberId !== payerId && amount > 0) {
                const debtRecord = {
                    fromUserId: memberId,
                    fromUserName: splittingData.participants.find(p => p.id === memberId)?.name || '',
                    toUserId: payerId,
                    toUserName: splittingData.payerName,
                    amount: amount,
                    description: `${splittingData.receipt.storeName} - 分帳`,
                    splittingId: splittingData.id,
                    groupId: splittingData.group?.id,
                    status: 'pending'
                };

                window.haMoneyDebtTracker.createDebtRecord(debtRecord);
            }
        });
    }

    /**
     * 顯示分帳結果
     */
    showSplittingResult(data) {
        const resultModalHtml = `
            <div class="modal fade" id="splittingResultModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-check-circle me-2"></i>分帳完成
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>分帳摘要</h6>
                                    <ul class="list-unstyled">
                                        <li><strong>商店:</strong> ${data.receipt.storeName}</li>
                                        <li><strong>日期:</strong> ${data.receipt.date}</li>
                                        <li><strong>總金額:</strong> <span class="text-success">HK$ ${data.totalAmount.toFixed(2)}</span></li>
                                        <li><strong>參與人數:</strong> ${data.participants.length}人</li>
                                        <li><strong>付款人:</strong> ${data.payerName}</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>各人應付</h6>
                                    <ul class="list-unstyled">
                                        ${Object.entries(data.debts).map(([memberId, amount]) => {
                                            const member = data.participants.find(p => p.id === memberId);
                                            const isPayer = memberId === data.payerId;
                                            return `
                                                <li class="d-flex justify-content-between">
                                                    <span>${member?.name || '未知'} ${isPayer ? '(付款人)' : ''}</span>
                                                    <span class="fw-bold ${isPayer ? 'text-success' : 'text-primary'}">
                                                        ${isPayer ? '已付款' : `HK$ ${amount.toFixed(2)}`}
                                                    </span>
                                                </li>
                                            `;
                                        }).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                            <button type="button" class="btn btn-primary" onclick="window.haMoneyMain?.showSection('records')">
                                查看記錄
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊模態框
        const existingModal = document.getElementById('splittingResultModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', resultModalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('splittingResultModal'));
        modal.show();
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        if (window.haMoneyMain?.showNotification) {
            window.haMoneyMain.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 創建全域實例
window.haMoneyAdvancedSplitting = new HaMoneyAdvancedSplitting(); 