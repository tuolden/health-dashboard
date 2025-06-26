"use strict";
/**
 * Custom Dashboard DAO - Issue #15
 *
 * Database access layer for custom dashboard builder functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomDashboardDao = void 0;
const pg_1 = require("pg");
class CustomDashboardDao {
    pool;
    constructor() {
        this.pool = new pg_1.Pool({
            host: process.env['POSTGRES_HOST'] || 'localhost',
            port: parseInt(process.env['POSTGRES_PORT'] || '5432'),
            database: process.env['POSTGRES_DB'] || 'health_dashboard',
            user: process.env['POSTGRES_USER'] || 'postgres',
            password: process.env['POSTGRES_PASSWORD'] || 'password'
        });
    }
    /**
     * Get all custom dashboards for a user
     */
    async getDashboards(userId = 'default_user') {
        try {
            const query = `
        SELECT id, name, user_id, time_range, created_at, updated_at
        FROM custom_dashboards 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
            const result = await this.pool.query(query, [userId]);
            return result.rows;
        }
        catch (error) {
            console.error('❌ Error fetching custom dashboards:', error);
            throw new Error('Failed to fetch custom dashboards');
        }
    }
    /**
     * Get a specific dashboard with its widgets
     */
    async getDashboardById(id) {
        try {
            // Get dashboard
            const dashboardQuery = `
        SELECT id, name, user_id, time_range, created_at, updated_at
        FROM custom_dashboards 
        WHERE id = $1
      `;
            const dashboardResult = await this.pool.query(dashboardQuery, [id]);
            if (dashboardResult.rows.length === 0) {
                return null;
            }
            const dashboard = dashboardResult.rows[0];
            // Get widgets
            const widgetsQuery = `
        SELECT id, dashboard_id, widget_type, grid_x, grid_y, size, widget_config, created_at
        FROM custom_dashboard_widgets 
        WHERE dashboard_id = $1 
        ORDER BY grid_y, grid_x
      `;
            const widgetsResult = await this.pool.query(widgetsQuery, [id]);
            dashboard.widgets = widgetsResult.rows;
            return dashboard;
        }
        catch (error) {
            console.error('❌ Error fetching dashboard by ID:', error);
            throw new Error('Failed to fetch dashboard');
        }
    }
    /**
     * Create a new custom dashboard
     */
    async createDashboard(data) {
        try {
            const query = `
        INSERT INTO custom_dashboards (name, user_id, time_range)
        VALUES ($1, $2, $3)
        RETURNING id, name, user_id, time_range, created_at, updated_at
      `;
            const values = [
                data.name,
                data.user_id || 'default_user',
                data.time_range || 'last_month'
            ];
            const result = await this.pool.query(query, values);
            return result.rows[0];
        }
        catch (error) {
            console.error('❌ Error creating custom dashboard:', error);
            throw new Error('Failed to create custom dashboard');
        }
    }
    /**
     * Update dashboard properties
     */
    async updateDashboard(id, updates) {
        try {
            const setClause = [];
            const values = [];
            let paramIndex = 1;
            if (updates.name) {
                setClause.push(`name = $${paramIndex++}`);
                values.push(updates.name);
            }
            if (updates.time_range) {
                setClause.push(`time_range = $${paramIndex++}`);
                values.push(updates.time_range);
            }
            setClause.push(`updated_at = NOW()`);
            values.push(id);
            const query = `
        UPDATE custom_dashboards 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, user_id, time_range, created_at, updated_at
      `;
            const result = await this.pool.query(query, values);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('❌ Error updating custom dashboard:', error);
            throw new Error('Failed to update custom dashboard');
        }
    }
    /**
     * Add widget to dashboard
     */
    async addWidget(data) {
        try {
            const query = `
        INSERT INTO custom_dashboard_widgets (dashboard_id, widget_type, grid_x, grid_y, size, widget_config)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, dashboard_id, widget_type, grid_x, grid_y, size, widget_config, created_at
      `;
            const values = [
                data.dashboard_id,
                data.widget_type,
                data.grid_x,
                data.grid_y,
                data.size,
                JSON.stringify(data.widget_config || {})
            ];
            const result = await this.pool.query(query, values);
            return result.rows[0];
        }
        catch (error) {
            console.error('❌ Error adding widget to dashboard:', error);
            throw new Error('Failed to add widget to dashboard');
        }
    }
    /**
     * Update widget properties
     */
    async updateWidget(id, updates) {
        try {
            const setClause = [];
            const values = [];
            let paramIndex = 1;
            if (updates.grid_x !== undefined) {
                setClause.push(`grid_x = $${paramIndex++}`);
                values.push(updates.grid_x);
            }
            if (updates.grid_y !== undefined) {
                setClause.push(`grid_y = $${paramIndex++}`);
                values.push(updates.grid_y);
            }
            if (updates.size) {
                setClause.push(`size = $${paramIndex++}`);
                values.push(updates.size);
            }
            if (updates.widget_config) {
                setClause.push(`widget_config = $${paramIndex++}`);
                values.push(JSON.stringify(updates.widget_config));
            }
            values.push(id);
            const query = `
        UPDATE custom_dashboard_widgets 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, dashboard_id, widget_type, grid_x, grid_y, size, widget_config, created_at
      `;
            const result = await this.pool.query(query, values);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('❌ Error updating widget:', error);
            throw new Error('Failed to update widget');
        }
    }
    /**
     * Remove widget from dashboard
     */
    async removeWidget(id) {
        try {
            const query = 'DELETE FROM custom_dashboard_widgets WHERE id = $1';
            const result = await this.pool.query(query, [id]);
            return (result.rowCount || 0) > 0;
        }
        catch (error) {
            console.error('❌ Error removing widget:', error);
            throw new Error('Failed to remove widget');
        }
    }
    /**
     * Initialize custom dashboard tables
     */
    async initializeTables() {
        try {
            console.log('🔧 Initializing custom dashboard tables...');
            // Run the migration file
            const fs = require('fs');
            const path = require('path');
            const migrationPath = path.join(__dirname, 'migrations', '004_custom_dashboards.sql');
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            await this.pool.query(migrationSQL);
            console.log('✅ Custom dashboard tables initialized');
        }
        catch (error) {
            console.error('❌ Error initializing custom dashboard tables:', error);
            throw error;
        }
    }
}
exports.CustomDashboardDao = CustomDashboardDao;
//# sourceMappingURL=customDashboardDao.js.map