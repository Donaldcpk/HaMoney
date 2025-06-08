/**
 * HaMoney - 群組管理系統
 * 處理群組創建、成員管理和分帳規則
 */

class HaMoneyGroupManager {
    constructor() {
        this.groups = [];
        this.currentGroup = null;
        this.init();
    }

    /**
     * 初始化群組管理系統
     */
    init() {
        this.loadGroups();
        this.bindEvents();
    }

    /**
     * 載入群組數據
     */
    loadGroups() {
        this.groups = window.haMoneyStorage.get('groups') || [];
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 創建群組按鈕
        document.addEventListener('click', (e) => {
            if (e.target.id === 'createGroupBtn' || e.target.closest('#createGroupBtn')) {
                this.showCreateGroupModal();
            }
            
            // 編輯群組
            if (e.target.classList.contains('edit-group-btn')) {
                const groupId = e.target.dataset.groupId;
                this.showEditGroupModal(groupId);
            }
            
            // 刪除群組
            if (e.target.classList.contains('delete-group-btn')) {
                const groupId = e.target.dataset.groupId;
                this.deleteGroup(groupId);
            }
            
            // 查看群組詳情
            if (e.target.classList.contains('view-group-btn')) {
                const groupId = e.target.dataset.groupId;
                this.showGroupDetail(groupId);
            }
            
            // 添加成員
            if (e.target.classList.contains('add-member-btn')) {
                this.addMemberToForm();
            }
            
            // 移除成員
            if (e.target.classList.contains('remove-member-btn')) {
                const memberIndex = e.target.dataset.memberIndex;
                this.removeMemberFromForm(memberIndex);
            }
        });

        // 表單提交
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'groupForm') {
                e.preventDefault();
                this.saveGroup();
            }
        });
    }

    /**
     * 創建新群組
     * @param {Object} groupData - 群組數據
     */
    createGroup(groupData) {
        const group = {
            id: 'group_' + Date.now(),
            name: groupData.name,
            description: groupData.description || '',
            category: groupData.category || 'general', // general, friends, family, colleagues
            members: groupData.members || [],
            rules: {
                defaultSplitMethod: groupData.defaultSplitMethod || 'equal',
                allowServiceFee: groupData.allowServiceFee !== false,
                defaultServiceFee: groupData.defaultServiceFee || 10,
                reminderDays: groupData.reminderDays || 7
            },
            statistics: {
                totalSplits: 0,
                totalAmount: 0,
                lastActivity: new Date().toISOString()
            },
            createdBy: window.haMoneyAuth.getCurrentUser()?.uid,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        this.groups.push(group);
        this.saveGroups();
        
        return group;
    }

    /**
     * 更新群組
     * @param {string} groupId - 群組ID
     * @param {Object} updateData - 更新數據
     */
    updateGroup(groupId, updateData) {
        const groupIndex = this.groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return null;

        this.groups[groupIndex] = { ...this.groups[groupIndex], ...updateData };
        this.groups[groupIndex].updatedAt = new Date().toISOString();
        
        this.saveGroups();
        return this.groups[groupIndex];
    }

    /**
     * 刪除群組
     * @param {string} groupId - 群組ID
     */
    deleteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // 確認刪除
        if (!confirm(`確定要刪除群組「${group.name}」嗎？此操作無法復原。`)) {
            return;
        }

        // 檢查是否有相關的分帳記錄
        const relatedRecords = window.haMoneyStorage.get('splittingRecords') || [];
        const hasRecords = relatedRecords.some(record => record.groupId === groupId);

        if (hasRecords) {
            if (!confirm('此群組有相關的分帳記錄，刪除後這些記錄將保留但無法關聯到群組。確定繼續嗎？')) {
                return;
            }
        }

        this.groups = this.groups.filter(g => g.id !== groupId);
        this.saveGroups();
        
        this.showNotification(`群組「${group.name}」已刪除`, 'success');
        this.refreshGroupDisplay();
    }

    /**
     * 添加成員到群組
     * @param {string} groupId - 群組ID
     * @param {Object} member - 成員數據
     */
    addMemberToGroup(groupId, member) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const newMember = {
            id: member.id || 'member_' + Date.now(),
            name: member.name,
            email: member.email || '',
            phone: member.phone || '',
            joinedAt: new Date().toISOString(),
            isActive: true
        };

        // 檢查是否已存在
        const existingMember = group.members.find(m => m.name === newMember.name);
        if (existingMember) {
            this.showNotification('成員已存在', 'warning');
            return;
        }

        group.members.push(newMember);
        this.saveGroups();
        
        return newMember;
    }

    /**
     * 從群組移除成員
     * @param {string} groupId - 群組ID
     * @param {string} memberId - 成員ID
     */
    removeMemberFromGroup(groupId, memberId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        group.members = group.members.filter(m => m.id !== memberId);
        this.saveGroups();
    }

    /**
     * 獲取用戶的群組
     * @param {string} userId - 用戶ID
     */
    getUserGroups(userId) {
        return this.groups.filter(group => {
            return group.createdBy === userId || 
                   group.members.some(member => member.id === userId);
        });
    }

    /**
     * 顯示創建群組模態框
     */
    showCreateGroupModal() {
        const modalHTML = `
            <div class="modal fade" id="groupModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-people-fill me-2"></i>創建新群組
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="groupForm">
                                <input type="hidden" id="groupId" value="">
                                
                                <!-- 基本資訊 -->
                                <div class="mb-4">
                                    <h6>基本資訊</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <label class="form-label">群組名稱 *</label>
                                            <input type="text" class="form-control" id="groupName" required placeholder="例：朋友聚餐群">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">分類</label>
                                            <select class="form-select" id="groupCategory">
                                                <option value="friends">朋友</option>
                                                <option value="family">家人</option>
                                                <option value="colleagues">同事</option>
                                                <option value="general">其他</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <label class="form-label">描述</label>
                                        <textarea class="form-control" id="groupDescription" rows="2" placeholder="選填：群組描述或用途"></textarea>
                                    </div>
                                </div>

                                <!-- 成員管理 -->
                                <div class="mb-4">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h6>群組成員</h6>
                                        <button type="button" class="btn btn-outline-primary btn-sm add-member-btn">
                                            <i class="bi bi-person-plus me-1"></i>添加成員
                                        </button>
                                    </div>
                                    <div id="membersList">
                                        <!-- 動態生成成員列表 -->
                                    </div>
                                </div>

                                <!-- 分帳規則 -->
                                <div class="mb-4">
                                    <h6>預設分帳規則</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <label class="form-label">預設分帳方式</label>
                                            <select class="form-select" id="defaultSplitMethod">
                                                <option value="equal">平均分攤</option>
                                                <option value="percentage">按比例分攤</option>
                                                <option value="custom">自定義金額</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">預設服務費 (%)</label>
                                            <input type="number" class="form-control" id="defaultServiceFee" value="10" min="0" max="30" step="0.5">
                                        </div>
                                    </div>
                                    <div class="row mt-3">
                                        <div class="col-md-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="allowServiceFee" checked>
                                                <label class="form-check-label" for="allowServiceFee">
                                                    允許服務費
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">提醒天數</label>
                                            <input type="number" class="form-control" id="reminderDays" value="7" min="1" max="30">
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="submit" form="groupForm" class="btn btn-primary">
                                <i class="bi bi-check-circle me-1"></i>創建群組
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊modal
        const existingModal = document.getElementById('groupModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 添加當前用戶為第一個成員
        this.addDefaultMember();
        
        const modal = new bootstrap.Modal(document.getElementById('groupModal'));
        modal.show();
    }

    /**
     * 顯示編輯群組模態框
     * @param {string} groupId - 群組ID
     */
    showEditGroupModal(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        this.showCreateGroupModal();
        
        // 填入現有數據
        setTimeout(() => {
            document.getElementById('groupId').value = group.id;
            document.getElementById('groupName').value = group.name;
            document.getElementById('groupCategory').value = group.category;
            document.getElementById('groupDescription').value = group.description;
            document.getElementById('defaultSplitMethod').value = group.rules.defaultSplitMethod;
            document.getElementById('defaultServiceFee').value = group.rules.defaultServiceFee;
            document.getElementById('allowServiceFee').checked = group.rules.allowServiceFee;
            document.getElementById('reminderDays').value = group.rules.reminderDays;
            
            // 更新標題
            document.querySelector('#groupModal .modal-title').innerHTML = `
                <i class="bi bi-pencil-fill me-2"></i>編輯群組
            `;
            
            document.querySelector('#groupModal .btn-primary').innerHTML = `
                <i class="bi bi-check-circle me-1"></i>更新群組
            `;
            
            // 載入成員
            this.loadGroupMembers(group);
        }, 100);
    }

    /**
     * 載入群組成員到表單
     * @param {Object} group - 群組對象
     */
    loadGroupMembers(group) {
        const membersList = document.getElementById('membersList');
        membersList.innerHTML = '';
        
        group.members.forEach((member, index) => {
            this.addMemberToForm(member, index);
        });
    }

    /**
     * 添加預設成員（當前用戶）
     */
    addDefaultMember() {
        const currentUser = window.haMoneyAuth.getCurrentUser();
        if (currentUser) {
            this.addMemberToForm({
                name: currentUser.displayName,
                email: currentUser.email || ''
            });
        }
    }

    /**
     * 添加成員到表單
     * @param {Object} member - 成員數據
     * @param {number} index - 索引
     */
    addMemberToForm(member = null, index = null) {
        const membersList = document.getElementById('membersList');
        const memberIndex = index !== null ? index : membersList.children.length;
        
        const memberHTML = `
            <div class="member-item border rounded p-3 mb-2" data-member-index="${memberIndex}">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <label class="form-label">姓名 *</label>
                        <input type="text" class="form-control member-name" value="${member?.name || ''}" required placeholder="成員姓名">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">電子郵件</label>
                        <input type="email" class="form-control member-email" value="${member?.email || ''}" placeholder="選填">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">電話</label>
                        <input type="tel" class="form-control member-phone" value="${member?.phone || ''}" placeholder="選填">
                    </div>
                    <div class="col-md-1">
                        <label class="form-label">&nbsp;</label>
                        <button type="button" class="btn btn-outline-danger btn-sm remove-member-btn d-block" data-member-index="${memberIndex}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        membersList.insertAdjacentHTML('beforeend', memberHTML);
    }

    /**
     * 從表單移除成員
     * @param {number} memberIndex - 成員索引
     */
    removeMemberFromForm(memberIndex) {
        const memberItem = document.querySelector(`[data-member-index="${memberIndex}"]`);
        if (memberItem) {
            memberItem.remove();
        }
    }

    /**
     * 保存群組
     */
    saveGroup() {
        const groupId = document.getElementById('groupId').value;
        const isEdit = !!groupId;
        
        // 收集表單數據
        const groupData = {
            name: document.getElementById('groupName').value.trim(),
            description: document.getElementById('groupDescription').value.trim(),
            category: document.getElementById('groupCategory').value,
            defaultSplitMethod: document.getElementById('defaultSplitMethod').value,
            defaultServiceFee: parseFloat(document.getElementById('defaultServiceFee').value),
            allowServiceFee: document.getElementById('allowServiceFee').checked,
            reminderDays: parseInt(document.getElementById('reminderDays').value),
            members: this.collectMembersFromForm()
        };

        // 驗證
        if (!groupData.name) {
            this.showNotification('請填寫群組名稱', 'error');
            return;
        }

        if (groupData.members.length < 2) {
            this.showNotification('群組至少需要2位成員', 'error');
            return;
        }

        // 保存或更新
        let group;
        if (isEdit) {
            group = this.updateGroup(groupId, groupData);
            this.showNotification('群組已更新', 'success');
        } else {
            group = this.createGroup(groupData);
            this.showNotification('群組創建成功', 'success');
        }

        // 關閉modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('groupModal'));
        modal.hide();

        // 刷新顯示
        this.refreshGroupDisplay();
    }

    /**
     * 從表單收集成員數據
     */
    collectMembersFromForm() {
        const members = [];
        const memberItems = document.querySelectorAll('.member-item');
        
        memberItems.forEach(item => {
            const name = item.querySelector('.member-name').value.trim();
            const email = item.querySelector('.member-email').value.trim();
            const phone = item.querySelector('.member-phone').value.trim();
            
            if (name) {
                members.push({
                    id: 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    name,
                    email,
                    phone,
                    joinedAt: new Date().toISOString(),
                    isActive: true
                });
            }
        });
        
        return members;
    }

    /**
     * 顯示群組詳情
     * @param {string} groupId - 群組ID
     */
    showGroupDetail(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // 獲取群組相關的分帳記錄
        const splittingRecords = window.haMoneyStorage.get('splittingRecords') || [];
        const groupRecords = splittingRecords.filter(record => record.groupId === groupId);

        const modalHTML = `
            <div class="modal fade" id="groupDetailModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-people-fill me-2"></i>${group.name} - 群組詳情
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- 群組資訊 -->
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="mb-0">群組資訊</h6>
                                        </div>
                                        <div class="card-body">
                                            <table class="table table-sm">
                                                <tr><td>名稱：</td><td><strong>${group.name}</strong></td></tr>
                                                <tr><td>分類：</td><td>${this.getCategoryLabel(group.category)}</td></tr>
                                                <tr><td>成員數量：</td><td>${group.members.length} 人</td></tr>
                                                <tr><td>總分帳次數：</td><td>${group.statistics.totalSplits} 次</td></tr>
                                                <tr><td>總金額：</td><td>HK$ ${group.statistics.totalAmount.toFixed(2)}</td></tr>
                                                <tr><td>創建時間：</td><td>${new Date(group.createdAt).toLocaleDateString('zh-HK')}</td></tr>
                                            </table>
                                            ${group.description ? `<p class="text-muted mt-2">${group.description}</p>` : ''}
                                        </div>
                                    </div>
                                </div>

                                <!-- 成員列表 -->
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="mb-0">成員列表</h6>
                                        </div>
                                        <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                                            ${group.members.map(member => `
                                                <div class="d-flex align-items-center mb-2">
                                                    <i class="bi bi-person-circle text-primary me-2"></i>
                                                    <div>
                                                        <div class="fw-bold">${member.name}</div>
                                                        ${member.email ? `<small class="text-muted">${member.email}</small>` : ''}
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <!-- 分帳記錄 -->
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="mb-0">最近分帳記錄</h6>
                                        </div>
                                        <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                                            ${groupRecords.length > 0 ? 
                                                groupRecords.slice(0, 5).map(record => `
                                                    <div class="border rounded p-2 mb-2">
                                                        <div class="fw-bold">${record.receipt.storeName}</div>
                                                        <div class="text-muted">HK$ ${record.total.toFixed(2)}</div>
                                                        <small class="text-muted">${new Date(record.createdAt).toLocaleDateString('zh-HK')}</small>
                                                    </div>
                                                `).join('') :
                                                '<p class="text-muted">暫無分帳記錄</p>'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                            <button type="button" class="btn btn-primary edit-group-btn" data-group-id="${group.id}">
                                <i class="bi bi-pencil me-1"></i>編輯群組
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊modal
        const existingModal = document.getElementById('groupDetailModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('groupDetailModal'));
        modal.show();
    }

    /**
     * 獲取分類標籤
     * @param {string} category - 分類
     */
    getCategoryLabel(category) {
        const labels = {
            friends: '朋友',
            family: '家人',
            colleagues: '同事',
            general: '其他'
        };
        return labels[category] || '其他';
    }

    /**
     * 生成群組管理界面
     */
    generateGroupManagementUI() {
        const currentUser = window.haMoneyAuth.getCurrentUser();
        if (!currentUser) {
            return '<div class="alert alert-warning">請先登入以管理群組</div>';
        }

        const userGroups = this.getUserGroups(currentUser.uid);

        return `
            <div class="group-management-container">
                <!-- 標題和創建按鈕 -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4><i class="bi bi-people-fill me-2"></i>我的群組</h4>
                    <button class="btn btn-primary" id="createGroupBtn">
                        <i class="bi bi-plus-circle me-1"></i>創建群組
                    </button>
                </div>

                <!-- 群組統計 -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-people text-primary mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">我的群組</h6>
                                <h4 class="text-primary">${userGroups.length}</h4>
                                <small class="text-muted">個群組</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-person-check text-success mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">總成員</h6>
                                <h4 class="text-success">${userGroups.reduce((sum, group) => sum + group.members.length, 0)}</h4>
                                <small class="text-muted">位成員</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-calculator text-info mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">總分帳</h6>
                                <h4 class="text-info">${userGroups.reduce((sum, group) => sum + group.statistics.totalSplits, 0)}</h4>
                                <small class="text-muted">次分帳</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-currency-dollar text-warning mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">總金額</h6>
                                <h4 class="text-warning">HK$ ${userGroups.reduce((sum, group) => sum + group.statistics.totalAmount, 0).toFixed(2)}</h4>
                                <small class="text-muted">港幣</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 群組列表 -->
                <div class="row">
                    ${userGroups.length > 0 ? 
                        userGroups.map(group => `
                            <div class="col-md-6 col-lg-4 mb-4">
                                <div class="card group-card h-100 border-0 shadow-sm">
                                    <div class="card-header bg-gradient-primary text-white">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">${group.name}</h6>
                                            <span class="badge badge-light">${this.getCategoryLabel(group.category)}</span>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <p class="text-muted mb-2">${group.description || '無描述'}</p>
                                        <div class="row text-center">
                                            <div class="col-4">
                                                <small class="text-muted">成員</small>
                                                <div class="fw-bold text-primary">${group.members.length}</div>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-muted">分帳</small>
                                                <div class="fw-bold text-success">${group.statistics.totalSplits}</div>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-muted">金額</small>
                                                <div class="fw-bold text-warning">HK$ ${group.statistics.totalAmount.toFixed(0)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer bg-transparent">
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm view-group-btn" data-group-id="${group.id}">
                                                <i class="bi bi-eye"></i> 查看
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm edit-group-btn" data-group-id="${group.id}">
                                                <i class="bi bi-pencil"></i> 編輯
                                            </button>
                                            <button class="btn btn-outline-danger btn-sm delete-group-btn" data-group-id="${group.id}">
                                                <i class="bi bi-trash"></i> 刪除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('') :
                        `<div class="col-12">
                            <div class="text-center py-5">
                                <i class="bi bi-people text-muted mb-3" style="font-size: 4rem;"></i>
                                <h5 class="text-muted">還沒有任何群組</h5>
                                <p class="text-muted">創建您的第一個群組來開始分帳吧！</p>
                                <button class="btn btn-primary" id="createGroupBtn">
                                    <i class="bi bi-plus-circle me-1"></i>創建第一個群組
                                </button>
                            </div>
                        </div>`
                    }
                </div>
            </div>
        `;
    }

    /**
     * 刷新群組顯示
     */
    refreshGroupDisplay() {
        const groupContainer = document.getElementById('group-management-content');
        if (groupContainer) {
            groupContainer.innerHTML = this.generateGroupManagementUI();
        }
    }

    /**
     * 保存群組數據
     */
    saveGroups() {
        window.haMoneyStorage.set('groups', this.groups);
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
     * 獲取群組by ID
     * @param {string} groupId - 群組ID
     */
    getGroupById(groupId) {
        return this.groups.find(g => g.id === groupId);
    }

    /**
     * 獲取所有群組
     */
    getAllGroups() {
        return this.groups;
    }
}

// 創建全局群組管理實例
window.haMoneyGroupManager = new HaMoneyGroupManager(); 