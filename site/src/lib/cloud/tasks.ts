import {HttpError} from './repo';
export interface Task {id:number;title:string;notes:string;project:string;tags:string;priority:'low'|'normal'|'high';due_date:string|null;status:'todo'|'doing'|'done';created_by:string;created_at:string;updated_at:string;completed_at:string|null;version:number}
export function taskInput(input:Record<string,unknown>) {
  const text=(key:string,max:number,required=false)=>{
    const v=input[key] ?? '';
    if(typeof v!=='string'||v.length>max || (required&&!v.trim())) throw new HttpError(400,`Invalid ${key}`);
    return v.trim();
  };
  const title=text('title',300,true),notes=text('notes',10000),project=text('project',100),tags=text('tags',300);
  const priority=input.priority??'normal',status=input.status??'todo',due=input.due_date||null;
  if(!['low','normal','high'].includes(String(priority))) throw new HttpError(400,'Invalid priority');
  if(!['todo','doing','done'].includes(String(status))) throw new HttpError(400,'Invalid status');
  if(due && (typeof due!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(due)||!Number.isFinite(Date.parse(due))||new Date(due).toISOString().slice(0,10)!==due)) throw new HttpError(400,'Invalid due date');
  return {title,notes,project,tags,priority:String(priority),status:String(status),due_date:due};
}
export async function saveTask(db:D1Database,input:Record<string,unknown>,email:string,id?:number){
  const t=taskInput(input),at=new Date().toISOString();
  if(id){
    if(!Number.isInteger(input.version)||Number(input.version)<1) throw new HttpError(400,'Task version is required');
    const row=await db.prepare("UPDATE tasks SET title=?,notes=?,project=?,tags=?,priority=?,due_date=?,status=?,updated_at=?,completed_at=CASE WHEN ?='done' THEN COALESCE(completed_at,?) ELSE NULL END,version=version+1 WHERE id=? AND version=? RETURNING *").bind(t.title,t.notes,t.project,t.tags,t.priority,t.due_date,t.status,at,t.status,at,id,input.version).first<Task>();
    if(!row) throw new HttpError(409,'This task changed in another session. Refresh before saving.');
    return row;
  }
  return db.prepare('INSERT INTO tasks(title,notes,project,tags,priority,due_date,status,created_by,created_at,updated_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING *').bind(t.title,t.notes,t.project,t.tags,t.priority,t.due_date,t.status,email,at,at,t.status==='done'?at:null).first<Task>();
}
