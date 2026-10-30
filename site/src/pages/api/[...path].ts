import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import {DB} from '../../lib/cloud/db';
import * as r from '../../lib/cloud/repo';
import {bulkStatus,setStatus,undoEvent} from '../../lib/cloud/status';
import {saveTask} from '../../lib/cloud/tasks';
import {MAX_IMAGE_BYTES,readDocImage,saveDocImage,workspaceApi} from '../../lib/cloud/workspace';
import {companyKey} from '../../../../dashboard/shared/statuses';
import * as pc from '../../lib/cloud/runRequests';
import {MODULES} from '../../owner.config';
export const prerender=false;
const defaults={autoCommit:false,manualCheckEveryHours:24};
const parse=(s:unknown,fallback:unknown={})=>{try{return JSON.parse(String(s));}catch{return fallback;}};
const pcOnlyMessage='This works only in the dashboard on your PC (http://localhost:5178).';
export const ALL:APIRoute=async({request,url,params,locals})=>{
  try {
    const db=new DB(env.DB),method=request.method,path=(params.path||'').replace(/\/$/,'');
    let m0:RegExpMatchArray|null;
    // Parts switched off in owner.config.ts have no API: /api/ws/… is the task manager, the rest is the job tracker.
    if(path.startsWith('ws/')?!MODULES.tasks:!MODULES.jobs)throw new r.HttpError(404,'Not found');
    const q=Object.fromEntries(url.searchParams);
    // Images in documents: raw bytes in and out, before the JSON body handling below.
    if((m0=path.match(/^ws\/doc-images\/(\d+)$/))&&method==='GET'){
      const img=await readDocImage(env.DB,Number(m0[1]));
      return new Response(img.data,{headers:{'Content-Type':img.mime,'Cache-Control':'private, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
    }
    if(path==='ws/doc-images'&&method==='POST'){
      const len=Number(request.headers.get('content-length')||0);
      if(len>MAX_IMAGE_BYTES) throw new r.HttpError(413,'Image too large (max 1.8 MB after shrinking)');
      return Response.json(await saveDocImage(env.DB,(request.headers.get('content-type')||'').split(';')[0].trim(),await request.arrayBuffer(),q.doc),{status:201});
    }
    let b:Record<string,any>={};
    if(!['GET','HEAD'].includes(method)){
      const text=await request.text();
      if(text.length>1_000_000) throw new r.HttpError(413,'Request too large');
      try {b=JSON.parse(text||'{}');}catch{throw new r.HttpError(400,'Invalid JSON');}
      if(!b || Array.isArray(b)||typeof b!=='object') throw new r.HttpError(400,'Expected a JSON object');
    }
    const json=(v:unknown,status=200)=>Response.json(v,{status});
    const match=(re:RegExp)=>path.match(re);
    let m:RegExpMatchArray|null;
    const by=locals.user?.kind==='user'?locals.user.email:'service';
    // Work only the PC can do goes into the PC queue: 202 + the request; the page shows its progress inline.
    const queue=async(kind:string,task:unknown=null,p:unknown={})=>json(await pc.enqueue(env.DB,kind,task,p,by),202);
    if(path==='run-requests'&&method==='GET'){
      const [requests,hbs]=await Promise.all([pc.listRequests(env.DB,Number(q.limit)||30),pc.heartbeats(env.DB)]);
      return json({requests,heartbeats:hbs,online:pc.pcOnline(hbs)});
    }
    if((m=match(/^run-requests\/(\d+)$/))&&method==='GET')return json(await pc.getRequest(env.DB,Number(m[1])));
    if((m=match(/^run-requests\/(\d+)\/cancel$/))&&method==='POST')return json(await pc.cancelRequest(env.DB,Number(m[1]),by));
    if(path==='runs'&&method==='POST')return queue('run',b.task,b.params??{});
    if((m=match(/^runs\/(\d+)\/cancel$/))&&method==='POST')return queue('cancel-run',null,{runId:Number(m[1])});
    if(path==='sync'&&method==='POST')return queue('sync');
    if((m=match(/^jobs\/([^/]+)\/fetch-description$/))&&method==='POST'){
      const id=decodeURIComponent(m[1]);
      await r.getJob(db,id);
      return queue('fetch-description',null,{jobId:id});
    }
    if(path==='research/paper-emails'&&method==='POST')return queue('paper-emails',null,{company:String(b.company||'')});
    if(path==='jobs'&&method==='GET') return json(await r.listJobs(db,{...q,limit:q.limit?Math.min(2000,Math.max(1,Number(q.limit)||100)):undefined,order:q.order==='asc'?'asc':'desc'}));
    if(path==='jobs/bulk-status'&&method==='POST'){
      if(!Array.isArray(b.ids)||!b.ids.length||b.ids.length>200) throw new r.HttpError(400,'Choose 1–200 jobs');
      return json(await bulkStatus(db,b.ids.map(String),String(b.status)));
    }
    if((m=match(/^jobs\/([^/]+)$/))){
      const id=decodeURIComponent(m[1]);
      if(method==='GET'){
        const job=await r.getJob(db,id),contacts=await r.listContacts(db,{company:job.company});
        const ids=new Set(contacts.map(c=>c.id));
        const outreach=(await r.listOutreach(db)).filter(o=>o.job_id===id||(o.contact_id!=null&&ids.has(o.contact_id)));
        return json({job,contacts,outreach});
      }
      if(method==='PATCH'){
        for(const key of ['notes','application_dir','resume_version','applied_date']) if(key in b && b[key]!==null && (typeof b[key]!=='string'||b[key].length>20000)) throw new r.HttpError(400,`Invalid ${key}`);
        return json(await r.updateJob(db,id,b));
      }
    }
    if((m=match(/^jobs\/([^/]+)\/(status|request-referral|rank|description)$/))&&method==='POST'){
      const id=decodeURIComponent(m[1]);
      if(m[2]==='status')return json(await setStatus(db,id,String(b.status),{note:b.note,by:locals.user?.kind==='user'?locals.user.email:'service'}));
      if(m[2]==='request-referral')return json(await r.requestReferral(db,id,b.on!==false));
      if(locals.user?.kind!=='service')throw new r.HttpError(403,'Runner service token required');
      if(m[2]==='rank')return json(await r.rankJob(db,id,Number(b.fit),String(b.reason||''),b));
      return json(await r.setDescription(db,id,String(b.description||'')));
    }
    if((m=match(/^events\/(\d+)\/undo$/))&&method==='POST')return json(await undoEvent(db,Number(m[1])));
    if(path==='contacts'){
      if(method==='GET')return json(await r.listContacts(db,q));
      if(method==='POST')return json(await r.addContact(db,b),201);
    }
    if((m=match(/^contacts\/(\d+)$/))){
      const id=Number(m[1]);
      if(method==='GET')return json({contact:await r.getContact(db,id),outreach:await r.listOutreach(db,{contactId:id})});
      if(method==='PATCH')return json(await r.updateContact(db,id,b));
    }
    if((m=match(/^contacts\/(\d+)\/linkedin$/))&&method==='POST')return json(await r.decideLinkedin(db,Number(m[1]),b.decision));
    if(path==='outreach'){
      if(method==='GET')return json(await r.listOutreach(db,{...q,due:q.due==='true'||q.due==='1',jobId:q.job}));
      if(method==='POST')return json(await r.addOutreach(db,b),201);
    }
    if((m=match(/^outreach\/(\d+)(?:\/(sent|reply))?$/))){
      const id=Number(m[1]);
      if(method==='GET')return json(await r.getOutreach(db,id));
      if(method==='PATCH'&&!m[2])return json(await r.updateOutreach(db,id,b));
      if(method==='POST'&&m[2]==='sent')return json(await r.markSent(db,id));
      if(method==='POST'&&m[2]==='reply')return json(await r.recordReply(db,id,String(b.outcome),b.notes));
    }
    if(path==='stats'&&method==='GET')return json(await r.stats(db));
    if(path==='companies'&&method==='GET')return json(await r.listCompanies(db));
    // "Check these yourself" (Home): an "I checked" click is an event (synced to the PCs); Undo reverts it.
    if(path==='companies/self-check'&&method==='POST')return json(await r.recordSelfCheck(db,String(b.company||'')));
    if((m=match(/^companies\/self-check\/(\d+)\/undo$/))&&method==='POST')return json(await r.undoSelfCheck(db,Number(m[1])));
    // One note per company (Referral and Interview phases); an empty note clears it.
    if(path==='company-notes'&&method==='GET')return json(await r.listCompanyNotes(db));
    if(path==='company-notes'&&method==='POST')return json(await r.setCompanyNote(db,String(b.company||''),b.note));
    // "Find R&D emails from papers": the cached result is readable here; searching needs the PC (PDFs, OpenAlex budget).
    if(path==='research/paper-emails'&&method==='GET'){
      if(q.company)return json(await r.getPaperEmailSearch(db,q.company));
      return json(await Promise.all(((await db.prepare('SELECT company FROM paper_email_searches ORDER BY company').all()) as {company:string}[]).map(x=>r.getPaperEmailSearch(db,x.company))));
    }
    if(path==='settings'){
      if(method==='GET')return json(await r.getSettings(db,defaults));
      if(method==='PATCH')return json(await r.updateSettings(db,defaults,b));
    }
    if(path==='marks'&&method==='POST')return json(await r.mark(db,String(b.kind),b.note));
    if(path==='meta'&&method==='GET')return json({bootId:'cloud-v1',health:{lastRunAt:null,matches:null,errors:[],digest:null,source:'none'},lastSync:null,config:{outlookComposeUrl:'https://outlook.office.com/mail/deeplink/compose',outlookMaxUrlLength:1800,resumePath:'Resume/master/Resume_master.pdf',repoRoot:'C:\\profitional\\Applications'},cloud:true,runnerConnected:pc.pcOnline(await pc.heartbeats(env.DB))});
    if(path==='claude-facts'&&method==='GET'){
      const [jobs,contacts,outreach,companies,weekly,manual]=await Promise.all([r.listJobs(db),r.listContacts(db),r.listOutreach(db),r.listCompanies(db),r.lastEvent(db,'weekly_review'),r.lastEvent(db,'manual_companies_checked')]);
      const keys=new Set(contacts.map(c=>companyKey(c.company))),referred=new Set(outreach.filter(o=>o.type==='referral').map(o=>o.job_id));
      return json({newCount:jobs.filter(j=>j.status==='new').length,toPrepare:jobs.filter(j=>j.status==='apply_referral'),referralRequested:jobs.filter(j=>j.referral_requested_at&&!referred.has(j.id)),referralNoContact:[...new Set(jobs.filter(j=>(j.status==='apply_referral'||j.referral_requested_at)&&!keys.has(companyKey(j.company))).map(j=>j.company))],followUpsDue:outreach.filter(o=>o.follow_up_is_due).length,researcherCount:contacts.filter(c=>c.relationship==='researcher').length,watcherErrors:[],lastWeeklyReview:weekly?.at??null,lastManualCheck:manual?.at??null,manualCompanies:companies.filter(c=>c.manual&&c.enabled!=='no').map(c=>c.name),manualDue:[],finalMinFit:30,today:r.today()});
    }
    if(path==='research/candidates'&&method==='GET'){
      const rows=(await db.prepare('SELECT * FROM research_candidates ORDER BY score DESC,id').all()).map((x:any)=>({...x,papers:parse(x.papers_json,[]),topics:parse(x.topics_json,[])}));
      return json({candidates:rows.filter(x=>!q.status||q.status.split(',').includes(x.status)),counts:Object.fromEntries(['new','picked','skipped','contacted'].map(s=>[s,rows.filter(x=>x.status===s).length]))});
    }
    if(path==='research/candidates/status'&&method==='POST'){
      if(!['new','picked','skipped'].includes(b.status)||!Array.isArray(b.ids)||!b.ids.length||b.ids.length>100)throw new r.HttpError(400,'Invalid candidate selection');
      await db.raw.batch(b.ids.map((id:number)=>db.raw.prepare("UPDATE research_candidates SET status=?,updated_at=? WHERE id=? AND status!='contacted'").bind(b.status,r.nowIso(),id)));
      return json({candidates:[]});
    }
    if(path==='runs/preflight'&&method==='GET')return json({ok:true,command:'PC runner',resolved:null,version:null,loggedIn:null,message:null,lastChromeRunAt:null,checkedAt:r.nowIso()});
    const run=(x:any)=>({...x,params:parse(x.params_json),progress:parse(x.progress_json,{steps:[],counters:{},malformed:0}),label:x.task,activity:x.task});
    if(path==='runs'&&method==='GET')return json({runs:(await db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT ?').all(Math.min(100,Number(q.limit)||50))).map(run),paused:null});
    if((m=match(/^runs\/(\d+)$/))&&method==='GET'){
      const row=await db.prepare('SELECT * FROM runs WHERE id=?').get(Number(m[1]));if(!row)throw new r.HttpError(404,'Run not found');
      return json({...run(row),children:(await db.prepare('SELECT * FROM runs WHERE parent_id=? ORDER BY id').all(Number(m[1]))).map(run)});
    }
    if(path.startsWith('ws/'))return json(await workspaceApi(db.raw,method,path.slice(3),b,q),method==='POST'?201:200);
    if(path==='tasks'&&method==='GET')return json((await db.raw.prepare("SELECT * FROM tasks ORDER BY CASE status WHEN 'done' THEN 1 ELSE 0 END,due_date IS NULL,due_date,CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,id DESC LIMIT 2000").all()).results);
    if(path==='tasks'&&method==='POST')return json(await saveTask(db.raw,b,locals.user?.kind==='user'?locals.user.email:'service'),201);
    if((m=match(/^tasks\/(\d+)$/))&&method==='PATCH')return json(await saveTask(db.raw,b,locals.user?.kind==='user'?locals.user.email:'service',Number(m[1])));

    if(path==='sync'||path==='research/search'||path.startsWith('runs/')||path==='runs'||path.endsWith('/fetch-description'))throw new r.HttpError(503,pcOnlyMessage);
    throw new r.HttpError(404,'No such API route');
  } catch(e){
    if(e instanceof r.HttpError)return Response.json({error:e.message},{status:e.status});
    console.error('Private API error',e instanceof Error?e.message:'unknown');
    return Response.json({error:'The request could not be completed. Please retry.'},{status:500});
  }
};
