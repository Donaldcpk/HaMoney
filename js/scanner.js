/**
 * HaMoney - 圖像掃描模組
 * 負責圖像上傳、預覽、壓縮和掃描功能
 */

class HaMoneyScanner {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        this.compressionQuality = 0.8;
        this.maxImageSize = 1024; // 最大寬度或高度
        this.currentImage = null;
        this.init();
    }

    /**
     * 初始化掃描器
     */
    init() {
        this.bindEvents();
        this.initDragAndDrop();
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 上傳按鈕
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // 拍照按鈕
        const cameraBtn = document.getElementById('cameraBtn');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.openCamera());
        }

        // 移除圖片按鈕
        const removeImageBtn = document.getElementById('removeImageBtn');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => this.removeImage());
        }

        // 分析按鈕
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeImage());
        }
    }

    /**
     * 初始化拖拽上傳
     */
    initDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        uploadArea.addEventListener('click', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.click();
        });
    }

    /**
     * 處理文件選擇
     * @param {Event} event - 文件選擇事件
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    /**
     * 處理文件
     * @param {File} file - 選中的文件
     */
    async handleFile(file) {
        try {
            // 驗證文件
            if (!this.validateFile(file)) {
                return;
            }

            // 顯示載入狀態
            this.showLoading('正在處理圖片...');

            // 壓縮圖片
            const compressedImageData = await this.compressImage(file);
            
            // 顯示預覽並自動開始分析
            this.showImagePreview(compressedImageData, true);
            
            // 保存圖片數據
            this.currentImage = compressedImageData;

            this.hideLoading();
            this.showNotification('圖片上傳成功，正在自動分析...', 'success');

        } catch (error) {
            console.error('處理圖片失敗:', error);
            this.hideLoading();
            this.showNotification(`處理圖片失敗: ${error.message}`, 'error');
        }
    }

    /**
     * 驗證文件
     * @param {File} file - 要驗證的文件
     * @returns {boolean} 驗證結果
     */
    validateFile(file) {
        // 檢查文件類型
        if (!this.allowedTypes.includes(file.type)) {
            this.showNotification('請選擇 JPG 或 PNG 格式的圖片', 'error');
            return false;
        }

        // 檢查文件大小
        if (file.size > this.maxFileSize) {
            this.showNotification('文件大小不能超過 10MB', 'error');
            return false;
        }

        return true;
    }

    /**
     * 壓縮圖片
     * @param {File} file - 原始圖片文件
     * @returns {Promise<string>} 壓縮後的 base64 數據
     */
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // 計算新尺寸
                    let { width, height } = this.calculateNewSize(img.width, img.height);
                    
                    // 設置畫布尺寸
                    canvas.width = width;
                    canvas.height = height;

                    // 繪製壓縮後的圖片
                    ctx.drawImage(img, 0, 0, width, height);

                    // 轉換為 base64
                    const compressedData = canvas.toDataURL('image/jpeg', this.compressionQuality);
                    resolve(compressedData);

                } catch (error) {
                    reject(new Error('圖片壓縮失敗'));
                }
            };

            img.onerror = () => reject(new Error('圖片載入失敗'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * 計算新尺寸
     * @param {number} originalWidth - 原始寬度
     * @param {number} originalHeight - 原始高度
     * @returns {Object} 新的寬度和高度
     */
    calculateNewSize(originalWidth, originalHeight) {
        if (originalWidth <= this.maxImageSize && originalHeight <= this.maxImageSize) {
            return { width: originalWidth, height: originalHeight };
        }

        const ratio = Math.min(
            this.maxImageSize / originalWidth,
            this.maxImageSize / originalHeight
        );

        return {
            width: Math.round(originalWidth * ratio),
            height: Math.round(originalHeight * ratio)
        };
    }

    /**
     * 顯示圖片預覽
     * @param {string} imageData - 圖片數據 (base64)
     * @param {boolean} autoAnalyze - 是否自動開始分析
     */
    showImagePreview(imageData, autoAnalyze = false) {
        const uploadArea = document.getElementById('uploadArea');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        if (uploadArea && imagePreview && previewImg) {
            uploadArea.classList.add('d-none');
            previewImg.src = imageData;
            imagePreview.classList.remove('d-none');
            
            // 如果設置為自動分析，延遲500ms後開始分析
            if (autoAnalyze) {
                setTimeout(() => {
                    this.analyzeImage();
                }, 500);
            }
        }
    }

    /**
     * 移除圖片
     */
    removeImage() {
        const uploadArea = document.getElementById('uploadArea');
        const imagePreview = document.getElementById('imagePreview');
        const fileInput = document.getElementById('fileInput');

        if (uploadArea && imagePreview) {
            uploadArea.classList.remove('d-none');
            imagePreview.classList.add('d-none');
        }

        if (fileInput) {
            fileInput.value = '';
        }

        this.currentImage = null;
        this.hideAnalysisResults();
    }

    /**
     * 打開攝像頭
     */
    async openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // 優先使用後置攝像頭
                } 
            });
            
            // 這裡可以實現攝像頭功能
            // 由於需要模態框等複雜UI，暫時顯示提示
            this.showNotification('攝像頭功能開發中，請使用文件上傳', 'info');
            
            // 停止攝像頭流
            stream.getTracks().forEach(track => track.stop());
            
        } catch (error) {
            console.error('打開攝像頭失敗:', error);
            this.showNotification('無法訪問攝像頭，請檢查權限設置', 'error');
        }
    }

    /**
     * 分析圖片
     */
    async analyzeImage() {
        if (!this.currentImage) {
            this.showNotification('請先上傳圖片', 'warning');
            return;
        }

        // 顯示智能進度載入
        const loadingId = window.haMoneyLoadingManager?.showProgressLoading('🤖 AI智能分析中...', 0) || 
                          this.showLoading('AI正在分析您的單據，請稍候...');

        try {
            this.hideAnalysisResults();

            // 模擬AI分析的進度階段
            const stages = [
                { progress: 20, message: '📷 圖像預處理中...' },
                { progress: 40, message: '🔍 文字識別中...' },
                { progress: 60, message: '💰 金額解析中...' },
                { progress: 80, message: '📋 項目歸類中...' },
                { progress: 95, message: '✨ 結果整理中...' }
            ];

            for (const stage of stages) {
                await new Promise(resolve => setTimeout(resolve, 400));
                if (window.haMoneyLoadingManager && loadingId) {
                    window.haMoneyLoadingManager.updateProgress(loadingId, stage.progress, stage.message);
                }
            }

            // 調用API分析圖片
            const result = await window.haMoneyAPI.analyzeReceipt(this.currentImage);

            // 完成進度
            if (window.haMoneyLoadingManager && loadingId) {
                window.haMoneyLoadingManager.updateProgress(loadingId, 100, '✅ 分析完成！');
                await new Promise(resolve => setTimeout(resolve, 500));
                window.haMoneyLoadingManager.hideLoading(loadingId);
            } else {
                this.hideLoading();
            }

            if (result.success) {
                // 顯示分析結果和手動校正選項
                this.showAnalysisResultsWithCorrection(result);
                this.showNotification('單據分析完成！點擊任何項目進行手動校正', 'success');
                
                // 保存收據數據
                window.haMoneyStorage?.addReceipt({
                    imageData: this.currentImage,
                    analysisResult: result,
                    processedAt: new Date().toISOString()
                });
            } else {
                this.showNotification(`分析失敗: ${result.error || '無法識別單據內容'}`, 'error');
            }

        } catch (error) {
            console.error('分析圖片失敗:', error);
            if (window.haMoneyLoadingManager && loadingId) {
                window.haMoneyLoadingManager.hideLoading(loadingId);
            } else {
                this.hideLoading();
            }
            this.showNotification(`分析失敗: ${error.message}`, 'error');
        }
    }

    /**
     * 顯示分析結果和手動校正選項
     * @param {Object} result - 分析結果
     */
    showAnalysisResultsWithCorrection(result) {
        this.showAnalysisResults(result);
        this.enableManualCorrection(result);
    }

    /**
     * 顯示分析結果
     * @param {Object} result - 分析結果
     */
    showAnalysisResults(result) {
        // 更新總金額
        const totalAmountElement = document.getElementById('totalAmount');
        if (totalAmountElement) {
            totalAmountElement.textContent = `HK$ ${result.totalAmount.toFixed(2)}`;
        }

        // 更新日期
        const receiptDateElement = document.getElementById('receiptDate');
        if (receiptDateElement) {
            receiptDateElement.textContent = result.date || '--';
        }

        // 更新商店名稱
        const storeNameElement = document.getElementById('storeName');
        if (storeNameElement) {
            storeNameElement.textContent = result.storeName || '--';
        }

        // 更新項目清單
        const itemsListElement = document.getElementById('itemsList');
        if (itemsListElement) {
            itemsListElement.innerHTML = '';
            
            if (result.items && result.items.length > 0) {
                result.items.forEach((item, index) => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'list-group-item d-flex justify-content-between align-items-center position-relative editable-item';
                    itemElement.dataset.itemIndex = index;
                    itemElement.innerHTML = `
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong class="item-name">${item.name}</strong>
                                    ${item.quantity > 1 ? `<small class="text-muted item-quantity"> x${item.quantity}</small>` : ''}
                                    <div class="edit-controls d-none mt-2">
                                        <input type="text" class="form-control form-control-sm mb-1" value="${item.name}" placeholder="項目名稱">
                                        <div class="row">
                                            <div class="col-6">
                                                <input type="number" class="form-control form-control-sm" value="${item.quantity}" min="1" placeholder="數量">
                                            </div>
                                            <div class="col-6">
                                                <input type="number" class="form-control form-control-sm" value="${item.price.toFixed(2)}" min="0" step="0.01" placeholder="單價">
                                            </div>
                                        </div>
                                        <div class="mt-2">
                                            <button class="btn btn-sm btn-success me-2 save-edit-btn">保存</button>
                                            <button class="btn btn-sm btn-secondary cancel-edit-btn">取消</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-primary rounded-pill item-total">HK$ ${(item.price * item.quantity).toFixed(2)}</span>
                                    <div class="mt-1">
                                        <button class="btn btn-sm btn-outline-secondary edit-item-btn" title="點擊編輯">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    itemsListElement.appendChild(itemElement);
                });
                
                // 添加新增項目按鈕
                const addItemBtn = document.createElement('div');
                addItemBtn.className = 'list-group-item text-center';
                addItemBtn.innerHTML = `
                    <button class="btn btn-outline-primary add-item-btn">
                        <i class="bi bi-plus-circle me-1"></i>新增項目
                    </button>
                `;
                itemsListElement.appendChild(addItemBtn);
                
            } else {
                itemsListElement.innerHTML = '<div class="text-muted text-center">無項目資訊</div>';
            }
        }

        // 顯示結果區域
        const analysisResults = document.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.classList.remove('d-none');
        }

        // 保存當前分析結果供後續使用
        this.currentAnalysisResult = result;
    }

    /**
     * 隱藏分析結果
     */
    hideAnalysisResults() {
        const analysisResults = document.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.classList.add('d-none');
        }
    }

    /**
     * 顯示載入狀態
     * @param {string} message - 載入消息
     */
    showLoading(message = '處理中...') {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            const messageElement = loadingIndicator.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            loadingIndicator.classList.remove('d-none');
        }
    }

    /**
     * 隱藏載入狀態
     */
    hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
    }

    /**
     * 顯示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知類型 (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // 使用全局通知系統
        if (window.haMoneyMain && window.haMoneyMain.showNotification) {
            window.haMoneyMain.showNotification(message, type);
        } else {
            // 簡單的控制台輸出作為後備
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * 獲取當前分析結果
     * @returns {Object|null} 當前分析結果
     */
    getCurrentAnalysisResult() {
        return this.currentAnalysisResult || null;
    }

    /**
     * 啟用手動校正功能
     * @param {Object} result - 分析結果
     */
    enableManualCorrection(result) {
        // 綁定編輯按鈕事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-item-btn')) {
                e.preventDefault();
                this.editItem(e.target.closest('.editable-item'));
            }
            
            if (e.target.closest('.save-edit-btn')) {
                e.preventDefault();
                this.saveItemEdit(e.target.closest('.editable-item'));
            }
            
            if (e.target.closest('.cancel-edit-btn')) {
                e.preventDefault();
                this.cancelItemEdit(e.target.closest('.editable-item'));
            }
            
            if (e.target.closest('.add-item-btn')) {
                e.preventDefault();
                this.addNewItem();
            }
            
            // 編輯總金額
            if (e.target.closest('#totalAmount')) {
                e.preventDefault();
                this.editTotalAmount();
            }
        });

        // 使總金額可編輯
        const totalAmountElement = document.getElementById('totalAmount');
        if (totalAmountElement) {
            totalAmountElement.style.cursor = 'pointer';
            totalAmountElement.title = '點擊編輯總金額';
            totalAmountElement.classList.add('editable-total');
        }
    }

    /**
     * 編輯項目
     */
    editItem(itemElement) {
        if (!itemElement) return;

        const editControls = itemElement.querySelector('.edit-controls');
        const displayInfo = itemElement.querySelector('.item-name').parentElement;
        
        editControls.classList.remove('d-none');
        displayInfo.style.display = 'none';
    }

    /**
     * 保存項目編輯
     */
    saveItemEdit(itemElement) {
        if (!itemElement) return;

        const inputs = itemElement.querySelectorAll('.edit-controls input');
        const nameInput = inputs[0];
        const quantityInput = inputs[1];
        const priceInput = inputs[2];

        if (!nameInput.value.trim()) {
            this.showNotification('項目名稱不能為空', 'warning');
            return;
        }

        const newName = nameInput.value.trim();
        const newQuantity = parseInt(quantityInput.value) || 1;
        const newPrice = parseFloat(priceInput.value) || 0;
        const newTotal = newQuantity * newPrice;

        // 更新顯示
        const itemName = itemElement.querySelector('.item-name');
        const itemQuantity = itemElement.querySelector('.item-quantity');
        const itemTotal = itemElement.querySelector('.item-total');

        itemName.textContent = newName;
        if (itemQuantity) {
            itemQuantity.textContent = newQuantity > 1 ? ` x${newQuantity}` : '';
        }
        itemTotal.textContent = `HK$ ${newTotal.toFixed(2)}`;

        // 更新數據
        const itemIndex = parseInt(itemElement.dataset.itemIndex);
        if (this.currentAnalysisResult && this.currentAnalysisResult.items[itemIndex]) {
            this.currentAnalysisResult.items[itemIndex].name = newName;
            this.currentAnalysisResult.items[itemIndex].quantity = newQuantity;
            this.currentAnalysisResult.items[itemIndex].price = newPrice;
        }

        this.cancelItemEdit(itemElement);
        this.recalculateTotal();
        this.showNotification('項目已更新', 'success');
    }

    /**
     * 取消項目編輯
     */
    cancelItemEdit(itemElement) {
        if (!itemElement) return;

        const editControls = itemElement.querySelector('.edit-controls');
        const displayInfo = itemElement.querySelector('.item-name').parentElement;
        
        editControls.classList.add('d-none');
        displayInfo.style.display = 'block';
    }

    /**
     * 新增項目
     */
    addNewItem() {
        const modalHtml = `
            <div class="modal fade" id="addItemModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">新增項目</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">項目名稱</label>
                                <input type="text" class="form-control" id="newItemName" placeholder="請輸入項目名稱">
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    <label class="form-label">數量</label>
                                    <input type="number" class="form-control" id="newItemQuantity" value="1" min="1">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">單價 (HK$)</label>
                                    <input type="number" class="form-control" id="newItemPrice" step="0.01" min="0" placeholder="0.00">
                                </div>
                            </div>
                            <div class="mt-3">
                                <strong>總額: HK$ <span id="newItemTotal">0.00</span></strong>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="saveNewItem">新增</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊模態框
        const existingModal = document.getElementById('addItemModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
        modal.show();

        // 綁定事件
        const quantityInput = document.getElementById('newItemQuantity');
        const priceInput = document.getElementById('newItemPrice');
        const totalSpan = document.getElementById('newItemTotal');

        const updateTotal = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            totalSpan.textContent = (quantity * price).toFixed(2);
        };

        quantityInput.addEventListener('input', updateTotal);
        priceInput.addEventListener('input', updateTotal);

        document.getElementById('saveNewItem').addEventListener('click', () => {
            const name = document.getElementById('newItemName').value.trim();
            const quantity = parseInt(quantityInput.value) || 1;
            const price = parseFloat(priceInput.value) || 0;

            if (!name) {
                this.showNotification('請輸入項目名稱', 'warning');
                return;
            }

            if (price <= 0) {
                this.showNotification('價格必須大於0', 'warning');
                return;
            }

            this.addItemToResult(name, quantity, price);
            modal.hide();
        });
    }

    /**
     * 添加項目到結果
     */
    addItemToResult(name, quantity, price) {
        const newItem = { name, quantity, price };
        
        if (!this.currentAnalysisResult) {
            this.currentAnalysisResult = { items: [], totalAmount: 0 };
        }
        
        this.currentAnalysisResult.items.push(newItem);
        this.showAnalysisResults(this.currentAnalysisResult);
        this.recalculateTotal();
        this.showNotification('項目已新增', 'success');
    }

    /**
     * 重新計算總金額
     */
    recalculateTotal() {
        if (!this.currentAnalysisResult || !this.currentAnalysisResult.items) return;

        const newTotal = this.currentAnalysisResult.items.reduce((sum, item) => {
            return sum + (item.quantity * item.price);
        }, 0);

        this.currentAnalysisResult.totalAmount = newTotal;
        
        const totalAmountElement = document.getElementById('totalAmount');
        if (totalAmountElement) {
            totalAmountElement.textContent = `HK$ ${newTotal.toFixed(2)}`;
        }
    }

    /**
     * 編輯總金額
     */
    editTotalAmount() {
        const totalAmountElement = document.getElementById('totalAmount');
        if (!totalAmountElement) return;

        const currentTotal = parseFloat(totalAmountElement.textContent.replace(/[^\d.]/g, '')) || 0;
        
        const newTotal = prompt('請輸入正確的總金額 (HK$):', currentTotal.toFixed(2));
        
        if (newTotal !== null && !isNaN(newTotal) && parseFloat(newTotal) >= 0) {
            const amount = parseFloat(newTotal);
            totalAmountElement.textContent = `HK$ ${amount.toFixed(2)}`;
            
            if (this.currentAnalysisResult) {
                this.currentAnalysisResult.totalAmount = amount;
            }
            
            this.showNotification('總金額已更新', 'success');
        }
    }

    /**
     * 重置掃描器
     */
    reset() {
        this.removeImage();
        this.currentAnalysisResult = null;
        this.hideLoading();
    }
}

// 創建全局掃描器實例
window.haMoneyScanner = new HaMoneyScanner(); 