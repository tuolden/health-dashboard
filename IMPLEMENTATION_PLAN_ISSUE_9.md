# 🧩 Implementation Plan: Heart Rate Workout Sessions (Issue #9)

## 📋 Overview

This document outlines the comprehensive implementation plan for adding heart rate workout session analysis to the health dashboard. The feature will integrate with the existing `polar_metrics` table in the `health_ingest` database and provide 14 new widgets for workout analysis.

## 🎯 Project Scope

- **Database**: `health_ingest.polar_metrics` table integration
- **New API Endpoints**: REST `/api/workouts/*` + GraphQL extensions
- **Frontend**: 14 new workout analysis widgets
- **Data Processing**: Session detection, heart rate zones, training load calculations

## 📊 Current Architecture Analysis

### ✅ Existing Infrastructure
- Database connection to `health_ingest` (same as CPAP)
- Widget system with 4 CPAP widgets implemented
- REST + GraphQL API architecture
- React/TypeScript frontend with Recharts

### 🔄 Integration Points
- Reuse existing database connection pattern
- Follow established widget component structure
- Extend GraphQL schema (similar to CPAP extension)
- Add new routes following `/api/cpap/*` pattern

## 🚀 Implementation Phases

---

## 📦 Phase 1: Database Integration & Session Detection
**Estimated Time**: 2-3 days  
**Priority**: Critical Foundation

### 1.1 Database Access Layer
- [ ] Create `PolarDao` class (similar to `CpapDao`)
- [ ] Implement connection to `polar_metrics` table
- [ ] Add database health checks and statistics
- [ ] Create TypeScript interfaces for polar data

### 1.2 Session Detection Algorithm
- [ ] Implement workout session detection logic
- [ ] Group contiguous heart rate data by sport type
- [ ] Filter sessions with `heart_rate IS NOT NULL`
- [ ] Calculate session start/end times and duration

### 1.3 Core API Endpoints
- [ ] REST: `GET /api/workouts/summary` - Basic session metrics
- [ ] GraphQL: `getWorkoutSessions` query
- [ ] Add polar routes to main server configuration
- [ ] Implement error handling and validation

### 1.4 Heart Rate Zone Calculations
- [ ] Implement Z1-Z5 heart rate zone logic
- [ ] Calculate time spent in each zone
- [ ] Add zone distribution calculations

### 📋 Phase 1 Deliverables
- Working database connection to `polar_metrics`
- Basic session detection and grouping
- REST endpoint returning session summaries
- GraphQL query for workout sessions
- Heart rate zone calculation foundation

---

## 🎨 Phase 2: Core Workout Widgets (1-6)
**Estimated Time**: 3-4 days  
**Priority**: Essential User Features

### 2.1 Widget Infrastructure
- [ ] Add workout widgets to widget registry
- [ ] Create base workout widget components
- [ ] Implement data fetching hooks
- [ ] Add workout category to widget types

### 2.2 Essential Widgets Implementation

#### Widget 1: Workout Summary
- [ ] Session metadata display (sport, duration, dates)
- [ ] Session badge/indicator component
- [ ] Time formatting and display logic

#### Widget 2: Average Heart Rate (BPM)
- [ ] Simple text display widget
- [ ] Heart rate averaging calculations
- [ ] Health indicator thresholds

#### Widget 3: Calories Burned
- [ ] Calorie calculation algorithm
- [ ] Text display with nutrition context
- [ ] Goal comparison functionality

#### Widget 4: Heart Rate Over Time
- [ ] Line chart implementation
- [ ] Real-time heart rate visualization
- [ ] Zoom and pan functionality

#### Widget 5: Time in Heart Rate Zones (Z1-Z5)
- [ ] Bar chart or stacked area chart
- [ ] Zone color coding and legends
- [ ] Percentage and time calculations

#### Widget 6: Fat Burn vs Cardio Ratio
- [ ] Pie chart implementation
- [ ] Ratio calculations based on zones
- [ ] Training optimization insights

