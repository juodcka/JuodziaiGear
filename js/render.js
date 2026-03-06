// ÔòÉÔòÉÔòÉÔòÉ CARD HTML ÔòÉÔòÉÔòÉÔòÉ
function cardHTML(item){
  const emoji=CAT_EMOJI[item.category]||'­ƒÄÆ';
  const lend=currentLend(item.gear_id);
  const safePhoto=safeUrl(item.photo_url);
  const photo=safePhoto?`<div class="card-photo"><img src="${safePhoto}" alt="" onerror="this.parentElement.innerHTML='${emoji}'"></div>`:`<div class="card-photo">${emoji}</div>`;
  const lentRow=item.status==='lent'&&lend?`<div class="card-meta-row" style="color:var(--warn)">­ƒñØ ${esc(lend.lent_to)}${lend.date_due?' ┬À due '+esc(lend.date_due):''}</div>`:'';
  return `<div class="gear-card ${item.status}" onclick="openDetail('${item.gear_id}')">
    ${photo}<div class="card-body">
    <div class="card-badges">
      <span class="tag" style="${getCatTagStyle(item.category)}">${item.category}</span>
      ${item.type?`<span class="tag tag-muted">${item.type}</span>`:''}
      ${item.subtype?`<span class="tag tag-muted">${item.subtype}</span>`:''}
      ${item.status==='lent'?'<span class="tag tag-lent">Lent</span>':''}
      ${item.status==='retired'?'<span class="tag tag-retired">Retired</span>':''}
      ${activeTrip(item.gear_id)?'<span class="tag tag-in_trip">In Trip</span>':''}
      ${(item.tags||[]).map(t=>`<span class="tag tag-user-tag">${esc(t)}</span>`).join('')}
    </div>
    <div class="card-name">${esc(item.name)}</div>
    <div class="card-brand">${esc(item.brand)}${item.model?' ┬À '+esc(item.model):''}</div>
    <div class="card-meta">${item.date_purchased?`<div class="card-meta-row">Bought: <strong>${item.date_purchased}</strong></div>`:''}${lentRow}</div>
    <div class="card-actions" onclick="event.stopPropagation()">
      <button class="btn btn-ghost btn-sm icon-btn" onclick="openEdit('${item.gear_id}')" title="Edit">${IC.pencil}</button>
      <button class="btn btn-ghost btn-sm icon-btn" onclick="duplicateItem('${item.gear_id}')" title="Duplicate">${IC.copy}</button>
      ${item.status==='lent'?`<button class="btn btn-warn btn-sm icon-btn" onclick="openReturn('${item.gear_id}')" title="Mark Returned">${IC.ret}</button>`:`<button class="btn btn-ghost btn-sm icon-btn" onclick="quickLend('${item.gear_id}')" title="Lend">${IC.lend}</button>`}
      <button class="btn btn-danger btn-sm icon-btn" onclick="deleteItem('${item.gear_id}')" title="Delete">${IC.x}</button>
    </div></div></div>`;
}

