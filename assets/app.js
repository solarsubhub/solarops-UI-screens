// Simple hash router
const routes = [
  "login","proposal","editor","financing","calculator","adjust","handoff",
  "survey","cad","trueup","permitting","install","inspection","pto","turnon","commissioning","pipeline","contractor","sales","finance","sales-projects"
];
const stageRoutes = ["survey","cad","trueup","permitting","install","inspection","pto","turnon","commissioning"]; 
let lastContractorTab = 'c-overview';
let nextContractorTab = null; // used for back-to-board flow
function showRoute(id){
  document.querySelectorAll('.route').forEach(s=>s.hidden=true);
  const el = document.getElementById(id) || document.getElementById('proposal');
  el.hidden = false;
  // update sidebar active
  document.querySelectorAll('.sidebar .nav-link').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
  });
  updateBackbar();
}
function updateBackbar(){
  const back = document.getElementById('backbar'); if(!back) return;
  const id = (location.hash||'#').replace('#','');
  const show = stageRoutes.includes(id);
  back.hidden = !show;
  document.body.classList.toggle('show-backbar', show);
}

window.addEventListener('hashchange',()=>{
  const id = location.hash.replace('#','') || 'login';
  // Auth guard: force login if not authenticated
  if(!appState.user?.role && id !== 'login'){
    location.hash = '#login';
    showRoute('login');
    updateBackbar();
    return;
  }
  if(routes.includes(id)) showRoute(id);
  updateBackbar();
});

// Toast helper
function toast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg; t.hidden = false;
  setTimeout(()=> t.hidden = true, 2200);
}
// Sidebar collapse toggle
document.getElementById('nav-toggle')?.addEventListener('click',()=>{
  document.body.classList.toggle('nav-collapsed');
});
// Collapsible groups
document.querySelectorAll('[data-collapsible]')?.forEach(el=>{
  el.addEventListener('click',()=>{
    const group = el.closest('.nav-group');
    const list = group?.querySelector('.group-list');
    if(!list) return;
    const collapsed = list.hasAttribute('hidden');
    if(collapsed) list.removeAttribute('hidden'); else list.setAttribute('hidden','');
    const caret = el.querySelector('.caret'); if(caret) caret.style.transform = collapsed? 'rotate(0deg)':'rotate(-90deg)';
  });
});

// Proposal Creation interactivity
const markBtn = document.getElementById('mark-preflight');
const analysisStatus = document.getElementById('analysis-status');
const packageCards = document.getElementById('package-cards');
const reviewCard = document.getElementById('review-card');
const preflightCard = document.getElementById('preflight-card');
const propPrev = document.getElementById('prop-prev');
const propNext = document.getElementById('prop-next');
const propProgress = document.getElementById('prop-progress');
const stepper = document.getElementById('proposal-stepper');
const kpiKw = document.getElementById('kpi-kw');
const kpiKwh = document.getElementById('kpi-kwh');
const kpiMonthly = document.getElementById('kpi-monthly');
const kpiSavings = document.getElementById('kpi-savings');

// ---- Versioning (Save Version) ----
const VSTORE_KEY = 'ssh_versions';
function loadVersions(){
  try{ return JSON.parse(localStorage.getItem(VSTORE_KEY)||'[]'); }catch{ return []; }
}
function saveVersions(list){
  localStorage.setItem(VSTORE_KEY, JSON.stringify(list));
}
function makeVersion(){
  const when = new Date();
  const tierName = (typeof chosenTier==='string' && chosenTier) ? (chosenTier.charAt(0).toUpperCase()+chosenTier.slice(1)) : 'Comfort';
  return {
    id: 'v'+String(Date.now()).slice(-6),
    when: when.toISOString(),
    label: `${tierName} • ${appState.kw} kW • ~$${appState.monthly}/mo`,
    kw: appState.kw, kwh: appState.kwh, capex: appState.capex, monthly: appState.monthly, tier: tierName
  };
}
function renderVersionList(){
  const ul = document.getElementById('version-list'); if(!ul) return;
  const items = loadVersions();
  if(items.length===0){ ul.innerHTML = '<li>No saved versions yet</li>'; return; }
  ul.innerHTML = '';
  items.slice().reverse().forEach(v=>{
    const li = document.createElement('li');
    const dt = new Date(v.when).toLocaleString();
    li.innerHTML = `${v.id} • ${v.label} <small style="color:#64748B">(${dt})</small>`;
    ul.appendChild(li);
  });
}
document.querySelector('[data-action="save-version"]')?.addEventListener('click',()=>{
  const list = loadVersions();
  const v = makeVersion();
  list.push(v); saveVersions(list); renderVersionList();
  toast('Version saved');
});
document.querySelector('[data-action="export-pdf"]')?.addEventListener('click',()=>{
  window.print();
});

// Shared app state to pipe defaults into Financing/Calculator and user context
const appState = {
  kw: 7.5,
  kwh: 11300,
  monthly: 132,
  capex: 21500,
  util: 180,
  user: (()=>{ try{return JSON.parse(localStorage.getItem('ssh_user')||'null');}catch{return null;} })()
};

function updateUserContext(){
  const role = appState.user?.role || null;
  const show = (href, ok)=>{
    document.querySelectorAll(`a[href="${href}"]`).forEach(a=>{ 
      a.style.display = ok ? '' : 'none';
      const li=a.closest('li'); if(li) li.style.display = ok? '':'none'; 
    });
  };
  // Show only Login when not authenticated
  show('#login', !role);
  show('#sales', !!role && (role==='Sales' || role==='Admin'));
  show('#sales-projects', !!role && (role==='Sales' || role==='Admin'));
  show('#proposal', !!role && (role==='Sales' || role==='Admin'));
  show('#editor', !!role && (role==='Sales' || role==='Admin'));
  show('#financing', !!role && (role==='Sales' || role==='Admin'));
  show('#calculator', !!role && (role==='Sales' || role==='Admin'));
  show('#handoff', !!role && (role==='Sales' || role==='Admin'));
  show('#contractor', !!role && (role==='Contractor' || role==='Admin'));
  show('#pipeline', !!role && (role==='Contractor' || role==='Admin'));
  show('#finance', !!role && (role==='Finance' || role==='Admin'));

  // Header controls visibility
  const saveBtn = document.querySelector('[data-action="save-version"]');
  const pdfBtn = document.querySelector('[data-action="export-pdf"]');
  const logoutBtn = document.getElementById('logout-btn');
  if(saveBtn) saveBtn.style.display = role ? '' : 'none';
  if(pdfBtn) pdfBtn.style.display = role ? '' : 'none';
  if(logoutBtn) logoutBtn.hidden = !role;

  // Hide entire Contractor group unless Contractor/Admin
  const contractorGroup = document.getElementById('group-contractor')?.closest('.nav-group');
  if(contractorGroup){ contractorGroup.style.display = (!!role && (role==='Contractor' || role==='Admin')) ? '' : 'none'; }

  // If not logged in, force login route
  if(!role && location.hash !== '#login'){
    location.hash = '#login';
  }
}
updateUserContext();

