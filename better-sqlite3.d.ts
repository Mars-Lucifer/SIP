declare module 'better-sqlite3' {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement<TRow = any> {
    run(params?: unknown): RunResult;
    get(params?: unknown): TRow;
    all(params?: unknown): TRow[];
  }

  export interface Database {
    pragma(command: string): unknown;
    exec(sql: string): this;
    prepare<TRow = any>(sql: string): Statement<TRow>;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    close(): void;
  }

  export interface Options {
    fileMustExist?: boolean;
    readonly?: boolean;
    timeout?: number;
    verbose?: (...args: any[]) => void;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database;
  }

  const Database: DatabaseConstructor;

  export default Database;
}