// ÔòÉÔòÉÔòÉÔòÉ TABLE ROW ÔòÉÔòÉÔòÉÔòÉ
function tableRowHTML(item,cols){
  const emoji=CAT_EMOJI[item.category]||'­ƒÄÆ';
  const lend=currentLend(item.gear_id);
  const safePhoto=safeUrl(item.photo_url);
  const photo=`<td><div style="display:flex;align-items:center;gap:4px"><span style="width:14px;flex-shrink:0"></span><div class="td-photo">${safePhoto?`<img src="${safePhoto}" onerror="this.parentElement.innerHTML='${emoji}'" alt="">`:emoji}</div></div></td>`;
  const inTrip=activeTrip(item.gear_id);
  const statusBadge=item.status==='lent'?`<span class="tag tag-lent">Lent${lend?.lent_to?' ┬À '+esc(lend.lent_to):''}</span>`
    :item.status==='retired'?'<span class="tag tag-retired">Retired</span>'
    :inTrip?'<span class="tag tag-in_trip">In Trip</span>'
    :'<span class="tag tag-camping">Active</span>';
  const rowCls=item.status==='lent'?'lent-row':item.status==='retired'?'retired-row':'';
  const defs={
    photo,
    name:`<td class="td-name" onclick="openDetail('${item.gear_id}')">${esc(item.name)}<small>${esc(item.brand)}${item.model?' ┬À '+esc(item.model):''}</small></td>`,
    brand:`<td>${esc(item.brand)||'ÔÇö'}</td>`,
    category:`<td><span class="tag" style="${getCatTagStyle(item.category)}">${item.category}</span></td>`,
    type:`<td>${esc(item.type)||'ÔÇö'}</td>`,
    subtype:`<td>${esc(item.subtype)||'ÔÇö'}</td>`,
    tags:`<td>${(item.tags||[]).length?(item.tags||[]).map(t=>`<span class="tag tag-user-tag">${esc(t)}</span>`).join(' '):'ÔÇö'}</td>`,
    weight_g:`<td style="color:var(--muted)">${item.weight_g?fmtWeight(parseFloat(item.weight_g)):'ÔÇö'}</td>`,
    date_purchased:`<td>${item.date_purchased||'ÔÇö'}</td>`,
    date_produced:`<td>${item.date_produced||'ÔÇö'}</td>`,
    status:`<td>${statusBadge}</td>`,
    retire_reason:`<td>${(()=>{const m=(item.notes||'').match(/^\[Retired:\s*([^\]]+)\]/);return m?`<span class="tag tag-retired">${esc(m[1])}</span>`:'ÔÇö';})()}</td>`,
    actions:`<td><div class="td-actions"><button class="btn btn-ghost btn-sm icon-btn" onclick="openEdit('${item.gear_id}')" title="Edit">${IC.pencil}</button><button class="btn btn-ghost btn-sm icon-btn" onclick="duplicateItem('${item.gear_id}')" title="Duplicate">${IC.copy}</button>${item.status==='lent'?`<button class="btn btn-warn btn-sm icon-btn" onclick="openReturn('${item.gear_id}')" title="Mark Returned">${IC.ret}</button>`:`<button class="btn btn-ghost btn-sm icon-btn" onclick="quickLend('${item.gear_id}')" title="Lend">${IC.lend}</button>`}<button class="btn btn-danger btn-sm icon-btn" onclick="deleteItem('${item.gear_id}')" title="Delete">${IC.x}</button></div></td>`
  };
  return `<tr class="${rowCls}">${cols.map(c=>defs[c]||'').join('')}</tr>`;
}
function emptyHTML(icon,title,sub){return`<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><p>${sub}</p></div>`;}
function emptyRow(span,msg){return`<tr><td colspan="${span}" style="text-align:center;padding:36px;color:var(--muted)">${msg}</td></tr>`;}


