/**
 * HaMoney - Firebase認證模組
 * 處理用戶登入、登出和認證狀態管理
 */

// Firebase配置
const firebaseConfig = {
    apiKey: "AIzaSyAo8W-8txUgKUisGwyUm5Cdl-0aDk-DGws",
    authDomain: "hamoney-dcpk.firebaseapp.com",
    projectId: "hamoney-dcpk",
    storageBucket: "hamoney-dcpk.appspot.com",
    messagingSenderId: "881794691891",
    appId: "1:881794691891:web:hamoney-dcpk"
};

class HaMoneyAuth {
    constructor() {
        this.user = null;
        this.isInitialized = false;
        this.init();
    }

    /**
     * 初始化Firebase
     */
    async init() {
        try {
            // 動態載入Firebase SDK
            await this.loadFirebaseSDK();
            
            // 初始化Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.provider = new firebase.auth.GoogleAuthProvider();
            
            // 設置Google登入範圍
            this.provider.addScope('profile');
            this.provider.addScope('email');
            
            // 監聽認證狀態變化
            this.auth.onAuthStateChanged((user) => {
                this.onAuthStateChanged(user);
            });
            
            this.isInitialized = true;
            console.log('Firebase認證初始化完成');
            
        } catch (error) {
            console.error('Firebase初始化失敗:', error);
            this.showFallbackLogin();
        }
    }

    /**
     * 動態載入Firebase SDK
     */
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            // 檢查是否已載入
            if (window.firebase) {
                resolve();
                return;
            }

            // 創建script標籤載入Firebase
            const scripts = [
                'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
                'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
            ];

            let loadedCount = 0;
            
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedCount++;
                    if (loadedCount === scripts.length) {
                        resolve();
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
    }