// Initial landing route per role
function getLandingForRole(role){
  if(role==='Sales') return '#sales';
  if(role==='Contractor') return '#contractor';
  if(role==='Finance') return '#finance';
  if(role==='Admin') return '#proposal'; // Admin sees all; land on Proposal by default
  return '#login';
}

(function initRoute(){
  const role = appState.user?.role || null;
  if(!role){
    location.hash = '#login';
    showRoute('login');
  } else {
    const current = location.hash || '';
    if(!current || current==='#login'){
      const dest = getLandingForRole(role);
      location.hash = dest;
      showRoute(dest.replace('#',''));
    } else {
      showRoute(current.replace('#',''));
    }
  }
  updateBackbar();
})();

// Login handling and role landing
document.getElementById('login-form')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const name = document.getElementById('login-name').value || 'User';
  const role = document.getElementById('login-role').value || 'Sales';
  appState.user = {name, role};
  localStorage.setItem('ssh_user', JSON.stringify(appState.user));
  updateUserContext();
  if(role==='Sales') location.hash = '#sales';
  else if(role==='Contractor') location.hash = '#contractor';
  else if(role==='Finance') location.hash = '#finance';
  else location.hash = '#proposal';
  toast(`Logged in as ${name} (${role})`);
});

// Logout handling
document.getElementById('logout-btn')?.addEventListener('click',()=>{
  localStorage.removeItem('ssh_user');
  appState.user = null;
  updateUserContext();
  showRoute('login');
  location.hash = '#login';
  toast('Logged out');
});

// Proposal step state machine
const proposalSteps = ['preflight','analysis','packages','review'];
let proposalStep = 'preflight';
let preflightDone = false; let packageChosen = false; let chosenTier = null;

function setProposalStep(step){
  proposalStep = step;
  // body step class for robust show/hide in CSS
  document.body.classList.remove('step-preflight','step-analysis','step-packages','step-review');
  document.body.classList.add('step-'+step);
  // Always hide contractor backbar while on Proposal
  const backbar = document.getElementById('backbar'); if(backbar) backbar.hidden = true;
  const showMap = (step==='analysis' || step==='packages' || step==='review');
  document.getElementById('map-canvas').hidden = !showMap;
  analysisStatus.hidden = (step!=='analysis');
  packageCards.hidden = (step!=='packages');
  reviewCard && (reviewCard.hidden = (step!=='review'));
  preflightCard && (preflightCard.hidden = (step!=='preflight'));
  // stepper UI
  if(stepper){
    [...stepper.querySelectorAll('.step')].forEach(li=>{
      li.classList.toggle('current', li.dataset.step===step);
      const idx = proposalSteps.indexOf(li.dataset.step);
      const currIdx = proposalSteps.indexOf(step);
      li.style.opacity = idx>currIdx+1 ? 0.5 : 1;
    });
  }
  // nav buttons
  if(propPrev) propPrev.disabled = (proposalStep==='preflight');
  let canNext = true;
  // Allow Next without requiring preflight complete
  if(step==='packages') canNext = packageChosen;
  if(propNext) propNext.disabled = !canNext;
  if(propNext) propNext.textContent = (step==='review') ? 'Finish' : 'Next';
  if(propProgress){
    const pct = ((proposalSteps.indexOf(step)+1)/proposalSteps.length)*100;
    propProgress.style.width = pct+'%';
  }
}

function runAnalysis(){
  setProposalStep('analysis');
  analysisStatus.hidden = false; packageCards.hidden = true;
  setTimeout(()=>{
    analysisStatus.hidden = true;
    kpiKw.textContent = '7.5';
    kpiKwh.textContent = '11,300';
    kpiMonthly.textContent = '$132';
    kpiSavings.textContent = '28%';
    appState.kw = 7.5; appState.kwh = 11300; appState.monthly = 132; appState.capex = 21500;
    updateSummaryChips();
    setProposalStep('packages');
    toast('Site analysis complete');
  }, 1000);
}

markBtn?.addEventListener('click',()=>{
  document.querySelectorAll('#preflight-list li').forEach(li=>{
    li.textContent = li.textContent.replace(/\s*$/,' ✓');
  });
  preflightDone = true; toast('Preflight complete');
  runAnalysis();
});

document.querySelectorAll('#package-cards .select-tier').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('#package-cards .pkg').forEach(c=>c.classList.remove('selected'));
    const card = btn.closest('.pkg');
    card?.classList.add('selected');
    // derive defaults from the chosen card
    const kw = Number((card?.querySelector('[data-field="kw"]')?.textContent||'0').replace(/[^\d.]/g,''))||appState.kw;
    const kwh = Number((card?.querySelector('[data-field="kwh"]')?.textContent||'0').replace(/[^\d.]/g,''))||appState.kwh;
    const monthly = Number((card?.querySelector('[data-field="monthly"]')?.textContent||'0').replace(/[^\d.]/g,''))||appState.monthly;
    appState.kw = kw; appState.kwh = kwh; appState.monthly = monthly;
    updateSummaryChips();
    packageChosen = true; chosenTier = card?.dataset.tier||'comfort';
    toast(`Selected ${card?.querySelector('h3')?.textContent} as baseline`);
    if(propNext) propNext.disabled = false;
  });
});

// Next/Back actions
propPrev?.addEventListener('click',()=>{
  const idx = proposalSteps.indexOf(proposalStep);
  if(idx>0){ setProposalStep(proposalSteps[idx-1]); }
});
propNext?.addEventListener('click',()=>{
  if(proposalStep==='preflight'){ runAnalysis(); return; }
  if(proposalStep==='analysis'){ setProposalStep('packages'); return; }
  if(proposalStep==='packages'){
    if(!packageChosen) return;
    const rev = document.getElementById('review-summary');
    if(rev){
      const tierName = (chosenTier||'comfort');
      const label = tierName.charAt(0).toUpperCase()+tierName.slice(1);
      rev.textContent = `${label} • ${appState.kw} kW • ~$${appState.monthly}/mo`;
    }
    setProposalStep('review'); return;
  }
  if(proposalStep==='review'){ location.hash = '#handoff'; return; }
});

