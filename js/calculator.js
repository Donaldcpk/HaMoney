/**
 * HaMoney - 分帳計算模組
 * 負責各種分帳模式的計算邏輯
 */

class HaMoneyCalculator {
    constructor() {
        this.splitModes = {
            equal: '平均分攤',
            percentage: '按比例分攤',
            custom: '自定義金額'
        };
    }

    /**
     * 平均分帳計算
     * @param {number} totalAmount - 總金額
     * @param {Array} members - 參與成員列表
     * @returns {Object} 分帳結果
     */
    calculateEqualSplit(totalAmount, members) {
        if (!members || members.length === 0) {
            throw new Error('至少需要一位參與成員');
        }

        const perPersonAmount = totalAmount / members.length;
        const result = {
            totalAmount,
            splitMode: 'equal',
            members: members.map(member => ({
                ...member,
                amount: Math.round(perPersonAmount * 100) / 100, // 四捨五入到分
                percentage: 100 / members.length
            })),
            calculatedAt: new Date().toISOString()
        };

        // 處理餘數分配
        this.adjustForRounding(result);
        
        return result;
    }

    /**
     * 按比例分帳計算
     * @param {number} totalAmount - 總金額
     * @param {Array} members - 參與成員列表（包含比例資訊）
     * @returns {Object} 分帳結果
     */
    calculatePercentageSplit(totalAmount, members) {
        if (!members || members.length === 0) {
            throw new Error('至少需要一位參與成員');
        }

        // 驗證比例總和
        const totalPercentage = members.reduce((sum, member) => sum + (member.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
            throw new Error('所有成員的比例總和必須等於100%');
        }

        const result = {
            totalAmount,
            splitMode: 'percentage',
            members: members.map(member => ({
                ...member,
                percentage: member.percentage || 0,
                amount: Math.round((totalAmount * member.percentage / 100) * 100) / 100
            })),
            calculatedAt: new Date().toISOString()
        };

        // 處理餘數分配
        this.adjustForRounding(result);
        
        return result;
    }

    /**
     * 自定義金額分帳計算
     * @param {number} totalAmount - 總金額
     * @param {Array} members - 參與成員列表（包含自定義金額）
     * @returns {Object} 分帳結果
     */
    calculateCustomSplit(totalAmount, members) {
        if (!members || members.length === 0) {
            throw new Error('至少需要一位參與成員');
        }

        const customTotal = members.reduce((sum, member) => sum + (member.amount || 0), 0);
        
        if (Math.abs(customTotal - totalAmount) > 0.01) {
            throw new Error(`自定義金額總和 (${customTotal.toFixed(2)}) 與總金額 (${totalAmount.toFixed(2)}) 不符`);
        }

        const result = {
            totalAmount,
            splitMode: 'custom',
            members: members.map(member => ({
                ...member,
                amount: member.amount || 0,
                percentage: Math.round((member.amount / totalAmount) * 10000) / 100 // 保留兩位小數
            })),
            calculatedAt: new Date().toISOString()
        };

        return result;
    }

    /**
     * 處理四捨五入餘數分配
     * @param {Object} result - 分帳結果對象
     */
    adjustForRounding(result) {
        const calculatedTotal = result.members.reduce((sum, member) => sum + member.amount, 0);
        const difference = Math.round((result.totalAmount - calculatedTotal) * 100) / 100;

        if (Math.abs(difference) > 0.01) {
            // 將差額分配給第一個成員
            result.members[0].amount = Math.round((result.members[0].amount + difference) * 100) / 100;
        }
    }

    /**
     * 計算欠款關係
     * @param {Object} splitResult - 分帳結果
     * @param {string} payerId - 付款人ID
     * @returns {Array} 欠款關係列表
     */
    calculateDebts(splitResult, payerId) {
        const debts = [];
        
        splitResult.members.forEach(member => {
            if (member.id !== payerId && member.amount > 0) {
                debts.push({
                    debtorId: member.id,
                    debtorName: member.name,
                    creditorId: payerId,
                    creditorName: splitResult.members.find(m => m.id === payerId)?.name || '付款人',
                    amount: member.amount,
                    status: 'pending',
                    dueDate: this.calculateDueDate(),
                    createdAt: new Date().toISOString()
                });
            }
        });

        return debts;
    }

    /**
     * 計算到期日期（預設7天後）
     * @param {number} days - 天數
     * @returns {string} 到期日期
     */
    calculateDueDate(days = 7) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);
        return dueDate.toISOString().split('T')[0];
    }

    /**
     * 驗證分帳數據
     * @param {number} totalAmount - 總金額
     * @param {Array} members - 成員列表
     * @param {string} splitMode - 分帳模式
     * @returns {Object} 驗證結果
     */
    validateSplitData(totalAmount, members, splitMode) {
        const errors = [];

        // 驗證總金額
        if (!totalAmount || totalAmount <= 0) {
            errors.push('總金額必須大於0');
        }

        // 驗證成員
        if (!members || members.length === 0) {
            errors.push('至少需要一位參與成員');
        }

        // 驗證成員名稱
        if (members) {
            members.forEach((member, index) => {
                if (!member.name || member.name.trim() === '') {
                    errors.push(`第${index + 1}位成員需要有效的姓名`);
                }
            });

            // 檢查重複姓名
            const names = members.map(m => m.name);
            const uniqueNames = [...new Set(names)];
            if (names.length !== uniqueNames.length) {
                errors.push('成員姓名不能重複');
            }
        }

        // 根據分帳模式進行特定驗證
        if (splitMode === 'percentage' && members) {
            const totalPercentage = members.reduce((sum, member) => sum + (member.percentage || 0), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                errors.push('所有成員的比例總和必須等於100%');
            }
        }

        if (splitMode === 'custom' && members) {
            const customTotal = members.reduce((sum, member) => sum + (member.amount || 0), 0);
            if (Math.abs(customTotal - totalAmount) > 0.01) {
                errors.push('自定義金額總和必須等於總金額');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 格式化金額顯示
     * @param {number} amount - 金額
     * @param {string} currency - 貨幣符號
     * @returns {string} 格式化後的金額
     */
    formatAmount(amount, currency = 'HK$') {
        if (typeof amount !== 'number') {
            return `${currency} 0.00`;
        }
        return `${currency} ${amount.toFixed(2)}`;
    }

    /**
     * 計算分帳統計
     * @param {Object} splitResult - 分帳結果
     * @returns {Object} 統計資訊
     */
    calculateStatistics(splitResult) {
        const members = splitResult.members;
        const amounts = members.map(m => m.amount);
        
        return {
            totalAmount: splitResult.totalAmount,
            memberCount: members.length,
            averageAmount: splitResult.totalAmount / members.length,
            maxAmount: Math.max(...amounts),
            minAmount: Math.min(...amounts),
            splitMode: splitResult.splitMode,
            calculatedAt: splitResult.calculatedAt
        };
    }

    /**
     * 生成分帳摘要
     * @param {Object} splitResult - 分帳結果
     * @returns {string} 分帳摘要文本
     */
    generateSummary(splitResult) {
        const { totalAmount, members, splitMode } = splitResult;
        const modeText = this.splitModes[splitMode] || splitMode;
        
        let summary = `分帳摘要\n`;
        summary += `總金額: ${this.formatAmount(totalAmount)}\n`;
        summary += `分帳模式: ${modeText}\n`;
        summary += `參與人數: ${members.length}人\n\n`;
        
        summary += `分配詳情:\n`;
        members.forEach(member => {
            summary += `${member.name}: ${this.formatAmount(member.amount)}`;
            if (splitMode === 'percentage') {
                summary += ` (${member.percentage.toFixed(1)}%)`;
            }
            summary += `\n`;
        });

        return summary;
    }

    /**
     * 計算多次分帳的總欠款
     * @param {Array} records - 分帳記錄列表
     * @param {string} memberId - 成員ID
     * @returns {Object} 總欠款統計
     */
    calculateTotalDebts(records, memberId) {
        let totalOwed = 0; // 欠別人的
        let totalOwing = 0; // 別人欠的
        const debtDetails = [];

        records.forEach(record => {
            if (record.debts) {
                record.debts.forEach(debt => {
                    if (debt.debtorId === memberId && debt.status === 'pending') {
                        totalOwed += debt.amount;
                        debtDetails.push({
                            type: 'owed',
                            creditor: debt.creditorName,
                            amount: debt.amount,
                            record: record
                        });
                    }
                    
                    if (debt.creditorId === memberId && debt.status === 'pending') {
                        totalOwing += debt.amount;
                        debtDetails.push({
                            type: 'owing',
                            debtor: debt.debtorName,
                            amount: debt.amount,
                            record: record
                        });
                    }
                });
            }
        });

        return {
            totalOwed: Math.round(totalOwed * 100) / 100,
            totalOwing: Math.round(totalOwing * 100) / 100,
            netBalance: Math.round((totalOwing - totalOwed) * 100) / 100,
            debtDetails
        };
    }

    /**
     * 優化欠款關係（合併同一對人之間的欠款）
     * @param {Array} debts - 欠款列表
     * @returns {Array} 優化後的欠款列表
     */
    optimizeDebts(debts) {
        const debtMap = new Map();

        debts.forEach(debt => {
            const key = `${debt.debtorId}-${debt.creditorId}`;
            const reverseKey = `${debt.creditorId}-${debt.debtorId}`;

            if (debtMap.has(reverseKey)) {
                // 存在反向欠款，進行抵消
                const existingDebt = debtMap.get(reverseKey);
                const netAmount = existingDebt.amount - debt.amount;
                
                if (netAmount > 0) {
                    existingDebt.amount = netAmount;
                } else if (netAmount < 0) {
                    debtMap.delete(reverseKey);
                    debtMap.set(key, {
                        ...debt,
                        amount: Math.abs(netAmount)
                    });
                } else {
                    // 完全抵消
                    debtMap.delete(reverseKey);
                }
            } else if (debtMap.has(key)) {
                // 累加同方向欠款
                debtMap.get(key).amount += debt.amount;
            } else {
                // 新的欠款關係
                debtMap.set(key, { ...debt });
            }
        });

        return Array.from(debtMap.values()).filter(debt => debt.amount > 0.01);
    }
}

// 創建全局計算器實例
window.haMoneyCalculator = new HaMoneyCalculator(); 