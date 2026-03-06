// â•â•â•â• HIERARCHICAL SELECTS â•â•â•â•
function populateBrandSelect(sel=''){
  const el=document.getElementById('fBrand');
  el.innerHTML='<option value="">â€” select brand â€”</option>';
  (lookups.brands||[]).forEach(b=>{const o=document.createElement('option');o.value=b;o.textContent=b;if(b===sel)o.selected=true;el.appendChild(o);});
}
function onCatChange(){
  const cat=document.getElementById('fCategory').value;
  const ts=document.getElementById('fType'); const ss=document.getElementById('fSubtype');
  ts.innerHTML='<option value="">â€” select type â€”</option>'; ss.innerHTML='<option value="">â€” select type first â€”</option>'; ss.disabled=true;
  if(!cat||!lookups.hierarchy[cat]){ts.disabled=true;return;} ts.disabled=false;
  Object.keys(lookups.hierarchy[cat]||{}).forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;ts.appendChild(o);});
}
function onTypeChange(){
  const cat=document.getElementById('fCategory').value; const typ=document.getElementById('fType').value;
  const ss=document.getElementById('fSubtype'); ss.innerHTML='<option value="">â€” select subtype â€”</option>';
  const subs=(lookups.hierarchy[cat]||{})[typ]||[];
  if(!subs.length){ss.disabled=true;return;} ss.disabled=false;
  subs.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;ss.appendChild(o);});
}
function setFormSelects(item){
  populateBrandSelect(item.brand||'');
  document.getElementById('fCategory').value=item.category||''; onCatChange();
  document.getElementById('fType').value=item.type||''; onTypeChange();
  document.getElementById('fSubtype').value=item.subtype||'';
}

