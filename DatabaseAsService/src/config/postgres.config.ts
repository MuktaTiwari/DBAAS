import { Pool, PoolConfig } from 'pg';

export class PostgresConfig {
  private static pools: Record<string, Pool> = {};

  public static getPool(config: PoolConfig): Pool {
    const key = JSON.stringify(config);
    if (!this.pools[key]) {
      this.pools[key] = new Pool(config);
    }
    return this.pools[key];
  }

  public static async closeAll(): Promise<void> {
    await Promise.all(
      Object.values(this.pools).map(pool => pool.end())
    );
    this.pools = {};
  }
}