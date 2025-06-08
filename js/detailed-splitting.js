/**
 * HaMoney - 仔細分帳功能
 * 提供比例、百分比、項目三種分帳方式
 */

class DetailedSplitActions {
    constructor() {
        this.currentReceipt = null;
        this.currentItems = [];
        this.splitMode = 'ratio'; // ratio, percentage, item
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 仔細分帳按鈕
        document.addEventListener('click', (e) => {
            if (e.target.id === 'detailedSplit' || e.target.closest('#detailedSplit')) {
                e.preventDefault();
                this.startDetailedSplit();
            }
        });
    }

    /**
     * 開始仔細分帳流程
     */
    startDetailedSplit() {
        // 檢查是否有掃描結果
        if (!this.validateReceiptData()) {
            return;
        }

        // 提取單據資料和項目
        this.currentReceipt = this.extractReceiptData();
        this.currentItems = this.extractItemsData();

        // 顯示仔細分帳選擇界面
        this.showDetailedSplitSelection();
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
     * 提取項目資料
     */
    extractItemsData() {
        const itemsListEl = document.getElementById('itemsList');
        const items = [];

        if (itemsListEl) {
            const itemElements = itemsListEl.querySelectorAll('.list-group-item');
            itemElements.forEach((itemEl, index) => {
                const nameEl = itemEl.querySelector('.item-name');
                const priceEl = itemEl.querySelector('.item-price');
                
                if (nameEl && priceEl) {
                    items.push({
                        id: `item_${index}`,
                        name: nameEl.textContent.trim(),
                        price: parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) || 0,
                        assignedTo: []
                    });
                }
            });
        }

        // 如果沒有項目，創建一個總金額項目
        if (items.length === 0) {
            items.push({
                id: 'total_item',
                name: '總金額',
                price: this.currentReceipt.totalAmount,
                assignedTo: []
            });
        }

        return items;
    }

