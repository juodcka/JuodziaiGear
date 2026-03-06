// â•â•â•â• RETURN â•â•â•â•
function openReturn(gear_id){
  const lend=currentLend(gear_id); if(!lend) return;
  document.getElementById('rLendId').value=lend.lend_id;document.getElementById('rGearId').value=gear_id;
  document.getElementById('rDate').value=new Date().toISOString().slice(0,10);document.getElementById('rCondition').value='';
  closeModal('detailOverlay'); document.getElementById('returnOverlay').classList.add('open');
}
async function confirmReturn(){
  const lend_id=document.getElementById('rLendId').value;const gear_id=document.getElementById('rGearId').value;
  const date_returned=document.getElementById('rDate').value;const cond=document.getElementById('rCondition').value;
  const btn=document.getElementById('confirmReturnBtn');btn.disabled=true;btn.textContent='Saving...';
  try{if(getApiUrl()) await api('returnGear',{lend_id,gear_id,date_returned,condition_on_return:cond});}catch(e){btn.disabled=false;btn.textContent='Confirm Return';toast('API: '+e.message);return;}
  btn.disabled=false;btn.textContent='Confirm Return';
  const lend=lends.find(l=>l.lend_id===lend_id);
  if(lend){lend.date_returned=date_returned;lend.condition_on_return=cond;}
  const item=items.find(i=>i.gear_id===gear_id);if(item) item.status='active';
  saveLocal();closeModal('returnOverlay');toast('Gear marked as returned');renderAll();
}

async function returnAllForPerson(person,lendIds,gearIds){
  const today=new Date().toISOString().slice(0,10);
  for(let i=0;i<lendIds.length;i++){
    try{if(getApiUrl()) await api('returnGear',{lend_id:lendIds[i],gear_id:gearIds[i],date_returned:today,condition_on_return:''});}catch(e){toast('API error: '+e.message);return;}
    const lend=lends.find(l=>l.lend_id===lendIds[i]);if(lend){lend.date_returned=today;lend.condition_on_return='';}
    const item=items.find(it=>it.gear_id===gearIds[i]);if(item) item.status='active';
  }
  saveLocal();renderAll();toast(`All gear from ${person} marked as returned`);
}

// â•â•â•â• SERVICE LOG â•â•â•â•
function getServiceLog(item){
  if(!item.service_log) return [];
  try{return JSON.parse(item.service_log);}catch(e){return [];}
}
async function logInspectionNow(gearId){
  const item=items.find(i=>i.gear_id===gearId); if(!item) return;
  const log=getServiceLog(item);
  log.unshift({date:new Date().toISOString().slice(0,10),type:'Inspection',note:'Inspected OK'});
  item.service_log=JSON.stringify(log);
  saveLocal();
  renderInspection();
  toast('Inspection logged for '+esc(item.name));
  try{if(getApiUrl()) await api('updateGear',{gear_id:gearId,service_log:item.service_log});}catch(e){toast('API: '+e.message);}
}
function openFailInspection(gearId){
  const item=items.find(i=>i.gear_id===gearId); if(!item) return;
  document.getElementById('fiGearId').value=gearId;
  document.getElementById('fiGearName').textContent=item.name+(item.brand?' â€” '+item.brand:'');
  document.getElementById('fiNotes').value='';
  document.getElementById('fiRetireReason').value='damaged';
  document.getElementById('failInspOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('fiNotes').focus(),80);
}
async function confirmFailInspection(){
  const gearId=document.getElementById('fiGearId').value;
  const notes=document.getElementById('fiNotes').value.trim();
  const reasonKey=document.getElementById('fiRetireReason').value;
  if(!notes){toast('Please describe the inspection result');return;}
  const item=items.find(i=>i.gear_id===gearId); if(!item) return;
  const _rl={worn_out:'Worn out',damaged:'Damaged',upgraded:'Upgraded / replaced',sold:'Sold',other:'Other'};
  const reasonLabel=_rl[reasonKey]||reasonKey;
  // Add service log entry
  const log=getServiceLog(item);
  log.unshift({date:new Date().toISOString().slice(0,10),type:'Inspection',note:'FAILED: '+notes});
  item.service_log=JSON.stringify(log);
  // Retire the item
  item.status='retired';
  const cleanNotes=(item.notes||'').replace(/^\[Retired:[^\]]*\]\s*/,'');
  item.notes='[Retired: '+reasonLabel+'] '+cleanNotes;
  closeModal('failInspOverlay');
  saveLocal();
  renderInspection();
  renderAll();
  toast(esc(item.name)+' retired after failed inspection');
  try{
    if(getApiUrl()) await api('updateGear',{gear_id:gearId,status:item.status,notes:item.notes,service_log:item.service_log});
  }catch(e){toast('API: '+e.message);}
}
async function addServiceLogEntry(gearId){
  const item=items.find(i=>i.gear_id===gearId); if(!item) return;
  const type=document.getElementById('slogType').value;
  const note=document.getElementById('slogNote').value.trim();
  const date=document.getElementById('slogDate').value||new Date().toISOString().slice(0,10);
  if(!note){toast('Note is required');return;}
  const log=getServiceLog(item);
  log.unshift({date,type,note});
  item.service_log=JSON.stringify(log);
  try{if(getApiUrl()) await api('updateGear',{gear_id:gearId,service_log:item.service_log});}catch(e){toast('API: '+e.message);}
  saveLocal();
  openDetail(gearId);
  if(curSection==='inspection') renderInspection();
  toast('Log entry added');
}

