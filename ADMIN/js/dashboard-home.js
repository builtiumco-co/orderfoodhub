document.addEventListener('DOMContentLoaded', () => {
    onSupabaseReady(() => {
        // Only run dashboard init if the picker exists
        if (document.getElementById('dashboardDatePicker')) {
            initDashboard();
        }
    });
});

async function initDashboard() {
    const datePicker = document.getElementById('dashboardDatePicker');
    const exportBtn = document.getElementById('exportDashboardCSV');

    // Set default date to Today (Local Date)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (datePicker) {
        datePicker.value = todayStr;
        datePicker.addEventListener('change', (e) => {
            refreshDashboardData(e.target.value);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const selectedDate = datePicker.value;
            exportDashboardToCSV(selectedDate);
        });
    }

    // Initial load
    refreshDashboardData(todayStr);
}

async function exportDashboardToCSV(dateStr) {
    try {
        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;

        const { data: orders, error } = await supabase
            .from('orders')
            .select('order_code, customer_name, phone, status, total_amount, created_at, payment_status, payment_method, address, items')
            .eq('payment_status', 'completed')
            .gte('created_at', start)
            .lte('created_at', end)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            alert('No orders found for this date to export.');
            return;
        }

        // CSV Headers
        const headers = [
            'Order ID',
            'Customer Name',
            'Phone',
            'Status',
            'Total Amount',
            'Created At',
            'Payment Method',
            'Address',
            'Items Summary'
        ];

        // Format Rows
        const rows = orders.map(order => {
            const itemsSummary = Array.isArray(order.items)
                ? order.items.map(i => `${i.qty}x ${i.name}`).join('; ')
                : '';

            const addr = order.address || {};
            const addressStr = `${addr.street || ''}, ${addr.lga || ''}`.replace(/,/g, ' ');

            return [
                `#${order.order_code}`,
                `"${order.customer_name}"`,
                `'${order.phone}`,
                order.status,
                order.total_amount,
                new Date(order.created_at).toLocaleString(),
                order.payment_method,
                `"${addressStr}"`,
                `"${itemsSummary}"`
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `foodhub_orders_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error('Export Error:', err);
        alert('Failed to export CSV: ' + err.message);
    }
}

function refreshDashboardData(selectedDate) {
    // Update date labels on indicators
    const displayDate = new Date(selectedDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    ['orders', 'revenue', 'pending', 'completed'].forEach(key => {
        const el = document.getElementById(`label-${key}-date`);
        if (el) el.textContent = displayDate;
    });

    // Load data
    Promise.all([
        loadDashboardStats(selectedDate),
        loadRecentOrders(selectedDate)
    ]).catch(err => console.error('Dashboard refresh error:', err));
}

async function loadDashboardStats(dateStr) {
    try {
        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;

        const { data: orders, error } = await supabase
            .from('orders')
            .select('status, total_amount, created_at, payment_status')
            .eq('payment_status', 'completed')
            .gte('created_at', start)
            .lte('created_at', end);

        if (error) throw error;

        // Process Metrics
        const stats = {
            orders: orders.length,
            revenue: orders
                .filter(o => o.status !== 'cancelled')
                .reduce((sum, o) => sum + (o.total_amount || 0), 0),
            pending: orders.filter(o => o.status === 'pending').length,
            completed: orders.filter(o => o.status === 'completed').length
        };

        // Update UI
        updateStat('stat-orders', stats.orders);
        updateStat('stat-revenue', formatCurrency(stats.revenue));
        updateStat('stat-pending', stats.pending);
        updateStat('stat-completed', stats.completed);

    } catch (err) {
        console.error('Stats Error:', err);
        ['stat-orders', 'stat-pending', 'stat-completed'].forEach(id => updateStat(id, 0));
        updateStat('stat-revenue', '₦0');
    }
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function loadRecentOrders(dateStr) {
    try {
        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;

        const { data: orders, error } = await supabase
            .from('orders')
            .select('order_code, customer_name, phone, status, total_amount, created_at, payment_status')
            .eq('payment_status', 'completed')
            .gte('created_at', start)
            .lte('created_at', end)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('recentOrdersBody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #6b7280;">No orders found for this date.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        orders.forEach(order => {
            const tr = document.createElement('tr');
            const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            tr.innerHTML = `
                <td>#${order.order_code}</td>
                <td>
                    <div class="font-medium">${order.customer_name}</div>
                    <div class="text-sm text-gray">${order.phone}</div>
                </td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td class="text-gray text-sm">${time}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Recent Orders Error:', err);
        const tbody = document.getElementById('recentOrdersBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444; padding: 20px;">Error loading orders</td></tr>';
        }
    }
}

function getStatusBadge(status) {
    const map = {
        'pending': 'badge-blue',
        'preparing': 'badge-orange',
        'ready': 'badge-green',
        'completed': 'badge-green',
        'cancelled': 'badge-gray'
    };
    const cls = map[status] || 'badge-gray';
    return `<span class="badge ${cls}">${status}</span>`;
}

// Redundant formatCurrency removed to prevent recursion with config.js version
