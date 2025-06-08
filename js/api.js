/**
 * HaMoney - API通信模組
 * 負責與Open Router AI API的通信和圖像識別
 */

class HaMoneyAPI {
    constructor() {
        this.apiKey = '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';
        this.apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
        this.model = 'meta-llama/llama-4-maverick:free';
        this.siteUrl = window.location.origin;
        this.siteName = 'HaMoney';
    }

    /**
     * 分析收據圖像
     * @param {string} imageData - Base64 編碼的圖像數據
     * @returns {Promise<Object>} 分析結果
     */
    async analyzeReceipt(imageData) {
        try {
            // 確保圖像數據格式正確
            const imageUrl = this.formatImageData(imageData);
            
            // 構建請求數據
            const requestData = {
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: this.getAnalysisPrompt()
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ]
            };

            // 發送API請求
            const response = await this.makeAPIRequest(requestData);
            
            // 解析回應
            return this.parseAnalysisResponse(response);

        } catch (error) {
            console.error('分析收據失敗:', error);
            throw new Error(`分析失敗: ${error.message}`);
        }
    }

    /**
     * 格式化圖像數據
     * @param {string} imageData - 圖像數據
     * @returns {string} 格式化後的圖像URL
     */
    formatImageData(imageData) {
        // 如果已經是完整的 data URL，直接返回
        if (imageData.startsWith('data:image/')) {
            return imageData;
        }
        
        // 如果只是 base64 數據，添加 data URL 前綴
        if (!imageData.startsWith('data:')) {
            return `data:image/jpeg;base64,${imageData}`;
        }
        
        return imageData;
    }

    /**
     * 獲取分析提示詞
     * @returns {string} AI分析提示詞
     */
    getAnalysisPrompt() {
        return `請分析這張收據或單據圖像，提取以下資訊並以JSON格式回傳：

1. 總金額（數字，不包含貨幣符號）
2. 日期（YYYY-MM-DD格式）
3. 商店/餐廳名稱
4. 項目清單（包含項目名稱和價格）
5. 稅額（如果有）
6. 小費（如果有）

請嚴格按照以下JSON格式回傳，不要包含任何其他文字或解釋：

{
  "success": true,
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD",
  "storeName": "商店名稱",
  "items": [
    {
      "name": "項目名稱",
      "price": 0.00,
      "quantity": 1
    }
  ],
  "tax": 0.00,
  "tip": 0.00,
  "currency": "HKD"
}

如果無法識別收據內容，請回傳：
{
  "success": false,
  "error": "無法識別收據內容"
}`;
    }

    /**
     * 發送API請求
     * @param {Object} requestData - 請求數據
     * @returns {Promise<Object>} API回應
     */
    async makeAPIRequest(requestData) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': this.siteUrl,
                'X-Title': this.siteName,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API請求失敗: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        return await response.json();
    }

    /**
     * 解析API回應
     * @param {Object} response - API回應
     * @returns {Object} 解析後的數據
     */
    parseAnalysisResponse(response) {
        try {
            // 檢查回應格式
            if (!response.choices || response.choices.length === 0) {
                throw new Error('API回應格式不正確');
            }

            // 提取內容
            const content = response.choices[0].message.content;
            
            // 嘗試解析JSON
            let analysisResult;
            try {
                // 清理可能的markdown格式
                const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
                analysisResult = JSON.parse(cleanContent);
            } catch (parseError) {
                console.warn('JSON解析失敗，嘗試提取資訊:', parseError);
                analysisResult = this.extractInfoFromText(content);
            }

            // 驗證和標準化結果
            return this.validateAndStandardizeResult(analysisResult);

        } catch (error) {
            console.error('解析API回應失敗:', error);
            throw new Error(`解析失敗: ${error.message}`);
        }
    }

    /**
     * 從文本中提取資訊（當JSON解析失敗時的後備方案）
     * @param {string} text - 文本內容
     * @returns {Object} 提取的資訊
     */
    extractInfoFromText(text) {
        const result = {
            success: false,
            totalAmount: 0,
            date: '',
            storeName: '',
            items: [],
            tax: 0,
            tip: 0,
            currency: 'HKD'
        };

        try {
            // 嘗試提取總金額
            const amountMatch = text.match(/(?:總額|總計|合計|total|amount).*?(\d+\.?\d*)/i);
            if (amountMatch) {
                result.totalAmount = parseFloat(amountMatch[1]);
                result.success = true;
            }

            // 嘗試提取日期
            const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                result.date = dateMatch[1];
            } else {
                result.date = new Date().toISOString().split('T')[0];
            }

            // 嘗試提取商店名稱
            const storeMatch = text.match(/(?:商店|店名|restaurant|store).*?[:：]\s*([^\n]+)/i);
            if (storeMatch) {
                result.storeName = storeMatch[1].trim();
            } else {
                result.storeName = '未識別';
            }

        } catch (error) {
            console.error('文本提取失敗:', error);
        }

        return result;
    }

    /**
     * 驗證和標準化結果
     * @param {Object} result - 原始結果
     * @returns {Object} 標準化後的結果
     */
    validateAndStandardizeResult(result) {
        const standardResult = {
            success: result.success || false,
            totalAmount: this.parseAmount(result.totalAmount),
            date: this.parseDate(result.date),
            storeName: result.storeName || '未識別',
            items: this.parseItems(result.items),
            tax: this.parseAmount(result.tax),
            tip: this.parseAmount(result.tip),
            currency: result.currency || 'HKD'
        };

        // 如果有項目但沒有總金額，計算總金額
        if (standardResult.items.length > 0 && standardResult.totalAmount === 0) {
            standardResult.totalAmount = standardResult.items.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            ) + standardResult.tax + standardResult.tip;
        }

        // 確保成功標記正確
        if (standardResult.totalAmount > 0 || standardResult.items.length > 0) {
            standardResult.success = true;
        }

        return standardResult;
    }

    /**
     * 解析金額
     * @param {*} amount - 原始金額
     * @returns {number} 解析後的金額
     */
    parseAmount(amount) {
        if (typeof amount === 'number') return Math.max(0, amount);
        if (typeof amount === 'string') {
            const parsed = parseFloat(amount.replace(/[^\d.-]/g, ''));
            return isNaN(parsed) ? 0 : Math.max(0, parsed);
        }
        return 0;
    }

    /**
     * 解析日期
     * @param {*} date - 原始日期
     * @returns {string} 格式化後的日期
     */
    parseDate(date) {
        if (!date) return new Date().toISOString().split('T')[0];
        
        try {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return parsedDate.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * 解析項目清單
     * @param {*} items - 原始項目清單
     * @returns {Array} 標準化後的項目清單
     */
    parseItems(items) {
        if (!Array.isArray(items)) return [];
        
        return items.map(item => ({
            name: item.name || '未知項目',
            price: this.parseAmount(item.price),
            quantity: Math.max(1, parseInt(item.quantity) || 1)
        })).filter(item => item.price > 0);
    }

    /**
     * 測試API連接
     * @returns {Promise<boolean>} 連接測試結果
     */
    async testConnection() {
        try {
            const testData = {
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: "Hello, please respond with 'OK' if you receive this message."
                    }
                ]
            };

            const response = await this.makeAPIRequest(testData);
            return response.choices && response.choices.length > 0;
        } catch (error) {
            console.error('API連接測試失敗:', error);
            return false;
        }
    }

    /**
     * 獲取API使用統計
     * @returns {Object} 使用統計
     */
    getUsageStats() {
        // 這裡可以添加使用統計邏輯
        return {
            requestCount: 0,
            successCount: 0,
            errorCount: 0
        };
    }
}

// 創建全局API實例
window.haMoneyAPI = new HaMoneyAPI(); 