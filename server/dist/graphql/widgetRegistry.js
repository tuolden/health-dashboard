"use strict";
/**
 * Widget Registry System - Issue #5 + #7
 *
 * Central registry that maps datasets to widgets and manages dependencies
 * for webhook routing and real-time updates. Extended with CPAP widgets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidWidget = exports.isValidDataset = exports.getAffectedWidgets = exports.widgetRegistry = exports.WidgetRegistry = exports.WIDGET_REGISTRY = void 0;
// Widget Registry Configuration
exports.WIDGET_REGISTRY = [
    // Steps Widget
    {
        widgetType: 'steps',
        datasetName: 'step_data',
        isActive: true
    },
    // Water Intake Widget
    {
        widgetType: 'waterIntake',
        datasetName: 'water_data',
        isActive: true
    },
    // Weight Widget
    {
        widgetType: 'weight',
        datasetName: 'weight_data',
        isActive: true
    },
    // Heart Rate Widget
    {
        widgetType: 'heartRate',
        datasetName: 'heart_rate_data',
        isActive: true
    },
    // Nutrition Widget
    {
        widgetType: 'nutrition',
        datasetName: 'nutrition_data',
        isActive: true
    },
    // Sleep Widget
    {
        widgetType: 'sleep',
        datasetName: 'sleep_data',
        isActive: true
    },
    // Activity Widget
    {
        widgetType: 'activity',
        datasetName: 'activity_data',
        isActive: true
    },
    // CPAP Widgets - Issue #7
    {
        widgetType: 'cpap-spo2-trend',
        datasetName: 'cpap_metrics',
        isActive: true
    },
    {
        widgetType: 'cpap-spo2-pulse',
        datasetName: 'cpap_metrics',
        isActive: true
    },
    {
        widgetType: 'cpap-leak-rate',
        datasetName: 'cpap_metrics',
        isActive: true
    },
    {
        widgetType: 'cpap-sleep-sessions',
        datasetName: 'cpap_metrics',
        isActive: true
    },
    // Workout Widgets - Issue #9
    {
        widgetType: 'workout-summary',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-heart-rate',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-calories',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-heart-rate-over-time',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-zones',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-fat-burn-ratio',
        datasetName: 'polar_metrics',
        isActive: true
    },
    // Advanced Analytics Widgets - Issue #9 Phase 3
    {
        widgetType: 'workout-recovery',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-intensity',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-training-load',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-weekly-zones',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-overtraining',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-variability',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-load-recovery',
        datasetName: 'polar_metrics',
        isActive: true
    },
    {
        widgetType: 'workout-warmup',
        datasetName: 'polar_metrics',
        isActive: true
    },
    // Additional widgets that might share datasets
    {
        widgetType: 'progressTracker',
        datasetName: 'weight_data', // Shares weight data
        isActive: true
    },
    {
        widgetType: 'caloriesBurned',
        datasetName: 'activity_data', // Shares activity data
        isActive: true
    }
];
// Registry Management Class
class WidgetRegistry {
    registry = new Map();
    widgetToDataset = new Map();
    constructor() {
        this.initializeRegistry();
    }
    /**
     * Initialize the registry with default mappings
     */
    initializeRegistry() {
        // Group widgets by dataset
        exports.WIDGET_REGISTRY.forEach(entry => {
            const { datasetName, widgetType } = entry;
            // Map dataset to widgets
            if (!this.registry.has(datasetName)) {
                this.registry.set(datasetName, []);
            }
            this.registry.get(datasetName).push(entry);
            // Map widget to dataset
            this.widgetToDataset.set(widgetType, datasetName);
        });
        console.log('📋 Widget Registry initialized:');
        this.registry.forEach((widgets, dataset) => {
            const widgetNames = widgets.map(w => w.widgetType).join(', ');
            console.log(`   ${dataset} → [${widgetNames}]`);
        });
    }
    /**
     * Get all widgets affected by a dataset update
     */
    getWidgetsByDataset(datasetName) {
        return this.registry.get(datasetName) || [];
    }
    /**
     * Get the dataset name for a specific widget
     */
    getDatasetByWidget(widgetType) {
        return this.widgetToDataset.get(widgetType);
    }
    /**
     * Get all active widgets
     */
    getActiveWidgets() {
        return exports.WIDGET_REGISTRY.filter(entry => entry.isActive);
    }
    /**
     * Get all datasets
     */
    getAllDatasets() {
        return Array.from(this.registry.keys());
    }
    /**
     * Check if a dataset exists in the registry
     */
    hasDataset(datasetName) {
        return this.registry.has(datasetName);
    }
    /**
     * Check if a widget exists in the registry
     */
    hasWidget(widgetType) {
        return this.widgetToDataset.has(widgetType);
    }
    /**
     * Update last updated timestamp for widgets affected by dataset
     */
    updateDatasetTimestamp(datasetName) {
        const widgets = this.getWidgetsByDataset(datasetName);
        const now = new Date();
        widgets.forEach(widget => {
            widget.lastUpdated = now;
        });
        console.log(`⏰ Updated timestamp for dataset '${datasetName}' affecting ${widgets.length} widgets`);
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const datasetMappings = {};
        this.registry.forEach((widgets, dataset) => {
            datasetMappings[dataset] = widgets.map(w => w.widgetType);
        });
        return {
            totalWidgets: exports.WIDGET_REGISTRY.length,
            totalDatasets: this.registry.size,
            activeWidgets: this.getActiveWidgets().length,
            datasetMappings
        };
    }
    /**
     * Get the complete registry for GraphQL queries
     */
    getFullRegistry() {
        return [...exports.WIDGET_REGISTRY];
    }
}
exports.WidgetRegistry = WidgetRegistry;
// Export singleton instance
exports.widgetRegistry = new WidgetRegistry();
// Helper functions for webhook processing
const getAffectedWidgets = (datasetName) => {
    return exports.widgetRegistry.getWidgetsByDataset(datasetName).map(w => w.widgetType);
};
exports.getAffectedWidgets = getAffectedWidgets;
const isValidDataset = (datasetName) => {
    return exports.widgetRegistry.hasDataset(datasetName);
};
exports.isValidDataset = isValidDataset;
const isValidWidget = (widgetType) => {
    return exports.widgetRegistry.hasWidget(widgetType);
};
exports.isValidWidget = isValidWidget;
//# sourceMappingURL=widgetRegistry.js.map