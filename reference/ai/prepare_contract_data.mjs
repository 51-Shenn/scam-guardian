/** Reproducible local production-contract preprocessing, synthetic augmentation and separate H-MOG reference preparation. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIBRARY = path.resolve(ROOT, '../../research-lib');
export const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const json = x => JSON.stringify(x, null, 2) + '\n';
const lines = xs => xs.map(x => JSON.stringify(x)).join('\n') + '\n';
export function rng(key) {
  let state = parseInt(hash(String(key)).slice(0, 8), 16) >>> 0;
  return () => { state = (state + 0x6D2B79F5) >>> 0; let x = Math.imul(state ^ state >>> 15, 1 | state); x ^= x + Math.imul(x ^ x >>> 7, 61 | x); return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}
export function stats(values, floor = 1) {
  const a = values.filter(x => x !== null && Number.isFinite(x)).sort((a,b) => a-b);
  const q = p => { const i = (a.length-1)*p, lo = Math.floor(i); return a[lo] + (a[Math.ceil(i)]-a[lo])*(i-lo); };
  return a.length ? {count: a.length, median: q(.5), iqr: q(.75)-q(.25), scale: Math.max(floor, q(.75)-q(.25))} : {count:0, median:null, iqr:null, scale:null};
}
const MEAN = a => a.length ? a.reduce((s,x) => s+x,0)/a.length : null;
const STD = a => a.length >= 2 ? Math.sqrt(a.reduce((s,x) => s+(x-MEAN(a))**2,0)/(a.length-1)) : null;
const FIELDS = ['recipient','amount','reference'];
const STEPS = ['recipient','amount','review'];
const TYPES = ['session_start','transaction','edit','focus','blur','navigate','help','app_state','window_focus','confirm'];
export function validateSession(s) {
  assert.ok(Object.keys(s.metadata).every(k=>['schemaVersion','featureDefinitionVersion','collectorVersion','localUserKey','sessionId','platform','appBuild','clock','simulated'].includes(k)), 'unknown metadata field');
  assert.equal(s.metadata.schemaVersion, 'tg-production-events-v1');
  assert.equal(s.metadata.clock, 'session-relative-monotonic-ms');
  assert.equal(s.metadata.simulated, true);
  assert.ok(s.events.length >= 2);
  let last = -1, confirmed = false;
  for (const [i,e] of s.events.entries()) {
    assert.equal(e.seq, i); assert.ok(Number.isSafeInteger(e.tMs) && e.tMs >= last); last=e.tMs;
    assert.ok(TYPES.includes(e.type)); assert.ok(!confirmed, 'event after confirmation');
    const keys = ['seq','tMs','type', ...({session_start:['stepId'],transaction:['amountMinorUnits','currency','isNewRecipient','availableBalanceMinorUnits','recentTransferCount','recipientHistoryCount','historyWindowMs','contextAsOfMs'],edit:['fieldId','lengthDelta','inputSource'],focus:['fieldId','origin'],blur:['fieldId'],navigate:['stepId','direction'],help:[],app_state:['state'],window_focus:['focused'],confirm:[]}[e.type])];
    assert.ok(Object.keys(e).every(k => keys.includes(k)), 'unknown/content-bearing event field');
    if (e.fieldId !== undefined) assert.ok(FIELDS.includes(e.fieldId));
    if (e.stepId !== undefined) assert.ok(STEPS.includes(e.stepId));
    if (e.type==='session_start') assert.equal(i,0);
    if (e.type==='edit') {assert.ok(Number.isSafeInteger(e.lengthDelta)); assert.ok(['typing','explicit_paste','composition','autofill','unknown'].includes(e.inputSource));}
    if (e.type==='focus') assert.ok(['user','restoration','unknown'].includes(e.origin));
    if (e.type==='navigate') assert.ok(['forward','back','cancel'].includes(e.direction));
    if (e.type==='app_state') assert.ok(['active','background'].includes(e.state));
    if (e.type==='window_focus') assert.equal(typeof e.focused,'boolean');
    if (e.type==='transaction') {
      for(const k of ['amountMinorUnits','availableBalanceMinorUnits','recentTransferCount','recipientHistoryCount']) assert.ok(e[k]===null || Number.isSafeInteger(e[k]) && e[k]>=0);
      assert.equal(e.currency,'MYR'); assert.ok(e.isNewRecipient===null || typeof e.isNewRecipient==='boolean');
      assert.ok(e.contextAsOfMs<=e.tMs && e.contextAsOfMs>=0); assert.ok(e.historyWindowMs>0);
    }
    if(e.type==='confirm') confirmed=true;
  }
  assert.equal(s.events[0].type,'session_start');
  assert.equal(s.events.at(-1).type,'confirm');
  assert.equal(s.researchAnnotations.confirmedAtMs,s.events.at(-1).tMs);
  const onset=s.researchAnnotations.coachingOnsetMs;
  assert.ok(onset===null || Number.isSafeInteger(onset) && onset>=0 && onset<s.researchAnnotations.confirmedAtMs);
  assert.equal(s.availability.automaticCall,'unavailable');
  assert.equal(s.availability.motion,'unavailable');
  return true;
}

export function generateSession(c, userIndex, ordinal, split) {
  const random=rng(`${c.seed}/journey/${userIndex}/${ordinal}`), profile=rng(`${c.seed}/profile/${userIndex}`);
  const enrolled=ordinal<c.enrollmentPool;
  const label=enrolled?'Normal':c.classes[Math.floor((ordinal-c.enrollmentPool)/c.evaluationSessionsPerClass)];
  const variant=['fast','slow','quiet'][(ordinal-c.enrollmentPool+c.evaluationSessionsPerClass)%c.evaluationSessionsPerClass];
  const speed=350+profile()*1000, tendency=profile(), baseAmount=Math.round(2000+profile()*40000);
  const coached=label.startsWith('Coached'), struggling=label==='Struggling';
  // Overlap is deliberate: calm coached cases and benign rapid/slow journeys prevent a universal direction assumption.
  let pace=struggling?1.35:(.8+random()*.6);
  const s={metadata:{schemaVersion:'tg-production-events-v1',featureDefinitionVersion:'tg-features-v1',collectorVersion:'scripted-generator-v1',localUserKey:`sim_u${String(userIndex).padStart(3,'0')}`,sessionId:`sim_u${String(userIndex).padStart(3,'0')}_s${String(ordinal).padStart(2,'0')}`,platform:'simulated',appBuild:'none',clock:'session-relative-monotonic-ms',simulated:true},availability:{editing:'available',inputSource:'available',automaticCall:'unavailable',motion:'unavailable'},events:[],researchAnnotations:{split,role:enrolled?'enrollment':'evaluation',sessionOrdinal:ordinal,scenario:label,labelSource:'scripted_simulation',variant:enrolled?'baseline':variant,coachingOnsetMs:null,confirmedAtMs:null,outcome:'confirmed',reportedCall:null}};
  let t=0; const add=(type,props={},delay=0)=>{t+=Math.round(delay);s.events.push({seq:s.events.length,tMs:t,type,...props});};
  const delay=()=>speed*pace*(.7+random()*.6);
  add('session_start',{stepId:'recipient'});
  add('transaction',{amountMinorUnits:null,currency:'MYR',isNewRecipient:random()<.45,availableBalanceMinorUnits:random()<.12?null:Math.round(100000+random()*400000),recentTransferCount:random()<.1?null:Math.floor(random()*6),recipientHistoryCount:random()<.1?null:Math.floor(random()*4),historyWindowMs:c.historyWindowMs,contextAsOfMs:0});
  add('focus',{fieldId:'recipient',origin:'user'},delay());
  for(let i=0;i<6;i++) add('edit',{fieldId:'recipient',lengthDelta:1,inputSource:'typing'},delay());
  if(coached) {s.researchAnnotations.coachingOnsetMs=t;pace=variant==='fast'?.65:variant==='slow'?1.5:1;}
  if(random()<.3) add('edit',{fieldId:'recipient',lengthDelta:4,inputSource:'explicit_paste'},delay());
  if(random()<tendency || struggling || coached && variant!=='quiet') {
    add('edit',{fieldId:'recipient',lengthDelta:-2,inputSource:'typing'},delay());
    add('edit',{fieldId:'recipient',lengthDelta:2,inputSource:'typing'},delay());
  }
  // A background episode exists in every class with the same probability; it is never a call detector.
  if(random()<.35) {add('app_state',{state:'background'},delay());add('window_focus',{focused:false});add('app_state',{state:'active'},2000+random()*5000);add('window_focus',{focused:true});add('focus',{fieldId:'recipient',origin:'restoration'});}
  add('blur',{fieldId:'recipient'},delay());add('navigate',{stepId:'amount',direction:'forward'},delay());
  add('focus',{fieldId:'amount',origin:'user'},delay());
  for(let i=0;i<4;i++) add('edit',{fieldId:'amount',lengthDelta:1,inputSource:'typing'},delay());
  if(struggling || random()<.25 || label==='Coached-high' && variant!=='quiet') {add('edit',{fieldId:'amount',lengthDelta:-1,inputSource:'typing'},delay());add('edit',{fieldId:'amount',lengthDelta:1,inputSource:'typing'},delay());}
  const previous=s.events.find(e=>e.type==='transaction');
  const amount=Math.round(baseAmount*(.6+random()*1.4)*(coached && random()<.3?2:1));
  add('transaction',{...Object.fromEntries(Object.entries(previous).filter(([k])=>!['seq','type','tMs'].includes(k))),amountMinorUnits:amount,contextAsOfMs:t},delay());
  add('blur',{fieldId:'amount'},delay());add('navigate',{stepId:'review',direction:'forward'},delay());
  const loops=struggling?2:(coached && variant!=='quiet'?(label==='Coached-high'?2:1):random()<tendency*.5?1:0);
  for(let i=0;i<loops;i++){add('navigate',{stepId:'amount',direction:'back'},delay()+random()*4000);add('focus',{fieldId:'amount',origin:'user'},delay());add('navigate',{stepId:'review',direction:'forward'},delay());}
  if(struggling || random()<.2) add('help',{},delay());
  add('confirm',{},delay()+3000+random()*5000+(coached && variant==='slow'?6000:0));
  s.researchAnnotations.confirmedAtMs=t;validateSession(s);return s;
}

export function augmentSession(parent,kind,c) {
  assert.equal(parent.researchAnnotations.split,'train');assert.equal(parent.researchAnnotations.role,'evaluation');
  const s=structuredClone(parent), random=rng(`${c.seed}/${parent.metadata.sessionId}/${kind}`);
  s.metadata.sessionId+=`__${kind}`;
  let factor=null;
  if(kind==='coherent_tempo') {
    factor=c.tempoFactorRange[0]+random()*(c.tempoFactorRange[1]-c.tempoFactorRange[0]);
    const scale=x=>x===null?null:Math.round(x*factor);
    for(const e of s.events){e.tMs=scale(e.tMs);if(e.contextAsOfMs!==undefined)e.contextAsOfMs=scale(e.contextAsOfMs);}
    s.researchAnnotations.confirmedAtMs=scale(s.researchAnnotations.confirmedAtMs);
    s.researchAnnotations.coachingOnsetMs=scale(s.researchAnnotations.coachingOnsetMs);
  } else if(kind==='edit_channel_unavailable') {
    s.events=s.events.filter(e=>e.type!=='edit').map((e,i)=>({...e,seq:i}));s.availability.editing='unavailable';s.availability.inputSource='unavailable';
  } else throw Error('unknown augmentation');
  s.lineage={parentSessionId:parent.metadata.sessionId,kind,factor,split:'train',synthetic:true};validateSession(s);return s;
}

export function featuresAt(s,cutoff,c) {
  assert.ok(Number.isSafeInteger(cutoff) && cutoff>=0 && cutoff<s.researchAnnotations.confirmedAtMs,'must precede confirmation');
  const events=s.events.filter(e=>e.tMs<=cutoff && e.type!=='confirm');
  let step='recipient', active=true, focused=true, last=0, lastInteraction=0;
  let foreground=0, hidden=0, idle=0, maxGap=0, pauseCount=0;
  const stepForeground=Object.fromEntries(STEPS.map(x=>[x,0])), visited={recipient:1,amount:0,review:0};
  const accumulate=now=>{
    const duration=now-last;
    if(active && focused){foreground+=duration;stepForeground[step]+=duration;const gap=now-lastInteraction;maxGap=Math.max(maxGap,gap);idle+=Math.max(0,now-Math.max(last,lastInteraction+c.foregroundPauseThresholdMs));if(last<lastInteraction+c.foregroundPauseThresholdMs && now>=lastInteraction+c.foregroundPauseThresholdMs)pauseCount++;}
    else hidden+=duration;
    last=now;
  };
  for(const e of events){
    accumulate(e.tMs);
    if(e.type==='app_state') {active=e.state==='active';lastInteraction=e.tMs;}
    else if(e.type==='window_focus') {focused=e.focused;lastInteraction=e.tMs;}
    else if(e.type==='navigate'){step=e.stepId;visited[step]++;lastInteraction=e.tMs;}
    else if(['edit','help','blur','transaction'].includes(e.type) || e.type==='focus' && e.origin==='user')lastInteraction=e.tMs;
  }
  accumulate(cutoff);
  const tx=events.filter(e=>e.type==='transaction').at(-1);
  const f={amount_minor_units:tx?.amountMinorUnits??null,available_balance_minor_units:tx?.availableBalanceMinorUnits??null,is_new_recipient:tx?.isNewRecipient==null?null:Number(tx.isNewRecipient),recent_transfer_count:tx?.recentTransferCount??null,recipient_history_count:tx?.recipientHistoryCount??null,balance_fraction:tx?.amountMinorUnits!=null && tx?.availableBalanceMinorUnits>0?tx.amountMinorUnits/tx.availableBalanceMinorUnits:null,elapsed_ms:cutoff,foreground_ms:foreground,background_or_blur_ms:hidden,foreground_idle_excess_ms:idle,max_foreground_gap_ms:maxGap,foreground_pause_count:pauseCount,back_count:events.filter(e=>e.type==='navigate' && e.direction==='back').length,step_revisit_count:Object.values(visited).reduce((a,x)=>a+Math.max(0,x-1),0),user_focus_count:events.filter(e=>e.type==='focus' && e.origin==='user').length,restoration_focus_count:events.filter(e=>e.type==='focus' && e.origin==='restoration').length,help_count:events.filter(e=>e.type==='help').length,automatic_call_active:null,motion_magnitude_std:null};
  for(const stepId of STEPS)f[`${stepId}_foreground_ms`]=stepForeground[stepId];
  const editAvailable=s.availability.editing==='available';
  const edits=events.filter(e=>e.type==='edit');
  for(const field of FIELDS){
    const a=edits.filter(e=>e.fieldId===field), intervals=a.slice(1).map((e,i)=>e.tMs-a[i].tMs);
    f[`${field}_edit_count`]=editAvailable?a.length:null;
    f[`${field}_negative_delta_count`]=editAvailable?a.filter(e=>e.lengthDelta<0).length:null;
    f[`${field}_net_length_delta`]=editAvailable?a.reduce((sum,e)=>sum+e.lengthDelta,0):null;
    f[`${field}_interval_sample_count`]=editAvailable?intervals.length:null;
    f[`${field}_edit_interval_mean_ms`]=editAvailable?MEAN(intervals):null;
    f[`${field}_edit_interval_std_ms`]=editAvailable?STD(intervals):null;
    f[`${field}_edit_elapsed_ms`]=editAvailable && a.length>=2?a.at(-1).tMs-a[0].tMs:null;
  }
  f.explicit_paste_count=s.availability.inputSource==='available'?edits.filter(e=>e.inputSource==='explicit_paste').length:null;
  assert.equal(f.foreground_ms+f.background_or_blur_ms,cutoff);
  assert.ok(f.foreground_idle_excess_ms<=foreground);
  return {schema_version:'tg-features-v1',session_id:s.metadata.sessionId,local_user_key:s.metadata.localUserKey,feature_cutoff_ms:cutoff,context_as_of_ms:tx?.contextAsOfMs??null,features:f,availability:{...s.availability,editIntervals:Object.fromEntries(FIELDS.map(field=>[field,!editAvailable?'unavailable':f[`${field}_interval_sample_count`]===0?'insufficient_samples':'available']))},origin:s.lineage?'augmented_simulation':'scripted_simulation'};
}
export function fitScaler(rows,c) {
  assert.ok(rows.length);const keys=Object.keys(rows[0].features);
  return Object.fromEntries(keys.map(k=>[k,stats(rows.map(r=>r.features[k]),c.sharedScaleFloor)]));
}
export function normalize(f,scaler) {
  return Object.fromEntries(Object.entries(f).map(([k,v])=>[k,v===null || !scaler[k]?.count?null:(v-scaler[k].median)/scaler[k].scale]));
}
export function baselineFor(sessions,count,c) {
  const selected=sessions.filter(s=>s.researchAnnotations.role==='enrollment').sort((a,b)=>a.researchAnnotations.sessionOrdinal-b.researchAnnotations.sessionOrdinal).slice(0,count);
  assert.equal(selected.length,count);
  const rows=selected.map(s=>featuresAt(s,s.researchAnnotations.confirmedAtMs-1,c));
  const keys=Object.keys(featuresAt(sessions[0],0,c).features);
  return {schema_version:'tg-baseline-v1',eligible_session_count:count,status:count?'available':'unavailable',source_session_ids:selected.map(s=>s.metadata.sessionId),statistics:Object.fromEntries(keys.map(k=>[k,stats(rows.map(r=>r.features[k]),c.sharedScaleFloor)])),usual_transfer_amount_minor_units:stats(rows.map(r=>r.features.amount_minor_units)).median};
}

const HMOG_FILES=['enrollment.jsonl.gz','train.jsonl.gz','validation.jsonl.gz','test.jsonl.gz','session_manifest.jsonl','reproducibility.json','report.json'];
function references() {
  const pages=read(path.join(ROOT,'data/processed/research-review-v1/read_pages.json'));
  return [...new Set(pages.map(p=>p.source_path))].map(p=>({label:`library/${p}`,path:path.join(LIBRARY,p)})).concat([{label:'project/OTP-BCAD.pdf',path:path.join(ROOT,'research/s11416-026-00667-4.pdf')}]);
}
function sourceFiles() {
  const c=read(path.join(ROOT,'config/data_pipeline_v1.json'));
  const local=['scripts/prepare_contract_data.mjs','scripts/test_contract_data.mjs','config/data_pipeline_v1.json','docs/DATA_PIPELINE_V1_PLAN.md','data/processed/research-review-v1/read_pages.json','data/processed/paper-review-v1/s11416-026-00667-4.txt',...HMOG_FILES.map(f=>`${c.hmogSource}/${f}`)];
  return local.map(p=>({label:p,path:path.join(ROOT,p)})).concat(references());
}
function processedPath(p) {
  const dest=path.resolve(ROOT,p),base=path.join(ROOT,'data/processed');
  assert.ok(dest.startsWith(base+path.sep),'output must be below data/processed');return dest;
}
function fresh(p) {assert.ok(!fs.existsSync(p),`refuse overwrite: ${p}`);fs.mkdirSync(p,{recursive:true});}
function verifyFreeze(f) {
  for(const s of f.inputs)assert.equal(hash(fs.readFileSync(s.path)),s.sha256,`frozen source changed: ${s.label}`);
}
export function freeze(output) {
  const out=processedPath(output);fresh(out);
  const inputs=sourceFiles().map(s=>({...s,sha256:hash(fs.readFileSync(s.path))}));
  const sources=inputs.filter(s=>s.label.startsWith('scripts/')||s.label.startsWith('config/')||s.label.startsWith('docs/')).map(s=>({label:s.label,sha256:s.sha256,text:fs.readFileSync(s.path,'utf8')}));
  const inventory=[];
  const walk=(dir,prefix)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const name=prefix?prefix+'/'+e.name:e.name;if(e.isDirectory())walk(path.join(dir,e.name),name);else inventory.push(name);}};
  walk(LIBRARY,'');
  const f={version:'tg-freeze-v1',runtime:{node:process.version,platform:process.platform,arch:process.arch,dependencies:'Node built-ins only'},config:read(path.join(ROOT,'config/data_pipeline_v1.json')),inputs,sourceSnapshots:sources,libraryInventory:inventory};
  fs.writeFileSync(path.join(out,'freeze.json'),json(f));
  console.log(JSON.stringify({freeze:path.join(out,'freeze.json'),inputs:inputs.length,libraryFiles:inventory.length,sha256:hash(json(f))}));return f;
}
export function build(freezePath,output) {
  const f=read(path.resolve(ROOT,freezePath));verifyFreeze(f);assert.equal(f.runtime.node,process.version);
  const out=processedPath(output);fresh(out);const c=f.config;
  const save=(name,data)=>fs.writeFileSync(path.join(out,name),typeof data==='string'?data:json(data));
  const users=Array.from({length:c.users},(_,i)=>i).sort((a,b)=>hash(`${c.seed}/split/${a}`).localeCompare(hash(`${c.seed}/split/${b}`)));
  const splitMap=Object.fromEntries(users.map((u,i)=>[u,i<c.splitCounts.train?'train':i<c.splitCounts.train+c.splitCounts.validation?'validation':'test']));
  const sessions=[], baselines=[],splitRows={enrollment:[],train:[],validation:[],test:[],train_augmented:[]},labels=[],lineage=[];
  const snapshot=s=>{const rows=[];for(let t=0;t<s.researchAnnotations.confirmedAtMs;t+=c.snapshotPeriodMs)rows.push(featuresAt(s,t,c));return rows;};
  for(let u=0;u<c.users;u++) {
    const originals=Array.from({length:c.enrollmentPool+c.classes.length*c.evaluationSessionsPerClass},(_,o)=>generateSession(c,u,o,splitMap[u]));sessions.push(...originals);
    for(const count of c.enrollmentConditions)baselines.push({local_user_key:originals[0].metadata.localUserKey,condition:count,...baselineFor(originals,count,c)});
    for(const s of originals){
      labels.push({session_id:s.metadata.sessionId,local_user_key:s.metadata.localUserKey,...s.researchAnnotations,origin:'scripted_simulation'});
      splitRows[s.researchAnnotations.role==='enrollment'?'enrollment':splitMap[u]].push(...snapshot(s));
      if(s.researchAnnotations.role==='evaluation' && splitMap[u]==='train')for(const kind of c.augmentation){const a=augmentSession(s,kind,c);sessions.push(a);lineage.push({session_id:a.metadata.sessionId,...a.lineage});labels.push({session_id:a.metadata.sessionId,local_user_key:a.metadata.localUserKey,...a.researchAnnotations,origin:'augmented_simulation'});splitRows.train_augmented.push(...snapshot(a));}
    }
  }
  const scaler=fitScaler(splitRows.train,c);
  for(const [split,rows] of Object.entries(splitRows))save(`payment_${split}.jsonl`,lines(rows.map(r=>({...r,normalized_features:normalize(r.features,scaler)}))));
  save('payment_events.jsonl',lines(sessions));save('payment_annotations.jsonl',lines(labels));save('payment_baselines.jsonl',lines(baselines));save('payment_augmentation_lineage.jsonl',lines(lineage));
  save('payment_scaler.json',{fit_scope:'original training evaluation snapshots only; enrollment/augmented/held-out excluded',fit_row_count:splitRows.train.length,source_session_ids:[...new Set(splitRows.train.map(r=>r.session_id))],statistics:scaler});
  save('payment_split_manifest.jsonl',lines(labels.filter(x=>x.origin==='scripted_simulation').map(x=>({local_user_key:x.local_user_key,session_id:x.session_id,split:x.split,role:x.role,session_ordinal:x.sessionOrdinal}))));
  // H-MOG is a separate observed behavioral reference, never payment rows or coached labels.
  const hRows=HMOG_FILES.filter(n=>n.endsWith('.gz')).flatMap(n=>zlib.gunzipSync(fs.readFileSync(path.join(ROOT,c.hmogSource,n))).toString('utf8').trim().split('\n').map(JSON.parse));
  const sessionManifest=fs.readFileSync(path.join(ROOT,c.hmogSource,'session_manifest.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const hReference=hRows.map(r=>({subject_id:r.subject_id,session_id:r.session_id,session_order:r.session_order,window_id:r.window_id,window_start_ms:r.window_start_ms,window_end_ms:r.window_end_ms,split:r.split,role:r.session_order<c.enrollmentPool?'enrollment':'evaluation',task:r.task,posture:r.posture,origin:'observed_hmog',risk_label:null,features:Object.fromEntries(c.hmogFeatures.map(k=>[k,r.features[k]??null]))})).sort((a,b)=>a.window_id.localeCompare(b.window_id));
  assert.equal(new Set(hReference.map(r=>r.window_id)).size,hReference.length);
  const hTrain=hReference.filter(r=>r.split==='train' && r.role==='evaluation');
  const hScaler=fitScaler(hTrain,{...c,sharedScaleFloor:c.hmogScaleFloor});
  save('hmog_reference.jsonl',lines(hReference.map(r=>({...r,normalized_features:normalize(r.features,hScaler)}))));
  save('hmog_scaler.json',{fit_scope:'original train subjects, session_order >= 10 only',fit_row_count:hTrain.length,source_window_ids:hTrain.map(r=>r.window_id),statistics:hScaler});
  save('hmog_session_manifest.jsonl',lines(sessionManifest.map(r=>({subject_id:r.subject_id,session_id:r.session_id,session_order:r.session_order,split:r.split,role:r.session_order<c.enrollmentPool?'enrollment':'evaluation',window_count:r.window_count}))));
  const hBaselines=[];
  for(const subject of [...new Set(hReference.map(r=>r.subject_id))].sort())for(const n of c.enrollmentConditions){const rows=hReference.filter(r=>r.subject_id===subject && r.session_order<n);const ids=sessionManifest.filter(r=>r.subject_id===subject && r.session_order<n).map(r=>r.session_id);assert.equal(ids.length,n);hBaselines.push({subject_id:subject,condition:n,source_session_ids:ids,statistics:Object.fromEntries(c.hmogFeatures.map(k=>[k,stats(rows.map(r=>r.features[k]),c.hmogScaleFloor)]))});}
  save('hmog_baselines.jsonl',lines(hBaselines));
  const classCounts={};for(const x of labels.filter(x=>x.role==='evaluation' && x.origin==='scripted_simulation')){classCounts[x.split]??={};classCounts[x.split][x.scenario]=(classCounts[x.split][x.scenario]??0)+1;}
  const report={version:c.version,simulation_notice:c.policy,freeze_sha256:hash(fs.readFileSync(path.resolve(ROOT,freezePath))),runtime:f.runtime,config:c,payment:{users:c.users,original_sessions:labels.filter(x=>x.origin==='scripted_simulation').length,enrollment_sessions:c.users*c.enrollmentPool,evaluation_sessions:c.users*c.classes.length*c.evaluationSessionsPerClass,augmented_sessions:lineage.length,snapshot_counts:Object.fromEntries(Object.entries(splitRows).map(([k,v])=>[k,v.length])),class_counts:classCounts,baseline_conditions:c.enrollmentConditions},hmog:{subjects:new Set(hReference.map(r=>r.subject_id)).size,sessions:sessionManifest.length,windows:hReference.length,training_scaler_windows:hTrain.length,role_counts:{enrollment:hReference.filter(r=>r.role==='enrollment').length,evaluation:hReference.filter(r=>r.role==='evaluation').length},augmentation:'none; observed reference only',risk_labels:'absent'},predictive_metrics:'not measured; data preparation only',limitations:['Generated labels encode authored assumptions; no real fraud validation','Automatic calls, pressure, true key dwell and motion in payment rows are unavailable','H-MOG key intervals are not TextInput edit intervals','Existing trained M0/M1/M2 require a new missingness adapter and retraining','Human manual sessions and agent collection fixtures excluded','H-MOG source is previously verified v1 artifacts; raw archive identities inherited, raw archives not rescanned in this run']};
  save('report.json',report);
  const artifacts=fs.readdirSync(out).sort().map(n=>({file:n,sha256:hash(fs.readFileSync(path.join(out,n))),bytes:fs.statSync(path.join(out,n)).size}));
  save('manifest.json',{freeze_sha256:report.freeze_sha256,artifacts});console.log(JSON.stringify(report));return report;
}
export function compare(first,second,output) {
  const a=processedPath(first),b=processedPath(second),dest=processedPath(output);assert.ok(!fs.existsSync(dest),'refuse overwrite comparison');
  const names=fs.readdirSync(a).sort();assert.deepEqual(names,fs.readdirSync(b).sort());
  const result={comparison:'byte-for-byte, all artifacts including manifests and reports',matched:names.length,artifacts:names.map(n=>{const ah=hash(fs.readFileSync(path.join(a,n))),bh=hash(fs.readFileSync(path.join(b,n)));assert.equal(ah,bh,`artifact mismatch: ${n}`);return {file:n,sha256:ah};})};
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,json(result));console.log(JSON.stringify(result));return result;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [command,...args]=process.argv.slice(2);
  if(command==='freeze' && args.length===1)freeze(args[0]);
  else if(command==='build' && args.length===2)build(args[0],args[1]);
  else if(command==='compare' && args.length===3)compare(...args);
  else throw Error('Usage: freeze OUTPUT_DIR | build FREEZE_JSON OUTPUT_DIR | compare FIRST_DIR SECOND_DIR OUTPUT_JSON');
}
