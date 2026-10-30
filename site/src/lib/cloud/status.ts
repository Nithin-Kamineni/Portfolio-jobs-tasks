import type {DB} from './db';
import {HttpError, getJob, nowIso, today} from './repo';
import {canTransition, DECISIONS, INBOX_STATUSES, isJobStatus, normalizeStatus, REMOVED_STATUSES} from '../../../../dashboard/shared/statuses';
import type {Job} from '../../../../dashboard/shared/types';

export async function setStatus(db:DB,id:string,status:string,opts:{note?:string;by?:string}={}) {
  const to=normalizeStatus(status); // apply_direct = applied (2026-10-17)
  if(REMOVED_STATUSES[to]) throw new HttpError(400,REMOVED_STATUSES[to]);
  if(!isJobStatus(to)) throw new HttpError(400,'Unknown job status');
  const job=await getJob(db,id,false);
  if(job.status===to && !opts.note) return {job,eventId:0};
  if(job.status!==to && !canTransition(job.status,to)) throw new HttpError(409,`Cannot change ${job.status} to ${to}`);
  const at=nowIso();
  const prev={status:job.status,decision_at:job.decision_at,applied_date:job.applied_date,outcome_date:job.outcome_date,notes:job.notes};
  const next={...prev,status:to};
  if(opts.note) next.notes=[job.notes,`[${today()}] ${opts.note}`].filter(Boolean).join('\n');
  if((DECISIONS as readonly string[]).includes(to)&&(INBOX_STATUSES.includes(job.status)||job.status==='apply_referral')) next.decision_at=at;
  if(to==='applied'&&!job.applied_date) next.applied_date=today();
  if(to==='interview') next.outcome_date=today();
  // Optimistic compare + event insertion are one atomic D1 batch. A stale editor never overwrites a newer change.
  const result=await db.raw.batch([
    db.raw.prepare('UPDATE jobs SET status=?,decision_at=?,applied_date=?,outcome_date=?,notes=?,updated_at=? WHERE id=? AND updated_at IS ? AND status=?').bind(next.status,next.decision_at,next.applied_date,next.outcome_date,next.notes,at,id,job.updated_at,job.status),
    db.raw.prepare("INSERT INTO events(at,entity,entity_id,kind,detail_json) SELECT ?,'job',?,'status',? WHERE changes()=1").bind(at,id,JSON.stringify({from:job.status,to,by:opts.by||'dashboard',prev})),
  ]);
  if(!result[0].meta.changes) throw new HttpError(409,'Job changed in another session. Refresh and retry.');
  return {job:await getJob(db,id,false),eventId:result[1].meta.last_row_id};
}

/** Several jobs at once (the Jobs page's multi-select). Each job succeeds or fails on its own, as on SQLite. */
export async function bulkStatus(db:DB,ids:string[],to:string){
  const updated:Job[]=[],eventIds:number[]=[],errors:{id:string;error:string}[]=[];
  for(const id of ids){
    try{const r=await setStatus(db,id,to);updated.push(r.job);if(r.eventId)eventIds.push(r.eventId);}
    catch(e){errors.push({id,error:(e as Error).message});}
  }
  return {updated,eventIds,errors};
}

export async function undoEvent(db:DB,eventId:number):Promise<Job> {
  const ev=await db.raw.prepare('SELECT * FROM events WHERE id=?').bind(eventId).first<Record<string,unknown>>();
  if(!ev) throw new HttpError(404,'No event');
  if(ev.undone_at || ev.entity!=='job' || ev.kind!=='status') throw new HttpError(409,'This event cannot be undone');
  const job=await getJob(db,String(ev.entity_id),false);
  const d=JSON.parse(String(ev.detail_json));
  const p=d.prev, at=nowIso();
  const result=await db.raw.batch([
    db.raw.prepare("UPDATE jobs SET status=?,decision_at=?,applied_date=?,outcome_date=?,notes=?,updated_at=? WHERE id=? AND updated_at IS ? AND status=? AND NOT EXISTS(SELECT 1 FROM events WHERE entity='job' AND entity_id=? AND kind='status' AND id>? AND undone_at IS NULL) AND EXISTS(SELECT 1 FROM events WHERE id=? AND undone_at IS NULL)").bind(p.status,p.decision_at,p.applied_date,p.outcome_date,p.notes,at,job.id,job.updated_at,d.to,job.id,eventId,eventId),
    db.raw.prepare('UPDATE events SET undone_at=? WHERE id=? AND changes()=1').bind(at,eventId),
  ]);
  if(!result[0].meta.changes) throw new HttpError(409,'Job changed again; undo the latest change first.');
  return getJob(db,job.id,false);
}
