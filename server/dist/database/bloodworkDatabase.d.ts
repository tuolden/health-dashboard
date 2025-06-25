/**
 * Bloodwork Database Connection - Issue #13
 *
 * PostgreSQL connection pool for bloodwork_ingest database
 */
import { Pool } from 'pg';
export declare const bloodworkPool: Pool;
export declare function testBloodworkConnection(): Promise<boolean>;
export declare function initializeBloodworkTables(): Promise<void>;
export declare function closeBloodworkConnection(): Promise<void>;
export default bloodworkPool;
//# sourceMappingURL=bloodworkDatabase.d.ts.map