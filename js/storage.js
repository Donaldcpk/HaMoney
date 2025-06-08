/**
 * HaMoney - 數據存儲模組
 * 負責本地數據的存儲、讀取和管理
 */

class HaMoneyStorage {
    constructor() {
        this.storagePrefix = 'hamoney_';
        this.init();
    }

    /**
     * 初始化存儲
     */
    init() {
        // 檢查瀏覽器是否支援 localStorage
        if (!this.isStorageSupported()) {
            console.warn('LocalStorage 不支援，使用記憶體存儲');
            this.memoryStorage = {};
        }

        // 創建預設數據結構
        this.ensureDefaultData();
    }

    /**
     * 檢查瀏覽器是否支援 localStorage
     */
    isStorageSupported() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 確保預設數據結構存在
     */
    ensureDefaultData() {
        const defaultData = {
            groups: [],
            records: [],
            settings: {
                currency: 'HKD',
                currencySymbol: 'HK$',
                defaultSplitMode: 'equal'
            },
            receipts: []
        };

        for (const [key, value] of Object.entries(defaultData)) {
            if (!this.get(key)) {
                this.set(key, value);
            }
        }
    }

    /**
     * 存儲數據
     * @param {string} key - 存儲鍵名
     * @param {*} data - 要存儲的數據
     */
    set(key, data) {
        const fullKey = this.storagePrefix + key;
        const jsonData = JSON.stringify(data);

        try {
            if (this.isStorageSupported()) {
                localStorage.setItem(fullKey, jsonData);
            } else {
                this.memoryStorage[fullKey] = jsonData;
            }
            return true;
        } catch (error) {
            console.error('存儲數據失敗:', error);
            return false;
        }
    }

    /**
     * 讀取數據
     * @param {string} key - 存儲鍵名
     * @param {*} defaultValue - 預設值
     */
    get(key, defaultValue = null) {
        const fullKey = this.storagePrefix + key;

        try {
            let jsonData;
            if (this.isStorageSupported()) {
                jsonData = localStorage.getItem(fullKey);
            } else {
                jsonData = this.memoryStorage[fullKey];
            }

            if (jsonData === null || jsonData === undefined) {
                return defaultValue;
            }

            return JSON.parse(jsonData);
        } catch (error) {
            console.error('讀取數據失敗:', error);
            return defaultValue;
        }
    }

    /**
     * 刪除數據
     * @param {string} key - 存儲鍵名
     */
    remove(key) {
        const fullKey = this.storagePrefix + key;

        try {
            if (this.isStorageSupported()) {
                localStorage.removeItem(fullKey);
            } else {
                delete this.memoryStorage[fullKey];
            }
            return true;
        } catch (error) {
            console.error('刪除數據失敗:', error);
            return false;
        }
    }

