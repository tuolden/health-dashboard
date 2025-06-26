/**
 * Custom Dashboard DAO - Issue #15
 *
 * Database access layer for custom dashboard builder functionality
 */
export interface CustomDashboard {
    id: number;
    name: string;
    user_id: string;
    time_range: string;
    created_at: Date;
    updated_at: Date;
    widgets?: CustomDashboardWidget[];
}
export interface CustomDashboardWidget {
    id: number;
    dashboard_id: number;
    widget_type: string;
    grid_x: number;
    grid_y: number;
    size: 'small' | 'medium' | 'large';
    widget_config: Record<string, any>;
    created_at: Date;
}
export interface CreateDashboardRequest {
    name: string;
    user_id?: string;
    time_range?: string;
}
export interface CreateWidgetRequest {
    dashboard_id: number;
    widget_type: string;
    grid_x: number;
    grid_y: number;
    size: 'small' | 'medium' | 'large';
    widget_config?: Record<string, any>;
}
export interface UpdateWidgetRequest {
    grid_x?: number;
    grid_y?: number;
    size?: 'small' | 'medium' | 'large';
    widget_config?: Record<string, any>;
}
export declare class CustomDashboardDao {
    private pool;
    constructor();
    /**
     * Get all custom dashboards for a user
     */
    getDashboards(userId?: string): Promise<CustomDashboard[]>;
    /**
     * Get a specific dashboard with its widgets
     */
    getDashboardById(id: number): Promise<CustomDashboard | null>;
    /**
     * Create a new custom dashboard
     */
    createDashboard(data: CreateDashboardRequest): Promise<CustomDashboard>;
    /**
     * Update dashboard properties
     */
    updateDashboard(id: number, updates: Partial<CreateDashboardRequest>): Promise<CustomDashboard | null>;
    /**
     * Add widget to dashboard
     */
    addWidget(data: CreateWidgetRequest): Promise<CustomDashboardWidget>;
    /**
     * Update widget properties
     */
    updateWidget(id: number, updates: UpdateWidgetRequest): Promise<CustomDashboardWidget | null>;
    /**
     * Remove widget from dashboard
     */
    removeWidget(id: number): Promise<boolean>;
    /**
     * Initialize custom dashboard tables
     */
    initializeTables(): Promise<void>;
}
//# sourceMappingURL=customDashboardDao.d.ts.map