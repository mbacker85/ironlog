const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium,webkit}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
new Function(source.match(/<script>([\s\S]*)<\/script>/)[1]);
const html=source.replace('  try{\n    state=loadState();',`  window.test={set audio(ctx){audioCtx=ctx},get state(){return state},set state(s){state=s},buildDefaultState,progressionPlan,getSlot,createActiveSession,finishWorkout,completeExercise,hasActivity,saveState,renderAll,applyImport,startRestTimer,updateTimerDisplay,syncWakeLock,stopRestTimer};
  try{
    state=loadState();`);
(async()=>{
for(const [name,type] of Object.entries(process.env.TEST_CHROMIUM ? {chromium,webkit} : {webkit})){
 const browser=await type.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.route('https://ironlog.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
 await context.route('https://fonts.**',r=>r.abort());
 const page=await context.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message)); page.on('dialog',d=>d.accept());
 await page.goto('https://ironlog.test/');
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ironlog-state-v2')));
 assert.equal((await state()).activeSession,null);
 await page.click('[data-env="gym"]'); assert.equal((await state()).environment,'gym');
 await page.click('#mainBtn'); await page.click('[data-env="home"]');
 assert.equal((await state()).activeSession.environment,'home');
 assert.equal((await state()).activeSession.items[0].weight,63);
 await page.click('[data-step="inc"] >> nth=0');
 assert(await page.isDisabled('[data-env="gym"]'));
 const active=(await state()).activeSession;
 const beforeRefresh=page.url();
 await page.click('#refreshBtn');
 await page.waitForURL(url=>url.href!==beforeRefresh && url.searchParams.has('refresh'));
 assert.deepEqual((await state()).activeSession,active);
 assert.equal(await page.textContent('#refreshBtn'),'Refresh');
 await page.click('#settingsBtn'); await page.click('#cancelWorkout');
 assert.equal((await state()).activeSession,null); assert.equal((await state()).dayIndex,0);
 assert.deepEqual((await state()).cancelledSessions[0].items,active.items);
 await page.click('[data-env="gym"]'); await page.click('#mainBtn');
 await page.click('[data-setdone] >> nth=0');
 const end=(await state()).activeSession.restTimer.end;
 await page.click('#timerAdd'); assert.equal((await state()).activeSession.restTimer.end,end+30000);
 await page.reload(); assert.equal((await state()).activeSession.restTimer.end,end+30000);
 await page.evaluate(()=>test.startRestTimer(.05,'test'));
 await page.waitForFunction(()=>document.getElementById('timerTime').textContent==='READY');
 assert.equal((await state()).activeSession.restTimer,null);
 await page.click('#timerAdd'); assert((await state()).activeSession.restTimer.end>Date.now());
 await page.click('#timerStop'); assert.equal((await state()).activeSession.restTimer,null);
 // Use the public UI to finish one exercise and return Home, without auto-starting.
 await page.click('[data-setdone="A-db-bench"][data-set="1"]');
 await page.click('[data-setdone="A-db-bench"][data-set="2"]');
 await page.click('[data-rir="1-2"][data-slot="A-db-bench"]');
 await page.click('[data-complete="A-db-bench"]');
 const homeBefore=(await state()).slotState['A-db-bench'].home;
 await page.click('#mainBtn');
 assert.equal((await state()).activeSession,null); assert.equal((await state()).dayIndex,1);
 assert.equal((await state()).history.length,1);
 assert.deepEqual((await state()).slotState['A-db-bench'].home,homeBefore);
 assert.equal(await page.locator('.rotation-card').count(),3);
 assert((await page.locator('.rotation-card').nth(0).textContent()).includes('Most recent'));
 assert((await page.locator('.rotation-card').nth(0).textContent()).includes('Oct'));
 assert((await page.textContent('#startNextWorkout')).includes('Day B'));
 assert.equal(await page.textContent('#mainBtn'),'Start Day B');
 assert(!(await page.isVisible('#timerBar')));
 assert(!(await page.isVisible('#dayPlateRow')));
 await page.click('#startNextWorkout');
 assert.equal((await state()).activeSession.day,'B');
 assert.equal((await state()).activeSession.environment,'gym');
 await page.click('#settingsBtn'); await page.click('#cancelWorkout');
 assert.equal((await state()).dayIndex,1);
 await page.reload(); assert.equal((await state()).activeSession,null);
 if(process.env.SCREENSHOT_DIR) await page.screenshot({path:process.env.SCREENSHOT_DIR+'/ironlog-home.png',fullPage:true});
 await page.click('#settingsBtn'); await page.click('#testSound');
 await page.waitForFunction(()=>/Test tones played|Audio could not start/.test(document.getElementById('soundStatus').textContent));
 // The container has no physical audio device. Instrument Web Audio scheduling separately.
 await page.evaluate(()=>{
   window.tones=[]; const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}});
   test.audio={state:'running',currentTime:0,destination:{},createBuffer:()=>({}),createBufferSource:node,createGain:node,
     createOscillator:()=>({...node(),frequency:{set value(v){tones.push(v)}}})};
 });
 await page.click('#testSound');
 await page.waitForFunction(()=>document.getElementById('soundStatus').textContent.startsWith('Test tones played'));
 assert.deepEqual(await page.evaluate(()=>tones),[660,880,1100,660,880,1100]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 if(process.env.SCREENSHOT_DIR) await page.screenshot({path:process.env.SCREENSHOT_DIR+'/ironlog-settings.png',fullPage:true});
 // Wake lock acquisition/release/reacquisition and refusal are graceful.
 await page.evaluate(()=>{
   window.wakeEvents=[];
   Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>{wakeEvents.push('request');return {release:async()=>wakeEvents.push('release'),addEventListener(){}}}}});
   test.createActiveSession();
 });
 await page.waitForFunction(()=>wakeEvents.includes('request'));
 await page.evaluate(async()=>{test.state.settings.keepAwake=false;await test.syncWakeLock();});
 assert.deepEqual(await page.evaluate(()=>wakeEvents),['request','release']);
 await page.evaluate(async()=>{test.state.settings.keepAwake=true;await test.syncWakeLock();test.state.activeSession=null;await test.syncWakeLock();});
 assert.deepEqual(await page.evaluate(()=>wakeEvents),['request','release','request','release']);
 await page.evaluate(async()=>{navigator.wakeLock.request=async()=>{throw Error('denied')};test.createActiveSession();await test.syncWakeLock();test.state.activeSession=null;});
 // Exact progression scenario matrix, isolated from user's data.
 const results=await page.evaluate(()=>{
   test.state=test.buildDefaultState(null); test.state.environment='gym';test.createActiveSession();
   const slot=test.getSlot('A-db-bench');
   const item=(reps,rir='1-2',weight=70,target=26)=>({weight,rir,startedTargetTotal:target,sets:reps.map(reps=>({reps,done:true}))});
   const calc=(reps,rir,w,t)=>test.progressionPlan(slot,item(reps,rir,w,t));
   let out={uneven:calc([9,9,8]),faster:calc([9,9,8],'3+'),failure:calc([12,12,12],'0'),top:calc([13,12,11],'1-2'),bad:calc([7,7,6]),severe:calc([3,3,3])};
   test.state.slotState[slot.id].gym.lastPerformance=out.severe.lastPerformance;
   out.twice=calc([3,3,3]); out.changedLoad=calc([3,3,3],'0',75);
   test.state.slotState[slot.id].gym.lastPerformance=out.uneven.lastPerformance;
   out.improved=calc([9,9,9],'1-2',70,27);
   test.state.activeSession.environment='home';
   const lateral=test.getSlot('A-lateral');
   out.lateral=test.progressionPlan(lateral,item([33,33],'3+',12,66));
   test.state.history=[{environment:'gym',items:[{slotId:slot.id,status:'complete',weight:70,reps:[10,10,10]}]}];
   test.state.activeSession.environment='gym'; out.trend=calc([7,7,7],'0',70,31);
   test.state.history[0].items.unshift({slotId:slot.id,status:'complete',weight:70,reps:[7,7,7],nextPlan:out.trend});out.trendTwice=calc([7,7,7],'0',70,31);
   return out;
 });
 assert.equal(results.uneven.targetTotal,27);assert.equal(results.uneven.weight,70);
 assert.equal(results.faster.targetTotal,28);assert.equal(results.failure.weight,70);
 assert.equal(results.failure.targetTotal,36);assert.equal(results.top.weight,75);
 assert.equal(results.bad.weight,70);assert.equal(results.severe.weight,70);
 assert.equal(results.twice.weight,65);assert.equal(results.changedLoad.weight,75);
 assert.equal(results.improved.targetTotal,28);assert.match(results.improved.note,/Progress/);
 assert.equal(results.lateral.weight,12);assert.equal(results.trend.weight,70);
 assert.equal(results.trend.badStreak,1);assert.equal(results.trendTwice.weight,65);
 // V1 migration: original key untouched, history/weights/day copied.
 const legacy={dayIndex:2,environment:'gym',exerciseState:{'db-bench':{homeWeight:72,gymWeight:70,repTarget:9}},history:[{day:'A',date:'2026-09-01',entries:[]}]};
 await page.evaluate(v=>{localStorage.clear();localStorage.setItem('ironlog-state-v1',JSON.stringify(v));},legacy);
 await page.reload(); let migrated=await state();
 assert.equal(migrated.dayIndex,2);assert.equal(migrated.slotState['A-db-bench'].home.weight,72);
 assert.equal(migrated.slotState['A-db-bench'].gym.weight,70);assert.equal(migrated.legacyHistory.length,1);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ironlog-state-v1'))),legacy);
 assert.equal(await page.locator('.rotation-card').count(),3);
 assert((await page.locator('.rotation-card').nth(0).textContent()).includes('Sep 1, 2026'));
 assert((await page.textContent('#startNextWorkout')).includes('Day C'));
 // Existing V2 with active session and a pre-existing completed plan is left intact.
 await page.click('#mainBtn'); let v2=await state(); delete v2.settings.keepAwake;
 v2.activeSession.items[0].sets[0].reps=7;v2.activeSession.items[0].sets[0].done=true;
 v2.activeSession.restTimer={end:Date.now()+90000,label:'Existing timer'};
 await page.evaluate(v=>localStorage.setItem('ironlog-state-v2',JSON.stringify(v)),v2);
 await page.reload(); const loaded=await state();
 assert.deepEqual(loaded.activeSession,v2.activeSession);assert.deepEqual(loaded.slotState,v2.slotState);
 assert.equal(loaded.settings.keepAwake,true);assert(await page.isDisabled('[data-env="home"]'));
 // Import preserves active timer and creates pre-import recovery copy.
 await page.evaluate(v=>test.applyImport(v),v2);assert.deepEqual((await state()).activeSession,v2.activeSession);
 assert(await page.evaluate(()=>!!localStorage.getItem('ironlog-before-import')));
 // Completion never trims older history.
 await page.evaluate(()=>{test.state.history=Array.from({length:121},(_,i)=>({id:String(i),items:[]}));test.finishWorkout();});
 assert.equal((await state()).history.length,122);
 // Storage failure must retain the unfinished session and rotation in memory.
 const failure=await page.evaluate(()=>{
  test.createActiveSession(); const id=test.state.activeSession.id,day=test.state.dayIndex;
  const original=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')};
  test.finishWorkout();Storage.prototype.setItem=original;
  return {same:test.state.activeSession?.id===id,day:test.state.dayIndex===day};
 });assert.deepEqual(failure,{same:true,day:true});
 // Invalid stored data must never be silently reset.
 await page.evaluate(()=>localStorage.setItem('ironlog-state-v2','{broken'));
 await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('ironlog-state-v2')),'{broken');
 assert(await page.isDisabled('#mainBtn'));
 assert.deepEqual(errors,[]);
 await browser.close();console.log(name+': migration, persistence, UI, timer/audio, progression, import and data-safety checks passed');
}
})().catch(e=>{console.error(e);process.exit(1)});
