document.addEventListener('DOMContentLoaded', () => {
    onSupabaseReady(() => {
        fetchMenuItems();
        setupEventListeners();
    });
});

// 1. Fetch and Render Items
async function fetchMenuItems(categoryFilter = 'All') {
    const tableBody = document.getElementById('menuTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading menu...</td></tr>';

    try {
        let query = supabase
            .from('menu_items')
            .select(`
                *,
                categories ( name )
            `)
            .order('name');

        const { data, error } = await query;

        if (error) throw error;

        // Store all items for search
        window.allMenuItems = data;
        renderMenuRows(data);
    } catch (err) {
        console.error('Error fetching menu:', err);
        tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error loading menu: ${err.message}</td></tr>`;
    }
}

// 1b. Search Menu Items
window.searchMenuItems = function (query) {
    if (!window.allMenuItems) return;

    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
        renderMenuRows(window.allMenuItems);
        return;
    }

    const filtered = window.allMenuItems.filter(item => {
        const name = item.name.toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = item.categories ? item.categories.name.toLowerCase() : '';

        return name.includes(searchTerm) || desc.includes(searchTerm) || cat.includes(searchTerm);
    });

    renderMenuRows(filtered);
}

// 2. Render Rows
function renderMenuRows(items) {
    const tableBody = document.getElementById('menuTableBody');
    tableBody.innerHTML = '';

    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No items found. Add one!</td></tr>';
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        const catName = item.categories ? item.categories.name : 'Uncategorized';

        // Create image preview if URL exists
        const imagePreview = item.image_url
            ? `<img src="${item.image_url}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; margin-right:8px;" onerror="this.style.display='none'">`
            : '';

        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center;">
                    ${imagePreview}
                    <div>
                        <div class="font-medium">${item.name}</div>
                        ${item.description ? `<span class="text-sm text-gray" style="font-size:0.75rem">${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}</span>` : ''}
                    </div>
                </div>
            </td>
            <td><span class="text-sm text-gray">${catName}</span></td>
            <td>${formatCurrency(item.price)}</td>
            <td>
                <label class="switch">
                    <input type="checkbox" 
                        ${item.is_available ? 'checked' : ''} 
                        onchange="toggleAvailability('${item.id}', this.checked)">
                    <span class="slider"></span>
                </label>
            </td>
            <td>
                <div class="flex gap-2">
                    <button class="btn-icon" onclick="editItem('${item.id}')"><i data-lucide="edit-2" size="18"></i></button>
                    <button class="btn-icon" style="color:var(--danger)" onclick="deleteItem('${item.id}')"><i data-lucide="trash-2" size="18"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Re-init icons for new content
    lucide.createIcons();
}

// 3. Toggle Availability
window.toggleAvailability = async (id, isAvailable) => {
    try {
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: isAvailable })
            .eq('id', id);

        if (error) {
            alert('Failed to update status');
            // Revert checkbox (optional, requires reference)
        } else {
            console.log(`Item ${id} is now ${isAvailable}`);
        }
    } catch (err) {
        console.error(err);
    }
};

// 4. Add/Edit Item
async function handleAddItem(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('addItemForm');
    const editId = form.dataset.editId; // Check if editing
    const isEdit = !!editId;

    submitBtn.textContent = isEdit ? 'Updating...' : 'Saving...';
    submitBtn.disabled = true;

    const name = document.getElementById('itemName').value.trim();
    const price = document.getElementById('itemPrice').value;
    const categoryName = document.getElementById('itemCategory').value;
    const isAvailable = document.getElementById('itemAvailable').checked;
    const imageUrl = document.getElementById('itemImageUrl').value.trim();
    const description = document.getElementById('itemDescription').value.trim();

    try {
        // Step A: Find Category ID
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', categoryName)
            .single();

        if (catError) throw new Error('Category not found. Please ensure categories exist in DB.');

        const categoryId = catData.id;

        // Step B: Prepare item data
        const itemData = {
            name,
            price: parseInt(price),
            category_id: categoryId,
            is_available: isAvailable
        };

        // Add optional fields only if provided
        if (imageUrl) itemData.image_url = imageUrl;
        if (description) itemData.description = description;

        // Step C: Insert or Update
        let error;
        if (isEdit) {
            // Update existing item
            const result = await supabase
                .from('menu_items')
                .update(itemData)
                .eq('id', editId);
            error = result.error;
        } else {
            // Insert new item
            const result = await supabase
                .from('menu_items')
                .insert([itemData]);
            error = result.error;
        }

        if (error) throw error;

        // Success
        closeModal();
        form.reset();
        delete form.dataset.editId; // Clear edit mode
        fetchMenuItems(); // Refresh table

        showSuccessMessage(isEdit ? 'Item updated successfully!' : 'Item added successfully!');

    } catch (err) {
        alert(err.message);
    } finally {
        submitBtn.textContent = isEdit ? 'Update Item' : 'Save Item';
        submitBtn.disabled = false;
    }
}

// Helper function for success messages
function showSuccessMessage(message) {
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed; top:20px; right:20px; background:#10b981; color:white; padding:1rem 1.5rem; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999;';
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

// 5. Setup Listeners and Init Data
async function setupEventListeners() {
    // A. Add Item Form
    const form = document.getElementById('addItemForm');
    if (form) form.addEventListener('submit', handleAddItem);

    // B. Load Categories into Dropdown
    const categorySelect = document.getElementById('itemCategory');
    if (categorySelect) {
        const { data } = await supabase.from('categories').select('name, id').order('sort_order');
        if (data) {
            categorySelect.innerHTML = data.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    }
}

// 6. Delete (Basic)
window.deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (error) throw error;
        fetchMenuItems(); // Refresh
        showSuccessMessage('Item deleted successfully!');
    } catch (err) {
        alert('Error deleting item: ' + err.message);
    }
}

// 7. Edit Item
window.editItem = async (id) => {
    try {
        // Fetch item data
        const { data: item, error } = await supabase
            .from('menu_items')
            .select('*, categories(name)')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Populate form with existing data
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemImageUrl').value = item.image_url || '';
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemAvailable').checked = item.is_available;

        // Set category
        if (item.categories) {
            document.getElementById('itemCategory').value = item.categories.name;
        }

        // Change modal title and button
        document.querySelector('#itemModal h3').textContent = 'Edit Menu Item';
        document.getElementById('submitBtn').textContent = 'Update Item';

        // Store item ID for update
        document.getElementById('addItemForm').dataset.editId = id;

        // Open modal
        openModal();

    } catch (err) {
        alert('Error loading item: ' + err.message);
    }
}

