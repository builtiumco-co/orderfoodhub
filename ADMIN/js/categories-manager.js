document.addEventListener('DOMContentLoaded', () => {
    onSupabaseReady(() => {
        fetchCategories();
    });

    const form = document.getElementById('addCategoryForm');
    if (form) form.addEventListener('submit', handleAddCategory);
});

async function fetchCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="padding:20px; text-align:center">Loading...</td></tr>';

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*, menu_items(count)') // Attempt to get count if Supabase config allows
            .order('sort_order', { ascending: true });

        if (error) throw error;
        renderCategories(data);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center">${err.message}</td></tr>`;
    }
}

function renderCategories(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = '';

    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding:20px; text-align:center">No categories found.</td></tr>';
        return;
    }

    categories.forEach(cat => {
        const tr = document.createElement('tr');
        // Note: menu_items is an array of objects even with count, usually requires exact format handling
        // For simplicity in Phase 2, we might show 0 or skip count if complex relationship query fails
        const count = cat.menu_items ? cat.menu_items[0]?.count : '-';

        tr.innerHTML = `
            <td><div class="font-medium">${cat.name}</div></td>
            <td>${cat.sort_order || 0}</td>
            <td><span class="badge badge-gray">Auto-calc</span></td>
            <td>
                <div class="flex gap-2">
                    <button class="btn-icon" style="color:var(--danger)" onclick="deleteCategory('${cat.id}')">
                        <i data-lucide="trash-2" size="18"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

async function handleAddCategory(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const name = document.getElementById('catName').value;
    const sort = document.getElementById('catSort').value;

    try {
        const { error } = await supabase
            .from('categories')
            .insert([{ name, sort_order: parseInt(sort) }]);

        if (error) throw error;

        document.getElementById('addCategoryForm').reset();
        closeModal();
        fetchCategories();

    } catch (err) {
        alert(err.message);
    } finally {
        btn.textContent = 'Save Category';
        btn.disabled = false;
    }
}

window.deleteCategory = async (id) => {
    if (!confirm('Delete this category? Items in it might lose their category association.')) return;
    try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        fetchCategories();
    } catch (err) {
        alert(err.message);
    }
};
