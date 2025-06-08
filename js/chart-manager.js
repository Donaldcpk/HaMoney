/**
 * HaMoney - 圖表管理系統
 * 提供視覺化報告功能，包括餅圖、折線圖等
 */

class HaMoneyChartManager {
    constructor() {
        this.chartInstances = {};
        this.init();
    }

    init() {
        this.loadChartLibrary();
    }

    /**
     * 載入Chart.js函式庫
     */
    async loadChartLibrary() {
        return new Promise((resolve, reject) => {
            if (window.Chart) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 創建群組費用分攤餅圖
     * @param {string} containerId - 容器ID
     * @param {string} groupId - 群組ID
     */
    createGroupExpensePieChart(containerId, groupId) {
        const group = window.haMoneyGroupManager.getGroupById(groupId);
        if (!group) return;

        // 獲取群組相關的分帳記錄
        const records = window.haMoneyStorage.get('splittingRecords') || [];
        const groupRecords = records.filter(record => record.groupId === groupId);

        // 計算每個成員的總支出
        const memberExpenses = {};
        group.members.forEach(member => {
            memberExpenses[member.name] = 0;
        });

        groupRecords.forEach(record => {
            Object.values(record.splits || {}).forEach(split => {
                if (memberExpenses.hasOwnProperty(split.name)) {
                    memberExpenses[split.name] += split.amount;
                }
            });
        });

        const data = {
            labels: Object.keys(memberExpenses),
            datasets: [{
                label: '支出金額 (HK$)',
                data: Object.values(memberExpenses),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        const config = {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${group.name} - 費用分攤比例`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, index) => {
                                    const value = data.datasets[0].data[index];
                                    return {
                                        text: `${label}: HK$ ${value.toFixed(2)}`,
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        strokeStyle: data.datasets[0].borderColor,
                                        lineWidth: data.datasets[0].borderWidth
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: HK$ ${context.parsed.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.renderChart(containerId, config);
    }

    /**
     * 創建月度開支趨勢折線圖
     * @param {string} containerId - 容器ID
     */
    createMonthlyTrendChart(containerId) {
        const records = window.haMoneyStorage.get('splittingRecords') || [];
        
        // 按月份統計開支
        const monthlyData = {};
        records.forEach(record => {
            const month = record.createdAt.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = 0;
            }
            monthlyData[month] += record.total;
        });

        // 排序月份並準備數據
        const sortedMonths = Object.keys(monthlyData).sort();
        const last6Months = sortedMonths.slice(-6);

        const data = {
            labels: last6Months.map(month => {
                const [year, monthNum] = month.split('-');
                return `${year}年${monthNum}月`;
            }),
            datasets: [{
                label: '月度總開支 (HK$)',
                data: last6Months.map(month => monthlyData[month]),
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#36A2EB',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '月度開支趨勢',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'HK$ ' + value.toFixed(0);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        this.renderChart(containerId, config);
    }

    /**
     * 創建分類開支橫條圖
     * @param {string} containerId - 容器ID
     */
    createCategoryExpenseChart(containerId) {
        const records = window.haMoneyStorage.get('splittingRecords') || [];
        
        // 按商店類型統計（簡單分類）
        const categories = {
            '餐廳美食': 0,
            '購物消費': 0,
            '交通出行': 0,
            '娛樂休閒': 0,
            '其他': 0
        };

        records.forEach(record => {
            const storeName = record.receipt.storeName.toLowerCase();
            let category = '其他';
            
            if (storeName.includes('餐') || storeName.includes('食') || storeName.includes('cafe') || storeName.includes('restaurant')) {
                category = '餐廳美食';
            } else if (storeName.includes('mall') || storeName.includes('shop') || storeName.includes('store')) {
                category = '購物消費';
            } else if (storeName.includes('taxi') || storeName.includes('uber') || storeName.includes('transport')) {
                category = '交通出行';
            } else if (storeName.includes('cinema') || storeName.includes('ktv') || storeName.includes('遊戲')) {
                category = '娛樂休閒';
            }
            
            categories[category] += record.total;
        });

        const data = {
            labels: Object.keys(categories),
            datasets: [{
                label: '開支金額 (HK$)',
                data: Object.values(categories),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)'
                ],
                borderWidth: 1
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: '分類開支統計',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'HK$ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        };

        this.renderChart(containerId, config);
    }

    /**
     * 創建個人欠款狀況圖表
     * @param {string} containerId - 容器ID
     */
    createPersonalDebtChart(containerId) {
        const currentUser = window.haMoneyAuth.getCurrentUser();
        if (!currentUser) return;

        const userDebts = window.haMoneyDebtTracker.getUserDebts(currentUser.uid);
        const userBalance = window.haMoneyDebtTracker.calculateUserBalance(currentUser.uid);

        const data = {
            labels: ['我欠別人', '別人欠我'],
            datasets: [{
                label: '金額 (HK$)',
                data: [userBalance.totalOwedByMe, userBalance.totalOwedToMe],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(75, 192, 192)'
                ],
                borderWidth: 2
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '個人欠款狀況',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: HK$ ${context.parsed.toFixed(2)}`;
                            }
                        }
                    }
                },
                cutout: '50%'
            }
        };

        this.renderChart(containerId, config);
    }

    /**
     * 渲染圖表
     * @param {string} containerId - 容器ID
     * @param {Object} config - 圖表配置
     */
    renderChart(containerId, config) {
        const canvas = document.getElementById(containerId);
        if (!canvas) {
            console.error(`找不到圖表容器: ${containerId}`);
            return;
        }

        // 銷毀現有圖表
        if (this.chartInstances[containerId]) {
            this.chartInstances[containerId].destroy();
        }

        // 創建新圖表
        try {
            this.chartInstances[containerId] = new Chart(canvas, config);
        } catch (error) {
            console.error('創建圖表失敗:', error);
            canvas.parentElement.innerHTML = '<p class="text-muted text-center">載入圖表失敗</p>';
        }
    }

    /**
     * 生成報告界面
     */
    generateReportsUI() {
        return `
            <div class="reports-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4><i class="bi bi-bar-chart-line me-2"></i>視覺化報告</h4>
                    <button class="btn btn-outline-primary" id="refreshChartsBtn">
                        <i class="bi bi-arrow-clockwise me-1"></i>重新整理
                    </button>
                </div>

                <!-- 統計卡片 -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-receipt text-primary mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">總分帳次數</h6>
                                <h4 class="text-primary" id="totalSplitsCount">0</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-currency-dollar text-success mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">總金額</h6>
                                <h4 class="text-success" id="totalAmount">HK$ 0</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-people text-info mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">活躍群組</h6>
                                <h4 class="text-info" id="activeGroups">0</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body text-center">
                                <i class="bi bi-calendar-month text-warning mb-2" style="font-size: 2rem;"></i>
                                <h6 class="card-title">本月分帳</h6>
                                <h4 class="text-warning" id="thisMonthSplits">0</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 圖表區域 -->
                <div class="row">
                    <!-- 月度趨勢 -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">月度開支趨勢</h6>
                            </div>
                            <div class="card-body">
                                <canvas id="monthlyTrendChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- 個人欠款狀況 -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">個人欠款狀況</h6>
                            </div>
                            <div class="card-body">
                                <canvas id="personalDebtChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- 分類開支 -->
                    <div class="col-md-12 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">分類開支統計</h6>
                            </div>
                            <div class="card-body">
                                <canvas id="categoryExpenseChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 群組分析（如果有群組的話） -->
                <div id="groupAnalysis" class="row">
                    <!-- 動態載入群組圖表 -->
                </div>
            </div>
        `;
    }

    /**
     * 載入所有圖表
     */
    async loadAllCharts() {
        try {
            await this.loadChartLibrary();
            
            // 更新統計數據
            this.updateStatistics();
            
            // 創建圖表
            setTimeout(() => {
                this.createMonthlyTrendChart('monthlyTrendChart');
                this.createPersonalDebtChart('personalDebtChart');
                this.createCategoryExpenseChart('categoryExpenseChart');
                this.loadGroupCharts();
            }, 100);
            
        } catch (error) {
            console.error('載入圖表失敗:', error);
        }
    }

    /**
     * 載入群組圖表
     */
    loadGroupCharts() {
        const groups = window.haMoneyGroupManager.getAllGroups();
        const groupAnalysis = document.getElementById('groupAnalysis');
        
        if (groups.length === 0 || !groupAnalysis) return;

        groupAnalysis.innerHTML = groups.map(group => `
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">${group.name} - 費用分攤</h6>
                    </div>
                    <div class="card-body">
                        <canvas id="groupChart_${group.id}" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        `).join('');

        // 為每個群組創建圖表
        setTimeout(() => {
            groups.forEach(group => {
                this.createGroupExpensePieChart(`groupChart_${group.id}`, group.id);
            });
        }, 100);
    }

    /**
     * 更新統計數據
     */
    updateStatistics() {
        const records = window.haMoneyStorage.get('splittingRecords') || [];
        const groups = window.haMoneyGroupManager.getAllGroups();
        
        // 總分帳次數
        const totalSplitsElement = document.getElementById('totalSplitsCount');
        if (totalSplitsElement) {
            totalSplitsElement.textContent = records.length;
        }

        // 總金額
        const totalAmount = records.reduce((sum, record) => sum + record.total, 0);
        const totalAmountElement = document.getElementById('totalAmount');
        if (totalAmountElement) {
            totalAmountElement.textContent = `HK$ ${totalAmount.toFixed(2)}`;
        }

        // 活躍群組
        const activeGroupsElement = document.getElementById('activeGroups');
        if (activeGroupsElement) {
            activeGroupsElement.textContent = groups.length;
        }

        // 本月分帳
        const thisMonth = new Date().toISOString().substring(0, 7);
        const thisMonthRecords = records.filter(record => 
            record.createdAt.substring(0, 7) === thisMonth
        );
        const thisMonthSplitsElement = document.getElementById('thisMonthSplits');
        if (thisMonthSplitsElement) {
            thisMonthSplitsElement.textContent = thisMonthRecords.length;
        }
    }

    /**
     * 綁定重新整理事件
     */
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshChartsBtn') {
                this.loadAllCharts();
            }
        });
    }
}

// 創建全局圖表管理實例
window.haMoneyChartManager = new HaMoneyChartManager(); 