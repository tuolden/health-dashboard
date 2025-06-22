/**
 * Widget Registry System - Issue #5
 * 
 * Central registry that maps datasets to widgets and manages dependencies
 * for webhook routing and real-time updates
 */

import { WidgetRegistryEntry } from '../types/widgets'

// Widget Registry Configuration
export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
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
]

// Registry Management Class
export class WidgetRegistry {
  private registry: Map<string, WidgetRegistryEntry[]> = new Map()
  private widgetToDataset: Map<string, string> = new Map()

  constructor() {
    this.initializeRegistry()
  }

  /**
   * Initialize the registry with default mappings
   */
  private initializeRegistry(): void {
    // Group widgets by dataset
    WIDGET_REGISTRY.forEach(entry => {
      const { datasetName, widgetType } = entry
      
      // Map dataset to widgets
      if (!this.registry.has(datasetName)) {
        this.registry.set(datasetName, [])
      }
      this.registry.get(datasetName)!.push(entry)
      
      // Map widget to dataset
      this.widgetToDataset.set(widgetType, datasetName)
    })

    console.log('📋 Widget Registry initialized:')
    this.registry.forEach((widgets, dataset) => {
      const widgetNames = widgets.map(w => w.widgetType).join(', ')
      console.log(`   ${dataset} → [${widgetNames}]`)
    })
  }

  /**
   * Get all widgets affected by a dataset update
   */
  getWidgetsByDataset(datasetName: string): WidgetRegistryEntry[] {
    return this.registry.get(datasetName) || []
  }

  /**
   * Get the dataset name for a specific widget
   */
  getDatasetByWidget(widgetType: string): string | undefined {
    return this.widgetToDataset.get(widgetType)
  }

  /**
   * Get all active widgets
   */
  getActiveWidgets(): WidgetRegistryEntry[] {
    return WIDGET_REGISTRY.filter(entry => entry.isActive)
  }

  /**
   * Get all datasets
   */
  getAllDatasets(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Check if a dataset exists in the registry
   */
  hasDataset(datasetName: string): boolean {
    return this.registry.has(datasetName)
  }

  /**
   * Check if a widget exists in the registry
   */
  hasWidget(widgetType: string): boolean {
    return this.widgetToDataset.has(widgetType)
  }

  /**
   * Update last updated timestamp for widgets affected by dataset
   */
  updateDatasetTimestamp(datasetName: string): void {
    const widgets = this.getWidgetsByDataset(datasetName)
    const now = new Date()
    
    widgets.forEach(widget => {
      widget.lastUpdated = now
    })
    
    console.log(`⏰ Updated timestamp for dataset '${datasetName}' affecting ${widgets.length} widgets`)
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalWidgets: number
    totalDatasets: number
    activeWidgets: number
    datasetMappings: Record<string, string[]>
  } {
    const datasetMappings: Record<string, string[]> = {}
    
    this.registry.forEach((widgets, dataset) => {
      datasetMappings[dataset] = widgets.map(w => w.widgetType)
    })

    return {
      totalWidgets: WIDGET_REGISTRY.length,
      totalDatasets: this.registry.size,
      activeWidgets: this.getActiveWidgets().length,
      datasetMappings
    }
  }

  /**
   * Get the complete registry for GraphQL queries
   */
  getFullRegistry(): WidgetRegistryEntry[] {
    return [...WIDGET_REGISTRY]
  }
}

// Export singleton instance
export const widgetRegistry = new WidgetRegistry()

// Helper functions for webhook processing
export const getAffectedWidgets = (datasetName: string): string[] => {
  return widgetRegistry.getWidgetsByDataset(datasetName).map(w => w.widgetType)
}

export const isValidDataset = (datasetName: string): boolean => {
  return widgetRegistry.hasDataset(datasetName)
}

export const isValidWidget = (widgetType: string): boolean => {
  return widgetRegistry.hasWidget(widgetType)
}