    /**
     * 顯示仔細分帳選擇界面
     */
    showDetailedSplitSelection() {
        const modalHTML = `
            <div class="modal fade" id="detailedSplitModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-gear-fill me-2"></i>仔細分帳
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
                                        <strong>項目數量</strong><br>
                                        <span class="text-info">${this.currentItems.length} 項</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 分帳方式選擇 -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0"><i class="bi bi-list-ul me-2"></i>選擇分帳方式</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <div class="card h-100 split-method-card" data-method="ratio">
                                                <div class="card-body text-center">
                                                    <i class="bi bi-pie-chart-fill text-primary mb-3" style="font-size: 2.5rem;"></i>
                                                    <h6>按比例分帳</h6>
                                                    <p class="text-muted small">例如：2:1:1 的比例分配</p>
                                                    <button class="btn btn-outline-primary btn-sm">選擇</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="card h-100 split-method-card" data-method="percentage">
                                                <div class="card-body text-center">
                                                    <i class="bi bi-percent text-warning mb-3" style="font-size: 2.5rem;"></i>
                                                    <h6>按百分比分帳</h6>
                                                    <p class="text-muted small">例如：50%、30%、20%</p>
                                                    <button class="btn btn-outline-warning btn-sm">選擇</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="card h-100 split-method-card" data-method="item">
                                                <div class="card-body text-center">
                                                    <i class="bi bi-list-check text-success mb-3" style="font-size: 2.5rem;"></i>
                                                    <h6>按項目分帳</h6>
                                                    <p class="text-muted small">將每個項目分配給不同人</p>
                                                    <button class="btn btn-outline-success btn-sm">選擇</button>
                                                </div>
                                            </div>
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
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div id="detailedParticipants">
                                                <!-- 動態生成參與者清單 -->
                                            </div>
                                            
                                            <!-- 新增參與者 -->
                                            <div class="mt-3">
                                                <div class="input-group">
                                                    <input type="text" class="form-control" id="newDetailedParticipantName" 
                                                           placeholder="新增參與者姓名">
                                                    <button class="btn btn-outline-secondary" type="button" id="addDetailedParticipant">
                                                        <i class="bi bi-plus-lg"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <h6>付款人</h6>
                                            <select class="form-select" id="detailedPayerSelect">
                                                <option value="">請選擇付款人</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 分帳詳細設定區域 -->
                            <div id="splitDetailsContainer" class="d-none">
                                <!-- 根據選擇的方式動態生成 -->
                            </div>

                            <!-- 計算預覽 -->
                            <div class="card d-none" id="detailedCalculationPreview">
                                <div class="card-header">
                                    <h6 class="mb-0"><i class="bi bi-calculator me-2"></i>分帳預覽</h6>
                                </div>
                                <div class="card-body">
                                    <div id="detailedCalculationResults">
                                        <!-- 動態生成計算結果 -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="confirmDetailedSplit" disabled>
                                <i class="bi bi-check-lg me-1"></i>確認分帳
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 插入模態框
        const existingModal = document.getElementById('detailedSplitModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('detailedSplitModal'));
        modal.show();

        // 綁定事件
        this.bindDetailedSplitEvents();

        // 載入參與者
        this.loadDetailedParticipants();
    }

    /**
     * 綁定仔細分帳事件
     */
    bindDetailedSplitEvents() {
        const modal = document.getElementById('detailedSplitModal');

        // 分帳方式選擇
        modal.addEventListener('click', (e) => {
            if (e.target.closest('.split-method-card')) {
                const method = e.target.closest('.split-method-card').dataset.method;
                this.selectSplitMethod(method);
            }
        });

        // 新增參與者
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'addDetailedParticipant') {
                this.addDetailedParticipant();
            }
        });

        // 確認分帳
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmDetailedSplit') {
                this.processDetailedSplit();
            }
        });

        // Enter鍵新增參與者
        modal.addEventListener('keypress', (e) => {
            if (e.target.id === 'newDetailedParticipantName' && e.key === 'Enter') {
                e.preventDefault();
                this.addDetailedParticipant();
            }
        });

        // 動態計算更新
        modal.addEventListener('input', (e) => {
            if (e.target.classList.contains('ratio-input') || 
                e.target.classList.contains('percentage-input')) {
                this.updateDetailedCalculation();
            }
        });

        // 項目分配變化
        modal.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.name && e.target.name.startsWith('item_')) {
                this.updateDetailedCalculation();
            }
        });
    }

    /**
     * 載入詳細參與者
     */
    loadDetailedParticipants() {
        const participantsHtml = `
            <div class="row g-2" id="detailedParticipantsList">
                <!-- 動態生成參與者 -->
            </div>
        `;
        
        document.getElementById('detailedParticipants').innerHTML = participantsHtml;
        
        // 添加當前用戶作為預設參與者
        const currentUser = window.haMoneyAuth?.getCurrentUser();
        if (currentUser) {
            this.addDetailedParticipantItem(currentUser.displayName || '我', currentUser.uid);
        }
    }

    /**
     * 新增詳細參與者項目
     */
    addDetailedParticipantItem(name, id = null) {
        const participantId = id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const container = document.getElementById('detailedParticipantsList');
        
        const participantHtml = `
            <div class="col-12 col-sm-6 col-md-4 participant-item" data-participant-id="${participantId}">
                <div class="card border">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="participant-name">${name}</span>
                            <button class="btn btn-sm btn-outline-danger remove-participant" 
                                    data-participant-id="${participantId}">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', participantHtml);
        this.updateDetailedPayerOptions();

        // 綁定移除事件
        const removeBtn = container.querySelector(`[data-participant-id="${participantId}"] .remove-participant`);
        removeBtn.addEventListener('click', () => {
            this.removeDetailedParticipant(participantId);
        });
    }

    /**
     * 新增詳細參與者
     */
    addDetailedParticipant() {
        const nameInput = document.getElementById('newDetailedParticipantName');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showNotification('請輸入參與者姓名', 'warning');
            return;
        }

        // 檢查是否重複
        const existingNames = document.querySelectorAll('.participant-name');
        for (let nameEl of existingNames) {
            if (nameEl.textContent.trim() === name) {
                this.showNotification('此參與者已存在', 'warning');
                nameInput.focus();
                return;
            }
        }

