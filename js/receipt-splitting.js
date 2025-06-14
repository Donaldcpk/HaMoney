/**
 * HaMoney - 單據分帳匹配模組
 * 核心功能：掃描單據後匹配群組成員進行分帳
 */

class ReceiptSplitting {
    constructor() {
        this.currentReceipt = null;
        this.selectedGroup = null;
        this.itemAssignments = {}; // 項目分配：{itemIndex: [memberIds]}
        this.memberShares = {};    // 成員分攤：{memberId: amount}
        this.payerMember = null;   // 付款人
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 監聽分帳按鈕事件
        document.addEventListener('click', (e) => {
            if (e.target.id === 'quickEqualSplit' || e.target.closest('#quickEqualSplit')) {
                e.preventDefault();
                this.startReceiptSplitting();
            }
            
            if (e.target.id === 'detailedSplit' || e.target.closest('#detailedSplit')) {
                e.preventDefault();
                this.startAdvancedSplitting();
            }
        });
    }

    /**
     * 開始單據分帳流程
     */
    startReceiptSplitting() {
        // 檢查單據數據
        if (!this.validateReceiptData()) {
            return;
        }

        // 檢查已選擇的群組
        const selectedGroup = window.haMoneyStorage.get('selectedGroup');
        if (!selectedGroup) {
            this.showNotification('請先選擇群組', 'warning');
            return;
        }

        this.selectedGroup = selectedGroup;
        this.currentReceipt = this.extractReceiptData();
        
        // 顯示項目匹配界面
        this.showItemMemberMatching();
    }

    /**
     * 驗證單據資料
     */
    validateReceiptData() {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults || analysisResults.classList.contains('d-none')) {
            this.showNotification('請先掃描並確認單據內容', 'warning');
            return false;
        }

