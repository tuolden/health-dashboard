"use strict";
/**
 * Polar Data Access Object - Issue #9
 *
 * Database operations for polar_metrics table and workout session analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolarDao = void 0;
const cpapDatabase_1 = require("./cpapDatabase"); // Reuse same database connection
const polar_1 = require("../types/polar");
class PolarDao {
    pool;
    constructor(dbPool = cpapDatabase_1.cpapPool) {
        this.pool = dbPool;
    }
    /**
     * Get workout sessions summary for REST API /api/workouts/summary
     */
    async getWorkoutSummary(filters = {}) {
        try {
            // First, detect sessions from raw data
            const sessions = await this.detectWorkoutSessions(filters);
            // Convert to summary format
            return sessions.map(session => ({
                sport: session.sport,
                session_start: session.session_start,
                session_end: session.session_end,
                duration_min: session.duration_min,
                avg_heart_rate: session.avg_heart_rate,
                calories_burned: session.calories_burned,
                zones: session.zones,
                recovery_drop_bpm: session.recovery_drop_bpm,
                intensity_score: session.intensity_score,
                trimp_score: session.trimp_score,
                fat_burn_ratio: session.fat_burn_ratio,
                cardio_ratio: session.cardio_ratio,
                bpm_std_dev: session.bpm_std_dev,
                warmup_duration_sec: session.warmup_duration_sec
            }));
        }
        catch (error) {
            throw new polar_1.PolarDataError(`Failed to fetch workout summary: ${error}`, 'FETCH_ERROR');
        }
    }
    /**
     * Detect workout sessions from polar_metrics data
     * Groups contiguous heart rate data by sport and time gaps
     */
    async detectWorkoutSessions(filters = {}) {
        try {
            let query = `
        SELECT 
          recorded_time_utc,
          heart_rate,
          sport,
          latitude,
          longitude,
          altitude,
          speed
        FROM polar_metrics
        WHERE heart_rate IS NOT NULL 
          AND heart_rate >= $1 
          AND heart_rate <= $2
      `;
            const params = [
                polar_1.HEART_RATE_THRESHOLDS.SESSION_DETECTION.MIN_HEART_RATE,
                polar_1.HEART_RATE_THRESHOLDS.SESSION_DETECTION.MAX_HEART_RATE
            ];
            let paramCount = 2;
            // Apply filters
            if (filters.startDate) {
                query += ` AND DATE(recorded_time_utc) >= $${++paramCount}`;
                params.push(filters.startDate);
            }
            if (filters.endDate) {
                query += ` AND DATE(recorded_time_utc) <= $${++paramCount}`;
                params.push(filters.endDate);
            }
            if (filters.sport) {
                query += ` AND sport = $${++paramCount}`;
                params.push(filters.sport);
            }
            query += ` ORDER BY recorded_time_utc ASC`;
            // Apply pagination
            if (filters.limit) {
                query += ` LIMIT $${++paramCount}`;
                params.push(filters.limit);
            }
            const result = await this.pool.query(query, params);
            // Process raw data into sessions
            return this.processRawDataIntoSessions(result.rows);
        }
        catch (error) {
            throw new polar_1.PolarDataError(`Failed to detect workout sessions: ${error}`, 'FETCH_ERROR');
        }
    }
    /**
     * Process raw polar data into workout sessions
     */
    processRawDataIntoSessions(rawData) {
        const sessions = [];
        let currentSession = null;
        let sessionData = [];
        const maxGapMs = polar_1.HEART_RATE_THRESHOLDS.SESSION_DETECTION.MAX_GAP_MINUTES * 60 * 1000;
        const minDurationMs = polar_1.HEART_RATE_THRESHOLDS.SESSION_DETECTION.MIN_DURATION_MINUTES * 60 * 1000;
        for (const row of rawData) {
            const currentTime = new Date(row.recorded_time_utc).getTime();
            if (!currentSession) {
                // Start new session
                currentSession = {
                    sport: row.sport || 'Unknown',
                    session_start: row.recorded_time_utc,
                    last_time: currentTime
                };
                sessionData = [row];
            }
            else {
                const timeSinceLastReading = currentTime - currentSession.last_time;
                const sportChanged = row.sport !== currentSession.sport;
                if (timeSinceLastReading > maxGapMs || sportChanged) {
                    // End current session and process it
                    const sessionDuration = currentSession.last_time - new Date(currentSession.session_start).getTime();
                    if (sessionDuration >= minDurationMs && sessionData.length > 0) {
                        const processedSession = this.calculateSessionMetrics(currentSession, sessionData);
                        sessions.push(processedSession);
                    }
                    // Start new session
                    currentSession = {
                        sport: row.sport || 'Unknown',
                        session_start: row.recorded_time_utc,
                        last_time: currentTime
                    };
                    sessionData = [row];
                }
                else {
                    // Continue current session
                    currentSession.last_time = currentTime;
                    sessionData.push(row);
                }
            }
        }
        // Process final session
        if (currentSession && sessionData.length > 0) {
            const sessionDuration = currentSession.last_time - new Date(currentSession.session_start).getTime();
            if (sessionDuration >= minDurationMs) {
                const processedSession = this.calculateSessionMetrics(currentSession, sessionData);
                sessions.push(processedSession);
            }
        }
        return sessions;
    }
    /**
     * Calculate comprehensive metrics for a workout session
     */
    calculateSessionMetrics(sessionInfo, sessionData) {
        const heartRates = sessionData.map(d => d.heart_rate).filter(hr => hr > 0);
        const zones = (0, polar_1.calculateHeartRateZones)(polar_1.DEFAULT_MAX_HEART_RATE);
        // Basic calculations
        const avgHeartRate = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null;
        const sessionStart = new Date(sessionInfo.session_start);
        const sessionEnd = new Date(sessionInfo.last_time);
        const durationMs = sessionEnd.getTime() - sessionStart.getTime();
        const durationMin = Math.round(durationMs / (1000 * 60));
        // Zone distribution
        const zoneBreakdown = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
        const secondsPerReading = sessionData.length > 1 ? durationMs / (1000 * sessionData.length) : 1;
        for (const reading of sessionData) {
            if (reading.heart_rate) {
                const zone = (0, polar_1.getHeartRateZone)(reading.heart_rate, zones);
                if (zone) {
                    zoneBreakdown[zone] += secondsPerReading / 60; // Convert to minutes
                }
            }
        }
        // Round zone minutes
        Object.keys(zoneBreakdown).forEach(zone => {
            zoneBreakdown[zone] = Math.round(zoneBreakdown[zone]);
        });
        // Calorie calculation
        const caloriesBurned = Object.entries(zoneBreakdown).reduce((total, [zone, minutes]) => {
            return total + (0, polar_1.calculateCaloriesForZone)(zone, minutes);
        }, 0);
        // Fat burn vs cardio ratio (Z1-Z2 vs Z3-Z5)
        const fatBurnMinutes = zoneBreakdown.Z1 + zoneBreakdown.Z2;
        const cardioMinutes = zoneBreakdown.Z3 + zoneBreakdown.Z4 + zoneBreakdown.Z5;
        const totalActiveMinutes = fatBurnMinutes + cardioMinutes;
        const fatBurnRatio = totalActiveMinutes > 0 ? fatBurnMinutes / totalActiveMinutes : 0;
        const cardioRatio = totalActiveMinutes > 0 ? cardioMinutes / totalActiveMinutes : 0;
        // Heart rate variability (standard deviation)
        const bpmStdDev = heartRates.length > 1 ? this.calculateStandardDeviation(heartRates) : null;
        // Basic TRIMP score (simplified)
        const trimpScore = avgHeartRate && durationMin ? Math.round(durationMin * (avgHeartRate / polar_1.DEFAULT_MAX_HEART_RATE) * 100) : null;
        // Intensity score (0-100 based on average zone)
        const intensityScore = avgHeartRate ? Math.round((avgHeartRate / polar_1.DEFAULT_MAX_HEART_RATE) * 100) : null;
        return {
            sport: sessionInfo.sport,
            session_start: sessionStart.toISOString(),
            session_end: sessionEnd.toISOString(),
            duration_min: durationMin,
            avg_heart_rate: avgHeartRate,
            calories_burned: caloriesBurned,
            zones: zoneBreakdown,
            recovery_drop_bpm: null, // TODO: Implement recovery calculation
            intensity_score: intensityScore,
            trimp_score: trimpScore,
            fat_burn_ratio: Math.round(fatBurnRatio * 100) / 100,
            cardio_ratio: Math.round(cardioRatio * 100) / 100,
            bpm_std_dev: bpmStdDev ? Math.round(bpmStdDev * 10) / 10 : null,
            warmup_duration_sec: null // TODO: Implement warmup detection
        };
    }
    /**
     * Calculate standard deviation for heart rate variability
     */
    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
        return Math.sqrt(avgSquaredDiff);
    }
    /**
     * Get raw polar metrics with optional filters
     */
    async getRawMetrics(filters = {}) {
        try {
            let query = `
        SELECT 
          id, recorded_time_utc, heart_rate, latitude, longitude,
          altitude, speed, sport, raw_json
        FROM polar_metrics
        WHERE 1=1
      `;
            const params = [];
            let paramCount = 0;
            // Apply filters
            if (filters.startDate) {
                query += ` AND DATE(recorded_time_utc) >= $${++paramCount}`;
                params.push(filters.startDate);
            }
            if (filters.endDate) {
                query += ` AND DATE(recorded_time_utc) <= $${++paramCount}`;
                params.push(filters.endDate);
            }
            if (filters.sport) {
                query += ` AND sport = $${++paramCount}`;
                params.push(filters.sport);
            }
            query += ` ORDER BY recorded_time_utc ASC`;
            // Apply pagination
            if (filters.limit) {
                query += ` LIMIT $${++paramCount}`;
                params.push(filters.limit);
            }
            if (filters.offset) {
                query += ` OFFSET $${++paramCount}`;
                params.push(filters.offset);
            }
            const result = await this.pool.query(query, params);
            return result.rows.map(row => ({
                id: row.id,
                recorded_time_utc: row.recorded_time_utc,
                heart_rate: row.heart_rate,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                speed: row.speed,
                sport: row.sport,
                raw_json: row.raw_json
            }));
        }
        catch (error) {
            throw new polar_1.PolarDataError(`Failed to fetch raw polar metrics: ${error}`, 'FETCH_ERROR');
        }
    }
}
exports.PolarDao = PolarDao;
//# sourceMappingURL=polarDao.js.map