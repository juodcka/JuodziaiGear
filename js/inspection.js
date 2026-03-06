// â•â•â•â• INSPECTION â•â•â•â•
let inspView='soft'; // 'soft' | 'hard'
function setInspView(v){
  inspView=v;
  document.getElementById('inspTabSoft').classList.toggle('active',v==='soft');
  document.getElementById('inspTabHard').classList.toggle('active',v==='hard');
  document.getElementById('inspViewSoft').style.display=v==='soft'?'':'none';
  document.getElementById('inspViewHard').style.display=v==='hard'?'':'none';
  renderInspection();
}
function getAgeYears(dateProd){
  if(!dateProd) return null;
  const prod=new Date(dateProd);
  if(isNaN(prod.getTime())) return null;
  const now=new Date();
  return (now - prod) / (1000*60*60*24*365.25);
}
function ageClass(years){
  if(years===null) return null;
  if(years>=7) return 'red';
  if(years>=5) return 'amber';
  return 'green';
}
function ageLabel(years){
  if(years===null) return 'â€”';
  const y=Math.floor(years);
  const m=Math.floor((years-y)*12);
  return y>0?`${y}y ${m}m`:`${m}m`;
}
function inspActionBtns(i){
  return `<td><div class="td-actions">
    ${i.status!=='retired'?`<button class="btn btn-ghost btn-sm icon-btn" onclick="logInspectionNow('${i.gear_id}')" title="Log Inspection â€” Passed">${IC.shield}</button>`:''}
    ${i.status!=='retired'?`<button class="btn btn-warn btn-sm icon-btn" onclick="openFailInspection('${i.gear_id}')" title="Failed Inspection â€” Retire">${IC.warn}</button>`:''}
    <button class="btn btn-ghost btn-sm icon-btn" onclick="openEdit('${i.gear_id}')" title="Edit">${IC.pencil}</button>
    <button class="btn btn-danger btn-sm icon-btn" onclick="deleteItem('${i.gear_id}')" title="Delete">${IC.x}</button>
  </div></td>`;
}
function inspInspCell(i){
  const log=getServiceLog(i);
  const lastInsp=log.find(e=>e.type==='Inspection');
  if(!lastInsp) return `<td style="color:var(--muted);font-size:12px">â€”</td>`;
  const failed=lastInsp.note&&lastInsp.note.startsWith('FAILED:');
  const dot=failed
    ?`<span class="insp-dot insp-dot-fail" title="Last inspection failed"></span>`
    :`<span class="insp-dot insp-dot-pass" title="Last inspection passed"></span>`;
  const noteText=failed?lastInsp.note.replace(/^FAILED:\s*/,''):lastInsp.note;
  return `<td><div class="insp-last">${dot}<div><div class="insp-last-date">${esc(lastInsp.date)}</div><div class="insp-last-note" title="${esc(noteText)}">${esc(noteText)}</div></div></div></td>`;
}
function inspPhotoCell(i){
  const emoji=CAT_EMOJI[i.category]||'ðŸŽ’';
  const safePhoto=safeUrl(i.photo_url);
  return `<td><div class="td-photo">${safePhoto?`<img src="${safePhoto}" onerror="this.parentElement.innerHTML='${emoji}'" alt="">`:emoji}</div></td>`;
}
function inspStatusBadge(i){
  return i.status==='lent'?'<span class="tag tag-lent">Lent</span>':i.status==='retired'?'<span class="tag tag-retired">Retired</span>':'<span class="tag tag-camping">Active</span>';
}
function renderInspection(){
  const mode=document.getElementById('inspStatusFilter')?.value||'active';
  const base=mode==='all'?items:items.filter(i=>i.status!=='retired');
  if(inspView==='soft') renderInspSoft(base);
  else renderInspHard(base);
}
function renderInspSoft(base){
  const pool=base.filter(i=>i.date_produced);
  const green=pool.filter(i=>ageClass(getAgeYears(i.date_produced))==='green');
  const amber=pool.filter(i=>ageClass(getAgeYears(i.date_produced))==='amber');
  const red  =pool.filter(i=>ageClass(getAgeYears(i.date_produced))==='red');

  document.getElementById('inspCards').innerHTML=`
    <div class="insp-card age-green">
      <div class="insp-label">&#60; 5 Years Old</div>
      <div class="insp-value">${green.length}</div>
      <div class="insp-sub">items in good standing</div>
    </div>
    <div class="insp-card age-amber">
      <div class="insp-label">5 â€“ 7 Years Old</div>
      <div class="insp-value">${amber.length}</div>
      <div class="insp-sub">consider inspection</div>
    </div>
    <div class="insp-card age-red">
      <div class="insp-label">7+ Years Old</div>
      <div class="insp-value">${red.length}</div>
      <div class="insp-sub">inspect or replace</div>
    </div>
    <div class="insp-card" style="background:var(--surface);border-color:var(--border)">
      <div class="insp-label" style="color:var(--muted)">Total Tracked</div>
      <div class="insp-value" style="color:var(--accent)">${pool.length}</div>
      <div class="insp-sub">items with prod. date</div>
    </div>`;

  const sorted=[...pool].sort((a,b)=>(getAgeYears(b.date_produced)||0)-(getAgeYears(a.date_produced)||0));
  if(!sorted.length){
    document.getElementById('inspTbody').innerHTML=`<tr><td colspan="10" style="text-align:center;padding:36px;color:var(--muted)">No items with production date set</td></tr>`;
    return;
  }
  document.getElementById('inspTbody').innerHTML=sorted.map(i=>{
    const yrs=getAgeYears(i.date_produced);
    const cls=ageClass(yrs);
    const dotColor={'green':'age-dot-green','amber':'age-dot-amber','red':'age-dot-red'}[cls];
    return `<tr class="insp-row-${cls}">
      ${inspPhotoCell(i)}
      <td class="td-name" onclick="openDetail('${i.gear_id}')">${esc(i.name)}<small>${esc(i.brand)}${i.model?' Â· '+esc(i.model):''}</small></td>
      <td>${esc(i.brand)||'â€”'}</td>
      <td><span class="tag" style="${getCatTagStyle(i.category)}">${i.category}</span></td>
      <td>${i.type||'â€”'}</td>
      <td>${i.date_produced||'â€”'}</td>
      <td><span class="age-dot ${dotColor}"></span>${ageLabel(yrs)}</td>
      <td>${inspStatusBadge(i)}</td>
      ${inspInspCell(i)}
      ${inspActionBtns(i)}
    </tr>`;
  }).join('');
}
function renderInspHard(base){
  const pool=base.filter(i=>!i.date_produced);
  const neverInspected=pool.filter(i=>!getServiceLog(i).find(e=>e.type==='Inspection'));
  const inspected=pool.length-neverInspected.length;

  document.getElementById('inspCardsHard').innerHTML=`
    <div class="insp-card" style="background:var(--surface);border-color:var(--border)">
      <div class="insp-label" style="color:var(--muted)">Total Hard Goods</div>
      <div class="insp-value" style="color:var(--accent)">${pool.length}</div>
      <div class="insp-sub">no production date</div>
    </div>
    <div class="insp-card age-green">
      <div class="insp-label">Inspected</div>
      <div class="insp-value">${inspected}</div>
      <div class="insp-sub">have inspection log</div>
    </div>
    <div class="insp-card age-amber">
      <div class="insp-label">Never Inspected</div>
      <div class="insp-value">${neverInspected.length}</div>
      <div class="insp-sub">no log entry yet</div>
    </div>`;

  if(!pool.length){
    document.getElementById('inspTbodyHard').innerHTML=`<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--muted)">No hard goods (all items have production dates set)</td></tr>`;
    return;
  }
  // Sort: never inspected first, then by name
  const sorted=[...pool].sort((a,b)=>{
    const aInsp=!!getServiceLog(a).find(e=>e.type==='Inspection');
    const bInsp=!!getServiceLog(b).find(e=>e.type==='Inspection');
    if(aInsp!==bInsp) return aInsp?1:-1;
    return (a.name||'').localeCompare(b.name||'');
  });
  document.getElementById('inspTbodyHard').innerHTML=sorted.map(i=>{
    const hasInsp=!!getServiceLog(i).find(e=>e.type==='Inspection');
    const rowCls=hasInsp?'':'insp-row-amber';
    return `<tr class="${rowCls}">
      ${inspPhotoCell(i)}
      <td class="td-name" onclick="openDetail('${i.gear_id}')">${esc(i.name)}<small>${esc(i.brand)}${i.model?' Â· '+esc(i.model):''}</small></td>
      <td>${esc(i.brand)||'â€”'}</td>
      <td><span class="tag" style="${getCatTagStyle(i.category)}">${i.category}</span></td>
      <td>${i.type||'â€”'}</td>
      <td>${inspStatusBadge(i)}</td>
      ${inspInspCell(i)}
      ${inspActionBtns(i)}
    </tr>`;
  }).join('');
}