// â•â•â•â• DETAIL â•â•â•â•
function openDetail(id){
  const item=items.find(i=>i.gear_id===id); if(!item) return;
  const emoji=CAT_EMOJI[item.category]||'ðŸŽ’';
  const safePhoto=safeUrl(item.photo_url);
  const photo=safePhoto?`<div class="detail-photo"><img src="${safePhoto}" alt="${esc(item.name)}" onerror="this.parentElement.innerHTML='${emoji}'"></div>`:`<div class="detail-photo">${emoji}</div>`;
  const lend=currentLend(id);
  const lentBox=lend?`<div class="lent-box"><div class="lent-box-title">Currently Lent Out</div><div>To: <strong>${esc(lend.lent_to||'Unknown')}</strong></div>${lend.date_lent?`<div>Since: ${esc(lend.date_lent)}</div>`:''} ${lend.date_due?`<div>Due back: <strong>${esc(lend.date_due)}</strong></div>`:''}</div>`:'';
  const cfEntries=(item.custom_fields||[]).filter(f=>f.label||f.value).map(f=>[f.label||'â€”',f.value||'â€”']);
  const DF_COLORS={'Brand':['#dce8f0','#b8d0de'],'Category':['#c8dfc8','#a0c0a0'],'Type':['#daeada','#b8d4b8'],'Subtype':['#eaf4e6','#c8e0c0'],'Purchased':['#ede8d4','#d0c8a4'],'Produced':['#ede8d4','#d0c8a4'],'Status':['#e4ddf0','#c4b8dc']};
  const fields=[['Brand',item.brand],['Category',item.category],['Type',item.type],['Subtype',item.subtype],['Model',item.model],['Purchased',item.date_purchased],['Price',item.price?'â‚¬'+item.price:''],['Weight',item.weight_g?item.weight_g+'g':''],['Serial/Cert',item.serial_cert],['Status',item.status],...cfEntries].filter(f=>f[1]);
  const retireMatch=(item.notes||'').match(/^\[Retired:\s*([^\]]+)\]/);
  const retireTag=item.status==='retired'?`<span class="tag tag-retired">Retired${retireMatch?' Â· '+retireMatch[1]:''}</span>`:'';
  const log=getServiceLog(item);
  const slogExpanded=curSection==='inspection';
  const logHtml=`<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px"><div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none';this.querySelector('.slog-chev').style.transform=this.nextElementSibling.style.display===''?'rotate(180deg)':'rotate(0deg)'"><div style="font-weight:700;font-size:13px">Service Log${log.length?` <span style="font-size:11px;font-weight:400;color:var(--muted)">(${log.length})</span>`:''}</div><svg class="slog-chev" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .2s;transform:${slogExpanded?'rotate(180deg)':'rotate(0deg)'}"><polyline points="4,7 10,13 16,7"/></svg></div><div style="display:${slogExpanded?'':'none'};margin-top:8px">${log.length?log.map(e=>`<div class="slog-entry"><span class="slog-date">${esc(e.date)}</span><span class="slog-type">${esc(e.type)}</span><div style="margin-top:3px">${esc(e.note)}</div></div>`).join(''):'<div style="color:var(--muted);font-size:13px">No entries yet.</div>'}<div class="slog-add"><input type="date" class="fc" id="slogDate" value="${new Date().toISOString().slice(0,10)}" style="font-size:12px"><select class="fc" id="slogType" style="font-size:12px"><option>Inspection</option><option>Fall/Impact</option><option>Service</option><option>Repair</option><option>Note</option></select><input type="text" class="fc" id="slogNote" placeholder="Entry noteâ€¦" style="grid-column:1/-1;font-size:12px"><button class="btn btn-primary btn-sm" onclick="addServiceLogEntry('${esc(item.gear_id)}')" style="grid-column:1/-1">Add Entry</button></div></div></div>`;
  const displayNotes=item.notes?item.notes.replace(/^\[Retired:[^\]]*\]\s*/,''):'';
  const tagsHtml=(item.tags||[]).length?`<div style="margin-top:10px">${(item.tags||[]).map(t=>`<span class="tag tag-user-tag">${esc(t)}</span>`).join(' ')}</div>`:'';
  document.getElementById('detailContent').innerHTML=`<div class="detail-header">${photo}<div><div class="detail-name">${esc(item.name)}</div><div class="detail-brand">${esc(item.brand)}${item.model?' â€” '+esc(item.model):''}</div><div class="card-badges"><span class="tag" style="${getCatTagStyle(item.category)}">${item.category}</span>${item.type?`<span class="tag tag-muted">${item.type}</span>`:''}${item.subtype?`<span class="tag tag-muted">${item.subtype}</span>`:''}${item.status==='lent'?'<span class="tag tag-lent">Lent Out</span>':''}${retireTag}</div></div></div>${lentBox}<div class="detail-grid">${fields.map(([l,v])=>{const c=DF_COLORS[l];const s=c?`style="--df-bg:${c[0]};--df-border:${c[1]}"`:'';return`<div ${s}><div class="dfl">${l}</div><div class="dfv">${esc(v)}</div></div>`;}).join('')}</div>${tagsHtml}${displayNotes?`<div class="dfl" style="margin-top:10px;margin-bottom:6px">Notes</div><div class="notes-box">${esc(displayNotes)}</div>`:''}${logHtml}`;
  document.getElementById('detailActions').innerHTML=`<button class="btn btn-danger" onclick="deleteItem('${item.gear_id}')">${IC.trash} Delete</button>${item.status==='lent'?`<button class="btn btn-warn" onclick="openReturn('${item.gear_id}')">${IC.ret} Mark Returned</button>`:''}${item.status==='active'?`<button class="btn btn-warn" onclick="closeModal('detailOverlay');quickLend('${item.gear_id}')">${IC.lend} Lend</button>`:''}<button class="btn btn-ghost" onclick="closeModal('detailOverlay');duplicateItem('${item.gear_id}')">${IC.copy} Duplicate</button><button class="btn btn-ghost" onclick="closeModal('detailOverlay')">Close</button><button class="btn btn-primary" onclick="openEdit('${item.gear_id}')">${IC.pencil} Edit</button>`;
  document.getElementById('detailOverlay').classList.add('open');
}