document.getElementById('review-back')?.addEventListener('click',()=> setProposalStep('packages'));

// Stepper click: allow navigating to completed steps only
stepper?.addEventListener('click',(e)=>{
  const li = e.target.closest('.step'); if(!li) return;
  const tgt = li.dataset.step; const tgtIdx = proposalSteps.indexOf(tgt);
  const maxIdx = preflightDone ? (packageChosen ? 3 : 2) : 0; // 0 preflight, 1 analysis, 2 packages, 3 review
  if(tgtIdx<=maxIdx){ setProposalStep(tgt); }
});

function initProposal(){
  preflightDone = false; packageChosen = false; chosenTier = null;
  setProposalStep('preflight');
  const backbar = document.getElementById('backbar'); if(backbar) backbar.hidden = true;
  // Pre-fill from selected lead context
  const info = document.getElementById('lead-info'); const body = document.getElementById('lead-info-body');
  if(appState.currentLead){
    info.hidden = false;
    body.innerHTML = `<div class="row gap"><strong>${appState.currentLead.name||appState.currentLead.id}</strong><span class="chip">${appState.currentLead.id}</span></div>`;
  }else{
    info.hidden = true;
    body.textContent = '—';
  }
}

// Tabs in editor
document.querySelectorAll('[data-tabs]').forEach(group=>{
  group.querySelectorAll('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      group.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      document.querySelectorAll('.tabpane').forEach(p=>p.classList.remove('active'));
      document.getElementById(`tab-${name}`)?.classList.add('active');
      // track last contractor tab
      if(group.id==='contractor-tabs') lastContractorTab = name;
    });
  });
});

// Simple editor counters
const panelCount = document.getElementById('panel-count');
let panels = 24;
function refreshMetrics(){
  // naive: each panel 0.31 kW
  const kw = (panels*0.31).toFixed(1);
  const kwh = Math.round(panels*425); // mock
  const capex = 800*panels; // mock
  const monthly = Math.max(90, Math.round(capex/300));
  const payback = (capex / (180*12*0.28)).toFixed(1); // mock
  document.getElementById('m-kw').textContent = kw;
  document.getElementById('m-kwh').textContent = kwh.toLocaleString();
  document.getElementById('m-capex').textContent = `$${capex.toLocaleString()}`;
  document.getElementById('m-monthly').textContent = `$${monthly}`;
  document.getElementById('m-payback').textContent = `${payback}y`;
  // sync shared state
  appState.kw = Number(kw); appState.kwh = kwh; appState.capex = capex; appState.monthly = monthly;
  updateSummaryChips();
}
document.querySelector('[data-tool="add"]')?.addEventListener('click',()=>{
  panels += 1; panelCount.textContent = panels; refreshMetrics();
});
document.querySelector('[data-tool="remove"]')?.addEventListener('click',()=>{
  panels = Math.max(10, panels-1); panelCount.textContent = panels; refreshMetrics();
});
refreshMetrics();