// ÔòÉÔòÉÔòÉÔòÉ GROUPING ÔòÉÔòÉÔòÉÔòÉ
function groupKey(i){return [i.name,i.brand,i.category,i.type,i.subtype].join('||');}
function groupItems(arr){
  const map=new Map();
  arr.forEach(i=>{
    const k=groupKey(i);
    if(!map.has(k)) map.set(k,[]);
    map.get(k).push(i);
  });
  return [...map.values()];
}
function tableRowGroupedHTML(group, cols){
  if(group.length===1) return tableRowHTML(group[0], cols);
  const rep=group[0]; // representative item
  const gid='grp-'+rep.gear_id;
  const emoji=CAT_EMOJI[rep.category]||'­ƒÄÆ';
  const safePhoto=safeUrl(rep.photo_url);
  const photoInner=safePhoto?`<img src="${safePhoto}" onerror="this.parentElement.innerHTML='${emoji}'" alt="">`:emoji;
  const statusCounts={active:0,lent:0,retired:0,in_trip:0};
  group.forEach(i=>{
    if(i.status==='lent') statusCounts.lent++;
    else if(i.status==='retired') statusCounts.retired++;
    else if(activeTrip(i.gear_id)) statusCounts.in_trip++;
    else statusCounts.active++;
  });
  const statusBadge=[
    statusCounts.active?`<span class="tag tag-camping">${statusCounts.active} active</span>`:'',
    statusCounts.in_trip?`<span class="tag tag-in_trip">${statusCounts.in_trip} in trip</span>`:'',
    statusCounts.lent?`<span class="tag tag-lent">${statusCounts.lent} lent</span>`:'',
    statusCounts.retired?`<span class="tag tag-retired">${statusCounts.retired} retired</span>`:'',
  ].filter(Boolean).join('<br style="line-height:6px">');
  // Build header row
  const defs={
    photo:`<td><div style="display:flex;align-items:center;gap:4px"><span class="group-toggle" style="width:14px;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7,4 13,10 7,16"/></svg></span><div class="td-photo">${photoInner}</div></div></td>`,
    name:`<td class="td-name"><span class="group-count">${group.length}</span>${esc(rep.name)}<small>${esc(rep.brand)}${rep.model?' ┬À '+esc(rep.model):''}</small></td>`,
    brand:`<td>${esc(rep.brand)||'ÔÇö'}</td>`,
    category:`<td><span class="tag" style="${getCatTagStyle(rep.category)}">${rep.category}</span></td>`,
    type:`<td>${rep.type||'ÔÇö'}</td>`,
    subtype:`<td>${rep.subtype||'ÔÇö'}</td>`,
    weight_g:(()=>{const tw=group.reduce((s,i)=>s+(parseFloat(i.weight_g)||0),0);return`<td style="color:var(--muted)">${tw?fmtWeight(tw):'ÔÇö'}</td>`})(),
    date_purchased:`<td>ÔÇö</td>`,
    date_produced:`<td>ÔÇö</td>`,
    status:`<td>${statusBadge}</td>`,
    actions:`<td></td>`
  };
  const headerRow=`<tr class="group-row" id="${gid}" onclick="toggleGroup('${gid}')">${cols.map(c=>defs[c]||'').join('')}</tr>`;
  // Build sub-rows
  const subRows=group.map(item=>{
    const r=tableRowHTML(item,cols);
    // Add sub-row class and hidden class, indent name cell
    return r
      .replace('<tr class="','<tr class="sub-row hidden ')
      .replace('<tr class=""','<tr class="sub-row hidden"')
      .replace('class="td-name"','class="td-name sub-indent"');
  }).join('');
  return headerRow+subRows;
}
function toggleGroup(gid){
  const header=document.getElementById(gid);
  if(!header) return;
  const isOpen=header.classList.toggle('open');
  let el=header.nextElementSibling;
  while(el&&el.classList.contains('sub-row')){
    el.classList.toggle('hidden',!isOpen);
    el=el.nextElementSibling;
  }
}

function toggleLentGroup(gid,e){
  if(e&&e.target.closest('button')) return;
  const header=document.getElementById(gid);
  if(!header) return;
  const isOpen=header.classList.toggle('open');
  let el=header.nextElementSibling;
  while(el&&el.classList.contains('lent-sub-row')){
    el.classList.toggle('hidden',!isOpen);
    el=el.nextElementSibling;
  }
}

