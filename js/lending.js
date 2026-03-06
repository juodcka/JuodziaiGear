// â•â•â•â• NEW LENDING (from Lent Out page) â•â•â•â•
let _nlPendingLends=[];

function openNewLending(){
  populateBorrowerList();
  const dl=document.getElementById('nlBorrowerList');
  const names=[...new Set(lends.map(l=>l.lent_to).filter(Boolean))].sort();
  if(dl) dl.innerHTML=names.map(n=>`<option value="${esc(n)}">`).join('');
  document.getElementById('nlLentTo').value='';
  document.getElementById('nlDateLent').value=new Date().toISOString().slice(0,10);
  document.getElementById('nlDateDue').value='';
  document.getElementById('nlNotes').value='';
  document.getElementById('nlStep1').style.display='';
  document.getElementById('nlStep2').style.display='none';
  _nlPendingLends=[];
  document.getElementById('newLendingOverlay').classList.add('open');
}
function nlStep2(){
  const lent_to=document.getElementById('nlLentTo').value.trim();
  if(!lent_to){toast('Please enter who you are lending to');return;}
  document.getElementById('nlPersonLabel').textContent=lent_to;
  document.getElementById('nlStep1').style.display='none';
  document.getElementById('nlStep2').style.display='';
  document.getElementById('nlPickerSearch').value='';
  nlFilterPicker();
}
function nlBack(){
  document.getElementById('nlStep1').style.display='';
  document.getElementById('nlStep2').style.display='none';
}
function nlFilterPicker(){
  const search=document.getElementById('nlPickerSearch').value.toLowerCase();
  const availOnly=document.getElementById('nlAvailOnly').checked;
  const dateLent=document.getElementById('nlDateLent').value;
  const dateDue=document.getElementById('nlDateDue').value||'9999-12-31';
  const el=document.getElementById('nlPickerList');
  const candidates=items.filter(i=>i.status!=='retired'&&(!search||(i.name||'').toLowerCase().includes(search)||(i.brand||'').toLowerCase().includes(search)));
  if(!candidates.length){el.innerHTML='<div style="padding:16px;text-align:center;color:var(--muted)">No items found</div>';return;}
  const rows=candidates.map(item=>{
    const lentConflict=item.status==='lent'||isItemLentDuring(item.gear_id,dateLent,dateDue);
    const tripConflict=!lentConflict&&isItemInTripDuring(item.gear_id,dateLent,dateDue);
    const disabled=lentConflict||tripConflict;
    if(availOnly&&disabled) return '';
    const conflictMsg=lentConflict?'Already lent out':tripConflict?'In a trip during this period':'';
    const _pEmoji=CAT_EMOJI[item.category]||'ðŸŽ’';
    const photo=item.photo_url&&safeUrl(item.photo_url)?`<img src="${safeUrl(item.photo_url)}" style="width:32px;height:32px;border-radius:6px;object-fit:cover" onerror="this.style.display='none';this.nextSibling.style.display=''"><span style="display:none;font-size:20px">${_pEmoji}</span>`:`<span style="font-size:20px">${_pEmoji}</span>`;
    const statusBadge=lentConflict?`<span class="tag tag-lent" style="font-size:10px">Lent</span>`:tripConflict?`<span class="tag" style="font-size:10px;background:var(--surface2)">In Trip</span>`:'';
    return `<div class="picker-row${disabled?' disabled':''}">
      <input type="checkbox" class="picker-cb" data-id="${esc(item.gear_id)}"${disabled?' disabled':''}>
      ${photo}
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:14px">${esc(item.name)} ${statusBadge}</div>
        <div style="color:var(--muted);font-size:12px">${esc(item.brand||'')}${item.weight_g?' Â· '+fmtWeight(parseFloat(item.weight_g)):''}</div>
        ${conflictMsg?`<div class="picker-conflict">${esc(conflictMsg)}</div>`:''}
      </div>
    </div>`;
  }).join('');
  el.innerHTML=rows||'<div style="padding:16px;text-align:center;color:var(--muted)">No available items</div>';
}
async function confirmNewLending(){
  const lent_to=document.getElementById('nlLentTo').value.trim();
  const date_lent=document.getElementById('nlDateLent').value;
  const date_due=document.getElementById('nlDateDue').value;
  const notes=document.getElementById('nlNotes').value.trim();
  const checked=[...document.querySelectorAll('#nlPickerList .picker-cb:checked:not(:disabled)')].map(cb=>cb.dataset.id);
  if(!checked.length){toast('Select at least one item');return;}
  const btn=document.getElementById('nlConfirmBtn');
  btn.disabled=true;btn.textContent='Savingâ€¦';
  for(const gear_id of checked){
    const item=items.find(i=>i.gear_id===gear_id); if(!item) continue;
    const lendRecord={lend_id:'LEND-'+Date.now().toString(36).toUpperCase()+'-'+gear_id.slice(-4),gear_id,gear_name:item.name,lent_to,date_lent,date_due,date_returned:'',condition_on_return:'',notes};
    if(getApiUrl()){
      try{
        const r=await api('addLend',{gear_id,gear_name:item.name,lent_to,date_lent,date_due,notes});
        if(r&&r.lend_id) lendRecord.lend_id=r.lend_id;
      }catch(e){toast('API: '+e.message);}
    }
    lends.unshift(lendRecord);
    item.status='lent';
  }
  saveLocal();
  btn.disabled=false;btn.textContent='Confirm Lending';
  closeModal('newLendingOverlay');
  toast(`${checked.length} item${checked.length>1?'s':''} lent to ${lent_to}`);
  renderAll();
}

