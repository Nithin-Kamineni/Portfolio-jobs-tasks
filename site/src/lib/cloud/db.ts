export class DB {
  constructor(public raw: D1Database) {}
  prepare(sql: string) {
    const bind = (args: unknown[]) => this.raw.prepare(sql).bind(...args);
    return {
      all: async (...args: unknown[]) => (await bind(args).all()).results,
      get: async (...args: unknown[]) => (await bind(args).first()) ?? undefined,
      run: async (...args: unknown[]) => {
        const result = await bind(args).run();
        return {changes: result.meta.changes, lastInsertRowid: result.meta.last_row_id};
      },
    };
  }
}
export const localDate = (date: Date) => new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York', year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const addDays = (day: string, count: number) => {
  const d = new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+count); return d.toISOString().slice(0,10);
};
