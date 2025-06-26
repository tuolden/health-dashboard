-- Custom Dashboard Builder - Database Schema
-- Issue #15: Custom Dashboard Builder - Grid-Based Widget Layout System

-- Create custom_dashboards table
CREATE TABLE IF NOT EXISTS custom_dashboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) DEFAULT 'default_user', -- for future multi-user support
    time_range VARCHAR(50) DEFAULT 'last_month',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create custom_dashboard_widgets table
CREATE TABLE IF NOT EXISTS custom_dashboard_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER REFERENCES custom_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(255) NOT NULL,
    grid_x INTEGER NOT NULL, -- column position (0-3)
    grid_y INTEGER NOT NULL, -- row position (0+)
    size VARCHAR(10) NOT NULL DEFAULT 'medium', -- 'small', 'medium', 'large'
    widget_config JSONB DEFAULT '{}', -- widget-specific configuration
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_user_id ON custom_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboard_widgets_dashboard_id ON custom_dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboard_widgets_position ON custom_dashboard_widgets(grid_x, grid_y);

-- Insert sample custom dashboards for testing
INSERT INTO custom_dashboards (name, time_range) VALUES 
    ('My Bloodwork Dashboard', 'last_month'),
    ('CPAP Monitoring', 'this_week'),
    ('Weight & Fitness', 'last_2_weeks')
ON CONFLICT DO NOTHING;

-- Insert sample widgets for the first dashboard
INSERT INTO custom_dashboard_widgets (dashboard_id, widget_type, grid_x, grid_y, size) VALUES 
    (1, 'health-score-summary', 0, 0, 'large'),
    (1, 'cbc-summary', 0, 1, 'medium'),
    (1, 'lipid-panel', 2, 1, 'medium'),
    (1, 'glucose-monitoring', 0, 2, 'small'),
    (1, 'hemoglobin-levels', 1, 2, 'small'),
    (1, 'thyroid-panel', 2, 2, 'medium')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE custom_dashboards IS 'User-created custom dashboard pages with personalized widget layouts';
COMMENT ON TABLE custom_dashboard_widgets IS 'Widget instances placed on custom dashboards with grid positioning';
COMMENT ON COLUMN custom_dashboard_widgets.grid_x IS 'Column position in 4-column grid (0-3)';
COMMENT ON COLUMN custom_dashboard_widgets.grid_y IS 'Row position, unlimited rows (0+)';
COMMENT ON COLUMN custom_dashboard_widgets.size IS 'Widget size: small(1x1), medium(2x1), large(4x1)';
