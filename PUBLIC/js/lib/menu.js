// ================================
// FOODHUB - Menu Module
// Restaurant and menu item functions
// ================================

window.menu = {
    /**
     * Get all categories (ordered by sort_order)
     * Returns: { data: [...], error: null }
     */
    async getCategories() {
        try {
            const data = await db.query('categories', {
                orderBy: { column: 'sort_order', ascending: true }
            });
            return { data, error: null };
        } catch (error) {
            logError(error, 'getCategories');
            return { data: [], error };
        }
    },

    /**
     * Get menu items for a category
     */
    async getMenuItemsByCategory(categoryId) {
        try {
            const data = await db.query('menu_items', {
                filters: { category_id: categoryId, is_available: true },
                orderBy: { column: 'name', ascending: true }
            });
            return { data, error: null };
        } catch (error) {
            logError(error, 'getMenuItemsByCategory');
            return { data: [], error };
        }
    },

    /**
     * Get all menu items with categories
     * Uses a single query with joins for better sync
     */
    async getAllMenuItems() {
        try {
            showLoader();

            // Fetch items WITH category data in one shot
            // Table names: menu_items, categories
            const { data: items, error } = await db.client
                .from('menu_items')
                .select('*, categories(*)')
                .eq('is_available', true)
                .order('name');

            if (error) throw error;

            if (!items || items.length === 0) {
                hideLoader();
                return { data: [], error: null };
            }

            // Group items by category manually to ensure correct structure for the UI
            const groupsMap = new Map();

            items.forEach(item => {
                const cat = item.categories;
                if (!cat) return; // Skip items without valid category

                if (!groupsMap.has(cat.id)) {
                    groupsMap.set(cat.id, {
                        categoryId: cat.id,
                        categoryName: cat.name,
                        sortOrder: cat.sort_order || 0,
                        items: []
                    });
                }
                groupsMap.get(cat.id).items.push(item);
            });

            // Convert to array and sort by category sortOrder
            const grouped = Array.from(groupsMap.values())
                .sort((a, b) => a.sortOrder - b.sortOrder);

            hideLoader();
            return { data: grouped, error: null };
        } catch (error) {
            hideLoader();
            logError(error, 'getAllMenuItems');
            return { data: [], error };
        }
    },

    /**
     * Mock Data for fallback
     */
    getMockData() {
        return [
            {
                categoryId: 'mock-rice',
                categoryName: 'Rice',
                items: [
                    { id: 'r1', name: 'Jollof Rice', price: 2500, description: 'Classic Nigerian jollof rice', image_url: './Assets/Menu/Jollof Rice.webp' },
                    { id: 'r2', name: 'Fried Rice', price: 2000, description: 'Savory fried rice', image_url: './Assets/Menu/fried rice.webp' },
                    { id: 'r3', name: 'white Rice + stew', price: 3000, description: 'White rice and stew', image_url: './Assets/Menu/white rice & Stew.webp' }
                ]
            },
            {
                categoryId: 'mock-chicken',
                categoryName: 'Chicken',
                items: [
                    { id: 'c1', name: 'Grilled Chicken', price: 3500, description: 'Spiced & grilled chicken', image_url: './Assets/Menu/Grilled chicken.webp' },
                    { id: 'c2', name: 'Fried Chicken', price: 3000, description: 'Crispy fried chicken', image_url: './Assets/Menu/Fried Chicken.webp' }
                ]
            },
            {
                categoryId: 'mock-soups',
                categoryName: 'Soups & Stews',
                items: [
                    { id: 's1', name: 'Egusi Soup', price: 2500, description: 'Melon seed soup' },
                    { id: 's2', name: 'Okra Soup', price: 2200, description: 'Fresh okra soup' }
                ]
            },
            {
                categoryId: 'mock-drinks',
                categoryName: 'Drinks',
                items: [
                    { id: 'd1', name: 'Coca Cola', price: 500, description: '500ml bottle', image_url: './Assets/Menu/Coca cola.webp' },
                    { id: 'd2', name: 'Zobo Drink', price: 400, description: 'Traditional hibiscus drink', image_url: './Assets/Menu/Zobo Drink.webp' }
                ]
            }
        ];
    },

    /**
     * Get single menu item
     * Returns: { data: {...}, error: null }
     */
    async getMenuItem(itemId) {
        try {
            const item = await db.get('menu_items', itemId);
            return { data: item, error: null };
        } catch (error) {
            logError(error, 'getMenuItem');
            return { data: null, error };
        }
    },

    /**
     * Get active items only
     * Returns: { data: [...], error: null }
     */
    async getActiveMenuItems() {
        try {
            const data = await db.query('menu_items', {
                filters: { is_available: true },
                orderBy: { column: 'name', ascending: true }
            });
            return { data, error: null };
        } catch (error) {
            logError(error, 'getActiveMenuItems');
            return { data: [], error };
        }
    },

    // --- Legacy / Extra Functions (Keeping for compatibility if needed) ---

    async searchMenuItems(query) {
        try {
            if (!query || query.length < 2) return [];
            showLoader();
            const items = await db.search('menu_items', 'name', query);
            hideLoader();
            return items || [];
        } catch (error) {
            hideLoader();
            logError(error, 'searchMenuItems');
            return [];
        }
    }
};
