/** Run the predeclared authored pitch challenge without fitting/tuning; preserve counts, misses, hashes and shadow-time scope. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleBundle } from '../src/domain/bundle.ts';
import { infer } from '../src/domain/contextual_inference.mjs';
import { snapshotAt } from '../src/domain/features.ts';
import { requestFeatures } from '../src/domain/request.ts';
import { evaluate } from '../src/domain/risk.ts';
import { explainLinear } from '../src/domain/explanation.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
const selection = read('src/domain/model/selection.json');
const loaded = assembleBundle(selection,
  { lr_combined_binary: read('src/domain/model/lr_combined_binary.json'), xgb_behavior_binary: read('src/domain/model/xgb_behavior_binary.json') },
  { xgb_behavior_binary: read('src/domain/model/xgb_behavior_binary.xgb.json') });
const request = (text, mismatch = false, verified = false) => ({ text, approvedDetails: 'mock-A', proposedDetails: mismatch ? 'mock-B' : 'mock-A',
  verificationReceipt: verified ? { details: mismatch ? 'mock-B' : 'mock-A', source: 'mock_known_channel' } : null });

// Definitions are frozen before the first run; no deletion of missed/over-flagged cases after inspecting results.
const cases = [
  ['C01','warning_bypass',false,request('Before paying rent, contact the person using your saved number. Never dismiss warnings.')],
  ['C02','warning_bypass',true,request('Your bank security team says transfer now to a safe account. Ignore the warning. Keep this secret and do not call the bank.')],
  ['C03','authority',false,request('Your bank says never submit a transfer to a safe account requested by a caller. Please verify independently.')],
  ['C04','authority',true,request('Urgent security investigation: send now to this safe account. Tell nobody and skip independent verification.')],
  ['C05','unfamiliar_wording',false,request('The invoice is ready. Use our usual contact route to check the destination first.')],
  ['C06','unfamiliar_wording',true,request('The destination is fine. Complete the task without seeking another opinion. Disregard any caution screen.')],
  ['C07','quiet_identical',false,request('Please send the agreed rent to the agreed recipient.')],
  ['C08','quiet_identical',true,request('Please send the agreed rent to the agreed recipient.')],
  ['C09','account_change',false,request('Our rent account has changed. I confirmed these details through our existing contact route.',true,true)],
  ['C10','account_change',true,request('Urgent: pay now to the changed account. Do not call anyone to verify.',true,false)],
  ['C11','call_lookalike',false,null,true],
  ['C12','call_lookalike',true,null,true],
  ['C13','request_absent',false,null,false],
  ['C14','request_absent',true,null,false],
  ['C15','quoted_instruction',false,request('Fraud awareness example: "Ignore the warning. Keep this secret. Your bank wants a safe account transfer now; do not call." This is a quotation to avoid, not payment advice.')],
  ['C16','quoted_instruction',true,request('Ignore the warning. Keep this secret. Your bank wants a safe account transfer now; do not call.')],
].map(([id,family,coached,input,call=false]) => ({id,family,coached,input,call}));
const profiles = [
  { id: 'direct', requestAt: 1200, recipientAt: 2000, amountAt: 7000, reviewAt: 20000, confirmAt: 30000, back: false },
  { id: 'hesitant', requestAt: 2200, recipientAt: 6000, amountAt: 14000, reviewAt: 30000, confirmAt: 40000, back: true },
];
const comparatorNames = ['transaction_rules','frozen_ai','hybrid','request_cue_baseline'];
const sets = [{ id: 'primary', editing: true, explicitPaste: true }, { id: 'editing_unavailable', editing: false, explicitPaste: true },
  { id: 'editing_and_paste_unavailable', editing: false, explicitPaste: false }];
const diagnosticRule = (c) => c.request_present === 1 && c.negated_instruction !== 1 &&
  ((c.warning_bypass === 1 && c.avoid_verification === 1) || c.bank_deception === 1 ||
   (c.safe_account === 1 && c.claimed_authority === 1 && c.urgency === 1) ||
   (c.approved_detail_mismatch === 1 && c.verification_bound !== 1));
function eventsFor(c,p) {
  const events = [];
  const add = (t,type,payload,source='observed_ui') => events.push({session_id:`${c.id}-${p.id}`,event_seq:0,event_t_ms:t,type,source,payload});
  add(0,'session_start',{step_id:'recipient'});
  if(c.input) add(p.requestAt,'request_context',requestFeatures(c.input),'authored_demo_request');
  add(p.recipientAt,'focus',{field_id:'recipient',origin:'user'});
  add(p.recipientAt+400,'edit',{field_id:'recipient',length_delta:12,input_source:'typing'});
  add(p.amountAt-1000,'blur',{field_id:'recipient'});
  add(p.amountAt,'navigate',{step_id:'amount',direction:'forward'});
  add(p.amountAt+400,'focus',{field_id:'amount',origin:'user'});
  add(p.amountAt+700,'edit',{field_id:'amount',length_delta:1,input_source:'typing'});
  add(p.amountAt+1000,'edit',{field_id:'amount',length_delta:1,input_source:'typing'});
  if(p.back) {
    add(p.amountAt+2000,'navigate',{step_id:'recipient',direction:'back'});
    add(p.amountAt+2500,'edit',{field_id:'recipient',length_delta:-1,input_source:'typing'});
    add(p.amountAt+3500,'edit',{field_id:'recipient',length_delta:1,input_source:'typing'});
    add(p.amountAt+4500,'navigate',{step_id:'amount',direction:'forward'});
  }
  add(p.reviewAt,'navigate',{step_id:'review',direction:'forward'});
  add(p.confirmAt,'confirm',{});
  events.sort((a,b)=>a.event_t_ms-b.event_t_ms).forEach((e,i)=>e.event_seq=i);
  return events;
}
const median = (values) => { if(!values.length)return null;const v=[...values].sort((a,b)=>a-b),i=Math.floor(v.length/2);return v.length%2?v[i]:(v[i-1]+v[i])/2; };
function summary(rows,comparator) {
  const high=rows.filter(r=>r.coached),benign=rows.filter(r=>!r.coached);
  const timely=r=>r.firstReviewMs[comparator]!==null&&r.firstReviewMs[comparator]>=r.onsetMs&&r.firstReviewMs[comparator]<r.confirmMs;
  const tp=high.filter(timely).length,fn=high.length-tp,fp=benign.filter(r=>r.firstReviewMs[comparator]!==null).length,tn=benign.length-fp;
  return {tp,fn,fp,tn,recall:high.length?tp/high.length:null,precision:tp+fp?tp/(tp+fp):null,f1:2*tp+fp+fn?2*tp/(2*tp+fp+fn):null,
    falseInterventionRate:benign.length?fp/benign.length:null,premature:high.filter(r=>r.firstReviewMs[comparator]!==null&&r.firstReviewMs[comparator]<r.onsetMs).length,
    medianAuthoredShadowLeadMs:median(high.filter(timely).map(r=>r.confirmMs-r.firstReviewMs[comparator])),shadowLeadSamples:tp};
}
const rows=[];
for(const availability of sets)for(const c of cases)for(const p of profiles) {
  const events=eventsFor(c,p),firstReviewMs=Object.fromEntries(comparatorNames.map(n=>[n,null]));
  const scores=[];let explanation=null;
  for(let t=0;t<p.confirmAt;t+=5000) {
    const input=snapshotAt(events,t,availability),result=infer(input,loaded.bundle);
    if(t===0)assert.equal(input.context_features.request_present,0,'future request must not leak');
    const rules=evaluate({callActive:c.call,newRecipient:true,pasted:false,amountRatio:t>=p.amountAt+1000?1:0,backPresses:p.back&&t>=p.amountAt+2000?1:0,helpTaps:0});
    const rulePositive=['hold','cooldown'].includes(rules.response),cuePositive=diagnosticRule(input.context_features);
    for(const [name,positive] of Object.entries({transaction_rules:rulePositive,frozen_ai:result.reviewRecommended,hybrid:rulePositive||result.reviewRecommended,request_cue_baseline:cuePositive}))
      if(positive&&firstReviewMs[name]===null)firstReviewMs[name]=t;
    if(result.reviewRecommended&&explanation===null)explanation=explainLinear(result.modelId,loaded.bundle.models[result.modelId],input,result.threshold);
    scores.push({cutoffMs:t,head:result.modelId,score:result.reviewScore,threshold:result.threshold,review:result.reviewRecommended});
  }
  rows.push({id:`${c.id}-${p.id}`,caseId:c.id,family:c.family,coached:c.coached,profile:p.id,availability:availability.id,
    onsetMs:c.coached?(c.call||!c.input?0:p.requestAt):0,confirmMs:p.confirmAt,firstReviewMs,scores,explanation});
}
for(const availability of sets)for(const profile of profiles) {
  const a=rows.find(r=>r.caseId==='C07'&&r.availability===availability.id&&r.profile===profile.id);
  const b=rows.find(r=>r.caseId==='C08'&&r.availability===availability.id&&r.profile===profile.id);
  assert.deepEqual(a.scores,b.scores,'quiet identical evidence must have identical model outputs');
}
const familyNames=[...new Set(cases.map(c=>c.family))];
const reports=sets.map(a=>{const own=rows.filter(r=>r.availability===a.id);return {availability:a.id,sessions:own.length,
  comparison:Object.fromEntries(comparatorNames.map(n=>[n,summary(own,n)])),
  families:familyNames.map(family=>({family,sessions:own.filter(r=>r.family===family).length,
    comparison:Object.fromEntries(comparatorNames.map(n=>[n,summary(own.filter(r=>r.family===family),n)]))}))};});
const hashes=Object.fromEntries(['scripts/evaluate_pitch_evidence.mjs','docs/four-minute-pitch-plan.md','src/domain/request.ts','src/domain/features.ts','src/domain/collector.ts','src/domain/explanation.ts',
  'src/domain/risk.ts','src/domain/contextual_inference.mjs','src/domain/model/selection.json','src/domain/model/lr_combined_binary.json',
  'src/domain/model/xgb_behavior_binary.json','src/domain/model/xgb_behavior_binary.xgb.json'].map(p=>[p,sha(p)]));
assert.equal(hashes['src/domain/model/lr_combined_binary.json'],selection.model_sha256.lr_combined_binary);
assert.equal(hashes['src/domain/model/xgb_behavior_binary.json'],selection.model_sha256.xgb_behavior_binary);
const report={version:'pitch-evidence-v1',simulationOnly:true,personalizationUsed:false,modelsChanged:false,
  scope:'Authored challenge cases; 16 case definitions x 2 correlated interaction profiles. Not participant-held-out or field effectiveness.',
  timingScope:'Authored uninterrupted confirmation minus first five-second model decision. Not displayed-warning or physical-device latency.',
  baselineScope:'Hand-set request cue comparator is diagnostic and unvalidated; not a fitted model.',
  groundTruthScope:'Scenario labels declared by the author, kept outside the model. Legitimate reviews count as burden even when prudent.',
  cases:cases.map(({id,family,coached,input,call})=>({id,family,coached,authoredRequest:input?.text??null,simulatedCall:call})),profiles,reports,hashes,rows};
const historicalPath='../trustguard-edge/data/processed/contextual-policy-v2/report.json';
const historicalSnapshot='data/processed/pitch-evidence-v1/historical-report.json';
if(!fs.existsSync(path.join(root,historicalSnapshot)))fs.copyFileSync(path.join(root,historicalPath),path.join(root,historicalSnapshot));
if(fs.existsSync(path.join(root,historicalPath)))assert.equal(sha(historicalSnapshot),sha(historicalPath),'Historical source changed; do not silently replace frozen evidence');
const historical=read(historicalSnapshot);
assert.equal(historical.audit.selected_before_test_sha256,hashes['src/domain/model/selection.json']);
report.historical={source:historicalPath,snapshot:historicalSnapshot,sha256:sha(historicalSnapshot),sessions:historical.test_sessions,scope:'Previously executed EXP013 simulated test; same authored wording banks and semantic families, new profile IDs. Not independent-language or real-world validation.',
  comparison:[...historical.controls.map(c=>({name:c.model,recall:c.test.coached_recall,f1:c.test.session_f1,falseInterventionRate:c.test.false_intervention_rate})),
    {name:'Selected availability policy',recall:historical.selected.coached_recall,f1:historical.selected.session_f1,falseInterventionRate:historical.selected.false_intervention_rate}],
  selected:{tp:historical.selected.correct_detections,fn:historical.selected.missed_or_premature,fp:historical.selected.false_warnings,tn:historical.selected.benign_sessions-historical.selected.false_warnings,
    coached:historical.selected.coached_sessions,benign:historical.selected.benign_sessions,quietDetected:historical.selected.families.quiet_identical.correct,quietTotal:historical.selected.families.quiet_identical.coached,
    medianAuthoredShadowLeadMs:historical.selected.lead_ms.median}};
const out=path.join(root,'data/processed/pitch-evidence-v1');fs.mkdirSync(out,{recursive:true});
if(process.argv.includes('--verify'))assert.equal(fs.readFileSync(path.join(out,'report.json'),'utf8'),JSON.stringify(report,null,2)+'\n','Frozen challenge report must reproduce byte for byte');
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
// Compact app evidence view: all cases remain in the full report, no handpicked success rate.
const compact={...report};delete compact.rows;delete compact.cases;delete compact.profiles;
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(compact,null,2)+'\n');
console.log(JSON.stringify({primary:reports[0].comparison,stress:reports.slice(1).map(r=>({availability:r.availability,ai:r.comparison.frozen_ai})),output:out},null,2));
