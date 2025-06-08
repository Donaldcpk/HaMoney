/**
 * HaMoney - 多語言管理系統
 * 支援繁體中文、簡體中文、英文
 */

class HaMoneyLanguageManager {
    constructor() {
        this.currentLanguage = 'zh-TW';
        this.translations = {};
        this.init();
    }

    init() {
        this.loadTranslations();
        this.loadSavedLanguage();
        this.bindEvents();
    }

    /**
     * 載入翻譯資源
     */
    loadTranslations() {
        this.translations = {
            'zh-TW': {
                // 基本界面
                'welcome_title': '歡迎使用 HaMoney',
                'welcome_subtitle': '智能分帳應用程式，讓費用分攤變得簡單透明',
                'login': '登入',
                'logout': '登出',
                'guest_mode': '訪客模式',
                
                // 導航選單
                'nav_scanner': '掃描帳單',
                'nav_groups': '群組管理',
                'nav_records': '記錄查詢',
                'nav_reports': '視覺報告',
                
                // 功能區塊
                'scan_receipt': '掃描帳單',
                'scan_receipt_desc': '使用 AI 智能識別帳單內容',
                'split_bill': '智能分帳',
                'split_bill_desc': '多種分帳方式，靈活應對各種場景',
                'track_debts': '欠款追蹤',
                'track_debts_desc': '自動記錄和管理欠款狀況',
                'manage_groups': '群組管理',
                'manage_groups_desc': '創建和管理不同的分帳群組',
                
                // 掃描界面
                'upload_receipt': '上傳帳單圖片',
                'drag_drop_hint': '拖拽圖片到此處或點擊上傳',
                'analyzing': '正在分析',
                'analysis_complete': '分析完成',
                
                // 分帳界面
                'splitting_setup': '分帳設定',
                'participants': '參與者',
                'payer': '付款人',
                'amount': '金額',
                'service_fee': '服務費',
                'tip': '小費',
                'splitting_method': '分帳方式',
                'equal_split': '平均分攤',
                'percentage_split': '按比例分攤',
                'custom_split': '自定義金額',
                'item_split': '按項目分攤',
                
                // 群組管理
                'create_group': '創建群組',
                'group_name': '群組名稱',
                'group_description': '群組描述',
                'group_category': '群組分類',
                'group_members': '群組成員',
                'add_member': '添加成員',
                'member_name': '成員姓名',
                'member_email': '電子郵件',
                'member_phone': '電話號碼',
                'group_rules': '分帳規則',
                'default_split_method': '預設分帳方式',
                'default_service_fee': '預設服務費',
                'reminder_days': '提醒天數',
                
                // 欠款追蹤
                'debt_tracking': '欠款追蹤',
                'my_balance': '我的淨餘額',
                'owed_by_me': '我要還的錢',
                'owed_to_me': '別人欠我的錢',
                'overdue_debts': '逾期欠款',
                'mark_paid': '標記已還款',
                'send_reminder': '發送提醒',
                'due_date': '到期日期',
                
                // 報告
                'monthly_trend': '月度趨勢',
                'expense_categories': '支出分類',
                'group_analysis': '群組分析',
                'debt_status': '欠款狀況',
                
                // 通用
                'save': '儲存',
                'cancel': '取消',
                'delete': '刪除',
                'edit': '編輯',
                'view': '查看',
                'confirm': '確認',
                'loading': '載入中',
                'success': '成功',
                'error': '錯誤',
                'warning': '警告',
                'info': '資訊',
                
                // 分類
                'friends': '朋友',
                'family': '家人',
                'colleagues': '同事',
                'general': '其他',
                
                // 日期時間
                'today': '今天',
                'yesterday': '昨天',
                'this_week': '本週',
                'this_month': '本月',
                'last_month': '上個月',
                
                // 通知訊息
                'login_success': '登入成功',
                'logout_success': '登出成功',
                'group_created': '群組創建成功',
                'group_updated': '群組更新成功',
                'group_deleted': '群組已刪除',
                'debt_paid': '已標記為還款',
                'reminder_sent': '提醒已發送',
                'analysis_complete_msg': 'AI 分析完成',
                'splitting_complete': '分帳完成',
                
                // 錯誤訊息
                'login_failed': '登入失敗',
                'upload_failed': '上傳失敗',
                'analysis_failed': '分析失敗',
                'invalid_amount': '金額無效',
                'group_name_required': '請填寫群組名稱',
                'min_members_required': '群組至少需要2位成員',
                'payer_required': '請選擇付款人',
                'participants_required': '請選擇參與者'
            },
            
            'zh-CN': {
                // 基本界面
                'welcome_title': '欢迎使用 HaMoney',
                'welcome_subtitle': '智能分账应用程序，让费用分摊变得简单透明',
                'login': '登录',
                'logout': '登出',
                'guest_mode': '访客模式',
                
                // 导航菜单
                'nav_scanner': '扫描账单',
                'nav_groups': '群组管理',
                'nav_records': '记录查询',
                'nav_reports': '可视报告',
                
                // 功能区块
                'scan_receipt': '扫描账单',
                'scan_receipt_desc': '使用 AI 智能识别账单内容',
                'split_bill': '智能分账',
                'split_bill_desc': '多种分账方式，灵活应对各种场景',
                'track_debts': '欠款追踪',
                'track_debts_desc': '自动记录和管理欠款状况',
                'manage_groups': '群组管理',
                'manage_groups_desc': '创建和管理不同的分账群组',
                
                // 通用
                'save': '保存',
                'cancel': '取消',
                'delete': '删除',
                'edit': '编辑',
                'view': '查看',
                'confirm': '确认',
                'loading': '加载中',
                'success': '成功',
                'error': '错误',
                'warning': '警告',
                'info': '信息'
            },
            
            'en': {
                // 基本界面
                'welcome_title': 'Welcome to HaMoney',
                'welcome_subtitle': 'Smart bill splitting app that makes expense sharing simple and transparent',
                'login': 'Login',
                'logout': 'Logout',
                'guest_mode': 'Guest Mode',
                
                // 导航菜单
                'nav_scanner': 'Scan Receipt',
                'nav_groups': 'Group Management',
                'nav_records': 'Records',
                'nav_reports': 'Visual Reports',
                
                // 功能区块
                'scan_receipt': 'Scan Receipt',
                'scan_receipt_desc': 'Use AI to intelligently recognize receipt content',
                'split_bill': 'Smart Splitting',
                'split_bill_desc': 'Multiple splitting methods for various scenarios',
                'track_debts': 'Debt Tracking',
                'track_debts_desc': 'Automatically record and manage debt status',
                'manage_groups': 'Group Management',
                'manage_groups_desc': 'Create and manage different splitting groups',
                
                // 掃描界面
                'upload_receipt': 'Upload Receipt Image',
                'drag_drop_hint': 'Drag and drop image here or click to upload',
                'analyzing': 'Analyzing',
                'analysis_complete': 'Analysis Complete',
                
                // 分帳界面
                'splitting_setup': 'Splitting Setup',
                'participants': 'Participants',
                'payer': 'Payer',
                'amount': 'Amount',
                'service_fee': 'Service Fee',
                'tip': 'Tip',
                'splitting_method': 'Splitting Method',
                'equal_split': 'Equal Split',
                'percentage_split': 'Percentage Split',
                'custom_split': 'Custom Amount',
                'item_split': 'Item-based Split',
                
                // 群組管理
                'create_group': 'Create Group',
                'group_name': 'Group Name',
                'group_description': 'Group Description',
                'group_category': 'Group Category',
                'group_members': 'Group Members',
                'add_member': 'Add Member',
                'member_name': 'Member Name',
                'member_email': 'Email',
                'member_phone': 'Phone Number',
                'group_rules': 'Splitting Rules',
                'default_split_method': 'Default Split Method',
                'default_service_fee': 'Default Service Fee',
                'reminder_days': 'Reminder Days',
                
                // 欠款追蹤
                'debt_tracking': 'Debt Tracking',
                'my_balance': 'My Net Balance',
                'owed_by_me': 'I Owe',
                'owed_to_me': 'Owed to Me',
                'overdue_debts': 'Overdue Debts',
                'mark_paid': 'Mark as Paid',
                'send_reminder': 'Send Reminder',
                'due_date': 'Due Date',
                
                // 報告
                'monthly_trend': 'Monthly Trend',
                'expense_categories': 'Expense Categories',
                'group_analysis': 'Group Analysis',
                'debt_status': 'Debt Status',
                
                // 通用
                'save': 'Save',
                'cancel': 'Cancel',
                'delete': 'Delete',
                'edit': 'Edit',
                'view': 'View',
                'confirm': 'Confirm',
                'loading': 'Loading',
                'success': 'Success',
                'error': 'Error',
                'warning': 'Warning',
                'info': 'Info',
                
                // 分類
                'friends': 'Friends',
                'family': 'Family',
                'colleagues': 'Colleagues',
                'general': 'General',
                
                // 日期時間
                'today': 'Today',
                'yesterday': 'Yesterday',
                'this_week': 'This Week',
                'this_month': 'This Month',
                'last_month': 'Last Month',
                
                // 通知訊息
                'login_success': 'Login successful',
                'logout_success': 'Logout successful',
                'group_created': 'Group created successfully',
                'group_updated': 'Group updated successfully',
                'group_deleted': 'Group deleted',
                'debt_paid': 'Marked as paid',
                'reminder_sent': 'Reminder sent',
                'analysis_complete_msg': 'AI analysis complete',
                'splitting_complete': 'Splitting complete',
                
                // 錯誤訊息
                'login_failed': 'Login failed',
                'upload_failed': 'Upload failed',
                'analysis_failed': 'Analysis failed',
                'invalid_amount': 'Invalid amount',
                'group_name_required': 'Please enter group name',
                'min_members_required': 'Group requires at least 2 members',
                'payer_required': 'Please select payer',
                'participants_required': 'Please select participants'
            }
        };
    }