// Financing AI stub
const credit = document.getElementById('credit');
const creditVal = document.getElementById('credit-val');
credit?.addEventListener('input',()=> { creditVal.textContent = credit.value; resetLenders(); });
function resetLenders(){ const list = document.getElementById('lender-list'); if(list){ list.hidden = true; list.innerHTML = ''; } }
['income','dti','down'].forEach(id=>{
  const el = document.getElementById(id);
  el?.addEventListener('input',()=>{ el._touched = true; resetLenders(); });
});
document.getElementById('goal')?.addEventListener('change',()=> resetLenders());
document.getElementById('run-ai')?.addEventListener('click',()=>{
  const score = Number(credit?.value||700);
  const goal = document.getElementById('goal').value;
  const list = document.getElementById('lender-list');
  list.innerHTML = '';
  const lenders = [
    {name:'GreenLend', apr:4.9, term:300, fee:295, promo:'$500 rebate'},
    {name:'SunFinance', apr:5.5, term:240, fee:0, promo:'0% fees'},
    {name:'BrightCredit', apr:6.2, term:180, fee:199, promo:null}
  ];
  lenders.sort((a,b)=> goal==='lowest' ? (a.apr - b.apr) : (a.term - b.term));
  lenders.forEach((l,i)=>{
    const approval = Math.min(0.98, Math.max(0.55, (score-550)/250)) - i*0.07;
    const monthly = Math.round((21500*(l.apr/100/12)) / (1 - Math.pow(1 + (l.apr/100/12), -l.term)));
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row between"><strong>${l.name}</strong><span>${(approval*100).toFixed(0)}% approval</span></div>
      <div class="row gap" style="margin-top:6px">
        <span>APR ${l.apr}%</span>
        <span>Term ${l.term}m</span>
        <span>Monthly $${monthly}</span>
        <span>Fees $${l.fee}</span>
      </div>
      ${l.promo?`<div class="chip">${l.promo}</div>`:''}
      <div style="margin-top:8px"><button class="btn primary">Select & Continue</button></div>
    `;
    list.appendChild(card);
  });
  list.hidden = false;
});

function updateSummaryChips(){
  const fin = document.getElementById('fin-summary');
  const calc = document.getElementById('calc-summary');
  const chips = [`From proposal: ${appState.kw} kW`,`Capex $${appState.capex.toLocaleString()}`,`Est. $${appState.monthly}/mo`];
  if(fin) fin.innerHTML = chips.map(t=>`<span class="chip">${t}</span>`).join('');
  if(calc) calc.innerHTML = chips.map(t=>`<span class="chip">${t}</span>`).join('');
}

// Calculator
function amortizedPayment(P, annualRatePct, months){
  const r = (annualRatePct/100)/12;
  if(r===0) return P/months;
  return P*r/(1-Math.pow(1+r,-months));
}
function recalc(){
  const P = Number(document.getElementById('loan-amount').value||0);
  const apr = Number(document.getElementById('apr').value||0);
  const term = Number(document.getElementById('term').value||0);
  const util = Number(document.getElementById('util').value||0);
  const payment = Math.round(amortizedPayment(P,apr,term));
  const newUtil = Math.round(util*0.25); // assume 75% bill offset
  const net = payment + newUtil;
  const savePct = ((util - net)/util*100).toFixed(0);
  document.getElementById('c-solar').textContent = `$${payment}`;
  document.getElementById('c-newutil').textContent = `$${newUtil}`;
  document.getElementById('c-net').textContent = `$${net}`;
  document.getElementById('c-save').textContent = `${savePct}%`;
  const before = document.getElementById('bar-before');
  const after = document.getElementById('bar-after');
  const maxVal = Math.max(util, net, 1);
  const beforePct = Math.round((util / maxVal) * 100);
  const afterPct = Math.round((net / maxVal) * 100);
  before.style.width = beforePct + '%';
  after.style.width = afterPct + '%';
  before.querySelector('span').textContent = `Before: $${util}`;
  after.querySelector('span').textContent = `After: $${net}`;
}
document.getElementById('calc-run')?.addEventListener('click', recalc);
recalc();

function applyDefaultsToFinancing(){
  updateSummaryChips();
  // nothing to set except maybe encourage down payment based on capex
  const down = document.getElementById('down'); if(down && !down._touched) down.value = Math.round(appState.capex*0.05);
  // hide recommendations until user clicks
  const list = document.getElementById('lender-list'); if(list){ list.hidden = true; list.innerHTML = ''; }
}

function applyDefaultsToCalculator(){
  updateSummaryChips();
  const loan = document.getElementById('loan-amount'); if(loan && !loan._touched) loan.value = appState.capex;
  const util = document.getElementById('util'); if(util && !util._touched) util.value = appState.util;
  recalc();
}

// Handoff defaults: pre-fill proposal summary with customer details
function applyHandoffDefaults(){
  const pane = document.querySelector('#handoff-wizard [data-pane="confirm"]');
  if(!pane) return;
  const p = pane.querySelector('p');
  const lead = appState.currentLead||{};
  const name = lead.name||lead.id||'—';
  const addr = lead.address||'—';
  const email = lead.email||'—';
  if(p){ p.innerHTML = `Comfort package • ${appState.kw} kW • ~$${appState.monthly}/mo<br/><small>Customer: <strong>${name}</strong> • ${addr} • ${email}</small>`; }
}

// Cost Adjustment
const target = document.getElementById('target');
const targetVal = document.getElementById('target-val');
const sumPayment = document.getElementById('sum-payment');
target?.addEventListener('input',()=>{
  targetVal.textContent = `$${target.value}`;
  sumPayment.textContent = `$${target.value}`;
});
document.querySelectorAll('#suggestions .suggest .btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const delta = Number(btn.closest('.suggest').dataset.delta||0);
    const current = Number((sumPayment.textContent||'').replace(/[^\d]/g,''));
    const next = Math.max(60, current + delta);
    sumPayment.textContent = `$${next}`;
    toast('Suggestion applied');
  });
});

// Handoff wizard
const wizard = document.getElementById('handoff-wizard');
wizard?.addEventListener('click', (e)=>{
  const nextBtn = e.target.closest('.next');
  if(!nextBtn) return;
  const panes = [...wizard.querySelectorAll('.pane')];
  const idx = panes.findIndex(p=>!p.hidden);
  if(idx>=0 && idx<panes.length-1){
    panes[idx].hidden = true;
    panes[idx+1].hidden = false;
  }
});

// Generic checklist toggling
document.body.addEventListener('click',(e)=>{
  const li = e.target.closest('.checklist li[data-check]');
  if(li){
    li.classList.toggle('done');
    // if on preflight, recompute completeness and update Next button
    if(li.closest('#preflight-list')){
      const all = [...document.querySelectorAll('#preflight-list li')];
      preflightDone = all.length>0 && all.every(x=>x.classList.contains('done'));
      if(proposalStep==='preflight') setProposalStep('preflight');
    }
  }
});

// Survey schedule
document.getElementById('survey-schedule')?.addEventListener('click',()=>{
  const d = document.getElementById('survey-date').value || '(date)';
  toast(`Survey scheduled for ${d}`);
});

// CAD actions
document.getElementById('cad-upload')?.addEventListener('click',()=>{
  const ul = document.getElementById('cad-versions');
  const n = ul.children.length+1;
  const li = document.createElement('li'); li.textContent = `v${n} – Draft`;
  ul.appendChild(li); toast('Uploaded new plan set (placeholder)');
});
document.getElementById('cad-approve')?.addEventListener('click',()=> toast('Approved for True Up'));

// Change order totals
function recomputeCO(){
  let sum = 0;
  document.querySelectorAll('#co-body tr').forEach(row=>{
    const price = Number(row.dataset.price||0);
    const qty = Number(row.querySelector('.co-qty')?.value||0);
    const total = price*qty; sum += total;
    row.querySelector('.co-total').textContent = `$${total}`;
  });
  document.getElementById('co-sum').textContent = `$${sum}`;
}
document.querySelectorAll('.co-qty').forEach(i=> i.addEventListener('input', recomputeCO));
recomputeCO();

// RFI thread
document.getElementById('rfi-add')?.addEventListener('click',()=>{
  const txt = document.getElementById('rfi-text');
  if(!txt.value.trim()) return; const li = document.createElement('li');
  li.textContent = txt.value; document.getElementById('rfi-list').appendChild(li);
  txt.value='';
});

// Installation save
document.getElementById('install-save')?.addEventListener('click',()=>{
  const d = document.getElementById('install-date').value || '(date)';
  toast(`Installation saved for ${d}`);
});

// Inspection
document.getElementById('insp-schedule')?.addEventListener('click',()=>{
  const d = document.getElementById('insp-date').value || '(date)';
  toast(`Inspection scheduled for ${d}`);
});
document.getElementById('punch-add')?.addEventListener('click',()=>{
  const txt = document.getElementById('punch-text'); if(!txt.value.trim()) return;
  const li = document.createElement('li'); li.textContent = txt.value; document.getElementById('punch-list').appendChild(li); txt.value='';
});
document.getElementById('insp-pass')?.addEventListener('click',()=> toast('Inspection passed'));
document.getElementById('insp-fail')?.addEventListener('click',()=> toast('Inspection failed – punch list updated'));

// PTO
document.getElementById('pto-mark')?.addEventListener('click',()=> toast('PTO received'));

// Turn-on telemetry
document.getElementById('telemetry-run')?.addEventListener('click',()=>{
  const w = Math.round(4500 + Math.random()*1500);
  const kwh = (4 + Math.random()*3).toFixed(1);
  document.getElementById('telemetry').textContent = `${w} W / ${kwh} kWh today`;
});

// --------- Kanban Pipeline ----------
const PIPE_STAGES = [
  {id:'survey', title:'Site Survey', wip:5},
  {id:'cad', title:'CAD', wip:6},
  {id:'trueup', title:'True Up', wip:5},
  {id:'permitting', title:'Permitting', wip:8},
  {id:'install', title:'Installation', wip:6},
  {id:'inspection', title:'Inspection', wip:5},
  {id:'pto', title:'PTO', wip:7},
  {id:'turnon', title:'Turn‑On', wip:6},
  {id:'commissioning', title:'Commissioning', wip:10}
];
let jobs = [
  {id:'J-1001', name:'Lopez', address:'123 Palm St', contractor:'SunWorks', stage:'survey', sales:'Alex'},
  {id:'J-1002', name:'Singh', address:'44 Juniper Ave', contractor:'BrightInstall', stage:'cad', sales:'Alex'},
  {id:'J-1003', name:'Chen', address:'9 Acacia Ct', contractor:'SunWorks', stage:'permitting', sales:'Sam'},
  {id:'J-1004', name:'Miller', address:'77 Lake View', contractor:'SunWorks', stage:'install', sales:'Sam'},
  {id:'J-1005', name:'Khan', address:'15 Oak Blvd', contractor:'BrightInstall', stage:'inspection', sales:'Riley'}
];

function renderKanbanAt(rootId, filterId, contractorId){
  const root = document.getElementById(rootId); if(!root) return;
  const q = (document.getElementById(filterId)?.value||'').toLowerCase();
  const ctr = document.getElementById(contractorId)?.value||'';
  root.innerHTML = '';
  PIPE_STAGES.forEach(stage=>{
    const col = document.createElement('div'); col.className = 'kan-col'; col.dataset.stage = stage.id;
    col.innerHTML = `<div class="kan-header"><span class="kan-title">${stage.title}</span><span class="kan-count badge" data-count></span></div><div class="kan-cards" data-cards></div>`;
    const wrap = col.querySelector('[data-cards]');
    const items = jobs.filter(j=> j.stage===stage.id && (!ctr||j.contractor===ctr) && (!q|| (j.name+' '+j.address).toLowerCase().includes(q)));
    items.forEach(j=>{
      const card = document.createElement('div');
      card.className = 'kan-card'; card.draggable = true; card.dataset.id = j.id;
      const options = PIPE_STAGES.map(s=>`<option value="${s.id}" ${s.id===j.stage?'selected':''}>${s.title}</option>`).join('');
      card.innerHTML = `<strong>${j.name}</strong> • ${j.address}<br/><small>${j.contractor} • ${j.id}</small>
        <div style="margin-top:6px"><label style="font-size:12px;color:#64748B">Move to </label>
        <select class="move-select" data-id="${j.id}">${options}</select></div>`;
      card.addEventListener('dragstart', ev=>{ card.classList.add('dragging'); ev.dataTransfer.setData('text/plain', j.id); });
      card.addEventListener('dragend', ()=> card.classList.remove('dragging'));
      wrap.appendChild(card);
    });
    const countEl = col.querySelector('[data-count]');
    const limit = stage.wip ?? Infinity; const count = items.length;
    countEl.textContent = isFinite(limit) ? `${count}/${limit}` : String(count);
    countEl.classList.remove('wip-near','wip-over');
    if(isFinite(limit)){
      if(count >= limit) countEl.classList.add('wip-over');
      else if(count >= Math.ceil(limit*0.8)) countEl.classList.add('wip-near');
    }
    // DnD targets
    col.addEventListener('dragover', ev=>{ ev.preventDefault(); col.classList.add('kan-drop'); });
    col.addEventListener('dragleave', ()=> col.classList.remove('kan-drop'));
    col.addEventListener('drop', ev=>{
      ev.preventDefault(); col.classList.remove('kan-drop');
      const id = ev.dataTransfer.getData('text/plain');
      const job = jobs.find(x=>x.id===id); if(job){ job.stage = stage.id; renderAllKanbans(); toast(`Moved ${id} → ${stage.title}`);} 
    });
    root.appendChild(col);
  });
}
function renderAllKanbans(){
  renderKanbanAt('kanban','pipe-filter','pipe-contractor');
  renderKanbanAt('kanban-home','ch-filter','ch-contractor');
  renderContractorDashboard();
  renderContractorList();
  updateNavBadges();
}

document.getElementById('pipe-filter')?.addEventListener('input', ()=>renderKanbanAt('kanban','pipe-filter','pipe-contractor'));
document.getElementById('pipe-contractor')?.addEventListener('change', ()=>renderKanbanAt('kanban','pipe-filter','pipe-contractor'));
document.getElementById('ch-filter')?.addEventListener('input', ()=>renderKanbanAt('kanban-home','ch-filter','ch-contractor'));
document.getElementById('ch-contractor')?.addEventListener('change', ()=>renderKanbanAt('kanban-home','ch-filter','ch-contractor'));
document.getElementById('ch-filter')?.addEventListener('input', renderContractorList);
document.getElementById('ch-contractor')?.addEventListener('change', renderContractorList);

// Backbar actions
document.getElementById('back-home')?.addEventListener('click',()=>{
  nextContractorTab = lastContractorTab; // preserve
  location.hash = '#contractor';
});
document.getElementById('back-board')?.addEventListener('click',()=>{
  nextContractorTab = 'c-board';
  location.hash = '#contractor';
});

// Move-select handler
document.body.addEventListener('change',(e)=>{
  const sel = e.target.closest('select.move-select');
  if(!sel) return; const id = sel.dataset.id; const job = jobs.find(j=>j.id===id);
  if(job){ job.stage = sel.value; renderAllKanbans(); toast(`Moved ${id} → ${PIPE_STAGES.find(s=>s.id===sel.value)?.title}`); }
});

// Render when visiting route
window.addEventListener('hashchange',()=>{
  if(location.hash==='#pipeline') renderKanbanAt('kanban','pipe-filter','pipe-contractor');
  if(location.hash==='#contractor') { 
    renderKanbanAt('kanban-home','ch-filter','ch-contractor'); 
    renderContractorDashboard(); 
    renderContractorList(); 
    updateNavBadges(); 
    renderContractorRightPane();
    // honor pending tab switch
    if(nextContractorTab){
      const el = document.querySelector(`#contractor-tabs .tab[data-tab="${nextContractorTab}"]`);
      el?.click();
      nextContractorTab = null;
    }
  }
  if(location.hash==='#financing') applyDefaultsToFinancing();
  if(location.hash==='#calculator') applyDefaultsToCalculator();
  if(location.hash==='#proposal') initProposal();
  if(location.hash==='#handoff') applyHandoffDefaults();
  if(location.hash==='#sales-projects') renderSalesProjects();
  if(location.hash==='#editor') renderVersionList();
});
if(location.hash==='#pipeline') renderKanbanAt('kanban','pipe-filter','pipe-contractor');
if(location.hash==='#contractor') { renderKanbanAt('kanban-home','ch-filter','ch-contractor'); renderContractorDashboard(); renderContractorList(); updateNavBadges(); renderContractorRightPane(); }
if(location.hash==='#financing') applyDefaultsToFinancing();
if(location.hash==='#calculator') applyDefaultsToCalculator();
if(location.hash==='#proposal' || location.hash==='') initProposal();
if(location.hash==='#handoff') applyHandoffDefaults();
if(location.hash==='#sales-projects') renderSalesProjects();
if(location.hash==='#editor') renderVersionList();