### 📋 Phase 2 Deliverables
- 6 functional workout widgets
- Widget registration and routing
- Chart components with proper styling
- Data fetching and error handling

---

## 🔬 Phase 3: Advanced Analytics Widgets (7-14)
**Estimated Time**: 4-5 days  
**Priority**: Advanced Features

### 3.1 Recovery & Performance Analytics

#### Widget 7: Heart Rate Recovery
- [ ] Recovery calculation algorithm (1-minute drop)
- [ ] Recovery trend analysis
- [ ] Cardiovascular fitness indicators

#### Widget 8: Session Intensity Score
- [ ] Intensity scoring algorithm
- [ ] Gauge/dial chart component
- [ ] Difficulty rating system

#### Widget 9: Training Load (TRIMP Score)
- [ ] TRIMP calculation implementation
- [ ] Cumulative load tracking
- [ ] Line graph over time

### 3.2 Trend Analysis & Alerts

#### Widget 10: Weekly Zone Distribution
- [ ] Weekly aggregation logic
- [ ] Stacked bar chart by week
- [ ] Training balance analysis

#### Widget 11: Overtraining Alert
- [ ] Rolling 7-day TRIMP comparison
- [ ] Threshold alert system
- [ ] Recovery recommendations

#### Widget 12: BPM Variability
- [ ] Heart rate variability calculations
- [ ] Box plot or deviation visualization
- [ ] Fatigue detection indicators

### 3.3 Advanced Metrics

#### Widget 13: Rolling Load vs Recovery Ratio
- [ ] Load/recovery ratio calculations
- [ ] Dual bar trend visualization
- [ ] Injury risk indicators

#### Widget 14: Warmup Efficiency
- [ ] Warmup detection algorithm
- [ ] Timeline visualization
- [ ] Fitness improvement tracking

### 📋 Phase 3 Deliverables
- 8 advanced analytics widgets
- Complex calculation algorithms
- Alert and notification systems
- Comprehensive workout analysis dashboard

---

## 🛠️ Technical Implementation Details

### Database Schema Integration
```sql
-- polar_metrics table structure (existing)
Table "public.polar_metrics"
- id (integer, primary key)
- recorded_time_utc (timestamp without time zone)
- heart_rate (integer)
- latitude, longitude, altitude, speed (double precision)
- sport (character varying(50))
- raw_json (text)
```

### API Endpoint Structure
```
REST Endpoints:
- GET /api/workouts/summary
- GET /api/workouts/sessions
- GET /api/workouts/zones
- GET /api/workouts/recovery

GraphQL Extensions:
- getWorkoutSessions(start: String!, end: String!)
- getWeeklyZoneBreakdown(weekStart: String!)
- getTrainingLoadTrend(days: Int!)
```

### Widget Categories
- **Category**: `workout` (new category)
- **Dataset**: `polar_metrics`
- **Refresh Strategy**: `hybrid` (WebSocket + interval)

## 📈 Success Metrics

### Phase 1 Success Criteria
- [ ] Database connection established
- [ ] Session detection working for sample data
- [ ] Basic API endpoints returning valid data
- [ ] Heart rate zones calculated correctly

### Phase 2 Success Criteria
- [ ] All 6 core widgets displaying data
- [ ] Charts rendering properly on mobile/desktop
- [ ] Real-time data updates working
- [ ] Error states handled gracefully

### Phase 3 Success Criteria
- [ ] Advanced analytics providing insights
- [ ] Alert systems functioning
- [ ] Performance optimized for large datasets
- [ ] Complete workout analysis dashboard

## 🔄 Future Enhancements
- Integration with other fitness devices
- Machine learning for workout recommendations
- Social features and workout sharing
- Advanced performance predictions

---

**Document Version**: 1.0  
**Last Updated**: 2025-06-24  
**Related Issue**: [GitHub Issue #9](https://github.com/tuolden/health-dashboard/issues/9)