    /**
     * 載入已儲存的語言設定
     */
    loadSavedLanguage() {
        const savedLanguage = window.haMoneyStorage?.get('language');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        this.updatePageLanguage();
    }

    /**
     * 設定語言
     * @param {string} language - 語言代碼
     */
    setLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`不支援的語言: ${language}`);
            return;
        }

        this.currentLanguage = language;
        window.haMoneyStorage?.set('language', language);
        this.updatePageLanguage();
        this.showNotification(this.t('language_changed'), 'success');
    }

    /**
     * 獲取翻譯文字
     * @param {string} key - 翻譯鍵值
     * @param {Object} params - 參數
     * @returns {string} 翻譯後的文字
     */
    t(key, params = {}) {
        const translation = this.translations[this.currentLanguage]?.[key] || 
                          this.translations['zh-TW'][key] || 
                          key;

        // 簡單的參數替換
        return Object.keys(params).reduce((text, param) => {
            return text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
        }, translation);
    }

    /**
     * 更新頁面語言
     */
    updatePageLanguage() {
        // 更新所有有 data-i18n 屬性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // 更新 HTML lang 屬性
        document.documentElement.lang = this.currentLanguage;

        // 觸發語言變更事件
        const event = new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        });
        document.dispatchEvent(event);
    }

    /**
     * 生成語言選擇器
     * @returns {string} HTML字符串
     */
    generateLanguageSelector() {
        const languages = [
            { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
            { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
            { code: 'en', name: 'English', flag: '🇺🇸' }
        ];

        return `
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" id="languageDropdown" data-bs-toggle="dropdown">
                    ${languages.find(lang => lang.code === this.currentLanguage)?.flag} 
                    ${languages.find(lang => lang.code === this.currentLanguage)?.name}
                </button>
                <ul class="dropdown-menu">
                    ${languages.map(lang => `
                        <li>
                            <a class="dropdown-item ${lang.code === this.currentLanguage ? 'active' : ''}" 
                               href="#" data-language="${lang.code}">
                                ${lang.flag} ${lang.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 語言選擇事件
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-language')) {
                e.preventDefault();
                const language = e.target.getAttribute('data-language');
                this.setLanguage(language);
            }
        });

        // 監聽動態內容變更
        document.addEventListener('DOMNodeInserted', () => {
            // 延遲更新以確保DOM完全載入
            setTimeout(() => this.updatePageLanguage(), 100);
        });
    }

    /**
     * 獲取當前語言
     * @returns {string} 當前語言代碼
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * 獲取支援的語言列表
     * @returns {Array} 語言列表
     */
    getSupportedLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * 格式化貨幣
     * @param {number} amount - 金額
     * @param {string} currency - 貨幣代碼
     * @returns {string} 格式化後的貨幣字符串
     */
    formatCurrency(amount, currency = 'HKD') {
        const locale = this.currentLanguage === 'en' ? 'en-US' : 'zh-HK';
        
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            // 備用格式
            return `HK$ ${amount.toFixed(2)}`;
        }
    }

    /**
     * 格式化日期
     * @param {Date|string} date - 日期
     * @returns {string} 格式化後的日期字符串
     */
    formatDate(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const locale = this.currentLanguage === 'en' ? 'en-US' : 'zh-HK';
        
        try {
            return dateObj.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateObj.toLocaleDateString();
        }
    }

    /**
     * 格式化相對時間
     * @param {Date|string} date - 日期
     * @returns {string} 相對時間字符串
     */
    formatRelativeTime(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = now - dateObj;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return this.t('today');
        if (diffDays === 1) return this.t('yesterday');
        if (diffDays < 7) return `${diffDays} 天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
        
        return this.formatDate(dateObj);
    }

    /**
     * 顯示通知（多語言）
     * @param {string} message - 訊息
     * @param {string} type - 類型
     */
    showNotification(message, type = 'info') {
        if (window.haMoneyMain && window.haMoneyMain.showNotification) {
            window.haMoneyMain.showNotification(message, type);
        }
    }
}

// 創建全局語言管理實例
window.haMoneyLanguageManager = new HaMoneyLanguageManager(); 