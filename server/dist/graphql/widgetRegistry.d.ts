/**
 * Widget Registry System - Issue #5 + #7
 *
 * Central registry that maps datasets to widgets and manages dependencies
 * for webhook routing and real-time updates. Extended with CPAP widgets.
 */
export interface WidgetRegistryEntry {
    widgetType: string;
    datasetName: string;
    isActive: boolean;
    lastUpdated?: Date;
}
export declare const WIDGET_REGISTRY: WidgetRegistryEntry[];
export declare class WidgetRegistry {
    private registry;
    private widgetToDataset;
    constructor();
    /**
     * Initialize the registry with default mappings
     */
    private initializeRegistry;
    /**
     * Get all widgets affected by a dataset update
     */
    getWidgetsByDataset(datasetName: string): WidgetRegistryEntry[];
    /**
     * Get the dataset name for a specific widget
     */
    getDatasetByWidget(widgetType: string): string | undefined;
    /**
     * Get all active widgets
     */
    getActiveWidgets(): WidgetRegistryEntry[];
    /**
     * Get all datasets
     */
    getAllDatasets(): string[];
    /**
     * Check if a dataset exists in the registry
     */
    hasDataset(datasetName: string): boolean;
    /**
     * Check if a widget exists in the registry
     */
    hasWidget(widgetType: string): boolean;
    /**
     * Update last updated timestamp for widgets affected by dataset
     */
    updateDatasetTimestamp(datasetName: string): void;
    /**
     * Get registry statistics
     */
    getStats(): {
        totalWidgets: number;
        totalDatasets: number;
        activeWidgets: number;
        datasetMappings: Record<string, string[]>;
    };
    /**
     * Get the complete registry for GraphQL queries
     */
    getFullRegistry(): WidgetRegistryEntry[];
}
export declare const widgetRegistry: WidgetRegistry;
export declare const getAffectedWidgets: (datasetName: string) => string[];
export declare const isValidDataset: (datasetName: string) => boolean;
export declare const isValidWidget: (widgetType: string) => boolean;
//# sourceMappingURL=widgetRegistry.d.ts.map