// â•â•â•â• TRIPS â•â•â•â•
function updateTripStatuses(){
  const today=new Date().toISOString().slice(0,10);
  const changed=[];
  trips.forEach(t=>{
    if(t.status==='ended') return;
    const newStatus=today<t.start_date?'planned':today<=t.end_date?'in_progress':'ended';
    if(t.status!==newStatus){t.status=newStatus;changed.push(t);}
  });
  if(changed.length){
    saveLocal();
    if(getApiUrl()) changed.forEach(t=>api('updateTrip',t).catch(()=>{}));
  }
}
function activeTrip(gear_id){
  return trips.find(t=>t.status==='in_progress'&&t.gear_ids.includes(gear_id))||null;
}
function isItemInTripDuring(gear_id,start,end,exclude_id=null){
  return trips.some(t=>{
    if(t.trip_id===exclude_id) return false;
    if(!t.gear_ids.includes(gear_id)) return false;
    return t.start_date<=end&&t.end_date>=start;
  });
}
function isItemLentDuring(gear_id,start,end){
  return lends.some(l=>{
    if(l.gear_id!==gear_id) return false;
    if(l.date_returned) return false;
    // open lend: from date_lent onward â€” overlaps if date_lent <= end
    return l.date_lent<=end;
  });
}
function renderTrips(){
  const el=document.getElementById('tripsContent');
  if(!el) return;
  if(!trips.length){el.innerHTML='<div style="padding:40px;text-align:center;color:var(--muted)">No trips yet. Create your first trip.</div>';return;}
  const statusOrder={in_progress:0,planned:1,ended:2};
  const sorted=[...trips].sort((a,b)=>(statusOrder[a.status]??9)-(statusOrder[b.status]??9)||a.start_date.localeCompare(b.start_date));
  el.innerHTML='<div class="trips-grid">'+sorted.map(t=>{
    const gCount=t.gear_ids.length;
    const totalW=t.gear_ids.reduce((s,id)=>{const item=items.find(i=>i.gear_id===id);return s+(parseFloat(item?.weight_g)||0);},0);
    const wStr=totalW?fmtWeight(totalW):'â€”';
    const statusLabel={planned:'Planned',in_progress:'In Progress',ended:'Ended'}[t.status]||t.status;
    const tagClass={planned:'tag-planned',in_progress:'tag-in_progress',ended:'tag-ended'}[t.status]||'';
    return `<div class="trip-card" onclick="openTripDetail('${esc(t.trip_id)}')">
      <div class="trip-card-header">
        <div class="trip-card-name">${esc(t.name)}</div>
        <span class="tag ${tagClass}">${statusLabel}</span>
      </div>
      <div class="trip-card-dates">${esc(t.start_date)} â€“ ${esc(t.end_date)}</div>
      <div class="trip-card-stats">
        <span><strong>${gCount}</strong> items</span>
        <span><strong>${wStr}</strong> total</span>
      </div>
      ${t.notes?`<div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(t.notes)}</div>`:''}
    </div>`;
  }).join('')+'</div>';
}
function openTripDetail(id){
  currentTripId=id;
  document.getElementById('trips-list-view').style.display='none';
  document.getElementById('trips-detail-view').style.display='';
  const fab=document.getElementById('fab');if(fab)fab.style.display='none';
  renderTripDetail(id);
}
function renderTripDetail(id){
  const t=trips.find(x=>x.trip_id===id);
  if(!t) return;
  const titleEl=document.getElementById('tripDetailTitle');
  titleEl.textContent=t.name;
  const actEl=document.getElementById('tripDetailActions');
  const statusLabel={planned:'Planned',in_progress:'In Progress',ended:'Ended'}[t.status]||t.status;
  const tagClass={planned:'tag-planned',in_progress:'tag-in_progress',ended:'tag-ended'}[t.status]||'';
  const L=(long,short)=>`<span class="btn-label-long">${long}</span><span class="btn-label-short">${short}</span>`;
  let actBtns=`<span class="tag ${tagClass}">${statusLabel}</span>`;
  actBtns+=`<button class="btn btn-ghost btn-sm" onclick="openEditTrip('${esc(id)}')">${L(IC.pencil+' Edit',IC.pencil)}</button>`;
  actBtns+=`<button class="btn btn-ghost btn-sm" onclick="duplicateTrip('${esc(id)}')">${L(IC.copy+' Copy',IC.copy)}</button>`;
  actBtns+=`<button class="btn btn-ghost btn-sm" onclick="printTripList('${esc(id)}')">${L(IC.print+' Print',IC.print)}</button>`;
  actBtns+=`<button class="btn ${_packingMode?'btn-primary':'btn-ghost'} btn-sm" onclick="togglePackingMode('${esc(id)}')">${L(_packingMode?IC.check1+' Packing':IC.check0+' Pack',_packingMode?IC.check1:IC.check0)}</button>`;
  if(t.status!=='ended') actBtns+=`<button class="btn btn-ghost btn-sm" onclick="endTrip('${esc(id)}')">${L('End Trip','End')}</button>`;
  actBtns+=`<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteTrip('${esc(id)}')">${L(IC.trash+' Delete',IC.trash)}</button>`;
  actEl.innerHTML=actBtns;
  const gearItems=t.gear_ids.map(gid=>items.find(i=>i.gear_id===gid)).filter(Boolean);
  gearItems.sort((a,b)=>(a.subtype||'').localeCompare(b.subtype||'')||(a.name||'').localeCompare(b.name||''));
  const totalW=gearItems.reduce((s,i)=>s+(parseFloat(i.weight_g)||0),0);
  const wt=parseFloat(t.weight_target)||0;
  const wPct=wt?Math.min(totalW/wt*100,100):0;
  const wColor=wPct>=100?'var(--danger)':wPct>=80?'var(--warn)':'var(--accent)';
  const weightStat=wt
    ?`<div class="trip-stat" style="min-width:140px">
        <div class="trip-stat-val" style="color:${wColor}">${fmtWeight(totalW)}<span style="font-size:13px;font-weight:400;color:var(--muted)"> / ${fmtWeight(wt)}</span></div>
        <div class="trip-stat-lbl">Weight / Budget</div>
        <div class="weight-bar-wrap"><div class="weight-bar" style="width:${wPct.toFixed(1)}%;background:${wColor}"></div></div>
      </div>`
    :`<div class="trip-stat"><div class="trip-stat-val">${totalW?fmtWeight(totalW):'â€”'}</div><div class="trip-stat-lbl">Total Weight</div></div>`;
  let html=`<div class="trip-detail-stats">
    <div class="trip-stat"><div class="trip-stat-val">${gearItems.length}</div><div class="trip-stat-lbl">Items</div></div>
    ${weightStat}
    <div class="trip-stat"><div class="trip-stat-val" style="color:#444">${fmtTripDate(t.start_date)}</div><div class="trip-stat-lbl">Departs</div></div>
    <div class="trip-stat"><div class="trip-stat-val" style="color:#444">${fmtTripDate(t.end_date)}</div><div class="trip-stat-lbl">Returns</div></div>
  </div>`;
  if(t.notes) html+=`<div style="margin-bottom:16px;padding:12px;background:var(--surface2);border-radius:8px;font-size:14px">${esc(t.notes)}</div>`;
  html+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <div style="font-weight:600">Gear</div>
    ${t.status!=='ended'?`<button class="btn btn-primary btn-sm" onclick="openTripItemPicker('${esc(id)}')">+ Add Items</button>`:''}
  </div>`;
  if(!gearItems.length){
    html+='<div style="padding:20px;text-align:center;color:var(--muted);font-size:14px">No items added yet.</div>';
  } else {
    html+=`<div class="ltw"><table class="gtable trip-gear-gtable"><thead><tr>
      <th style="width:62px"></th>
      <th>Item</th>
      <th>Type</th>
      <th>Subtype</th>
      <th>Weight</th>
      <th style="width:40px"></th>
    </tr></thead><tbody>`;
    const tripGroups=groupItems(gearItems);
    tripGroups.forEach(group=>{
      const tripRowHTML=(item,extraCls='')=>{
        const emoji=CAT_EMOJI[item.category]||'ðŸŽ’';
        const safePhoto=safeUrl(item.photo_url);
        const photoCell=safePhoto?`<img src="${safePhoto}" onerror="this.parentElement.innerHTML='${emoji}'" alt="">`:emoji;
        const removeBtn=t.status!=='ended'?`<button class="btn btn-ghost btn-sm icon-btn" onclick="removeItemFromTrip('${esc(id)}','${esc(item.gear_id)}')" title="Remove">${IC.x}</button>`:'';
        const meta=[item.subtype,item.weight_g?fmtWeight(parseFloat(item.weight_g)):null].filter(Boolean).join(' Â· ');
        const isChecked=!!_packingChecked[item.gear_id];
        const firstCell=_packingMode
          ?`<td onclick="togglePackItem('${esc(item.gear_id)}','${esc(id)}')" style="cursor:pointer;text-align:center;user-select:none;padding:4px">${isChecked?'<svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/><polyline points="7,10 9,12 13,8"/></svg>':'<svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/></svg>'}</td>`
          :`<td><div class="td-photo">${photoCell}</div></td>`;
        return `<tr id="pkrow-${esc(item.gear_id)}"${isChecked?' class="pack-checked'+( extraCls?' '+extraCls:'')+'\"':extraCls?' class="'+extraCls+'"':''}>
          ${firstCell}
          <td class="td-name${extraCls?' sub-indent':''}" onclick="openDetail('${esc(item.gear_id)}')">${esc(item.name)}<small>${esc(item.brand||'')}</small><span class="tg-meta">${esc(meta||'â€”')}</span></td>
          <td>${esc(item.type||'â€”')}</td>
          <td style="color:var(--muted)">${esc(item.subtype||'â€”')}</td>
          <td style="color:var(--muted)">${item.weight_g?fmtWeight(parseFloat(item.weight_g)):'â€”'}</td>
          <td>${removeBtn}</td>
        </tr>`;
      };
      if(group.length===1){
        html+=tripRowHTML(group[0]);
      } else {
        const rep=group[0];
        const gid='tgrp-'+rep.gear_id;
        const emoji=CAT_EMOJI[rep.category]||'ðŸŽ’';
        const safePhoto=safeUrl(rep.photo_url);
        const photoInner=safePhoto?`<img src="${safePhoto}" onerror="this.parentElement.innerHTML='${emoji}'" alt="">`:emoji;
        const totalW=group.reduce((s,i)=>s+(parseFloat(i.weight_g)||0),0);
        html+=`<tr class="group-row" id="${gid}" onclick="toggleGroup('${gid}')">
          <td><div style="display:flex;align-items:center;gap:4px"><span class="group-toggle" style="width:14px;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7,4 13,10 7,16"/></svg></span><div class="td-photo">${photoInner}</div></div></td>
          <td class="td-name"><span class="group-count">${group.length}</span>${esc(rep.name)}<small>${esc(rep.brand||'')}</small></td>
          <td>${esc(rep.type||'â€”')}</td>
          <td style="color:var(--muted)">${esc(rep.subtype||'â€”')}</td>
          <td style="color:var(--muted)">${totalW?fmtWeight(totalW):'â€”'}</td>
          <td></td>
        </tr>`;
        group.forEach(item=>{ html+=tripRowHTML(item,'sub-row hidden'); });
      }
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('tripDetailContent').innerHTML=html;
}
function togglePackingMode(tripId){
  _packingMode=!_packingMode;
  if(!_packingMode) _packingChecked={};
  renderTripDetail(tripId);
}
function togglePackItem(gearId,tripId){
  _packingChecked[gearId]=!_packingChecked[gearId];
  const row=document.getElementById('pkrow-'+gearId);
  if(row){
    row.classList.toggle('pack-checked',!!_packingChecked[gearId]);
    row.firstElementChild.textContent=_packingChecked[gearId]?'âœ…':'â¬œ';
  }
}
function backToTrips(){
  _packingMode=false; _packingChecked={};
  currentTripId=null;
  document.getElementById('trips-detail-view').style.display='none';
  document.getElementById('trips-list-view').style.display='';
  const fab=document.getElementById('fab');if(fab&&window.innerWidth<=720)fab.style.display='flex';
  renderTrips();
}
function openAddTrip(){
  editingTripId=null;
  document.getElementById('addTripTitle').textContent='New Trip';
  document.getElementById('tripName').value='';
  document.getElementById('tripStartDate').value='';
  document.getElementById('tripEndDate').value='';
  document.getElementById('tripWeightTarget').value='';
  document.getElementById('tripNotes').value='';
  document.getElementById('addTripOverlay').classList.add('open');
}
function openEditTrip(id){
  const t=trips.find(x=>x.trip_id===id);
  if(!t) return;
  editingTripId=id;
  document.getElementById('addTripTitle').textContent='Edit Trip';
  document.getElementById('tripName').value=t.name;
  document.getElementById('tripStartDate').value=t.start_date;
  document.getElementById('tripEndDate').value=t.end_date;
  document.getElementById('tripWeightTarget').value=t.weight_target||'';
  document.getElementById('tripNotes').value=t.notes||'';
  document.getElementById('addTripOverlay').classList.add('open');
}
function duplicateTrip(id){
  const t=trips.find(x=>x.trip_id===id); if(!t) return;
  _dupGearIds=[...t.gear_ids];
  editingTripId=null;
  document.getElementById('addTripTitle').textContent='Duplicate Trip';
  document.getElementById('tripName').value='Copy of '+t.name;
  document.getElementById('tripStartDate').value='';
  document.getElementById('tripEndDate').value='';
  document.getElementById('tripWeightTarget').value=t.weight_target||'';
  document.getElementById('tripNotes').value=t.notes||'';
  document.getElementById('addTripOverlay').classList.add('open');
}
function printTripList(tripId){
  const t=trips.find(x=>x.trip_id===tripId); if(!t) return;
  const gearItems=t.gear_ids.map(gid=>items.find(i=>i.gear_id===gid)).filter(Boolean);
  gearItems.sort((a,b)=>(a.subtype||'').localeCompare(b.subtype||'')||(a.name||'').localeCompare(b.name||''));
  const totalW=gearItems.reduce((s,i)=>s+(parseFloat(i.weight_g)||0),0);
  const rows=gearItems.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.brand||'')}</td><td>${esc(i.type||'')}</td><td>${i.weight_g?fmtWeight(parseFloat(i.weight_g)):'â€”'}</td><td></td></tr>`).join('');
  const html=`<html><head><title>${esc(t.name)}</title><style>body{font-family:sans-serif;padding:20px}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left;font-size:13px}th{background:#f0f0f0}tfoot td{font-weight:700}</style></head><body><h1>${esc(t.name)}</h1><p>${t.start_date||''}${t.end_date?' â€“ '+t.end_date:''} &nbsp;Â·&nbsp; ${gearItems.length} items &nbsp;Â·&nbsp; ${totalW?fmtWeight(totalW):'â€”'}</p><table><thead><tr><th>Item</th><th>Brand</th><th>Type</th><th>Weight</th><th><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,10 8,15 17,5"/></svg></th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3">Total</td><td>${fmtWeight(totalW)}</td><td></td></tr></tfoot></table></body></html>`;
  const w=window.open('','_blank','width=700,height=600');
  if(!w){toast('Pop-up blocked â€” allow pop-ups and try again');return;}
  w.document.write(html); w.document.close(); w.print();
}
async function saveTrip(){
  const name=document.getElementById('tripName').value.trim();
  if(!name){toast('Trip name is required');return;}
  const btn=document.getElementById('saveTripBtn');btn.disabled=true;btn.textContent='Saving...';
  const start=document.getElementById('tripStartDate').value;
  const end=document.getElementById('tripEndDate').value;
  const notes=document.getElementById('tripNotes').value.trim();
  const weight_target=parseFloat(document.getElementById('tripWeightTarget').value)||null;
  if(start&&end&&end<start){toast('End date must be on or after start date');return;}
  const today=new Date().toISOString().slice(0,10);
  const status=!start||today<start?'planned':(!end||today<=end)?'in_progress':'ended';
  if(editingTripId){
    const t=trips.find(x=>x.trip_id===editingTripId);
    if(!t) return;
    Object.assign(t,{name,start_date:start,end_date:end,status,notes,weight_target,updated_at:new Date().toISOString()});
    try{ await api('updateTrip',t); }catch(e){toast('API: '+e.message);}
  } else {
    const t={trip_id:'TRIP-'+Date.now().toString(36).toUpperCase(),name,start_date:start,end_date:end,status,gear_ids:_dupGearIds?[..._dupGearIds]:[],notes,weight_target,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    _dupGearIds=null;
    trips.push(t);
    try{ await api('addTrip',t); }catch(e){toast('API: '+e.message);}
  }
  btn.disabled=false;btn.textContent='Save Trip';
  saveLocal();
  closeModal('addTripOverlay');
  updateBadges();
  if(editingTripId&&currentTripId===editingTripId) renderTripDetail(editingTripId);
  else renderTrips();
  toast(editingTripId?'Trip updated':'Trip created');
}
async function deleteTrip(id){
  const trip=trips.find(t=>t.trip_id===id); if(!trip) return;
  trips=trips.filter(t=>t.trip_id!==id);
  saveLocal(); updateBadges(); backToTrips();
  toastWithUndo('Trip deleted',()=>{
    trips.push(trip);
    saveLocal(); updateBadges(); renderTrips();
    toast('Delete undone');
  });
  setTimeout(async()=>{
    if(!trips.find(t=>t.trip_id===id)){
      try{ await api('deleteTrip',{trip_id:id}); }catch(e){toast('API: '+e.message);}
    }
  },5200);
}
async function endTrip(id){
  const t=trips.find(x=>x.trip_id===id);
  if(!t) return;
  t.status='ended';
  t.updated_at=new Date().toISOString();
  try{ await api('updateTrip',t); }catch(e){toast('API: '+e.message);}
  saveLocal();
  updateBadges();
  renderTripDetail(id);
  toast('Trip ended');
}
let _pickerTripId=null;
function openTripItemPicker(trip_id){
  _pickerTripId=trip_id;
  document.getElementById('pickerSearch').value='';
  populatePickerList('');
  document.getElementById('tripItemPickerOverlay').classList.add('open');
}
function _pickerItemHTML(item,t,extraClass=''){
  const already=t.gear_ids.includes(item.gear_id);
  const lentConflict=!already&&isItemLentDuring(item.gear_id,t.start_date,t.end_date);
  const tripConflict=!already&&!lentConflict&&isItemInTripDuring(item.gear_id,t.start_date,t.end_date,t.trip_id);
  const disabled=lentConflict||tripConflict;
  if(document.getElementById('pickerAvailOnly')?.checked&&disabled&&!already) return '';
  const conflictMsg=lentConflict?'Lent during this period':tripConflict?'In another trip':'';
  const _pEmoji=CAT_EMOJI[item.category]||'ðŸŽ’';
  const emoji=item.photo_url&&safeUrl(item.photo_url)?`<img src="${safeUrl(item.photo_url)}" style="width:32px;height:32px;border-radius:6px;object-fit:cover" onerror="this.style.display='none';this.nextSibling.style.display=''"><span style="display:none;font-size:20px">${_pEmoji}</span>`:`<span style="font-size:20px">${_pEmoji}</span>`;
  return `<div class="picker-row${disabled?' disabled':''}${extraClass?' '+extraClass:''}">
    <input type="checkbox" class="picker-cb" data-id="${esc(item.gear_id)}"${already?' checked disabled':disabled?' disabled':''}>
    ${emoji}
    <div style="flex:1;min-width:0">
      <div style="font-weight:600;font-size:14px">${esc(item.name)}${already?' <span style="color:var(--muted);font-size:11px">(already added)</span>':''}</div>
      <div style="color:var(--muted);font-size:12px">${esc(item.brand||'')}${item.weight_g?' Â· '+fmtWeight(parseFloat(item.weight_g)):''}</div>
      ${conflictMsg?`<div class="picker-conflict">${esc(conflictMsg)}</div>`:''}
    </div>
  </div>`;
}
function populatePickerList(search){
  const t=trips.find(x=>x.trip_id===_pickerTripId);
  if(!t) return;
  const s=search.toLowerCase();
  const active=items.filter(i=>i.status!=='retired'&&(!s||(i.name||'').toLowerCase().includes(s)||(i.brand||'').toLowerCase().includes(s)));
  const el=document.getElementById('pickerList');
  if(!active.length){el.innerHTML='<div style="padding:16px;text-align:center;color:var(--muted)">No items found</div>';return;}
  const groups=groupItems(active);
  el.innerHTML=groups.map((group,gi)=>{
    if(group.length===1) return _pickerItemHTML(group[0],t);
    // Multi-item group
    const gid='grp-'+gi;
    const rep=group[0];
    const _pEmoji=CAT_EMOJI[rep.category]||'ðŸŽ’';
    const emoji=rep.photo_url&&safeUrl(rep.photo_url)?`<img src="${safeUrl(rep.photo_url)}" style="width:32px;height:32px;border-radius:6px;object-fit:cover" onerror="this.style.display='none';this.nextSibling.style.display=''"><span style="display:none;font-size:20px">${_pEmoji}</span>`:`<span style="font-size:20px">${_pEmoji}</span>`;
    const totalW=group.reduce((s,i)=>s+(parseFloat(i.weight_g)||0),0);
    const allAlready=group.every(i=>t.gear_ids.includes(i.gear_id));
    const someAlready=!allAlready&&group.some(i=>t.gear_ids.includes(i.gear_id));
    const allDisabled=group.every(i=>{
      const already=t.gear_ids.includes(i.gear_id);
      return already||isItemLentDuring(i.gear_id,t.start_date,t.end_date)||isItemInTripDuring(i.gear_id,t.start_date,t.end_date,t.trip_id);
    });
    const subRowsHTML=group.map(item=>_pickerItemHTML(item,t,'picker-sub-row')).join('');
    const headerHTML=`<div class="picker-row picker-group-header" id="pgh-${gid}" onclick="togglePickerGroup('${gid}')">
      <span class="picker-group-toggle">${IC.chevR}</span>
      <input type="checkbox" class="picker-group-cb" data-group="${gid}"${allAlready?' checked':allDisabled?' disabled':''} onclick="event.stopPropagation()">
      ${emoji}
      <div style="flex:1;min-width:0">
        <div style="font-size:14px">${esc(rep.name)}<span class="picker-group-count">Ã—${group.length}</span></div>
        <div style="color:var(--muted);font-size:12px">${esc(rep.brand||'')}${rep.subtype?' Â· '+esc(rep.subtype):''}${totalW?' Â· '+fmtWeight(totalW):''}</div>
      </div>
    </div>`;
    return headerHTML+`<div class="picker-sub-rows">${subRowsHTML}</div>`;
  }).join('');
  // Wire up group checkboxes
  el.querySelectorAll('.picker-group-cb').forEach(gcb=>{
    const gid=gcb.dataset.group;
    // set indeterminate if partial
    const subCbs=[...el.querySelectorAll(`.picker-cb[data-id]`)].filter(cb=>{
      const row=cb.closest('.picker-sub-rows');
      return row&&row.previousElementSibling&&row.previousElementSibling.id==='pgh-'+gid;
    });
    const checkedCount=subCbs.filter(c=>c.checked).length;
    if(checkedCount>0&&checkedCount<subCbs.length) gcb.indeterminate=true;
    gcb.addEventListener('change',()=>{
      subCbs.filter(c=>!c.disabled).forEach(cb=>{cb.checked=gcb.checked;});
    });
  });
}
function togglePickerGroup(gid){
  const hdr=document.getElementById('pgh-'+gid);
  if(hdr) hdr.classList.toggle('open');
}
function filterPickerList(){
  populatePickerList(document.getElementById('pickerSearch').value);
}
async function confirmTripItemPicker(){
  const t=trips.find(x=>x.trip_id===_pickerTripId);
  if(!t) return;
  const checked=[...document.querySelectorAll('.picker-cb:checked:not(:disabled)')].map(cb=>cb.dataset.id);
  if(!checked.length){closeModal('tripItemPickerOverlay');return;}
  checked.forEach(id=>{if(!t.gear_ids.includes(id)) t.gear_ids.push(id);});
  t.updated_at=new Date().toISOString();
  try{ await api('updateTrip',t); }catch(e){toast('API: '+e.message);}
  saveLocal();
  closeModal('tripItemPickerOverlay');
  renderTripDetail(_pickerTripId);
  toast(`${checked.length} item${checked.length>1?'s':''} added`);
}
async function removeItemFromTrip(trip_id,gear_id){
  const t=trips.find(x=>x.trip_id===trip_id);
  if(!t) return;
  t.gear_ids=t.gear_ids.filter(id=>id!==gear_id);
  t.updated_at=new Date().toISOString();
  try{ await api('updateTrip',t); }catch(e){toast('API: '+e.message);}
  saveLocal();
  renderTripDetail(trip_id);
  toast('Item removed');
}

