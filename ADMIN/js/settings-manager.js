document.addEventListener('DOMContentLoaded', () => {
    onSupabaseReady(() => {
        fetchDeliveryZones();
    });

    const form = document.getElementById('addZoneForm');
    if (form) form.addEventListener('submit', handleAddZone);
});

// 1. Fetch Zones
async function fetchDeliveryZones() {
    const tbody = document.getElementById('zonesTableBody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Loading zones...</td></tr>';

    try {
        const { data, error } = await supabase
            .from('delivery_zones')
            .select('*')
            .order('price', { ascending: true }); // Sort by cheaper delivery first

        if (error) throw error;

        renderZones(data);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
    }
}

// 2. Render Loop
function renderZones(zones) {
    const tbody = document.getElementById('zonesTableBody');
    tbody.innerHTML = '';

    if (zones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No zones defined.</td></tr>';
        return;
    }

    zones.forEach(zone => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="font-medium">${zone.zone_name}</div></td>
            <td>${formatCurrency(zone.price)}</td>
            <td>
                <button class="btn-icon" style="color:var(--danger)" onclick="deleteZone('${zone.id}')">
                    <i data-lucide="trash-2" size="18"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

// 3. Add Zone
async function handleAddZone(e) {
    e.preventDefault();
    const btn = document.getElementById('saveZoneBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const name = document.getElementById('zoneName').value;
    const price = document.getElementById('zonePrice').value;

    try {
        const { error } = await supabase
            .from('delivery_zones')
            .insert([{ zone_name: name, price: parseInt(price) }]);

        if (error) throw error;

        document.getElementById('addZoneForm').reset();
        closeModal();
        fetchDeliveryZones();

    } catch (err) {
        alert('Error adding zone: ' + err.message);
    } finally {
        btn.textContent = 'Save Zone';
        btn.disabled = false;
    }
}

// 4. Delete Zone
window.deleteZone = async (id) => {
    if (!confirm('Delete this delivery zone?')) return;

    try {
        const { error } = await supabase
            .from('delivery_zones')
            .delete()
            .eq('id', id);

        if (error) throw error;

        fetchDeliveryZones();
    } catch (err) {
        alert(err.message);
    }
}