function renderContractorDashboard(){
  const counts = Object.fromEntries(PIPE_STAGES.map(s=>[s.id, jobs.filter(j=>j.stage===s.id).length]));
  const total = jobs.length; const sla = Math.max(0, Math.floor(counts.permitting/2) + (counts.inspection>0?1:0));
  const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = String(val); };
  set('ctr-total', total);
  set('ctr-sla', sla);
  set('ctr-permit', counts.permitting||0);
  set('ctr-install', counts.install||0);
  set('ctr-inspect', counts.inspection||0);
  set('ctr-pto', counts.pto||0);
  const upcoming = document.getElementById('ctr-upcoming'); if(upcoming){
    upcoming.innerHTML = '';
    const items = jobs.filter(j=> ['survey','install','inspection'].includes(j.stage)).slice(0,5);
    if(items.length===0){ upcoming.innerHTML = '<li>No scheduled items</li>'; }
    else items.forEach(j=>{
      const li = document.createElement('li'); li.textContent = `${j.name} — ${PIPE_STAGES.find(s=>s.id===j.stage).title}`; upcoming.appendChild(li);
    });
  }
}

function renderContractorList(){
  const tbody = document.getElementById('ctr-tbody'); if(!tbody) return;
  const q = (document.getElementById('ch-filter')?.value||'').toLowerCase();
  const ctr = document.getElementById('ch-contractor')?.value||'';
  const filtered = jobs.filter(j=> (!ctr||j.contractor===ctr) && (!q || (j.name+' '+j.address).toLowerCase().includes(q)));
  tbody.innerHTML = '';
  filtered.forEach(j=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${j.id}</td><td>${j.name}</td><td>${j.address}</td><td>${PIPE_STAGES.find(s=>s.id===j.stage).title}</td><td>${j.contractor}</td>`;
    tbody.appendChild(tr);
  });
}

// --------- Sales: My Projects (read-only) ----------
function renderSalesProjects(){
  const root = document.getElementById('sales-projects-root'); if(!root) return;
  const user = appState.user?.name || '';
  const mine = jobs.filter(j=> j.sales === user);
  const byStage = PIPE_STAGES.map(s=>({
    id: s.id,
    title: s.title,
    items: mine.filter(j=> j.stage === s.id)
  }));
  root.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'kanban';
  byStage.forEach(col=>{
    const el = document.createElement('div'); el.className = 'kan-col';
    el.innerHTML = `<div class="kan-header"><span class="kan-title">${col.title}</span><span class="kan-count badge">${col.items.length}</span></div><div class="kan-cards"></div>`;
    const cards = el.querySelector('.kan-cards');
    col.items.forEach(j=>{
      const c = document.createElement('div'); c.className='kan-card';
      c.innerHTML = `<strong>${j.name}</strong> • ${j.address}<br/><small>${j.contractor} • ${j.id}</small>`;
      cards.appendChild(c);
    });
    wrap.appendChild(el);
  });
  root.appendChild(wrap);
}

function updateNavBadges(){
  const total = jobs.length;
  const pipe = document.getElementById('badge-pipe'); if(pipe) pipe.textContent = String(total);
  const ctr = document.getElementById('badge-ctr'); if(ctr) ctr.textContent = String(total);
}

// --------- Sales Dashboard ----------
const SD_STATUSES = [
  {id:'new', label:'New', color:'#8B5CF6'},
  {id:'qualified', label:'Qualified', color:'#10B981'},
  {id:'appointment', label:'Appointment Set', color:'#F59E0B'},
  {id:'converted', label:'Converted', color:'#22C55E'},
  {id:'disqualified', label:'Disqualified', color:'#EF4444'}
];
// Persistence helpers
function loadJSON(key, fallback){
  try{ const v = JSON.parse(localStorage.getItem(key)); return v??fallback; }catch{ return fallback; }
}
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function seedLeads(){
  return [
    {id:'L-1001', user:'Alex', created:daysAgo(9), status:'appointment', name:'Lopez', email:'lopez@example.com', address:'123 Palm St'},
    {id:'L-1002', user:'Alex', created:daysAgo(2), status:'qualified', name:'Singh', email:'singh@example.com', address:'44 Juniper Ave'},
    {id:'L-1003', user:'Sam', created:daysAgo(12), status:'converted', name:'Chen', email:'chen@example.com', address:'9 Acacia Ct'},
    {id:'L-1004', user:'Sam', created:daysAgo(1), status:'new', name:'Miller', email:'miller@example.com', address:'77 Lake View'},
    {id:'L-1005', user:'Riley', created:daysAgo(20), status:'disqualified', name:'Khan', email:'khan@example.com', address:'15 Oak Blvd'}
  ];
}
let leads = loadJSON('ssh_leads', seedLeads()).map(l=>({...l, created:new Date(l.created)}));
let finPending = loadJSON('ssh_fin_pending', []);
let finRecent = loadJSON('ssh_fin_recent', []);
function daysAgo(n){ const d = new Date(); d.setDate(d.getDate()-n); return d; }

function renderSales(){
  // populate user filter
  const userSel = document.getElementById('sd-user'); if(userSel && userSel.options.length<=1){
    const users = Array.from(new Set(leads.map(l=>l.user)));
    users.forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; userSel.appendChild(o); });
  }
  const wnd = Number(document.getElementById('sd-window')?.value||90);
  const user = document.getElementById('sd-user')?.value||'all';
  const since = new Date(); since.setDate(since.getDate()-wnd);
  const view = leads.filter(l=> l.created>=since && (user==='all'||l.user===user));
  const count = view.length;
  const today = view.filter(l=> sameDay(l.created, new Date())).length;
  const byStatus = Object.fromEntries(SD_STATUSES.map(s=>[s.id, view.filter(l=>l.status===s.id).length]));
  // tiles
  setText('sd-total', count);
  setText('sd-total-sub', `${today} today`);
  setText('sd-qualified', byStatus.qualified||0);
  const qRate = pct(byStatus.qualified, count); setText('sd-qualified-sub', `${qRate}% rate`);
  setText('sd-appt', byStatus.appointment||0);
  const aRate = pct(byStatus.appointment, byStatus.qualified||1); setText('sd-appt-sub', `${aRate}% from qualified`);
  setText('sd-new-count', byStatus.new||0);
  setText('sd-conv', byStatus.converted||0);
  const cRate = pct(byStatus.converted, count); setText('sd-conv-sub', `${cRate}% of ${count}`);
  // breakdown
  const ul = document.getElementById('sd-breakdown'); if(ul){ ul.innerHTML=''; SD_STATUSES.forEach(s=>{
    const li = document.createElement('li'); li.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.color};margin-right:8px"></span>${s.label}<span style="float:right">${byStatus[s.id]||0}</span>`; ul.appendChild(li);
  }); }
  // table
  const tbody = document.querySelector('#sd-table tbody');
  if(tbody){
    tbody.innerHTML = '';
    view.forEach(l=>{
      const tr = document.createElement('tr');
      const actions = [
        l.status!=='qualified'?`<button class="btn sm" data-action="lead-qual" data-id="${l.id}">Qualify</button>`:'',
        `<button class="btn sm" data-action="lead-prop" data-id="${l.id}">Start Proposal</button>`,
        (l.status==='qualified'?`<button class="btn sm" data-action="lead-submit" data-id="${l.id}">Submit Finance</button>`:''),
        `<button class="btn sm" data-action="lead-follow" data-id="${l.id}">Follow-up</button>`
      ].filter(Boolean).join(' ');
      tr.innerHTML = `<td>${l.id}</td><td>${l.name||'-'}</td><td>${l.user}</td><td>${l.status}</td><td>${new Date(l.created).toLocaleDateString()}</td><td>${actions}</td>`;
      tbody.appendChild(tr);
    });
  }
  // KPI bars
  setBar('sd-qual-rate','sd-qual-rate-val', qRate);
  setBar('sd-appt-rate','sd-appt-rate-val', aRate);
  const dRate = pct(byStatus.disqualified, count); setBar('sd-disq-rate','sd-disq-rate-val', dRate);
}
function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent = String(txt); }
function setBar(barId, valId, pctVal){ const bar=document.getElementById(barId); const val=document.getElementById(valId); if(bar) bar.style.width = `${pctVal}%`; if(val) val.textContent = `${pctVal}%`; }
function pct(n,d){ if(!d) return 0; return Math.round((n/d)*1000)/10; }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