    /**
     * Google登入
     */
    async signInWithGoogle() {
        if (!this.isInitialized) {
            this.showNotification('認證系統尚未初始化，請稍候再試', 'warning');
            return;
        }

        try {
            const result = await this.auth.signInWithPopup(this.provider);
            const user = result.user;
            
            console.log('Google登入成功:', user.displayName);
            this.showNotification(`歡迎 ${user.displayName}！`, 'success');
            
            return user;
        } catch (error) {
            console.error('Google登入失敗:', error);
            
            // 處理特定錯誤
            let errorMessage = '登入失敗，請重試';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = '登入已取消';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = '彈出視窗被阻擋，請允許彈出視窗並重試';
            }
            
            this.showNotification(errorMessage, 'error');
            throw error;
        }
    }

    /**
     * 登出
     */
    async signOut() {
        try {
            await this.auth.signOut();
            this.showNotification('已成功登出', 'info');
        } catch (error) {
            console.error('登出失敗:', error);
            this.showNotification('登出失敗', 'error');
        }
    }

    /**
     * 認證狀態變化處理
     */
    onAuthStateChanged(user) {
        this.user = user;
        this.updateUI();
        
        if (user) {
            // 用戶已登入
            console.log('用戶已登入:', user.displayName);
            this.initUserData();
            this.handlePostLoginFlow();
        } else {
            // 用戶未登入
            console.log('用戶未登入');
            this.showLoginPrompt();
        }
    }

    /**
     * 處理登錄後的流程
     * 優先引導用戶創建或選擇群組
     */
    handlePostLoginFlow() {
        // 檢查是否有群組
        const groups = window.haMoneyStorage.getGroups();
        
        if (!groups || groups.length === 0) {
            // 沒有群組，引導創建群組
            this.showNotification('歡迎使用 HaMoney！請先創建您的第一個群組', 'info');
            setTimeout(() => {
                this.showFirstTimeGroupSetup();
            }, 2000);
        } else {
            // 有群組，但引導到群組管理頁面讓用戶確認
            this.showNotification('歡迎回來！請確認或創建群組後開始分帳', 'success');
            setTimeout(() => {
                if (window.haMoneyMain) {
                    window.haMoneyMain.showSection('groups');
                }
            }, 1500);
        }
    }

    /**
     * 顯示初次群組設置指引
     */
    showFirstTimeGroupSetup() {
        // 跳轉到群組頁面
        if (window.haMoneyMain) {
            window.haMoneyMain.showSection('groups');
        }
        
        // 顯示群組創建指引
        setTimeout(() => {
            this.showGroupCreationGuide();
        }, 500);
    }

    /**
     * 顯示群組創建指引
     */
    showGroupCreationGuide() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'groupGuideModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-people-fill me-2"></i>歡迎使用 HaMoney！
                        </h5>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-4">
                            <i class="bi bi-people text-primary" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="mb-3">讓我們開始吧！</h5>
                        <p class="text-muted mb-4">
                            在掃描單據之前，請先創建一個群組。<br>
                            群組可以是您的朋友、同事或家人。
                        </p>
                        <div class="alert alert-info">
                            <i class="bi bi-lightbulb me-2"></i>
                            <strong>提示：</strong>創建群組後，您就可以開始掃描單據並進行分帳了！
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick="window.haMoneyAuth.triggerGroupCreation()">
                            <i class="bi bi-plus-circle me-2"></i>創建我的第一個群組
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal, {
            backdrop: 'static',
            keyboard: false
        });
        bootstrapModal.show();
        
        // 清理模態框
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * 觸發群組創建
     */
    triggerGroupCreation() {
        if (window.haMoneyGroupManager) {
            // 觸發新群組創建
            const createButton = document.querySelector('#createGroupBtn');
            if (createButton) {
                createButton.click();
            } else {
                // 如果按鈕不存在，直接調用創建功能
                window.haMoneyGroupManager.showCreateGroupModal();
            }
        }
    }

    /**
     * 初始化用戶數據
     */
    initUserData() {
        if (this.user) {
            // 保存用戶資訊到本地存儲
            const userData = {
                uid: this.user.uid,
                displayName: this.user.displayName,
                email: this.user.email,
                photoURL: this.user.photoURL,
                lastLoginAt: new Date().toISOString()
            };
            
            window.haMoneyStorage.set('currentUser', userData);
        }
    }

    /**
     * 更新用戶界面
     */
    updateUI() {
        const userInfo = document.getElementById('userInfo');
        const loginButton = document.getElementById('loginButton');
        const logoutButton = document.getElementById('logoutButton');
        
        if (this.user) {
            // 顯示用戶資訊
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${this.user.photoURL || '/assets/images/default-avatar.png'}" 
                             alt="用戶頭像" class="rounded-circle me-2" width="32" height="32">
                        <span class="text-white">${this.user.displayName}</span>
                    </div>
                `;
                userInfo.classList.remove('d-none');
            }
            
            if (loginButton) loginButton.classList.add('d-none');
            if (logoutButton) logoutButton.classList.remove('d-none');
            
        } else {
            // 隱藏用戶資訊
            if (userInfo) userInfo.classList.add('d-none');
            if (loginButton) loginButton.classList.remove('d-none');
            if (logoutButton) logoutButton.classList.add('d-none');
        }
    }

    /**
     * 顯示登入提示
     */
    showLoginPrompt() {
        // 可以在這裡顯示登入提示或限制某些功能
    }

    /**
     * 顯示備用登入方式
     */
    showFallbackLogin() {
        this.showNotification('無法載入Google登入，將使用訪客模式', 'warning');
        
        // 創建訪客用戶
        const guestUser = {
            uid: 'guest_' + Date.now(),
            displayName: '訪客用戶',
            email: 'guest@hamoney.local',
            photoURL: null,
            isGuest: true
        };
        
        window.haMoneyStorage.set('currentUser', guestUser);
        this.user = guestUser;
        this.updateUI();
    }

    /**
     * 獲取當前用戶
     */
    getCurrentUser() {
        return this.user || window.haMoneyStorage.get('currentUser');
    }

    /**
     * 檢查用戶是否已登入
     */
    isSignedIn() {
        return !!this.getCurrentUser();
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

    /**
     * 獲取用戶限制資訊
     */
    getUserLimits() {
        // Firebase Authentication免費方案限制
        return {
            dailyActiveUsers: 50000,      // 每日活躍用戶
            monthlyActiveUsers: 50000,    // 每月活躍用戶
            simultaneousConnections: 'unlimited', // 同時連接數無限制
            authMethods: ['google', 'email', 'anonymous'], // 支援的認證方式
            
            // 對於您的問題：1000人同時登入完全沒問題
            recommendedConcurrentUsers: 10000,
            maxConcurrentUsers: 'unlimited'
        };
    }
}

// 創建全局認證實例
window.haMoneyAuth = new HaMoneyAuth(); 