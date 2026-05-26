// ====================================
// SUPABASE CLIENT - Database Connection
// ====================================

class SupabaseClient {
    constructor() {
        // Initialize Supabase client
        this.client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client initialized');
    }

    /**
     * GET - Get single row by ID or filters
     */
    async get(table, idOrFilters) {
        try {
            if (typeof idOrFilters === 'string' || typeof idOrFilters === 'number') {
                return await this.selectOne(table, { id: idOrFilters });
            }
            return await this.selectOne(table, idOrFilters);
        } catch (error) {
            logError(error, `GET ${table}`);
            return null;
        }
    }

    /**
     * QUERY - Advanced data fetching
     */
    async query(table, options = {}) {
        try {
            let query = this.client.from(table).select(options.select || '*');

            // Apply filters
            if (options.filters) {
                Object.keys(options.filters).forEach(key => {
                    const val = options.filters[key];
                    if (val !== null && val !== undefined) {
                        query = query.eq(key, val);
                    }
                });
            }

            // Apply order
            if (options.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending !== false
                });
            }

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            logError(error, `QUERY ${table}`);
            return [];
        }
    }

    /**
     * SEARCH - Text search on a column
     */
    async search(table, column, queryStr, options = {}) {
        try {
            let query = this.client.from(table).select(options.select || '*');

            // ilike for case-insensitive partial match
            query = query.ilike(column, `%${queryStr}%`);

            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            logError(error, `SEARCH ${table}`);
            return [];
        }
    }

    /**
     * SELECT - Get data from table
     */
    async select(table, filters = {}) {
        try {
            let query = this.client.from(table).select('*');
            Object.keys(filters).forEach(key => {
                query = query.eq(key, filters[key]);
            });
            const { data, error } = await query;
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logError(error, `SELECT ${table}`);
            return { data: null, error };
        }
    }

    /**
     * SELECT SINGLE - Get one row
     */
    async selectOne(table, filters) {
        try {
            let query = this.client.from(table).select('*').limit(1);
            Object.keys(filters).forEach(key => {
                query = query.eq(key, filters[key]);
            });
            const { data, error } = await query;
            if (error) throw error;
            return { data: data?.[0] || null, error: null };
        } catch (error) {
            logError(error, `SELECT ONE ${table}`);
            return { data: null, error };
        }
    }

    /**
     * INSERT - Add new row
     */
    async insert(table, data) {
        try {
            const { data: result, error } = await this.client
                .from(table)
                .insert([data])
                .select();
            if (error) throw error;
            return { data: result?.[0] || null, error: null };
        } catch (error) {
            logError(error, `INSERT ${table}`);
            return { data: null, error };
        }
    }

    /**
     * UPDATE - Modify existing row
     * Supports both update(table, id, data) and update(table, updates, filters)
     */
    async update(table, updatesOrId, filtersOrUpdates) {
        try {
            let updates = updatesOrId;
            let filters = filtersOrUpdates;

            // Handle update(table, id, updates)
            if (typeof updatesOrId === 'string' || typeof updatesOrId === 'number') {
                updates = filtersOrUpdates;
                filters = { id: updatesOrId };
            }

            let query = this.client.from(table).update(updates);
            Object.keys(filters).forEach(key => {
                query = query.eq(key, filters[key]);
            });

            const { data, error } = await query.select();
            if (error) throw error;
            return { data: data?.[0] || null, error: null };
        } catch (error) {
            logError(error, `UPDATE ${table}`);
            return { data: null, error };
        }
    }

    /**
     * DELETE - Remove row
     */
    async delete(table, filters) {
        try {
            let query = this.client.from(table).delete();
            Object.keys(filters).forEach(key => {
                query = query.eq(key, filters[key]);
            });
            const { error } = await query;
            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            logError(error, `DELETE ${table}`);
            return { success: false, error };
        }
    }

    /**
     * COUNT - Get row count
     */
    async count(table, filters = {}) {
        try {
            let query = this.client.from(table).select('*', { count: 'exact', head: true });
            Object.keys(filters).forEach(key => {
                query = query.eq(key, filters[key]);
            });
            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        } catch (error) {
            logError(error, `COUNT ${table}`);
            return 0;
        }
    }

    /**
     * HEALTH CHECK - Test connection
     */
    async healthCheck() {
        try {
            // Check menu_items table instead of customers
            const { error } = await this.client.from('menu_items').select('id').limit(1);
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is just "no rows"
            console.log('✅ Supabase connection OK');
            return true;
        } catch (error) {
            console.error('❌ Supabase connection failed:', error.message);
            return false;
        }
    }
}

// Create global database instance
const db = new SupabaseClient();

// Test connection on load
window.addEventListener('load', () => {
    db.healthCheck();
});

console.log('✅ Supabase client loaded');