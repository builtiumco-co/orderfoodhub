document.addEventListener('DOMContentLoaded', () => {
    onSupabaseReady(() => {
        fetchOrders('All');

        const exportBtn = document.getElementById('exportOrdersCSV');
        if (exportBtn) {
            exportBtn.onclick = () => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                // Reuse the same logic logic as dashboard but specifically for today
                if (typeof exportDashboardToCSV === 'function') {
                    exportDashboardToCSV(todayStr);
                } else {
                    // Fallback to a simple alert if logic is not linked (though it should be via SPA/Global)
                    console.error('Export logic not found');
                }
            };
        }

        // Auto-refresh every 30 seconds (Simple Polling)
        setInterval(() => {
            const activeFilter = document.querySelector('.btn-primary')?.textContent || 'All';
            const filterMap = {
                'All Orders': 'All',
                'Pending': 'pending',
                'Preparing': 'preparing',
                'Ready': 'ready',
                'Completed': 'completed'
            };
            fetchOrders(filterMap[activeFilter] || 'All');
        }, 30000);
    });
});

// 1. Fetch Orders
async function fetchOrders(statusFilter = 'All') {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Loading orders...</td></tr>';

    try {
        // Calculate Today's Date Range (UTC)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;

        let query = supabase
            .from('orders')
            .select('*')
            .eq('payment_status', 'completed')
            .gte('created_at', start)
            .lte('created_at', end)
            .order('created_at', { ascending: false });

        if (statusFilter !== 'All') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        renderOrderRows(data);
    } catch (err) {
        console.error('Error fetching orders:', err);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
    }
}

// 2. Render Rows
function renderOrderRows(orders) {
    const tableBody = document.querySelector('.data-table tbody');
    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No orders found.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');

        // Format Items Summary
        let itemsSummary = '';
        if (Array.isArray(order.items)) {
            itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        } else if (typeof order.items === 'object') {
            itemsSummary = Object.values(order.items).map(i => `${i.qty}x ${i.name}`).join(', ');
        }

        // Address String
        const addr = order.address || {};
        const addressStr = `${addr.street || ''}, ${addr.lga || ''}`;

        // Time
        const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        tr.innerHTML = `
            <td>#${order.order_code}</td>
            <td>
                <div class="font-medium">${order.customer_name}</div>
                <div class="text-sm text-gray">${addressStr}</div>
            </td>
            <td>
                <div class="text-sm" style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsSummary}">
                    ${itemsSummary}
                </div>
            </td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>
                <select 
                    class="status-select ${getStatusClass(order.status)}" 
                    onchange="updateOrderStatus('${order.id}', this.value)"
                    style="padding: 0.25rem 0.5rem; border-radius: 12px; border: none; font-size: 0.875rem; font-weight: 500; cursor: pointer;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button class="btn btn-outline btn-icon" onclick="viewOrderDetails('${order.id}')" title="View Details">
                    <i data-lucide="eye" size="18"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    lucide.createIcons();
}

// Helper: Get status class for styling
function getStatusClass(status) {
    const map = {
        'pending': 'status-pending',
        'preparing': 'status-preparing',
        'ready': 'status-ready',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };
    return map[status.toLowerCase()] || 'status-pending';
}

// 3. Helper: Badge HTML
function getStatusBadge(status) {
    const map = {
        'pending': 'badge-blue',
        'preparing': 'badge-orange',
        'ready': 'badge-green',
        'completed': 'badge-gray',
        'cancelled': 'badge-danger'
    };
    const colorClass = map[status.toLowerCase()] || 'badge-gray';
    return `<span class="badge ${colorClass}">${status}</span>`;
}

// 4. View Order Details (Placeholder for future modal)
window.viewOrderDetails = async (id) => {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Simple alert for now - can be replaced with modal later
        const items = Array.isArray(order.items)
            ? order.items.map(i => `${i.qty}x ${i.name} - ₦${i.price}`).join('\n')
            : 'No items';

        const addr = order.address || {};
        const addressText = `${addr.street || ''}\n${addr.landmark || ''}\n${addr.zone || ''}`;

        alert(`Order #${order.order_code}\n\nCustomer: ${order.customer_name}\nPhone: ${order.phone}\n\nAddress:\n${addressText}\n\nItems:\n${items}\n\nSubtotal: ₦${order.total_amount - order.delivery_fee}\nDelivery: ₦${order.delivery_fee}\nTotal: ₦${order.total_amount}`);
    } catch (err) {
        alert('Error loading order: ' + err.message);
    }
};

// 5. Update Order Status
window.updateOrderStatus = async function (id, status) {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', id);

        if (error) throw error;

        // Show success message
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed; top:20px; right:20px; background:#10b981; color:white; padding:0.75rem 1.25rem; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999; font-size:0.9rem;';
        msg.textContent = `Order status updated to ${status}`;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);

        // Refresh orders list
        const activeFilter = document.querySelector('.btn-primary')?.textContent || 'All';
        const filterMap = {
            'All Orders': 'All',
            'Pending': 'pending',
            'Preparing': 'preparing',
            'Ready': 'ready',
            'Completed': 'completed'
        };
        fetchOrders(filterMap[activeFilter] || 'All');

    } catch (err) {
        alert("Failed to update: " + err.message);
    }
}