// â•â•â•â• ADD/EDIT â•â•â•â•
function toggleLentFields(){
  const _s=document.getElementById('fStatus').value;
  document.getElementById('lentFields').style.display=_s==='lent'?'':'none';
  const _rg=document.getElementById('retireReasonGroup');
  if(_rg) _rg.style.display=_s==='retired'?'':'none';
}
function clearForm(){
  populateCategoryDropdowns();
  ['fName','fModel','fSerial','fNotes','fLentTo','fPhotoUrl'].forEach(id=>document.getElementById(id).value='');
  ['fDateBought','fDateProd','fPrice','fWeight','fLentDate','fLentReturn'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('fStatus').value='active'; document.getElementById('lentFields').style.display='none';
  const _rg=document.getElementById('retireReasonGroup'); if(_rg) _rg.style.display='none';
  document.getElementById('fCustomFields').innerHTML='';
  populateBrandSelect(); document.getElementById('fCategory').value='';
  document.getElementById('fType').innerHTML='<option value="">â€” select category first â€”</option>'; document.getElementById('fType').disabled=true;
  document.getElementById('fSubtype').innerHTML='<option value="">â€” select type first â€”</option>'; document.getElementById('fSubtype').disabled=true;
}
function openAddModal(){editingId=null;clearForm();renderTagsSelect([]);document.getElementById('mTitle').textContent='Add Gear';document.getElementById('addOverlay').classList.add('open');}
function openEdit(id){
  const item=items.find(i=>i.gear_id===id); if(!item) return;
  editingId=id; document.getElementById('mTitle').textContent='Edit Gear';
  document.getElementById('fName').value=item.name||'';document.getElementById('fModel').value=item.model||'';
  document.getElementById('fDateBought').value=item.date_purchased||'';document.getElementById('fDateProd').value=item.date_produced||'';
  document.getElementById('fPrice').value=item.price||'';document.getElementById('fWeight').value=item.weight_g||'';
  document.getElementById('fSerial').value=item.serial_cert||'';
  document.getElementById('fStatus').value=item.status||'active';
  let _editNotes=item.notes||'';
  if(item.status==='retired'){
    const _m=_editNotes.match(/^\[Retired:\s*([^\]]+)\]/);
    if(_m){
      const _rlv={worn_out:'Worn out',damaged:'Damaged',upgraded:'Upgraded',sold:'Sold',other:'Other'};
      const _rv=Object.entries(_rlv).find(([k,v])=>v===_m[1].trim())?.[0]||'other';
      const _rr=document.getElementById('fRetireReason');
      if(_rr) _rr.value=_rv;
      _editNotes=_editNotes.replace(/^\[Retired:[^\]]*\]\s*/,'');
    }
  }
  document.getElementById('fNotes').value=_editNotes;
  document.getElementById('fPhotoUrl').value=item.photo_url||'';
  setFormSelects(item); toggleLentFields();
  const lend=currentLend(id)||{};
  document.getElementById('fLentTo').value=lend.lent_to||'';document.getElementById('fLentDate').value=lend.date_lent||'';document.getElementById('fLentReturn').value=lend.date_due||'';
  // Populate custom fields
  document.getElementById('fCustomFields').innerHTML='';
  (item.custom_fields||[]).forEach(f=>addCustomField(f.label,f.value));
  renderTagsSelect(item.tags||[]);
  closeModal('detailOverlay'); document.getElementById('addOverlay').classList.add('open');
}
async function saveItem(){
  const name=document.getElementById('fName').value.trim(); const brand=document.getElementById('fBrand').value;
  if(!name||!brand){toast('Name and brand are required');return;}
  const btn=document.getElementById('saveBtn'); btn.disabled=true; btn.textContent='Saving...';
  const body={name,brand,category:document.getElementById('fCategory').value,type:document.getElementById('fType').value,
    subtype:document.getElementById('fSubtype').value,model:document.getElementById('fModel').value.trim(),
    date_purchased:document.getElementById('fDateBought').value,date_produced:document.getElementById('fDateProd').value,
    price:document.getElementById('fPrice').value,weight_g:document.getElementById('fWeight').value,
    serial_cert:document.getElementById('fSerial').value.trim(),
    photo_url:document.getElementById('fPhotoUrl').value.trim(),
    custom_fields:getCustomFields(),tags:getSelectedTags()};
  let _saveNotes=document.getElementById('fNotes').value.trim();
  const _saveStatus=document.getElementById('fStatus').value;
  body.status=_saveStatus;
  if(_saveStatus==='retired'){
    const _reason=document.getElementById('fRetireReason')?.value||'other';
    const _rl={worn_out:'Worn out',damaged:'Damaged',upgraded:'Upgraded',sold:'Sold',other:'Other'};
    _saveNotes=_saveNotes.replace(/^\[Retired:[^\]]*\]\s*/,'');
    _saveNotes='[Retired: '+(_rl[_reason]||_reason)+'] '+_saveNotes;
  }
  body.notes=_saveNotes;
  body.service_log=editingId?(items.find(i=>i.gear_id===editingId)?.service_log||''):'';
  try{
    if(getApiUrl()){
      if(editingId){body.gear_id=editingId;await api('updateGear',body);}
      else{const r=await api('addGear',body);body.gear_id=r.gear_id;}
      // Lend records are now created via the dedicated Lend dialog (quickLend/confirmLend)
    }
  }catch(e){toast('API error: '+e.message);}
  if(editingId){const idx=items.findIndex(i=>i.gear_id===editingId);if(idx>=0) items[idx]={...items[idx],...body};}
  else{body.gear_id=body.gear_id||('GEAR-'+Date.now().toString(36).toUpperCase());items.unshift(body);}
  // Lend records created separately via confirmLend()
  saveLocal(); btn.disabled=false; btn.textContent='Save Gear'; closeModal('addOverlay');
  toast(editingId?'Item updated':'Item added'); renderAll();
}
function duplicateItem(id){
  const src=items.find(i=>i.gear_id===id); if(!src) return;
  // Pre-fill form with source item data, clear identity fields
  editingId=null;
  populateCategoryDropdowns();
  document.getElementById('mTitle').textContent='Duplicate: '+src.name;
  document.getElementById('fName').value=src.name;
  document.getElementById('fModel').value=src.model||'';
  document.getElementById('fDateBought').value=src.date_purchased||'';
  document.getElementById('fDateProd').value=src.date_produced||'';
  document.getElementById('fPrice').value=src.price||'';
  document.getElementById('fWeight').value=src.weight_g||'';
    document.getElementById('fSerial').value=''; // clear â€” unique per item
  document.getElementById('fStatus').value='active';
  document.getElementById('fNotes').value=src.notes||'';
  document.getElementById('fPhotoUrl').value=src.photo_url||'';
  document.getElementById('lentFields').style.display='none';
  setFormSelects(src);
  renderTagsSelect(src.tags||[]);
  document.getElementById('addOverlay').classList.add('open');
  // Focus production date field since that's usually the only thing that differs
  setTimeout(()=>{
    const pd=document.getElementById('fDateProd');
    pd.focus();
    pd.scrollIntoView({behavior:'smooth',block:'center'});
  },80);
  toast('Duplicated â€” update serial / date as needed');
}
async function deleteItem(id){
  const item=items.find(i=>i.gear_id===id); if(!item) return;
  const removedLends=lends.filter(l=>l.gear_id===id);
  items=items.filter(i=>i.gear_id!==id);
  lends=lends.filter(l=>l.gear_id!==id);
  saveLocal(); closeModal('detailOverlay'); renderAll();
  toastWithUndo('Item deleted',()=>{
    items.push(item);
    lends.push(...removedLends);
    saveLocal(); renderAll();
    toast('Delete undone');
  });
  // Deferred API call â€” fires after undo window closes
  setTimeout(async()=>{
    if(!items.find(i=>i.gear_id===id)){
      try{if(getApiUrl()) await api('deleteGear',{gear_id:id});}catch(e){toast('API: '+e.message);}
    }
  },5200);
}
function populateBorrowerList(){
  const names=[...new Set(lends.map(l=>l.lent_to).filter(Boolean))].sort();
  const dl=document.getElementById('borrowerList');
  if(dl) dl.innerHTML=names.map(n=>`<option value="${esc(n)}">`).join('');
}
function quickLend(id){
  const item=items.find(i=>i.gear_id===id); if(!item) return;
  if(activeTrip(id)){toast('Item is currently in an active trip');return;}
  populateBorrowerList();
  document.getElementById('lGearId').value=id;
  document.getElementById('lGearName').textContent=item.name+(item.brand?' â€” '+item.brand:'');
  document.getElementById('lendTitle').textContent='Lend: '+item.name;
  document.getElementById('lLentTo').value='';
  document.getElementById('lDateLent').value=new Date().toISOString().slice(0,10);
  document.getElementById('lDateDue').value='';
  document.getElementById('lNotes').value='';
  document.getElementById('lendOverlay').classList.add('open');
}
async function confirmLend(){
  const gear_id=document.getElementById('lGearId').value;
  const lent_to=document.getElementById('lLentTo').value.trim();
  if(!lent_to){toast('Please enter who you are lending to');return;}
  const item=items.find(i=>i.gear_id===gear_id); if(!item) return;
  const date_lent=document.getElementById('lDateLent').value;
  const date_due=document.getElementById('lDateDue').value;
  const notes=document.getElementById('lNotes').value.trim();
  if(isItemInTripDuring(gear_id,date_lent,date_due||'9999-12-31')){toast('Item is assigned to a trip during this period');return;}
  const lendRecord={lend_id:'LEND-'+Date.now().toString(36).toUpperCase(),gear_id,gear_name:item.name,lent_to,date_lent,date_due,date_returned:'',condition_on_return:'',notes};
  const btn=document.getElementById('confirmLendBtn');btn.disabled=true;btn.textContent='Saving...';
  if(getApiUrl()){
    try{
      const r=await api('addLend',{gear_id,gear_name:item.name,lent_to,date_lent,date_due,notes});
      if(r&&r.lend_id) lendRecord.lend_id=r.lend_id;
    }catch(e){
      btn.disabled=false;btn.textContent='Confirm Lend';
      toast('API error â€” lend not saved: '+e.message);
      return;
    }
  }
  btn.disabled=false;btn.textContent='Confirm Lend';
  lends.unshift(lendRecord);
  item.status='lent';
  saveLocal();
  closeModal('lendOverlay');
  toast('Gear lent to '+lent_to);
  renderAll();
}