document.getElementById('sd-window')?.addEventListener('change', renderSales);
document.getElementById('sd-user')?.addEventListener('change', renderSales);
document.getElementById('sd-refresh')?.addEventListener('click', renderSales);
// New Lead modal helpers
function hideNewLeadModal(){ const m=document.getElementById('modal-new-lead'); if(m) m.hidden = true; }
function showNewLeadModal(){ const m=document.getElementById('modal-new-lead'); if(m) m.hidden = false; }
document.getElementById('modal-new-lead')?.setAttribute('hidden','');
// Open
document.getElementById('sd-new')?.addEventListener('click', showNewLeadModal);
// Close buttons
document.getElementById('ml-close')?.addEventListener('click', hideNewLeadModal);
document.getElementById('ml-cancel')?.addEventListener('click', hideNewLeadModal);
// Click outside card closes
document.getElementById('modal-new-lead')?.addEventListener('click', (e)=>{ if(e.target.id==='modal-new-lead') hideNewLeadModal(); });
// Escape closes
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideNewLeadModal(); });
// Modal submit
document.getElementById('new-lead-form')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const id = 'L-'+Math.floor(1000+Math.random()*9000);
  leads.push({
    id,
    user: fd.get('user')||'Alex',
    created: new Date(),
    status:'new',
    name: fd.get('name')||'',
    phone: fd.get('phone')||'',
    email: fd.get('email')||'',
    address: fd.get('address')||'',
    source: fd.get('source')||'Web',
    notes: fd.get('notes')||''
  });
  saveJSON('ssh_leads', leads);
  renderSales();
  hideNewLeadModal();
  (e.target).reset();
  toast(`Lead ${id} created`);
});
// Follow-ups modal (stale > 7 days; supports snooze and done)
function showFollowups(){
  const list = document.getElementById('fu-list'); if(!list) return;
  const now = new Date();
  const stale = leads.filter(l=>{
    const age = (now - new Date(l.created))/(1000*60*60*24);
    const next = l.nextContact ? new Date(l.nextContact) : null;
    const due = !next || next <= now;
    return !l.followupDone && age>7 && due && !['new','qualified'].includes(l.status);
  });
  list.innerHTML = '';
  if(stale.length===0){ list.innerHTML = '<li>No follow-ups found</li>'; }
  stale.forEach(l=>{
    const li = document.createElement('li');
    const nextTxt = l.nextContact ? ` • Next: ${new Date(l.nextContact).toLocaleDateString()}` : '';
    li.innerHTML = `<strong>${l.name||l.id}</strong> • ${l.status} • ${new Date(l.created).toLocaleDateString()}${nextTxt}
      <div class="row gap" style="margin-top:6px">
        <button class="btn sm" data-action="lead-prop" data-id="${l.id}">Start Proposal</button>
        <button class="btn sm" data-fu-snooze="3" data-id="${l.id}">Snooze 3d</button>
        <button class="btn sm" data-fu-snooze="7" data-id="${l.id}">Snooze 7d</button>
        <button class="btn sm" data-fu-snooze="14" data-id="${l.id}">Snooze 14d</button>
        <button class="btn sm" data-fu-done="${l.id}">Mark Done</button>
      </div>`;
    list.appendChild(li);
  });
  document.getElementById('modal-followups').hidden = false;
}
document.getElementById('fu-close')?.addEventListener('click', ()=> document.getElementById('modal-followups').hidden = true);
document.getElementById('sd-followups')?.addEventListener('click', showFollowups);
document.body.addEventListener('click',(e)=>{
  const done = e.target.closest('[data-fu-done]');
  if(done){
    const id = done.getAttribute('data-fu-done'); const l = leads.find(x=>x.id===id);
    if(l){ l.followupDone = true; saveJSON('ssh_leads', leads); }
    document.getElementById('modal-followups').hidden = true; renderSales(); toast('Follow-up marked done');
  }
  const snz = e.target.closest('[data-fu-snooze]');
  if(snz){
    const d = Number(snz.getAttribute('data-fu-snooze')||'7');
    const id = snz.getAttribute('data-id');
    const l = leads.find(x=>x.id===id);
    if(l){ l.nextContact = new Date(Date.now()+d*24*60*60*1000).toISOString(); saveJSON('ssh_leads', leads); }
    document.getElementById('modal-followups').hidden = true; renderSales(); toast(`Snoozed ${d} days`);
  }
});