        this.addDetailedParticipantItem(name);
        nameInput.value = '';
        nameInput.focus();
    }

    /**
     * 移除詳細參與者
     */
    removeDetailedParticipant(participantId) {
        const participantEl = document.querySelector(`[data-participant-id="${participantId}"]`);
        if (participantEl) {
            participantEl.remove();
            this.updateDetailedPayerOptions();
            this.updateDetailedCalculation();
        }
    }

    /**
     * 更新詳細付款人選項
     */
    updateDetailedPayerOptions() {
        const payerSelect = document.getElementById('detailedPayerSelect');
        const participants = this.getDetailedParticipants();
        
        // 保存當前選擇
        const currentPayer = payerSelect.value;
        
        // 清空選項
        payerSelect.innerHTML = '<option value="">請選擇付款人</option>';
        
        // 添加所有參與者為付款人選項
        participants.forEach(participant => {
            const option = document.createElement('option');
            option.value = participant.id;
            option.textContent = participant.name;
            payerSelect.appendChild(option);
        });
        
        // 恢復之前的選擇
        if (currentPayer && participants.find(p => p.id === currentPayer)) {
            payerSelect.value = currentPayer;
        }
    }

    /**
     * 獲取詳細參與者清單
     */
    getDetailedParticipants() {
        const participantItems = document.querySelectorAll('.participant-item');
        return Array.from(participantItems).map(item => ({
            id: item.dataset.participantId,
            name: item.querySelector('.participant-name').textContent.trim()
        }));
    }

    /**
     * 選擇分帳方式
     */
    selectSplitMethod(method) {
        this.splitMode = method;
        
        // 更新選中狀態
        document.querySelectorAll('.split-method-card').forEach(card => {
            card.classList.remove('border-primary', 'bg-light');
        });
        
        const selectedCard = document.querySelector(`[data-method="${method}"]`);
        selectedCard.classList.add('border-primary', 'bg-light');

        // 顯示對應的詳細設定
        this.showSplitMethodDetails(method);
    }

    /**
     * 顯示分帳方式詳細設定
     */
    showSplitMethodDetails(method) {
        const container = document.getElementById('splitDetailsContainer');
        const participants = this.getDetailedParticipants();

        if (participants.length < 2) {
            container.innerHTML = '<div class="alert alert-warning">請至少添加2位參與者</div>';
            container.classList.remove('d-none');
            return;
        }

        let detailsHTML = '';

        switch (method) {
            case 'ratio':
                detailsHTML = this.generateRatioSettings(participants);
                break;
            case 'percentage':
                detailsHTML = this.generatePercentageSettings(participants);
                break;
            case 'item':
                detailsHTML = this.generateItemSettings(participants);
                break;
        }

        container.innerHTML = detailsHTML;
        container.classList.remove('d-none');

        // 顯示計算預覽
        document.getElementById('detailedCalculationPreview').classList.remove('d-none');
        this.updateDetailedCalculation();
    }

    /**
     * 生成比例設定界面
     */
    generateRatioSettings(participants) {
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>設定比例分配</h6>
                </div>
                <div class="card-body">
                    <p class="text-muted">為每位參與者設定比例數值（例如：2:1:1）</p>
                    <div class="row g-3">
                        ${participants.map(participant => `
                            <div class="col-md-6">
                                <label class="form-label">${participant.name}</label>
                                <div class="input-group">
                                    <input type="number" class="form-control ratio-input" 
                                           value="1" min="0" step="0.1"
                                           data-participant-id="${participant.id}">
                                    <span class="input-group-text">份</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成百分比設定界面
     */
    generatePercentageSettings(participants) {
        const defaultPercentage = (100 / participants.length).toFixed(1);
        
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-percent me-2"></i>設定百分比分配</h6>
                </div>
                <div class="card-body">
                    <p class="text-muted">為每位參與者設定百分比（總和必須為100%）</p>
                    <div class="row g-3">
                        ${participants.map(participant => `
                            <div class="col-md-6">
                                <label class="form-label">${participant.name}</label>
                                <div class="input-group">
                                    <input type="number" class="form-control percentage-input" 
                                           value="${defaultPercentage}" min="0" max="100" step="0.1"
                                           data-participant-id="${participant.id}">
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-3">
                        <div class="alert alert-info">
                            <small>
                                <i class="bi bi-info-circle me-1"></i>
                                總百分比：<span id="totalPercentage">100</span>%
                                <span id="percentageWarning" class="text-danger d-none">（必須等於100%）</span>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成項目設定界面
     */
    generateItemSettings(participants) {
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-list-check me-2"></i>項目分配</h6>
                </div>
                <div class="card-body">
                    <p class="text-muted">為每個項目選擇負責的參與者（可多選）</p>
                    ${this.currentItems.map(item => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-4">
                                        <h6 class="mb-1">${item.name}</h6>
                                        <span class="text-success">HK$ ${item.price.toFixed(2)}</span>
                                    </div>
                                    <div class="col-md-8">
                                        <div class="row g-2">
                                            ${participants.map(participant => `
                                                <div class="col-6 col-lg-3">
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="checkbox" 
                                                               name="item_${item.id}" 
                                                               value="${participant.id}"
                                                               id="item_${item.id}_${participant.id}">
                                                        <label class="form-check-label" 
                                                               for="item_${item.id}_${participant.id}">
                                                            ${participant.name}
                                                        </label>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 更新詳細計算
     */
    updateDetailedCalculation() {
        const participants = this.getDetailedParticipants();
        const payerSelect = document.getElementById('detailedPayerSelect');
        const resultContainer = document.getElementById('detailedCalculationResults');
        const confirmBtn = document.getElementById('confirmDetailedSplit');

        if (participants.length < 2 || !payerSelect.value) {
            resultContainer.innerHTML = '<div class="text-center text-muted">請完善設定後查看結果</div>';
            confirmBtn.disabled = true;
            return;
        }

        let splits = [];
        let isValid = false;

        switch (this.splitMode) {
            case 'ratio':
                splits = this.calculateRatioSplits(participants);
                isValid = splits.every(split => split.amount > 0);
                break;
            case 'percentage':
                splits = this.calculatePercentageSplits(participants);
                isValid = this.validatePercentageTotal();
                break;
            case 'item':
                splits = this.calculateItemSplits(participants);
                isValid = this.validateItemAssignments();
                break;
        }

        if (splits.length > 0 && isValid) {
            this.displayDetailedCalculationResults(splits);
            confirmBtn.disabled = false;
        } else {
            resultContainer.innerHTML = '<div class="text-center text-warning">請檢查設定</div>';
            confirmBtn.disabled = true;
        }
    }

    /**
     * 計算比例分帳
     */
    calculateRatioSplits(participants) {
        const ratioInputs = document.querySelectorAll('.ratio-input');
        const ratios = {};
        let totalRatio = 0;

        ratioInputs.forEach(input => {
            const participantId = input.dataset.participantId;
            const ratio = parseFloat(input.value) || 0;
            ratios[participantId] = ratio;
            totalRatio += ratio;
        });

        if (totalRatio === 0) return [];

        return participants.map(participant => ({
            participantId: participant.id,
            participantName: participant.name,
            amount: (this.currentReceipt.totalAmount * ratios[participant.id]) / totalRatio,
            ratio: ratios[participant.id]
        }));
    }

    /**
     * 計算百分比分帳
     */
    calculatePercentageSplits(participants) {
        const percentageInputs = document.querySelectorAll('.percentage-input');
        const percentages = {};

        percentageInputs.forEach(input => {
            const participantId = input.dataset.participantId;
            const percentage = parseFloat(input.value) || 0;
            percentages[participantId] = percentage;
        });

        // 更新百分比總計
        const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + p, 0);
        const totalEl = document.getElementById('totalPercentage');
        const warningEl = document.getElementById('percentageWarning');
        
        if (totalEl) {
            totalEl.textContent = totalPercentage.toFixed(1);
            if (Math.abs(totalPercentage - 100) > 0.1) {
                warningEl.classList.remove('d-none');
            } else {
                warningEl.classList.add('d-none');
            }
        }

        return participants.map(participant => ({
            participantId: participant.id,
            participantName: participant.name,
            amount: (this.currentReceipt.totalAmount * percentages[participant.id]) / 100,
            percentage: percentages[participant.id]
        }));
    }

    /**
     * 計算項目分帳
     */
    calculateItemSplits(participants) {
        const participantTotals = {};
        participants.forEach(p => {
            participantTotals[p.id] = { 
                name: p.name, 
                amount: 0, 
                items: [] 
            };
        });

        this.currentItems.forEach(item => {
            const checkboxes = document.querySelectorAll(`input[name="item_${item.id}"]:checked`);
            const assignedParticipants = Array.from(checkboxes).map(cb => cb.value);
            
            if (assignedParticipants.length > 0) {
                const amountPerPerson = item.price / assignedParticipants.length;
                assignedParticipants.forEach(participantId => {
                    if (participantTotals[participantId]) {
                        participantTotals[participantId].amount += amountPerPerson;
                        participantTotals[participantId].items.push({
                            name: item.name,
                            amount: amountPerPerson
                        });
                    }
                });
            }
        });

        return Object.entries(participantTotals).map(([id, data]) => ({
            participantId: id,
            participantName: data.name,
            amount: data.amount,
            items: data.items
        }));
    }

    /**
     * 驗證百分比總計
     */
    validatePercentageTotal() {
        const percentageInputs = document.querySelectorAll('.percentage-input');
        let total = 0;
        
        percentageInputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });

        return Math.abs(total - 100) <= 0.1;
    }

    /**
     * 驗證項目分配
     */
    validateItemAssignments() {
        return this.currentItems.every(item => {
            const checkboxes = document.querySelectorAll(`input[name="item_${item.id}"]:checked`);
            return checkboxes.length > 0;
        });
    }

    /**
     * 顯示詳細計算結果
     */
    displayDetailedCalculationResults(splits) {
        const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
        
        let resultHTML = `
            <div class="row mb-3">
                <div class="col-6">
                    <strong>原始總額：</strong>HK$ ${this.currentReceipt.totalAmount.toFixed(2)}
                </div>
                <div class="col-6">
                    <strong>分帳總額：</strong>
                    <span class="${Math.abs(totalSplit - this.currentReceipt.totalAmount) <= 0.01 ? 'text-success' : 'text-danger'}">
                        HK$ ${totalSplit.toFixed(2)}
                    </span>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>參與者</th>
                            <th>應付金額</th>
                            ${this.splitMode === 'ratio' ? '<th>比例</th>' : ''}
                            ${this.splitMode === 'percentage' ? '<th>百分比</th>' : ''}
                            ${this.splitMode === 'item' ? '<th>項目詳情</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${splits.map(split => `
                            <tr>
                                <td><strong>${split.participantName}</strong></td>
                                <td class="text-success">HK$ ${split.amount.toFixed(2)}</td>
                                ${this.splitMode === 'ratio' ? `<td>${split.ratio || 0}</td>` : ''}
                                ${this.splitMode === 'percentage' ? `<td>${(split.percentage || 0).toFixed(1)}%</td>` : ''}
                                ${this.splitMode === 'item' ? `
                                    <td>
                                        ${split.items ? split.items.map(item => `
                                            <small class="d-block">${item.name}: HK$ ${item.amount.toFixed(2)}</small>
                                        `).join('') : ''}
                                    </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('detailedCalculationResults').innerHTML = resultHTML;
    }

    /**
     * 處理詳細分帳
     */
    processDetailedSplit() {
        const participants = this.getDetailedParticipants();
        const payerId = document.getElementById('detailedPayerSelect').value;
        const payer = participants.find(p => p.id === payerId);

        if (!payer) {
            this.showNotification('請選擇付款人', 'error');
            return;
        }

        let splits = [];

        switch (this.splitMode) {
            case 'ratio':
                splits = this.calculateRatioSplits(participants);
                break;
            case 'percentage':
                splits = this.calculatePercentageSplits(participants);
                break;
            case 'item':
                splits = this.calculateItemSplits(participants);
                break;
        }

        // 添加付款人標記
        splits = splits.map(split => ({
            ...split,
            paid: split.participantId === payerId
        }));

        // 生成分帳資料
        const splitData = {
            id: `detailed_${Date.now()}`,
            type: 'detailed',
            method: this.splitMode,
            receipt: this.currentReceipt,
            participants: participants,
            payer: payer,
            splits: splits,
            totalAmount: this.currentReceipt.totalAmount,
            splitAmount: splits.reduce((sum, split) => sum + split.amount, 0),
            serviceFee: 0,
            tip: 0,
            timestamp: new Date().toISOString()
        };

        // 使用快速分帳的修訂界面
        this.showDetailedRevision(splitData);
    }

    /**
     * 顯示詳細分帳修訂界面
     */
    showDetailedRevision(splitData) {
        // 關閉詳細分帳模態框
        const detailedModal = bootstrap.Modal.getInstance(document.getElementById('detailedSplitModal'));
        detailedModal.hide();

        // 使用快速分帳的修訂界面
        setTimeout(() => {
            if (window.haMoneyQuickSplit) {
                window.haMoneyQuickSplit.showSplitRevision(splitData);
            }
        }, 300);
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        if (window.haMoneyLoadingManager) {
            window.haMoneyLoadingManager.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// 初始化詳細分帳功能
document.addEventListener('DOMContentLoaded', () => {
    window.haMoneyDetailedSplit = new DetailedSplitActions();
}); 