    /**
     * 清空所有應用數據
     */
    clear() {
        try {
            if (this.isStorageSupported()) {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.storagePrefix)) {
                        localStorage.removeItem(key);
                    }
                });
            } else {
                this.memoryStorage = {};
            }
            this.ensureDefaultData();
            return true;
        } catch (error) {
            console.error('清空數據失敗:', error);
            return false;
        }
    }

    /**
     * 獲取所有群組
     */
    getGroups() {
        return this.get('groups', []);
    }

    /**
     * 保存群組
     * @param {Array} groups - 群組數組
     */
    saveGroups(groups) {
        return this.set('groups', groups);
    }

    /**
     * 添加新群組
     * @param {Object} group - 群組對象
     */
    addGroup(group) {
        const groups = this.getGroups();
        group.id = this.generateId();
        group.createdAt = new Date().toISOString();
        groups.push(group);
        return this.saveGroups(groups);
    }

    /**
     * 更新群組
     * @param {string} groupId - 群組ID
     * @param {Object} updatedGroup - 更新的群組數據
     */
    updateGroup(groupId, updatedGroup) {
        const groups = this.getGroups();
        const index = groups.findIndex(g => g.id === groupId);
        if (index !== -1) {
            groups[index] = { ...groups[index], ...updatedGroup };
            groups[index].updatedAt = new Date().toISOString();
            return this.saveGroups(groups);
        }
        return false;
    }

    /**
     * 刪除群組
     * @param {string} groupId - 群組ID
     */
    deleteGroup(groupId) {
        const groups = this.getGroups();
        const filteredGroups = groups.filter(g => g.id !== groupId);
        return this.saveGroups(filteredGroups);
    }

    /**
     * 獲取所有分帳記錄
     */
    getRecords() {
        return this.get('records', []);
    }

    /**
     * 保存分帳記錄
     * @param {Array} records - 記錄數組
     */
    saveRecords(records) {
        return this.set('records', records);
    }

    /**
     * 添加新的分帳記錄
     * @param {Object} record - 分帳記錄對象
     */
    addRecord(record) {
        const records = this.getRecords();
        record.id = this.generateId();
        record.createdAt = new Date().toISOString();
        record.status = record.status || 'pending';
        records.unshift(record); // 添加到開頭
        return this.saveRecords(records);
    }

    /**
     * 更新分帳記錄
     * @param {string} recordId - 記錄ID
     * @param {Object} updatedRecord - 更新的記錄數據
     */
    updateRecord(recordId, updatedRecord) {
        const records = this.getRecords();
        const index = records.findIndex(r => r.id === recordId);
        if (index !== -1) {
            records[index] = { ...records[index], ...updatedRecord };
            records[index].updatedAt = new Date().toISOString();
            return this.saveRecords(records);
        }
        return false;
    }

    /**
     * 刪除分帳記錄
     * @param {string} recordId - 記錄ID
     */
    deleteRecord(recordId) {
        const records = this.getRecords();
        const filteredRecords = records.filter(r => r.id !== recordId);
        return this.saveRecords(filteredRecords);
    }

    /**
     * 獲取設置
     */
    getSettings() {
        return this.get('settings', {
            currency: 'HKD',
            currencySymbol: 'HK$',
            defaultSplitMode: 'equal'
        });
    }

    /**
     * 保存設置
     * @param {Object} settings - 設置對象
     */
    saveSettings(settings) {
        return this.set('settings', settings);
    }

    /**
     * 獲取收據數據
     */
    getReceipts() {
        return this.get('receipts', []);
    }

    /**
     * 保存收據數據
     * @param {Array} receipts - 收據數組
     */
    saveReceipts(receipts) {
        return this.set('receipts', receipts);
    }

    /**
     * 添加收據
     * @param {Object} receipt - 收據對象
     */
    addReceipt(receipt) {
        const receipts = this.getReceipts();
        receipt.id = this.generateId();
        receipt.createdAt = new Date().toISOString();
        receipts.unshift(receipt);
        return this.saveReceipts(receipts);
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 獲取存儲使用量統計
     */
    getStorageStats() {
        try {
            if (!this.isStorageSupported()) {
                return { supported: false };
            }

            let totalSize = 0;
            const items = {};

            for (let key in localStorage) {
                if (key.startsWith(this.storagePrefix)) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    items[key.replace(this.storagePrefix, '')] = size;
                }
            }

            return {
                supported: true,
                totalSize,
                items,
                totalSizeKB: (totalSize / 1024).toFixed(2)
            };
        } catch (error) {
            console.error('獲取存儲統計失敗:', error);
            return { supported: false, error: error.message };
        }
    }

    /**
     * 導出所有數據
     */
    exportData() {
        try {
            const data = {
                groups: this.getGroups(),
                records: this.getRecords(),
                settings: this.getSettings(),
                receipts: this.getReceipts(),
                exportedAt: new Date().toISOString(),
                version: '1.0.0'
            };

            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('導出數據失敗:', error);
            return null;
        }
    }

    /**
     * 導入數據
     * @param {string} jsonData - JSON 格式的數據
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // 驗證數據格式
            if (!data.version || !data.exportedAt) {
                throw new Error('無效的數據格式');
            }

            // 備份現有數據
            const backup = this.exportData();

            // 導入新數據
            if (data.groups) this.saveGroups(data.groups);
            if (data.records) this.saveRecords(data.records);
            if (data.settings) this.saveSettings(data.settings);
            if (data.receipts) this.saveReceipts(data.receipts);

            return { success: true, backup };
        } catch (error) {
            console.error('導入數據失敗:', error);
            return { success: false, error: error.message };
        }
    }
}

// 創建全局存儲實例
window.haMoneyStorage = new HaMoneyStorage(); 