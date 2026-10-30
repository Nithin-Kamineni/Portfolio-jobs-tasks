// The website's PC queue (migrations/0017_run_requests.sql): buttons that need the PC (Claude runs, git Sync, Fetch
// description, Find R&D emails from papers) insert a request here; the dashboard on the owner's PC claims it within ~20 s,
// runs it through the same code as its own buttons and writes the outcome back (dashboard/server/runRequests.ts).
import {TASK_IDS,TASKS,type TaskId} from '../../../../dashboard/server/runs/tasks';
import {HttpError,nowIso} from './repo';

export const REQUEST_KINDS=['run','sync','fetch-description','paper-emails','cancel-run'] as const;
export type RequestKind=(typeof REQUEST_KINDS)[number];
export type RequestStatus='queued'|'claimed'|'started'|'done'|'failed'|'cancelled';
export const ACTIVE_REQUEST:RequestStatus[]=['queued','claimed','started'];

export interface RunRequest{
  id:number;kind:RequestKind;task:string|null;params:Record<string,unknown>;requested_at:string;requested_by:string|null;
  status:RequestStatus;claimed_at:string|null;claimed_by:string|null;local_run_id:number|null;message:string|null;result:Record<string,unknown>|null;updated_at:string;
}
/** One row per PC (home, work): its last check-in. */
export interface PcHeartbeat{machine:string;name:string;at:string;version:string|null;busy:boolean;current_run:number|null;current_task?:string|null;current_request:number|null}
/** The PC counts as online when it checked in within this time (it checks every ~20 s). */
export const PC_ONLINE_MS=2*60_000;

const parse=(s:unknown)=>{try{const v=JSON.parse(String(s??''));return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch{return null;}};
const toRequest=(r:any):RunRequest=>({...r,id:Number(r.id),params:parse(r.params_json)||{},result:parse(r.result_json),local_run_id:r.local_run_id==null?null:Number(r.local_run_id),params_json:undefined,result_json:undefined});

const isPlain=(v:unknown)=>v===null||['string','number','boolean'].includes(typeof v)||(Array.isArray(v)&&v.length<=200&&v.every(x=>['string','number'].includes(typeof x)));

/** Checks a website request before it is queued. The PC validates again with the full rules (RunManager.start). */
export function validateRequest(kind:unknown,task:unknown,params:unknown):{kind:RequestKind;task:string|null;params:Record<string,unknown>}{
  if(!REQUEST_KINDS.includes(kind as RequestKind))throw new HttpError(400,'Unknown request kind');
  const p=params==null?{}:params;
  if(typeof p!=='object'||Array.isArray(p))throw new HttpError(400,'params must be an object');
  if(JSON.stringify(p).length>4000)throw new HttpError(400,'params are too large');
  const out:Record<string,unknown>={};
  for(const [k,v] of Object.entries(p as Record<string,unknown>)){if(v===undefined)continue;if(!isPlain(v))throw new HttpError(400,`Invalid value for ${k}`);out[k]=v;}
  const need=(key:string)=>{const v=out[key];if(typeof v!=='string'&&typeof v!=='number'||!String(v).trim()||String(v).length>300)throw new HttpError(400,`${key} is required`);return String(v).trim();};
  if(kind==='run'){
    if(!(TASK_IDS as readonly unknown[]).includes(task))throw new HttpError(400,`Unknown task "${String(task)}"`);
    const def=TASKS[task as TaskId];
    if(def.internal)throw new HttpError(400,`${def.label} runs only as a step of another task`);
    for(const k of Object.keys(out))if(!(k in def.params))throw new HttpError(400,`${def.label} has no parameter "${k}"`);
    return {kind,task:String(task),params:out};
  }
  if(kind==='fetch-description')return {kind,task:null,params:{jobId:need('jobId')}};
  if(kind==='paper-emails')return {kind,task:null,params:{company:need('company')}};
  if(kind==='cancel-run'){const runId=Number(out.runId);if(!Number.isInteger(runId)||runId<1)throw new HttpError(400,'runId is required');return {kind,task:null,params:{runId}};}
  return {kind:'sync',task:null,params:{}};
}

/** Queues a request (or returns the same one that is still waiting/running). */
export async function enqueue(db:D1Database,kind:unknown,task:unknown,params:unknown,by:string):Promise<{queued:true;deduped:boolean;request:RunRequest}>{
  const v=validateRequest(kind,task,params);
  const paramsJson=JSON.stringify(v.params);
  const same=await db.prepare(`SELECT * FROM run_requests WHERE kind=? AND task IS ? AND params_json=? AND status IN ('queued','claimed','started') ORDER BY id DESC LIMIT 1`).bind(v.kind,v.task,paramsJson).first();
  if(same)return {queued:true,deduped:true,request:toRequest(same)};
  const at=nowIso();
  const row=await db.prepare(`INSERT INTO run_requests(kind,task,params_json,requested_at,requested_by,status,updated_at) VALUES (?,?,?,?,?,'queued',?) RETURNING *`).bind(v.kind,v.task,paramsJson,at,by.slice(0,200),at).first();
  return {queued:true,deduped:false,request:toRequest(row)};
}

export async function listRequests(db:D1Database,limit=30):Promise<RunRequest[]>{
  return ((await db.prepare('SELECT * FROM run_requests ORDER BY id DESC LIMIT ?').bind(Math.min(200,Math.max(1,limit))).all()).results).map(toRequest);
}
export async function getRequest(db:D1Database,id:number):Promise<RunRequest>{
  const r=await db.prepare('SELECT * FROM run_requests WHERE id=?').bind(id).first();
  if(!r)throw new HttpError(404,'Request not found');
  return toRequest(r);
}
export async function heartbeats(db:D1Database):Promise<PcHeartbeat[]>{
  const rows=(await db.prepare('SELECT * FROM pc_heartbeat ORDER BY name').all()).results as any[];
  return rows.map(r=>({machine:r.machine,name:r.name||r.machine,at:r.at,version:r.version,busy:Boolean(r.busy),current_run:r.current_run??null,current_task:r.current_task??null,current_request:r.current_request??null}));
}
/** True when at least one PC checked in within the last ~2 min. */
export const pcOnline=(hbs:PcHeartbeat[],now=Date.now())=>hbs.some(hb=>now-new Date(hb.at).getTime()<PC_ONLINE_MS);

/**
 * Cancel: a queued request is cancelled here at once; one the PC already started (a Claude run) gets a cancel-run
 * request, which the PC carries out on its next check.
 */
export async function cancelRequest(db:D1Database,id:number,by:string):Promise<RunRequest>{
  const at=nowIso();
  const res=await db.prepare(`UPDATE run_requests SET status='cancelled',message='Cancelled on the website',updated_at=? WHERE id=? AND status='queued'`).bind(at,id).run();
  const r=await getRequest(db,id);
  if(res.meta.changes)return r;
  if(r.status==='cancelled')return r;
  if(['done','failed'].includes(r.status))throw new HttpError(409,`It already ${r.status==='done'?'finished':'failed'}`);
  if(r.kind!=='run'||r.local_run_id==null)throw new HttpError(409,'Your PC is already doing this; it stops by itself');
  await enqueue(db,'cancel-run',null,{runId:r.local_run_id},by);
  return r;
}