// Sales actions routing
document.body.addEventListener('click',(e)=>{
  const qa = e.target.closest('[data-action="lead-qual"]');
  const sp = e.target.closest('[data-action="lead-prop"]');
  const fu = e.target.closest('[data-action="lead-follow"]');
  const sf = e.target.closest('[data-action="lead-submit"]');
  if(qa){
    const id = qa.dataset.id; const l = leads.find(x=>x.id===id); if(l){ l.status='qualified'; saveJSON('ssh_leads', leads); toast(`${id} qualified`); renderSales(); }
    return;
  }
  if(sp){
    const id = sp.dataset.id; const l = leads.find(x=>x.id===id);
    if(l){ appState.currentLead = {id:l.id, name:l.name, email:l.email||'', address:l.address||'', user:l.user||''}; document.querySelector('.crumbs').textContent = `Customer • ${l.name||l.id}`; }
    location.hash = '#proposal';
    return;
  }
  if(sf){
    const id = sf.dataset.id; const l = leads.find(x=>x.id===id);
    if(l){
      finPending.unshift({id:`F-${id}`, lead:l.name||id, user:l.user, submitted:new Date().toISOString(), leadId:l.id, address:l.address||'', email:l.email||''});
      saveJSON('ssh_fin_pending', finPending);
      toast(`${id} submitted to Finance`);
      location.hash = '#finance';
    }
    return;
  }
  if(fu){
    const id = fu.dataset.id; const l = leads.find(x=>x.id===id);
    if(l){ l.nextContact = new Date(Date.now()+7*24*60*60*1000).toISOString(); saveJSON('ssh_leads', leads); toast('Follow-up in 7 days'); renderSales(); }
    return;
  }
});

