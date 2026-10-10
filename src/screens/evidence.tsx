import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Action } from '@/components/guardian/action';
import { Wordmark } from '@/components/guardian/wordmark';
import { useSession } from '@/components/bank/session';
import evidence from '../../data/processed/pitch-evidence-v1/summary.json';

const chapters = ['Problem', 'Model evidence', 'Decision', 'Trust', 'Live proof'] as const;
const percent = (n: number | null) => n === null ? 'Not measured' : `${(n * 100).toFixed(1)}%`;
const body = 'font-body text-base leading-6 text-ink';
const muted = 'font-body text-sm leading-5 text-soft';
const headings = 'font-display text-[32px] leading-[38px] text-ink';
const familyLabel: Record<string,string> = { warning_bypass: 'Warning bypass', authority: 'Claimed authority', unfamiliar_wording: 'Unfamiliar wording',
  quiet_identical: 'Quiet identical evidence', account_change: 'Account change', call_lookalike: 'Call lookalike', request_absent: 'Request absent', quoted_instruction: 'Quoted instructions' };
const comparatorLabel: Record<string,string> = { transaction_rules: 'Transaction rules', frozen_ai: 'Frozen AI', hybrid: 'Rules + AI', request_cue_baseline: 'Simple request cues' };

/** Judge evidence and rehearsal reference on Android and web. Static evaluation stays separate from live counters. */
export default function EvidenceScreen() {
  const [chapter, setChapter] = useState(0);
  const insets = useSafeAreaInsets();
  const { report } = useSession();
  const primary = evidence.reports[0];
  return <View className="flex-1 bg-page" style={{ paddingTop: Math.max(12, insets.top) }}>
    <View className="gap-3 border-b border-line px-5 pb-4">
      <View className="flex-row flex-wrap items-center justify-between gap-3"><Wordmark onPress={() => router.replace('/')} />
        <Action small secondary label="Back to live demo" onPress={() => router.replace('/demo')} />
      </View>
      <Text className={muted}>Predictive Model Track · simulated prototype · four-minute presentation</Text>
      <View accessibilityRole="tablist" className="flex-row flex-wrap gap-2">
        {chapters.map((name,index)=><Pressable key={name} accessibilityRole="tab" accessibilityLabel={`Evidence ${name}`} accessibilityState={{selected:index===chapter}}
          onPress={()=>setChapter(index)} className={`min-h-11 justify-center rounded-xl px-3 ${index===chapter?'bg-ink':'bg-white'}`}>
          <Text className={`font-body text-sm ${index===chapter?'text-white':'text-ink'}`}>{index+1}. {name}</Text>
        </Pressable>)}
      </View>
    </View>
    <ScrollView key={chapter} className="flex-1" contentContainerStyle={{padding:24,paddingBottom:Math.max(24,insets.bottom+16),maxWidth:1100,width:'100%',alignSelf:'center'}}>
      <View className="gap-5">
        {chapter===0&&<>
          <Text accessibilityRole="header" className={headings}>A decision before money leaves</Text>
          <Text className={body}>For a mobile payment user following someone else&apos;s instructions, Guardian asks whether the payment needs an independent check before confirmation.</Text>
          <Text className="font-display text-[28px] leading-9 text-ink">Continue reviewing. Verify independently. Cancel.</Text>
          <Text className={body}>The useful opportunity is a warning while the user can still change their decision. Every unnecessary interruption is measured as burden.</Text>
          <Text className={muted}>No money moves. All requests, calls, labels and transaction history are simulated. Financial losses avoided and better human decisions have not been measured.</Text>
          <Action secondary label="Open live demo" onPress={()=>router.replace('/demo')} />
        </>}
        {chapter===1&&<>
          <Text accessibilityRole="header" className={headings}>Model evidence and counterexamples</Text>
          <Text className={body}>Frozen local classifiers: XGBoost for available behavior without a request; logistic regression for behavior + encoded request cues after arrival. Predictions use five-second prefixes. Labels never enter inference.</Text>
          <Text className="font-body text-xl text-ink">Original simulated evaluation · 1,440 sessions</Text>
          <Text className={muted}>{evidence.historical.scope} Comparisons change inputs and routing as well as model; they do not isolate an architecture effect.</Text>
          <ScrollView horizontal><View style={{minWidth:620}}>
            <View className="flex-row border-b border-line py-2"><Text className={`${body} flex-[2]`}>Model / policy</Text><Text className={`${body} flex-1`}>Recall</Text><Text className={`${body} flex-1`}>F1</Text><Text className={`${body} flex-1`}>Benign reviews</Text></View>
            {evidence.historical.comparison.map(row=><View key={row.name} className="flex-row border-b border-line py-3">
              <Text className={`${muted} flex-[2]`}>{row.name}</Text><Text className={`${body} flex-1`}>{percent(row.recall)}</Text><Text className={`${body} flex-1`}>{row.f1.toFixed(3)}</Text><Text className={`${body} flex-1`}>{percent(row.falseInterventionRate)}</Text>
            </View>)}
          </View></ScrollView>
          <Text className={body}>Selected: {evidence.historical.selected.tp}/{evidence.historical.selected.coached} coached detected, {evidence.historical.selected.fp}/{evidence.historical.selected.benign} benign reviews. Quiet scams: {evidence.historical.selected.quietDetected}/{evidence.historical.selected.quietTotal} detected.</Text>
          <Text className="font-body text-xl text-ink">New authored challenge · 32 sessions</Text>
          <Text className={muted}>16 cases × two correlated interaction profiles. Fixed before running; no retraining or threshold changes. This small challenge is not a population estimate. A stronger baseline is retained.</Text>
          <ScrollView horizontal><View style={{minWidth:680}}>
            <View className="flex-row border-b border-line py-2"><Text className={`${body} flex-[2]`}>Comparator</Text><Text className={`${body} flex-1`}>Detected</Text><Text className={`${body} flex-1`}>F1</Text><Text className={`${body} flex-1`}>Benign reviews</Text></View>
            {Object.entries(primary.comparison).map(([name,row])=><View key={name} className="flex-row border-b border-line py-3">
              <Text className={`${muted} flex-[2]`}>{comparatorLabel[name]}</Text><Text className={`${body} flex-1`}>{row.tp}/{row.tp+row.fn} ({percent(row.recall)})</Text><Text className={`${body} flex-1`}>{row.f1?.toFixed(3)??'—'}</Text><Text className={`${body} flex-1`}>{row.fp}/{row.fp+row.tn} ({percent(row.falseInterventionRate)})</Text>
            </View>)}
          </View></ScrollView>
          <Text className={body}>AI has not demonstrated superiority to simple request cues on this challenge. The hybrid detects more while increasing interruptions.</Text>
          <Text className="font-body text-xl text-ink">All challenge categories · AI results</Text>
          {primary.families.map(f=><Text key={f.family} className={muted}>{familyLabel[f.family]}: detected {f.comparison.frozen_ai.tp}/{f.comparison.frozen_ai.tp+f.comparison.frozen_ai.fn}; benign reviews {f.comparison.frozen_ai.fp}/{f.comparison.frozen_ai.fp+f.comparison.frozen_ai.tn}.</Text>)}
          <Text className="font-body text-xl text-ink">Missing-channel stress tests · separate runs</Text>
          {evidence.reports.slice(1).map(r=><Text key={r.availability} className={muted}>{r.availability.replaceAll('_',' ')}: AI recall {percent(r.comparison.frozen_ai.recall)}, benign reviews {percent(r.comparison.frozen_ai.falseInterventionRate)}. Unavailable inputs remain null; execution succeeds but quality changes.</Text>)}
          <Text className={muted}>Full report: data/processed/pitch-evidence-v1/report.json. Frozen selection SHA: {evidence.hashes['src/domain/model/selection.json'].slice(0,16)}. Historical report SHA: {evidence.historical.sha256.slice(0,16)}. Reproduce with scripts/evaluate_pitch_evidence.mjs --verify.</Text>
        </>}
        {chapter===2&&<>
          <Text accessibilityRole="header" className={headings}>Detect → categorize → prioritize → explain</Text>
          <Text className={body}>Detect: the learned model recommends review before confirmation.</Text>
          <Text className={body}>Categorize: display policy distinguishes warning-bypass instructions, possible external direction and navigation difficulty. These categories are not additional trained classes.</Text>
          <Text className={body}>Prioritize: check before confirmation for review; offer guidance for difficulty. Priority is a disclosed policy, not an estimated loss or calibrated probability.</Text>
          <Text className={body}>Explain: show the available evidence, actual warning origin and a specific next action.</Text>
          <Text className="font-display text-[26px] leading-8 text-ink">“Use a contact number you already know, not one supplied in the request.”</Text>
          <Text className={muted}>The independent-check guide is implemented. Actual contact, recipient certification and people making better decisions remain unmeasured.</Text>
        </>}
        {chapter===3&&<>
          <Text accessibilityRole="header" className={headings}>An explanation tied to the computation</Text>
          <Text className={body}>The first positive logistic-regression prefix retains its actual weighted feature and missing-input contributions. All terms plus the intercept reconstruct its score and threshold decision.</Text>
          <Text className={body}>Positive contributions push toward review. This is a mathematical explanation of an association, not proof that someone is a scammer. The score is not a scam probability.</Text>
          <Text className={body}>The text encoder uses simple English patterns. Unfamiliar wording and quoted advice can defeat it. XGBoost attribution is not implemented; its fallback is labeled accordingly.</Text>
          <Text className={muted}>Local inference only. No call audio, caller identity, account text or cross-app messages enter model inputs. Only authored fixture requests are encoded. Personalization is deferred.</Text>
        </>}
        {chapter===4&&<>
          <Text accessibilityRole="header" className={headings}>Timing and burden you can inspect</Text>
          <Text className={body}>Current app run: {report.summary.falseInterventionSessions}/{report.summary.legitimateSessions} legitimate sessions warned. FIR: {percent(report.summary.falseInterventionRate)}. Tiny demo counters are not estimated real-world false alarms.</Text>
          <Text className={body}>Before-review interval: {report.summary.medianWarningToReviewMs===null?'Not measured':`${(report.summary.medianWarningToReviewMs/1000).toFixed(2)} s`}. This ends at first Review entry and excludes the review cooldown.</Text>
          <Text className={body}>Observed warning-to-confirmation: {report.summary.medianObservedLeadMs===null?'Not measured':`${(report.summary.medianObservedLeadMs/1000).toFixed(2)} s`}. Includes the 15-second pause and response delays. Cancelled sessions have no confirmation lead.</Text>
          <Text className={muted}>Separate authored shadow lead in the evaluation report uses uninterrupted scripted confirmation times, not real user timings. Layout is a warning-display proxy; reading or noticing is not established.</Text>
          <Text className={body}>Demo sequence: routine payment → coached request while transaction rules stay quiet → independent-check guide → cancellation → inspect all evaluation outcomes.</Text>
          <Text className={muted}>No field effectiveness or physical Android release-latency result is claimed. Export metrics before reload; this run retains the most recent 20 sessions in memory.</Text>
          <Action secondary label="Return to measurements" onPress={()=>router.replace('/demo')} />
        </>}
      </View>
    </ScrollView>
  </View>;
}