        const totalAmount = document.getElementById('totalAmount');
        if (!totalAmount || parseFloat(totalAmount.textContent.replace(/[^\d.]/g, '')) <= 0) {
            this.showNotification('單據金額無效', 'error');
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
        const itemsListEl = document.getElementById('itemsList');

        // 提取項目清單
        const items = [];
        const itemElements = itemsListEl.querySelectorAll('.editable-item');
        itemElements.forEach((element, index) => {
            const name = element.querySelector('.item-name').textContent;
            const quantityEl = element.querySelector('.item-quantity');
            const quantity = quantityEl ? parseInt(quantityEl.textContent.replace('x', '').trim()) : 1;
            const priceText = element.querySelector('.item-total').textContent;
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

            items.push({
                index: index,
                name: name,
                quantity: quantity,
                unitPrice: price / quantity,
                totalPrice: price
            });
        });

        return {
            totalAmount: parseFloat(totalAmountEl.textContent.replace(/[^\d.]/g, '')) || 0,
            date: receiptDateEl.textContent || new Date().toLocaleDateString('zh-TW'),
            storeName: storeNameEl.textContent || '未知商店',
            items: items,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 顯示項目成員匹配界面
     * 核心功能：將每個項目分配給群組成員
     */
    showItemMemberMatching() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'itemMemberMatchingModal';
        
        const modalContent = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-diagram-3 me-2"></i>項目分帳配對
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- 單據摘要 -->
                        <div class="alert alert-info mb-4">
                            <div class="row text-center">
                                <div class="col-md-3">
                                    <strong>群組</strong><br>
                                    <span class="text-muted">${this.selectedGroup.name}</span>
                                </div>
                                <div class="col-md-3">
                                    <strong>商店</strong><br>
                                    <span class="text-muted">${this.currentReceipt.storeName}</span>
                                </div>
                                <div class="col-md-3">
                                    <strong>總金額</strong><br>
                                    <span class="text-success fs-5">HK$ ${this.currentReceipt.totalAmount.toFixed(2)}</span>
                                </div>
                                <div class="col-md-3">
                                    <strong>日期</strong><br>
                                    <span class="text-muted">${this.currentReceipt.date}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 項目分配區域 -->
                        <div class="row">
                            <!-- 左側：項目清單 -->
                            <div class="col-md-7">
                                <h6><i class="bi bi-list-ul me-2"></i>項目清單</h6>
                                <div id="itemsAssignment" class="mb-3">
                                    ${this.generateItemsAssignmentHTML()}
                                </div>
                            </div>

                            <!-- 右側：成員列表 -->
                            <div class="col-md-5">
                                <h6><i class="bi bi-people me-2"></i>群組成員</h6>
                                <div id="membersPanel" class="mb-3">
                                    ${this.generateMembersPanelHTML()}
                                </div>

                                <!-- 付款人選擇 -->
                                <div class="mb-3">
                                    <h6><i class="bi bi-credit-card me-2"></i>付款人</h6>
                                    <select class="form-select" id="payerSelect">
                                        <option value="">選擇付款人</option>
                                        ${this.selectedGroup.members.map(member => 
                                            `<option value="${member.id}">${member.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>

                                <!-- 分帳結果預覽 -->
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6><i class="bi bi-calculator me-2"></i>分帳結果</h6>
                                        <div id="splittingPreview">
                                            <div class="text-center text-muted">
                                                請分配項目查看結果
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 快捷操作 -->
                        <div class="mt-4">
                            <div class="row g-2">
                                <div class="col-6 col-md-3">
                                    <button type="button" class="btn btn-outline-primary w-100" id="assignAllToAll">
                                        <i class="bi bi-people me-1"></i>全部平分
                                    </button>
                                </div>
                                <div class="col-6 col-md-3">
                                    <button type="button" class="btn btn-outline-secondary w-100" id="clearAllAssignments">
                                        <i class="bi bi-eraser me-1"></i>清除分配
                                    </button>
                                </div>
                                <div class="col-6 col-md-3">
                                    <button type="button" class="btn btn-outline-info w-100" id="smartAssign">
                                        <i class="bi bi-magic me-1"></i>智能分配
                                    </button>
                                </div>
                                <div class="col-6 col-md-3">
                                    <button type="button" class="btn btn-outline-warning w-100" id="previewCalculation">
                                        <i class="bi bi-eye me-1"></i>預覽結果
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-success" id="confirmSplitting" disabled>
                            <i class="bi bi-check-lg me-1"></i>確認分帳
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        const bootstrapModal = new bootstrap.Modal(modal, {
            backdrop: 'static',
            keyboard: false
        });
        bootstrapModal.show();

        // 綁定事件
        this.bindMatchingEvents(modal);

        // 清理模態框
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * 生成項目分配HTML
     */
    generateItemsAssignmentHTML() {
        return this.currentReceipt.items.map(item => `
            <div class="card mb-2 item-card" data-item-index="${item.index}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h6 class="mb-1">${item.name}</h6>
                            <small class="text-muted">
                                數量: ${item.quantity} | 單價: HK$ ${item.unitPrice.toFixed(2)} | 小計: HK$ ${item.totalPrice.toFixed(2)}
                            </small>
                        </div>
                        <div class="col-md-4">
                            <div class="assigned-members" data-item-index="${item.index}">
                                <small class="text-muted">未分配</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 生成成員面板HTML
     */
    generateMembersPanelHTML() {
        return this.selectedGroup.members.map(member => `
            <div class="card mb-2 member-card" data-member-id="${member.id}">
                <div class="card-body py-2">
                    <div class="row align-items-center">
                        <div class="col-8">
                            <h6 class="mb-0">${member.name}</h6>
                        </div>
                        <div class="col-4 text-end">
                            <span class="badge bg-secondary member-amount" data-member-id="${member.id}">HK$ 0.00</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 綁定匹配界面事件
     */
    bindMatchingEvents(modal) {
        // 項目點擊事件 - 顯示成員選擇
        const itemCards = modal.querySelectorAll('.item-card');
        itemCards.forEach(card => {
            card.addEventListener('click', () => {
                this.showMemberSelectionForItem(card.dataset.itemIndex);
            });
        });

        // 快捷操作
        modal.querySelector('#assignAllToAll').addEventListener('click', () => {
            this.assignAllItemsToAllMembers();
        });

        modal.querySelector('#clearAllAssignments').addEventListener('click', () => {
            this.clearAllAssignments();
        });

        modal.querySelector('#smartAssign').addEventListener('click', () => {
            this.smartAssignItems();
        });

        modal.querySelector('#previewCalculation').addEventListener('click', () => {
            this.updateSplittingPreview();
        });

        // 付款人選擇
        modal.querySelector('#payerSelect').addEventListener('change', (e) => {
            this.payerMember = e.target.value;
            this.updateSplittingPreview();
        });

        // 確認分帳
        modal.querySelector('#confirmSplitting').addEventListener('click', () => {
            this.confirmSplitting();
        });
    }

    /**
     * 顯示項目的成員選擇界面
     */
    showMemberSelectionForItem(itemIndex) {
        const item = this.currentReceipt.items[itemIndex];
        const currentAssignments = this.itemAssignments[itemIndex] || [];

        const selectionModal = document.createElement('div');
        selectionModal.className = 'modal fade';
        selectionModal.id = 'memberSelectionModal';
        
        selectionModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">選擇分攤成員</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <h6>${item.name}</h6>
                            <p class="text-muted">單價: HK$ ${item.unitPrice.toFixed(2)} | 總價: HK$ ${item.totalPrice.toFixed(2)}</p>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">選擇參與分攤的成員：</label>
                            ${this.selectedGroup.members.map(member => `
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" 
                                           id="member_${member.id}" value="${member.id}"
                                           ${currentAssignments.includes(member.id) ? 'checked' : ''}>
                                    <label class="form-check-label" for="member_${member.id}">
                                        ${member.name}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" id="saveMemberSelection">確認</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(selectionModal);
        const modal = new bootstrap.Modal(selectionModal);
        modal.show();

        // 保存選擇
        selectionModal.querySelector('#saveMemberSelection').addEventListener('click', () => {
            const selectedMembers = [];
            const checkboxes = selectionModal.querySelectorAll('input[type="checkbox"]:checked');
            checkboxes.forEach(cb => selectedMembers.push(cb.value));
            
            this.itemAssignments[itemIndex] = selectedMembers;
            this.updateItemAssignmentDisplay(itemIndex);
            this.updateSplittingPreview();
            
            modal.hide();
        });

        // 清理
        selectionModal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(selectionModal);
        });
    }

    /**
     * 更新項目分配顯示
     */
    updateItemAssignmentDisplay(itemIndex) {
        const assignedDiv = document.querySelector(`[data-item-index="${itemIndex}"] .assigned-members`);
        const assignments = this.itemAssignments[itemIndex] || [];
        
        if (assignments.length === 0) {
            assignedDiv.innerHTML = '<small class="text-muted">未分配</small>';
        } else {
            const memberNames = assignments.map(memberId => {
                const member = this.selectedGroup.members.find(m => m.id === memberId);
                return member ? member.name : '未知';
            });
            assignedDiv.innerHTML = `<small class="text-success">${memberNames.join(', ')}</small>`;
        }
    }

    /**
     * 全部項目分配給全部成員（平分）
     */
    assignAllItemsToAllMembers() {
        const allMemberIds = this.selectedGroup.members.map(m => m.id);
        this.currentReceipt.items.forEach(item => {
            this.itemAssignments[item.index] = [...allMemberIds];
            this.updateItemAssignmentDisplay(item.index);
        });
        this.updateSplittingPreview();
        this.showNotification('已將所有項目分配給所有成員', 'success');
    }

    /**
     * 清除所有分配
     */
    clearAllAssignments() {
        this.itemAssignments = {};
        this.currentReceipt.items.forEach(item => {
            this.updateItemAssignmentDisplay(item.index);
        });
        this.updateSplittingPreview();
        this.showNotification('已清除所有分配', 'info');
    }

    /**
     * 智能分配（基於歷史偏好）
     */
    smartAssignItems() {
        // 這裡可以實現基於歷史數據的智能分配邏輯
        // 目前先實現簡單的平分
        this.assignAllItemsToAllMembers();
    }

    /**
     * 更新分帳預覽
     */
    updateSplittingPreview() {
        const preview = document.getElementById('splittingPreview');
        if (!preview) return;

        // 計算每個成員應付金額
        this.memberShares = {};
        this.selectedGroup.members.forEach(member => {
            this.memberShares[member.id] = 0;
        });

        // 遍歷所有項目分配
        this.currentReceipt.items.forEach(item => {
            const assignments = this.itemAssignments[item.index];
            if (assignments && assignments.length > 0) {
                const sharePerMember = item.totalPrice / assignments.length;
                assignments.forEach(memberId => {
                    this.memberShares[memberId] += sharePerMember;
                });
            }
        });

        // 更新成員金額顯示
        this.selectedGroup.members.forEach(member => {
            const badge = document.querySelector(`[data-member-id="${member.id}"].member-amount`);
            if (badge) {
                badge.textContent = `HK$ ${this.memberShares[member.id].toFixed(2)}`;
                badge.className = this.memberShares[member.id] > 0 ? 'badge bg-primary' : 'badge bg-secondary';
            }
        });

        // 生成預覽HTML
        const totalAssigned = Object.values(this.memberShares).reduce((sum, amount) => sum + amount, 0);
        const unassignedAmount = this.currentReceipt.totalAmount - totalAssigned;

        let previewHTML = `
            <div class="row g-2 mb-3">
                ${this.selectedGroup.members.map(member => `
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <span>${member.name}</span>
                            <span class="badge ${this.memberShares[member.id] > 0 ? 'bg-primary' : 'bg-light text-dark'}">
                                HK$ ${this.memberShares[member.id].toFixed(2)}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between">
                        <strong>已分配總額</strong>
                        <strong class="text-primary">HK$ ${totalAssigned.toFixed(2)}</strong>
                    </div>
                </div>
                ${unassignedAmount > 0.01 ? `
                <div class="col-12">
                    <div class="d-flex justify-content-between text-warning">
                        <strong>未分配金額</strong>
                        <strong>HK$ ${unassignedAmount.toFixed(2)}</strong>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        if (this.payerMember) {
            const payerName = this.selectedGroup.members.find(m => m.id === this.payerMember)?.name;
            previewHTML += `
                <hr>
                <div class="alert alert-info py-2 mb-0">
                    <small><i class="bi bi-info-circle me-1"></i><strong>${payerName}</strong> 先付款，其他人再轉帳給付款人</small>
                </div>
            `;
        }

        preview.innerHTML = previewHTML;

        // 檢查是否可以確認分帳
        const confirmBtn = document.getElementById('confirmSplitting');
        if (confirmBtn) {
            const canConfirm = totalAssigned > 0 && Math.abs(unassignedAmount) < 0.01 && this.payerMember;
            confirmBtn.disabled = !canConfirm;
        }
    }

    /**
     * 確認分帳
     */
    confirmSplitting() {
        if (!this.validateSplittingData()) {
            return;
        }

        // 生成最終分帳結果
        const splittingResult = this.generateSplittingResult();
        
        // 顯示最終確認界面
        this.showFinalConfirmation(splittingResult);
    }

    /**
     * 驗證分帳數據
     */
    validateSplittingData() {
        const totalAssigned = Object.values(this.memberShares).reduce((sum, amount) => sum + amount, 0);
        const unassignedAmount = Math.abs(this.currentReceipt.totalAmount - totalAssigned);

        if (unassignedAmount > 0.01) {
            this.showNotification('還有項目未分配完成', 'warning');
            return false;
        }

        if (!this.payerMember) {
            this.showNotification('請選擇付款人', 'warning');
            return false;
        }

        return true;
    }

    /**
     * 生成分帳結果
     */
    generateSplittingResult() {
        const payerName = this.selectedGroup.members.find(m => m.id === this.payerMember)?.name;
        const payerAmount = this.memberShares[this.payerMember] || 0;
        const payerPaidExtra = this.currentReceipt.totalAmount - payerAmount;

        const memberDetails = this.selectedGroup.members.map(member => ({
            id: member.id,
            name: member.name,
            shouldPay: this.memberShares[member.id] || 0,
            isPayer: member.id === this.payerMember,
            owesToPayer: member.id === this.payerMember ? 0 : (this.memberShares[member.id] || 0)
        }));

        return {
            receiptData: this.currentReceipt,
            groupData: this.selectedGroup,
            itemAssignments: this.itemAssignments,
            memberDetails: memberDetails,
            payerMember: this.payerMember,
            payerName: payerName,
            totalAmount: this.currentReceipt.totalAmount,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 顯示最終確認界面
     */
    showFinalConfirmation(splittingResult) {
        // 關閉當前模態框
        const currentModal = bootstrap.Modal.getInstance(document.getElementById('itemMemberMatchingModal'));
        if (currentModal) {
            currentModal.hide();
        }

        // 顯示結果表格
        setTimeout(() => {
            this.showSplittingResultsTable(splittingResult);
        }, 300);
    }

    /**
     * 顯示分帳結果表格
     * 核心需求：顯示簡單表格說明每人付款多少及誰人最後付款
     */
    showSplittingResultsTable(splittingResult) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'splittingResultsModal';
        
        const memberRows = splittingResult.memberDetails.map(member => `
            <tr class="${member.isPayer ? 'table-success' : ''}">
                <td>
                    <strong>${member.name}</strong>
                    ${member.isPayer ? '<span class="badge bg-success ms-2">付款人</span>' : ''}
                </td>
                <td class="text-end">HK$ ${member.shouldPay.toFixed(2)}</td>
                <td class="text-end">
                    ${member.isPayer ? 
                        '<span class="text-success">已付款</span>' : 
                        `<span class="text-primary">轉帳給 ${splittingResult.payerName}</span>`
                    }
                </td>
                <td class="text-end">
                    ${member.isPayer ? 
                        '<span class="text-muted">-</span>' : 
                        `<strong class="text-primary">HK$ ${member.owesToPayer.toFixed(2)}</strong>`
                    }
                </td>
            </tr>
        `).join('');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-check-circle me-2"></i>分帳完成
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- 單據摘要 -->
                        <div class="alert alert-info mb-4">
                            <div class="row text-center">
                                <div class="col-md-4">
                                    <strong>商店</strong><br>
                                    <span class="text-muted">${splittingResult.receiptData.storeName}</span>
                                </div>
                                <div class="col-md-4">
                                    <strong>總金額</strong><br>
                                    <span class="text-success fs-5">HK$ ${splittingResult.totalAmount.toFixed(2)}</span>
                                </div>
                                <div class="col-md-4">
                                    <strong>群組</strong><br>
                                    <span class="text-muted">${splittingResult.groupData.name}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 分帳結果表格 -->
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead class="table-primary">
                                    <tr>
                                        <th>成員</th>
                                        <th class="text-end">應付金額</th>
                                        <th class="text-end">付款狀態</th>
                                        <th class="text-end">需轉帳</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${memberRows}
                                </tbody>
                                <tfoot class="table-light">
                                    <tr>
                                        <th>總計</th>
                                        <th class="text-end">HK$ ${splittingResult.totalAmount.toFixed(2)}</th>
                                        <th></th>
                                        <th class="text-end">
                                            HK$ ${splittingResult.memberDetails
                                                .filter(m => !m.isPayer)
                                                .reduce((sum, m) => sum + m.owesToPayer, 0)
                                                .toFixed(2)}
                                        </th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <!-- 轉帳說明 -->
                        <div class="alert alert-success">
                            <h6><i class="bi bi-info-circle me-2"></i>轉帳說明</h6>
                            <p class="mb-2"><strong>${splittingResult.payerName}</strong> 已經支付了整筆費用 HK$ ${splittingResult.totalAmount.toFixed(2)}</p>
                            <p class="mb-0">其他成員請按照上表金額轉帳給 <strong>${splittingResult.payerName}</strong></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x me-1"></i>關閉
                        </button>
                        <button type="button" class="btn btn-primary" id="shareResults">
                            <i class="bi bi-share me-1"></i>分享結果
                        </button>
                        <button type="button" class="btn btn-success" id="saveRecord">
                            <i class="bi bi-save me-1"></i>保存記錄
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal, {
            backdrop: 'static'
        });
        bootstrapModal.show();

        // 綁定事件
        modal.querySelector('#saveRecord').addEventListener('click', () => {
            this.saveRecord(splittingResult);
            bootstrapModal.hide();
        });

        modal.querySelector('#shareResults').addEventListener('click', () => {
            this.shareResults(splittingResult);
        });

        // 清理
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * 保存分帳記錄
     */
    saveRecord(splittingResult) {
        try {
            // 保存到存儲
            window.haMoneyStorage.addRecord({
                title: `${splittingResult.receiptData.storeName} - ${splittingResult.receiptData.date}`,
                receiptData: splittingResult.receiptData,
                groupData: splittingResult.groupData,
                splittingResult: splittingResult,
                status: 'active',
                type: 'receipt_splitting'
            });

            this.showNotification('分帳記錄已保存！', 'success');
            
            // 跳轉到記錄頁面
            setTimeout(() => {
                if (window.haMoneyMain) {
                    window.haMoneyMain.showSection('records');
                }
            }, 1000);

        } catch (error) {
            console.error('保存記錄失敗:', error);
            this.showNotification('保存失敗，請重試', 'error');
        }
    }

    /**
     * 分享結果
     */
    shareResults(splittingResult) {
        const text = this.generateShareText(splittingResult);
        
        if (navigator.share) {
            navigator.share({
                title: 'HaMoney 分帳結果',
                text: text
            });
        } else {
            // 複製到剪貼板
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('分帳結果已複製到剪貼板', 'success');
            });
        }
    }

    /**
     * 生成分享文字
     */
    generateShareText(splittingResult) {
        let text = `🍽️ ${splittingResult.receiptData.storeName} 分帳結果\n`;
        text += `📅 ${splittingResult.receiptData.date}\n`;
        text += `💰 總金額: HK$ ${splittingResult.totalAmount.toFixed(2)}\n\n`;
        
        text += `👥 群組: ${splittingResult.groupData.name}\n`;
        text += `💳 付款人: ${splittingResult.payerName}\n\n`;
        
        text += `📊 分帳明細:\n`;
        splittingResult.memberDetails.forEach(member => {
            if (member.isPayer) {
                text += `✅ ${member.name}: HK$ ${member.shouldPay.toFixed(2)} (已付款)\n`;
            } else {
                text += `💸 ${member.name}: HK$ ${member.shouldPay.toFixed(2)} → 轉帳給 ${splittingResult.payerName}\n`;
            }
        });
        
        text += `\n📱 由 HaMoney 智能分帳應用生成`;
        
        return text;
    }

    /**
     * 開始進階分帳
     */
    startAdvancedSplitting() {
        // 可以在這裡實現更複雜的分帳邏輯
        this.startReceiptSplitting();
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

// 創建全局實例
window.haMoneyReceiptSplitting = new ReceiptSplitting(); 