// Phase list in right pane
function renderPhaseList(){
  const host = document.getElementById('phase-list'); if(!host) return;
  host.innerHTML = '';
  PIPE_STAGES.forEach(s=>{
    const count = jobs.filter(j=>j.stage===s.id).length;
    const item = document.createElement('li'); item.className = 'phase-item';
    item.innerHTML = `
      <div>
        <div class="row between"><strong>${s.title}</strong><span class="meta">${count} jobs</span></div>
        <div class="phase-progress"><span style="width:${Math.min(100, (count/((s.wip||6)))*100)}%"></span></div>
      </div>
      <div class="row gap">
        <button class="btn sm" data-phase-open="${s.id}">Open</button>
        <button class="btn sm" data-phase-board="${s.id}">Board</button>
      </div>`;
    host.appendChild(item);
  });
}

document.body.addEventListener('click',(e)=>{
  const open = e.target.closest('[data-phase-open]');
  if(open){ location.hash = '#' + open.dataset.phaseOpen; return; }
  const board = e.target.closest('[data-phase-board]');
  if(board){
    document.querySelector('#contractor-tabs .tab[data-tab="c-board"]').click();
    // no direct filter per lane; guide user visually
    document.getElementById('kanban-home')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
});

// Finance dashboard (render + actions)
function renderFinance(){
  const tbody = document.querySelector('#fin-pending tbody');
  if(tbody){ tbody.innerHTML=''; finPending.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${r.lead}</td><td>${r.user}</td><td>${new Date(r.submitted).toLocaleDateString()}</td>
      <td class="row gap"><button class="btn sm" data-fin-approve="${r.id}">Approve</button><button class="btn sm" data-fin-reject="${r.id}">Reject</button></td>`;
    tbody.appendChild(tr);
  }); }
  const ul = document.getElementById('fin-recent'); if(ul){ ul.innerHTML=''; finRecent.slice(0,8).forEach(x=>{
    const li = document.createElement('li'); li.textContent = `${x.id} • ${x.action} by ${x.user} (${new Date(x.when).toLocaleDateString()})`; ul.appendChild(li);
  }); }
}
document.getElementById('fin-refresh')?.addEventListener('click', ()=> renderFinance());
document.body.addEventListener('click',(e)=>{
  const ap = e.target.closest('[data-fin-approve]');
  const rj = e.target.closest('[data-fin-reject]');
  if(ap){
    const id = ap.dataset.finApprove; const idx = finPending.findIndex(x=>x.id===id);
    if(idx>=0){
      const row = finPending.splice(idx,1)[0];
      finRecent.unshift({id:row.id, action:'Approved', user:appState.user?.name||'Finance', when:new Date().toISOString()});
      saveJSON('ssh_fin_pending', finPending); saveJSON('ssh_fin_recent', finRecent);
      const jid = 'J-'+Math.floor(1000+Math.random()*9000);
      jobs.unshift({id:jid, name:row.lead, address:row.address||'TBD', contractor:'SunWorks', stage:'survey', sales: row.user});
      renderAllKanbans();
      renderFinance();
      toast(`${id} approved → Job ${jid} created`);
    }
    return;
  }
  if(rj){
    const id = rj.dataset.finReject; const idx = finPending.findIndex(x=>x.id===id);
    if(idx>=0){
      const row = finPending.splice(idx,1)[0];
      finRecent.unshift({id:row.id, action:'Rejected', user:appState.user?.name||'Finance', when:new Date().toISOString()});
      saveJSON('ssh_fin_pending', finPending); saveJSON('ssh_fin_recent', finRecent);
      renderFinance();
      toast(`${id} rejected`);
    }
    return;
  }
});

// Integrate renders
function renderContractorRightPane(){
  renderPhaseList();
}