// â•â•â•â• CUSTOM FIELDS ON GEAR ITEMS â•â•â•â•
const CF_LABEL_DEFAULTS=['Colour','Material','Size','EU Size','UK Size','US Size','Weight (g)','Serial No.','Model','Year','Certification'];
function getCfLabelOptions(){
  const labels=new Set(CF_LABEL_DEFAULTS);
  items.forEach(it=>(it.custom_fields||[]).forEach(f=>{if(f.label) labels.add(f.label);}));
  return [...labels].sort();
}
function addCustomField(label='',value=''){
  const listId='cfLabelList';
  if(!document.getElementById(listId)){
    const dl=document.createElement('datalist');
    dl.id=listId;
    document.body.appendChild(dl);
  }
  const dl=document.getElementById(listId);
  dl.innerHTML=getCfLabelOptions().map(l=>`<option value="${esc(l)}">`).join('');
  const row=document.createElement('div');
  row.className='cf-row';
  row.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:center;margin-bottom:6px';
  row.innerHTML=`<input type="text" class="fc cf-label" list="${listId}" placeholder="Label (e.g. Size)" value="${esc(label)}" style="font-size:13px">
    <input type="text" class="fc cf-value" placeholder="Value (e.g. 44)" value="${esc(value)}" style="font-size:13px">
    <button type="button" onclick="this.closest('.cf-row').remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;line-height:1;padding:0 4px">Ã—</button>`;
  document.getElementById('fCustomFields').appendChild(row);
}
function getCustomFields(){
  return [...document.querySelectorAll('#fCustomFields .cf-row')].map(row=>({
    label:row.querySelector('.cf-label').value.trim(),
    value:row.querySelector('.cf-value').value.trim()
  })).filter(f=>f.label||f.value);
}
function renderTagsSelect(selectedTags){
  const container=document.getElementById('fTagsContainer');
  if(!container) return;
  const tags=lookups.tags||[];
  if(!tags.length){container.innerHTML='<span style="font-size:12px;color:var(--muted)">No tags defined. Add tags in Settings.</span>';return;}
  container.innerHTML=tags.map(t=>{
    const sel=(selectedTags||[]).includes(t);
    return`<div class="tag-pill${sel?' selected':''}" onclick="this.classList.toggle('selected')" data-tag="${esc(t)}">${esc(t)}</div>`;
  }).join('');
}
function getSelectedTags(){
  return [...document.querySelectorAll('#fTagsContainer .tag-pill.selected')].map(el=>el.dataset.tag);
}

