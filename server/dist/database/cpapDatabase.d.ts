/**
 * CPAP Database Configuration - Issue #7
 *
 * PostgreSQL connection setup for health_ingest database with CPAP metrics
 */
import { Pool } from 'pg';
export declare const cpapPool: Pool;
export declare const testCpapConnection: () => Promise<boolean>;
export declare const getCpapDbStats: () => Promise<any>;
export declare const closeCpapPool: () => Promise<void>;
export default cpapPool;
//# sourceMappingURL=cpapDatabase.d.ts.map