// ÔòÉÔòÉÔòÉÔòÉ RENDER ALL ÔòÉÔòÉÔòÉÔòÉ
function renderAll(){
  updateBadges();
  populateFilterDropdowns();
  const isc=curView==='card';
  const filtered=applySorted(getFiltered());
  document.getElementById('allCard').style.display=isc?'':'none';
  document.getElementById('allTable').style.display=isc?'none':'';
  if(isc) document.getElementById('allCard').innerHTML=filtered.length?filtered.map(cardHTML).join(''):emptyHTML('­ƒÅö','No gear found','Add your first item or adjust filters');
  else document.getElementById('allTbody').innerHTML=filtered.length?groupItems(filtered).map(g=>tableRowGroupedHTML(g,['photo','name','brand','category','type','subtype','tags','weight_g','date_purchased','date_produced','status','actions'])).join(''):emptyRow(11,'No items');

  const ret=applySorted(items.filter(i=>i.status==='retired'));
  document.getElementById('retiredCard').style.display=isc?'':'none';
  document.getElementById('retiredTable').style.display=isc?'none':'';
  if(isc) document.getElementById('retiredCard').innerHTML=ret.length?ret.map(cardHTML).join(''):emptyHTML('­ƒôª','No retired gear','');
  else document.getElementById('retiredTbody').innerHTML=ret.length?ret.map(i=>tableRowHTML(i,['photo','name','brand','category','type','retire_reason','date_purchased','date_produced','actions'])).join(''):emptyRow(8,'No retired items');
  renderLent();
}
function renderLent(){
  const lentItems=items.filter(i=>i.status==='lent');
  const today=new Date().toISOString().slice(0,10);
  // ÔöÇÔöÇ Active lends ÔöÇÔöÇ
  if(!lentItems.length){
    document.getElementById('lentContent').innerHTML=emptyHTML('­ƒñØ','Nothing lent out','All your gear is home safe');
  } else {
    // Group by lent_to
    const groups=new Map();
    lentItems.forEach(i=>{
      const lend=currentLend(i.gear_id)||{};
      const person=lend.lent_to||'ÔÇö';
      if(!groups.has(person)) groups.set(person,[]);
      groups.get(person).push({item:i,lend});
    });
    let rows='';
    let idx=0;
    for(const [person,entries] of groups){
      const dates=entries.map(e=>e.lend.date_lent).filter(Boolean).sort();
      const minDateLent=dates[0]||'ÔÇö';
      const dues=entries.map(e=>e.lend.date_due).filter(Boolean).sort();
      const maxDateDue=dues[dues.length-1]||'ÔÇö';
      const gid='lg-'+idx++;
      const lendIds=entries.map(e=>e.lend.lend_id).filter(Boolean);
      const gearIds=entries.map(e=>e.item.gear_id);
      const raData=JSON.stringify({person,lendIds,gearIds}).replace(/'/g,"&#39;");
      rows+=`<tr class="lent-group-header" id="${gid}" onclick="toggleLentGroup('${gid}',event)"><td colspan="6"><div class="lent-group-header-inner"><span class="group-toggle">${IC.chevR}</span>${esc(person)}<span class="group-count">${entries.length}</span><span class="lent-grp-meta">Lent: ${esc(minDateLent)}</span><span class="lent-grp-meta">Return by: ${esc(maxDateDue)}</span><button class="btn btn-warn btn-sm" style="margin-left:auto;flex-shrink:0" data-ra='${raData}' onclick="const d=JSON.parse(this.dataset.ra);returnAllForPerson(d.person,d.lendIds,d.gearIds)">${IC.ret} Return All</button></div></td></tr>`;
      entries.forEach(({item:i,lend})=>{
        const overdue=lend.date_due&&lend.date_due<today;
        rows+=`<tr class="lent-sub-row hidden">
          <td><div class="td-photo">${CAT_EMOJI[i.category]||'­ƒÄÆ'}</div></td>
          <td class="td-name" onclick="openDetail('${i.gear_id}')" style="cursor:pointer">${esc(i.name)}<small>${esc(i.brand)}</small></td>
          <td>${esc(lend.date_lent)||'ÔÇö'}</td>
          <td style="color:${overdue?'var(--danger)':'var(--text)'};font-weight:${overdue?700:400}">${esc(lend.date_due)||'ÔÇö'}${overdue?' '+IC.warn:''}</td>
          <td>${(()=>{const parts=[];if(lend.notes) parts.push(esc(lend.notes));if(lend.custom_fields&&lend.custom_fields.length) parts.push(lend.custom_fields.map(f=>`<span style="color:var(--muted)">${esc(f.label)}:</span> ${esc(f.value)}`).join(' ┬À '));return parts.join('<br>')||'ÔÇö';})()}</td>
          <td><button class="btn btn-warn btn-sm" onclick="openReturn('${i.gear_id}')" title="Mark Returned">${IC.ret} Return</button></td>
        </tr>`;
      });
    }
    document.getElementById('lentContent').innerHTML=`<div class="ltw"><table class="lent-table">
      <thead><tr>
        <th style="width:48px"></th>
        <th>Item</th><th>Date Lent</th><th>Return By</th><th>Notes</th><th>Action</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }
  // ÔöÇÔöÇ History (returned lends) ÔöÇÔöÇ
  renderLentHistory();
}
function renderLentHistory(){
  const returned=lends.filter(l=>l.date_returned);
  const histEl=document.getElementById('lentHistoryContent');
  if(!histEl) return;
  if(!returned.length){
    histEl.innerHTML=`<div style="text-align:center;padding:24px;color:var(--muted)">No lending history yet</div>`;
    return;
  }
  // Sort newest return first
  const sorted=[...returned].sort((a,b)=>(b.date_returned||'').localeCompare(a.date_returned||''));
  const rows=sorted.map(l=>{
    const item=items.find(i=>i.gear_id===l.gear_id);
    const name=item?item.name:l.gear_name||'Unknown';
    const brand=item?item.brand:'';
    const cat=item?item.category:'';
    const emoji=item?(CAT_EMOJI[cat]||'­ƒÄÆ'):'­ƒÄÆ';
    const duration=l.date_lent&&l.date_returned?Math.round((new Date(l.date_returned)-new Date(l.date_lent))/(1000*60*60*24))+'d':'ÔÇö';
    return`<tr>
      <td><div class="td-photo">${emoji}</div></td>
      <td class="td-name" onclick="${item?`openDetail('${l.gear_id}')`:'void(0)'}" style="cursor:${item?'pointer':'default'}">${esc(name)}<small>${esc(brand)}</small></td>
      <td>${esc(l.lent_to)||'ÔÇö'}</td>
      <td>${l.date_lent||'ÔÇö'}</td>
      <td>${l.date_returned||'ÔÇö'}</td>
      <td>${duration}</td>
      <td>${esc(l.condition_on_return)||'ÔÇö'}</td>
      <td>${esc(l.notes)||'ÔÇö'}</td>
    </tr>`;
  }).join('');
  histEl.innerHTML=`<div class="ltw"><table class="lent-table">
    <thead><tr>
      <th style="width:48px"></th>
      <th>Item</th><th>Lent To</th><th>Date Lent</th><th>Date Returned</th><th>Duration</th><th>Condition</th><th>Notes</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}
function toggleLentHistory(){
  const body=document.getElementById('lentHistoryBody');
  const icon=document.getElementById('lentHistoryToggleIcon');
  const label=document.getElementById('lentHistoryToggleLabel');
  const isOpen=body.classList.toggle('open');
  icon.textContent=isOpen?'Ôû▓':'Ôû╝';
  label.textContent=isOpen?'Hide':'Show';
}
function updateBadges(){
  const active=items.filter(i=>i.status!=='retired');
  document.getElementById('b-all').textContent=active.length;
  document.getElementById('b-lent').textContent=items.filter(i=>i.status==='lent').length;
  document.getElementById('b-retired').textContent=items.filter(i=>i.status==='retired').length;
  const f=getFiltered();
  document.getElementById('st-total').textContent=f.filter(i=>i.status!=='retired').length;
  document.getElementById('st-lent').textContent=f.filter(i=>i.status==='lent').length;
  document.getElementById('st-retired').textContent=items.filter(i=>i.status==='retired').length;
  document.getElementById('st-brands').textContent=new Set(f.map(i=>i.brand).filter(Boolean)).size;
  const lc=items.filter(i=>i.status==='lent').length;
  const mb=document.getElementById('mb-lent');
  if(mb){mb.textContent=lc;mb.style.display=lc?'':'none';}
  const tc=trips.filter(t=>t.status==='in_progress').length;
  const bt=document.getElementById('b-trips');
  if(bt) bt.textContent=tc||'';
  const mbt=document.getElementById('mb-trips');
  if(mbt){mbt.textContent=tc;mbt.style.display=tc?'':'none';}
}

