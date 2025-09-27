// Simple hash router
const routes = [
  "proposal","editor","financing","calculator","adjust","handoff",
  "survey","cad","trueup","permitting","install","inspection","pto","turnon","commissioning","pipeline","contractor"
];
function showRoute(id){
  document.querySelectorAll('.route').forEach(s=>s.hidden=true);
  const el = document.getElementById(id) || document.getElementById('proposal');
  el.hidden = false;
  // update sidebar active
  document.querySelectorAll('.sidebar .nav-link').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
  });
}
window.addEventListener('hashchange',()=>{
  const id = location.hash.replace('#','') || 'proposal';
  if(routes.includes(id)) showRoute(id);
});
showRoute((location.hash||'#proposal').replace('#',''));

// Toast helper
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  setTimeout(()=> t.hidden = true, 2200);
}

// Proposal Creation interactivity
const markBtn = document.getElementById('mark-preflight');
const analysisBtn = document.getElementById('start-analysis');
const analysisStatus = document.getElementById('analysis-status');
const packageCards = document.getElementById('package-cards');
const kpiKw = document.getElementById('kpi-kw');
const kpiKwh = document.getElementById('kpi-kwh');
const kpiMonthly = document.getElementById('kpi-monthly');
const kpiSavings = document.getElementById('kpi-savings');

markBtn?.addEventListener('click',()=>{
  document.querySelectorAll('#preflight-list li').forEach(li=>{
    li.textContent = li.textContent.replace(/\s*$/,' ✓');
  });
  toast('Preflight complete');
});

analysisBtn?.addEventListener('click',()=>{
  analysisStatus.hidden = false;
  packageCards.hidden = true;
  // simulate async
  setTimeout(()=>{
    analysisStatus.hidden = true;
    // populate KPIs and show packages
    kpiKw.textContent = '7.5';
    kpiKwh.textContent = '11,300';
    kpiMonthly.textContent = '$132';
    kpiSavings.textContent = '28%';
    packageCards.hidden = false;
    toast('Site analysis complete');
  }, 1200);
});

document.querySelectorAll('#package-cards .select-tier').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('#package-cards .pkg').forEach(c=>c.classList.remove('selected'));
    const card = btn.closest('.pkg');
    card?.classList.add('selected');
    toast(`Selected ${card?.querySelector('h3')?.textContent} as baseline`);
  });
});

// Tabs in editor
document.querySelectorAll('[data-tabs]').forEach(group=>{
  group.querySelectorAll('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      group.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      document.querySelectorAll('.tabpane').forEach(p=>p.classList.remove('active'));
      document.getElementById(`tab-${name}`)?.classList.add('active');
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
credit?.addEventListener('input',()=> creditVal.textContent = credit.value);
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
});

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
  before.style.width = Math.min(100, util).toString()+"%";
  after.style.width = Math.min(100, net).toString()+"%";
  after.querySelector('span').textContent = `After: $${net}`;
}
document.getElementById('calc-run')?.addEventListener('click', recalc);
recalc();

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
  if(li){ li.classList.toggle('done'); }
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
  {id:'J-1001', name:'Lopez', address:'123 Palm St', contractor:'SunWorks', stage:'survey'},
  {id:'J-1002', name:'Singh', address:'44 Juniper Ave', contractor:'BrightInstall', stage:'cad'},
  {id:'J-1003', name:'Chen', address:'9 Acacia Ct', contractor:'SunWorks', stage:'permitting'},
  {id:'J-1004', name:'Miller', address:'77 Lake View', contractor:'SunWorks', stage:'install'},
  {id:'J-1005', name:'Khan', address:'15 Oak Blvd', contractor:'BrightInstall', stage:'inspection'}
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
}

document.getElementById('pipe-filter')?.addEventListener('input', ()=>renderKanbanAt('kanban','pipe-filter','pipe-contractor'));
document.getElementById('pipe-contractor')?.addEventListener('change', ()=>renderKanbanAt('kanban','pipe-filter','pipe-contractor'));
document.getElementById('ch-filter')?.addEventListener('input', ()=>renderKanbanAt('kanban-home','ch-filter','ch-contractor'));
document.getElementById('ch-contractor')?.addEventListener('change', ()=>renderKanbanAt('kanban-home','ch-filter','ch-contractor'));

// Move-select handler
document.body.addEventListener('change',(e)=>{
  const sel = e.target.closest('select.move-select');
  if(!sel) return; const id = sel.dataset.id; const job = jobs.find(j=>j.id===id);
  if(job){ job.stage = sel.value; renderAllKanbans(); toast(`Moved ${id} → ${PIPE_STAGES.find(s=>s.id===sel.value)?.title}`); }
});

// Render when visiting route
window.addEventListener('hashchange',()=>{
  if(location.hash==='#pipeline') renderKanbanAt('kanban','pipe-filter','pipe-contractor');
  if(location.hash==='#contractor') { renderKanbanAt('kanban-home','ch-filter','ch-contractor'); renderContractorDashboard(); }
});
if(location.hash==='#pipeline') renderKanbanAt('kanban','pipe-filter','pipe-contractor');
if(location.hash==='#contractor') { renderKanbanAt('kanban-home','ch-filter','ch-contractor'); renderContractorDashboard(); }

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
