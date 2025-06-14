/**
 * HaMoney 應用程式配置
 * 此文件包含應用程式的各種配置設定
 * 敏感資訊（如API密鑰）請放在 api-keys.js 中
 */

const HaMoneyConfig = {
    // API設定
    api: {
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'meta-llama/llama-4-maverick:free',
        timeout: 30000, // 30秒超時
        retries: 3
    },

    // 應用程式設定
    app: {
        name: 'HaMoney',
        version: '1.0.0',
        defaultLanguage: 'zh-TW',
        siteName: 'HaMoney 智能分帳應用'
    },

    // UI設定
    ui: {
        animationDuration: 300,
        toastDuration: 3000,
        loadingMinTime: 1000
    },

    // 功能設定
    features: {
        maxGroupMembers: 20,
        maxReceiptItems: 50,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
    },

    // 存儲設定
    storage: {
        keyPrefix: 'hamoney_',
        maxRecords: 1000,
        backupInterval: 24 * 60 * 60 * 1000 // 24小時
    },

    // 獲取API密鑰
    getApiKey() {
        try {
            // 生產環境使用直接嵌入的密鑰
            const prodApiKey = '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';
            
            // 檢查是否在生產環境
            if (window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost') {
                return prodApiKey;
            }
            
            // 開發環境優先從外部配置文件獲取
            if (typeof window !== 'undefined' && window.HaMoneyApiKeys) {
                return window.HaMoneyApiKeys.openRouterKey;
            }
            
            // 如果外部配置不存在，使用嵌入密鑰
            return prodApiKey;
            
        } catch (error) {
            console.error('獲取API密鑰失敗:', error);
            // 返回嵌入的密鑰作為後備
            return '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';
        }
    },

    // 檢查配置完整性
    validateConfig() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API密鑰未設定，請檢查配置文件');
        }
        
        if (apiKey.length < 50) {
            throw new Error('API密鑰格式不正確');
        }
        
        console.log('✅ API配置驗證成功');
        return true;
    }
};

// 導出配置
window.HaMoneyConfig = HaMoneyConfig; 