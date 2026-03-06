// â•â•â•â• INLINE EDIT HELPERS â•â•â•â•
function startEdit(liId){
  const el=document.getElementById(liId);
  el.classList.add('editing');
  el.querySelectorAll('.edit-show').forEach(b=>b.style.display='none');
  el.querySelectorAll('.edit-save,.edit-cancel').forEach(b=>b.style.display='');
  const inp=el.querySelector('input.fc');
  if(inp){inp.focus();inp.select();}
}
function cancelEdit(liId){
  const el=document.getElementById(liId);
  el.classList.remove('editing');
  el.querySelectorAll('.edit-show').forEach(b=>b.style.display='');
  el.querySelectorAll('.edit-save,.edit-cancel').forEach(b=>b.style.display='none');
}
function startEditCat(cat){ startEdit('cat-li-'+cat); }
function startEditBrand(brand){ startEdit('brand-li-'+brand); }
function startEditType(cat,typ){ startEdit('type-li-'+cat+'-'+typ); }

async function saveEditCat(oldCat){
  const newCat=document.getElementById('cat-edit-'+oldCat).value.trim();
  if(!newCat||newCat===oldCat){cancelEdit('cat-li-'+oldCat);return;}
  if(lookups.hierarchy[newCat]){toast('Category already exists');return;}
  // Rename in hierarchy
  lookups.hierarchy[newCat]=lookups.hierarchy[oldCat];
  delete lookups.hierarchy[oldCat];
  // Propagate to items
  items.forEach(i=>{if(i.category===oldCat) i.category=newCat;});
  try{if(getApiUrl()){
    await api('renameCategory',{oldName:oldCat,newName:newCat});
    // Bulk-update affected items
    const affected=items.filter(i=>i.category===newCat);
    for(const it of affected) await api('updateGear',{gear_id:it.gear_id,category:newCat});
  }}catch(e){toast('API: '+e.message);}
  saveLocal();renderLookupUI();renderAll();toast(`Category renamed to "${newCat}"`);
}

async function saveEditBrand(oldBrand){
  const newBrand=document.getElementById('brand-edit-'+oldBrand).value.trim();
  if(!newBrand||newBrand===oldBrand){cancelEdit('brand-li-'+oldBrand);return;}
  if(lookups.brands.includes(newBrand)){toast('Brand already exists');return;}
  const idx=lookups.brands.indexOf(oldBrand);
  if(idx>=0) lookups.brands[idx]=newBrand;
  lookups.brands.sort();
  // Propagate to items
  items.forEach(i=>{if(i.brand===oldBrand) i.brand=newBrand;});
  try{if(getApiUrl()){
    await api('renameBrand',{oldName:oldBrand,newName:newBrand});
    const affected=items.filter(i=>i.brand===newBrand);
    for(const it of affected) await api('updateGear',{gear_id:it.gear_id,brand:newBrand});
  }}catch(e){toast('API: '+e.message);}
  saveLocal();renderLookupUI();renderAll();toast(`Brand renamed to "${newBrand}"`);
}

async function saveEditType(cat,oldType){
  const newType=(document.getElementById('ht-edit-'+hId(cat)+'-'+hId(oldType))?.value||'').trim();
  if(!newType||newType===oldType){cancelEdit('ht-'+hId(cat)+'-'+hId(oldType));return;}
  if(lookups.hierarchy[cat][newType]){toast('Type already exists in this category');return;}
  lookups.hierarchy[cat][newType]=lookups.hierarchy[cat][oldType];
  delete lookups.hierarchy[cat][oldType];
  if(_hierOpen.types.has(cat+'\0'+oldType)){_hierOpen.types.delete(cat+'\0'+oldType);_hierOpen.types.add(cat+'\0'+newType);}
  items.forEach(i=>{if(i.category===cat&&i.type===oldType) i.type=newType;});
  try{if(getApiUrl()){
    await api('renameType',{category:cat,oldName:oldType,newName:newType});
    const affected=items.filter(i=>i.category===cat&&i.type===newType);
    for(const it of affected) await api('updateGear',{gear_id:it.gear_id,type:newType});
  }}catch(e){toast('API: '+e.message);}
  saveLocal();renderLookupUI();renderAll();toast(`Type renamed to "${newType}"`);
}

// â•â•â•â• SETTINGS â•â•â•â•
let _hierOpen={cats:new Set(),types:new Set()};
function hId(s){return s.replace(/[^a-zA-Z0-9]/g,'_');}
function toggleHCat(cat){
  const open=_hierOpen.cats.has(cat);
  if(open) _hierOpen.cats.delete(cat); else _hierOpen.cats.add(cat);
  const ch=document.getElementById('hc-ch-'+hId(cat));
  const tg=document.querySelector('#hc-'+hId(cat)+' > .htree-toggle');
  if(ch) ch.style.display=open?'none':'';
  if(tg) tg.classList.toggle('open',!open);
}
function toggleHType(cat,typ){
  const key=cat+'\0'+typ;
  const open=_hierOpen.types.has(key);
  if(open) _hierOpen.types.delete(key); else _hierOpen.types.add(key);
  const ch=document.getElementById('ht-ch-'+hId(cat)+'-'+hId(typ));
  const tg=document.querySelector('#ht-'+hId(cat)+'-'+hId(typ)+' > .htree-toggle');
  if(ch) ch.style.display=open?'none':'';
  if(tg) tg.classList.toggle('open',!open);
}
function showAddType(cat){
  const r=document.getElementById('add-t-'+hId(cat)); if(!r) return;
  r.classList.add('open');
  if(!_hierOpen.cats.has(cat)) toggleHCat(cat);
  const inp=document.getElementById('new-t-'+hId(cat)); if(inp) inp.focus();
}
function cancelAddType(cat){
  const r=document.getElementById('add-t-'+hId(cat)); if(r){r.classList.remove('open');const inp=r.querySelector('input');if(inp)inp.value='';}
}
async function confirmAddType(cat){
  const inp=document.getElementById('new-t-'+hId(cat)); if(!inp) return;
  const typ=inp.value.trim(); if(!typ){toast('Type name required');return;}
  if(!lookups.hierarchy[cat]) lookups.hierarchy[cat]={};
  if(lookups.hierarchy[cat][typ]){toast('Type already exists');return;}
  lookups.hierarchy[cat][typ]=[];
  try{if(getApiUrl()) await api('addCategoryType',{category:cat,type:typ,subtype:''});}catch(e){toast('API: '+e.message);}
  _hierOpen.types.add(cat+'\0'+typ);
  saveLocal(); inp.value=''; cancelAddType(cat); renderLookupUI(); toast('Type added');
}
function showAddSub(cat,typ){
  const r=document.getElementById('add-s-'+hId(cat)+'-'+hId(typ)); if(!r) return;
  r.classList.add('open');
  if(!_hierOpen.types.has(cat+'\0'+typ)) toggleHType(cat,typ);
  const inp=document.getElementById('new-s-'+hId(cat)+'-'+hId(typ)); if(inp) inp.focus();
}
function cancelAddSub(cat,typ){
  const r=document.getElementById('add-s-'+hId(cat)+'-'+hId(typ)); if(r){r.classList.remove('open');const inp=r.querySelector('input');if(inp)inp.value='';}
}
async function confirmAddSub(cat,typ){
  const inp=document.getElementById('new-s-'+hId(cat)+'-'+hId(typ)); if(!inp) return;
  const sub=inp.value.trim(); if(!sub){toast('Subtype name required');return;}
  if(!lookups.hierarchy[cat]?.[typ]) return;
  if(lookups.hierarchy[cat][typ].includes(sub)){toast('Subtype already exists');return;}
  lookups.hierarchy[cat][typ].push(sub);
  try{if(getApiUrl()) await api('addCategoryType',{category:cat,type:typ,subtype:sub});}catch(e){toast('API: '+e.message);}
  saveLocal(); inp.value=''; cancelAddSub(cat,typ); renderLookupUI(); toast('Subtype added');
}
function showAddCat(){
  const r=document.getElementById('add-cat-row'); if(r) r.classList.add('open');
  const inp=document.getElementById('new-cat-input'); if(inp) inp.focus();
}
function cancelAddCat(){
  const r=document.getElementById('add-cat-row'); if(r) r.classList.remove('open');
  const inp=document.getElementById('new-cat-input'); if(inp) inp.value='';
}
async function confirmAddCat(){
  const v=(document.getElementById('new-cat-input')?.value||'').trim(); if(!v) return;
  if(lookups.hierarchy[v]){toast('Category already exists');return;}
  try{if(getApiUrl()) await api('addCategory',{category:v});}catch(e){toast('API: '+e.message);}
  lookups.hierarchy[v]={}; _hierOpen.cats.add(v); saveLocal(); cancelAddCat(); renderLookupUI(); toast('Category added');
}
async function saveHCat(oldCat){
  const newCat=(document.getElementById('hc-edit-'+hId(oldCat))?.value||'').trim();
  if(!newCat||newCat===oldCat){cancelEdit('hc-'+hId(oldCat));return;}
  if(lookups.hierarchy[newCat]){toast('Category already exists');return;}
  lookups.hierarchy[newCat]=lookups.hierarchy[oldCat];
  delete lookups.hierarchy[oldCat];
  if(_hierOpen.cats.has(oldCat)){_hierOpen.cats.delete(oldCat);_hierOpen.cats.add(newCat);}
  items.forEach(i=>{if(i.category===oldCat) i.category=newCat;});
  try{if(getApiUrl()){
    await api('renameCategory',{oldName:oldCat,newName:newCat});
    const affected=items.filter(i=>i.category===newCat);
    for(const it of affected) await api('updateGear',{gear_id:it.gear_id,category:newCat});
  }}catch(e){toast('API: '+e.message);}
  saveLocal();renderLookupUI();renderAll();toast(`Category renamed to "${newCat}"`);
}
async function saveEditSub(cat,typ,oldSub){
  const sid=hId(cat)+'-'+hId(typ)+'-'+hId(oldSub);
  const newSub=(document.getElementById('hs-edit-'+sid)?.value||'').trim();
  if(!newSub||newSub===oldSub){cancelEdit('hs-'+sid);return;}
  const arr=lookups.hierarchy[cat]?.[typ]||[];
  if(arr.includes(newSub)){toast('Subtype already exists');return;}
  const idx=arr.indexOf(oldSub); if(idx>=0) arr[idx]=newSub;
  items.forEach(i=>{if(i.category===cat&&i.type===typ&&i.subtype===oldSub) i.subtype=newSub;});
  try{if(getApiUrl()){
    await api('renameSubtype',{category:cat,type:typ,oldName:oldSub,newName:newSub});
    const affected=items.filter(i=>i.category===cat&&i.type===typ&&i.subtype===newSub);
    for(const it of affected) await api('updateGear',{gear_id:it.gear_id,subtype:newSub});
  }}catch(e){toast('API: '+e.message);}
  saveLocal();renderLookupUI();renderAll();toast(`Subtype renamed to "${newSub}"`);
}
async function removeSub(cat,typ,sub){
  if(!confirm(`Remove subtype "${sub}"?`)) return;
  if(lookups.hierarchy[cat]?.[typ]) lookups.hierarchy[cat][typ]=lookups.hierarchy[cat][typ].filter(s=>s!==sub);
  try{if(getApiUrl()) await api('removeSubtype',{category:cat,type:typ,subtype:sub});}catch(e){toast('API: '+e.message);}
  saveLocal();renderLookupUI();toast('Subtype removed');
}
function renderHierTree(){
  const el=document.getElementById('hierTree'); if(!el) return;
  const hier=lookups.hierarchy||{};
  if(!Object.keys(hier).length){el.innerHTML='<div style="color:var(--muted);font-size:13px;padding:8px 0">No categories yet.</div>';return;}
  el.innerHTML=Object.entries(hier).sort(([a],[b])=>a.localeCompare(b)).map(([cat,types])=>{
    const cid=hId(cat); const catOpen=_hierOpen.cats.has(cat);
    const typeRows=Object.entries(types).sort(([a],[b])=>a.localeCompare(b)).map(([typ,subs])=>{
      const tid=cid+'-'+hId(typ); const typOpen=_hierOpen.types.has(cat+'\0'+typ);
      const subRows=subs.map(sub=>{
        const sid=tid+'-'+hId(sub);
        return `<div class="htree-row" id="hs-${sid}">
          <span style="width:14px;flex-shrink:0"></span>
          <span class="htree-sub-label">â€¢ ${esc(sub)}</span>
          <input class="fc htree-edit-input" id="hs-edit-${sid}" value="${esc(sub)}">
          <div class="htree-actions">
            <button class="btn btn-ghost btn-sm edit-show" title="Rename" onclick="startEdit('hs-${sid}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg></button>
            <button class="btn btn-primary btn-sm edit-save" style="display:none" onclick="saveEditSub('${esc(cat)}','${esc(typ)}','${esc(sub)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,10 8,15 17,5"/></svg></button>
            <button class="btn btn-ghost btn-sm edit-cancel" style="display:none" onclick="cancelEdit('hs-${sid}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
            <button class="btn btn-ghost btn-sm edit-show" title="Remove" onclick="removeSub('${esc(cat)}','${esc(typ)}','${esc(sub)}')">&#10005;</button>
          </div>
        </div>`;
      }).join('');
      return `<div>
        <div class="htree-row" id="ht-${tid}">
          <span class="htree-toggle${typOpen?' open':''}" onclick="toggleHType('${esc(cat)}','${esc(typ)}')"><svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7,4 13,10 7,16"/></svg></span>
          <span class="htree-label">${esc(typ)} <span style="font-size:11px;color:var(--muted);font-weight:400">${subs.length}</span></span>
          <input class="fc htree-edit-input" id="ht-edit-${tid}" value="${esc(typ)}">
          <div class="htree-actions">
            <button class="btn btn-ghost btn-sm edit-show" title="Rename" onclick="startEdit('ht-${tid}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg></button>
            <button class="btn btn-primary btn-sm edit-save" style="display:none" onclick="saveEditType('${esc(cat)}','${esc(typ)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,10 8,15 17,5"/></svg></button>
            <button class="btn btn-ghost btn-sm edit-cancel" style="display:none" onclick="cancelEdit('ht-${tid}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
            <button class="btn btn-ghost btn-sm edit-show" title="Add subtype" onclick="showAddSub('${esc(cat)}','${esc(typ)}')">+</button>
            <button class="btn btn-ghost btn-sm edit-show" title="Remove" onclick="removeType('${esc(cat)}','${esc(typ)}')">&#10005;</button>
          </div>
        </div>
        <div id="ht-ch-${tid}" style="display:${typOpen?'':'none'}">
          <div class="htree-children">
            ${subRows}
            <div class="htree-add-row" id="add-s-${tid}">
              <input type="text" class="fc" id="new-s-${tid}" placeholder="New subtypeâ€¦" style="flex:1;font-size:12px" onkeydown="if(event.key==='Enter') confirmAddSub('${esc(cat)}','${esc(typ)}')">
              <button class="btn btn-primary btn-sm" onclick="confirmAddSub('${esc(cat)}','${esc(typ)}')">Add</button>
              <button class="btn btn-ghost btn-sm" onclick="cancelAddSub('${esc(cat)}','${esc(typ)}')">&#10005;</button>
            </div>
          </div>
          <button class="htree-add-btn" onclick="showAddSub('${esc(cat)}','${esc(typ)}')">+ Add Subtype</button>
        </div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:4px">
      <div class="htree-row" id="hc-${cid}">
        <span class="htree-toggle${catOpen?' open':''}" onclick="toggleHCat('${esc(cat)}')"><svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7,4 13,10 7,16"/></svg></span>
        <span class="htree-label" style="color:var(--accent)">${CAT_EMOJI[cat]||''} ${esc(cat)} <span style="font-size:11px;color:var(--muted);font-weight:400">${Object.keys(types).length} types</span></span>
        <input class="fc htree-edit-input" id="hc-edit-${cid}" value="${esc(cat)}">
        <div class="htree-actions">
          <button class="btn btn-ghost btn-sm edit-show" title="Rename" onclick="startEdit('hc-${cid}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg></button>
          <button class="btn btn-primary btn-sm edit-save" style="display:none" onclick="saveHCat('${esc(cat)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,10 8,15 17,5"/></svg></button>
          <button class="btn btn-ghost btn-sm edit-cancel" style="display:none" onclick="cancelEdit('hc-${cid}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
          <button class="btn btn-ghost btn-sm edit-show" title="Add type" onclick="showAddType('${esc(cat)}')">+</button>
          <button class="btn btn-ghost btn-sm edit-show" title="Remove" onclick="removeCategory('${esc(cat)}')">&#10005;</button>
        </div>
      </div>
      <div id="hc-ch-${cid}" style="display:${catOpen?'':'none'}">
        <div class="htree-children">
          ${typeRows}
          <div class="htree-add-row" id="add-t-${cid}">
            <input type="text" class="fc" id="new-t-${cid}" placeholder="New typeâ€¦" style="flex:1;font-size:12px" onkeydown="if(event.key==='Enter') confirmAddType('${esc(cat)}')">
            <button class="btn btn-primary btn-sm" onclick="confirmAddType('${esc(cat)}')">Add</button>
            <button class="btn btn-ghost btn-sm" onclick="cancelAddType('${esc(cat)}')">&#10005;</button>
          </div>
        </div>
        <button class="htree-add-btn" onclick="showAddType('${esc(cat)}')">+ Add Type</button>
      </div>
    </div>`;
  }).join('');
}
function setStickyColumns(on){
  document.body.classList.toggle('sticky-cols',on);
  localStorage.setItem('sg_sticky_cols',on?'1':'0');
  const cb=document.getElementById('stickyColsToggle');
  if(cb) cb.checked=on;
}
function initStickyColumns(){
  const saved=localStorage.getItem('sg_sticky_cols');
  // default ON (null = first visit)
  const on=saved===null?true:saved==='1';
  setStickyColumns(on);
}

function renderLookupUI(){
  const cats=getCats();
  const cl=document.getElementById('categoryList');
  if(cl) cl.innerHTML=cats.map(c=>`
    <div class="list-item" id="cat-li-${c}">
      <span class="list-item-label">${esc(c)}</span>
      <input class="fc list-item-edit" id="cat-edit-${c}" value="${esc(c)}" style="font-size:13px;padding:4px 8px">
      <div class="list-item-btns">
        <button class="btn btn-ghost btn-sm edit-show" onclick="startEditCat('${esc(c)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg></button>
        <button class="btn btn-primary btn-sm edit-save" style="display:none" onclick="saveEditCat('${esc(c)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,10 8,15 17,5"/></svg></button>
        <button class="btn btn-ghost btn-sm edit-cancel" style="display:none" onclick="cancelEdit('cat-li-${c}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
        <button class="btn btn-ghost btn-sm edit-show" onclick="removeCategory('${esc(c)}')">&#10005;</button>
      </div>
    </div>`).join('');
  populateCategoryDropdowns();
  const bl=document.getElementById('brandList');
  if(bl) bl.innerHTML=(lookups.brands||[]).map(b=>`
    <div class="list-item" id="brand-li-${b}">
      <span class="list-item-label">${esc(b)}</span>
      <input class="fc list-item-edit" id="brand-edit-${b}" value="${esc(b)}" style="font-size:13px;padding:4px 8px">
      <div class="list-item-btns">
        <button class="btn btn-ghost btn-sm edit-show" onclick="startEditBrand('${esc(b)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg></button>
        <button class="btn btn-primary btn-sm edit-save" style="display:none" onclick="saveEditBrand('${esc(b)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,10 8,15 17,5"/></svg></button>
        <button class="btn btn-ghost btn-sm edit-cancel" style="display:none" onclick="cancelEdit('brand-li-${b}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
        <button class="btn btn-ghost btn-sm edit-show" onclick="removeBrand('${esc(b)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
      </div>
    </div>`).join('');
  const tl=document.getElementById('tagList');
  if(tl) tl.innerHTML=(lookups.tags||[]).map(t=>{
    const eid='tag-edit-'+CSS.escape(t);
    const lid='tag-li-'+CSS.escape(t);
    return`<div class="list-item" id="${lid}">
      <span class="list-item-label">${esc(t)}</span>
      <input class="fc list-item-edit" id="${eid}" value="${esc(t)}" style="font-size:13px;padding:4px 8px">
      <div class="list-item-btns">
        <button class="btn btn-ghost btn-sm edit-show" onclick="startEditTag('${esc(t)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg></button>
        <button class="btn btn-primary btn-sm edit-save" style="display:none" onclick="saveEditTag('${esc(t)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,10 8,15 17,5"/></svg></button>
        <button class="btn btn-ghost btn-sm edit-cancel" style="display:none" onclick="cancelEdit('${lid}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
        <button class="btn btn-ghost btn-sm edit-show" onclick="removeTag('${esc(t)}')"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg></button>
      </div>
    </div>`;}).join('');
  renderHierTree();
}
function getCats(){return Object.keys(lookups.hierarchy||{}).sort();}
function populateCategoryDropdowns(){
  const cats=getCats();
  ['fCategory','fCat'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    const cur=el.value;
    el.innerHTML=id==='fCat'?'<option value="">All Categories</option>':'<option value="">&#8212; select &#8212;</option>';
    cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;if(c===cur)o.selected=true;el.appendChild(o);});
  });
  CATS.length=0; cats.forEach(c=>CATS.push(c));
}
async function addCategory(){
  const v=document.getElementById('newCategory').value.trim(); if(!v) return;
  if(lookups.hierarchy[v]){toast('Category already exists');return;}
  try{if(getApiUrl()) await api('addCategory',{category:v});}catch(e){toast('API: '+e.message);}
  lookups.hierarchy[v]={}; saveLocal(); document.getElementById('newCategory').value=''; renderLookupUI(); toast('Category added');
}
function removeCategory(cat){
  if(!confirm('Remove category "'+cat+'" and all its types?')) return;
  delete lookups.hierarchy[cat]; _hierOpen.cats.delete(cat); saveLocal(); renderLookupUI(); toast('Category removed');
}
async function addBrand(){
  const v=document.getElementById('newBrand').value.trim(); if(!v) return;
  if(lookups.brands.includes(v)){toast('Brand already exists');return;}
  try{if(getApiUrl()) await api('addBrand',{brand:v});}catch(e){toast('API: '+e.message);}
  lookups.brands.push(v);lookups.brands.sort();saveLocal();document.getElementById('newBrand').value='';renderLookupUI();toast('Brand added');
}
function removeBrand(b){lookups.brands=lookups.brands.filter(x=>x!==b);saveLocal();renderLookupUI();}
function startEditTag(tag){startEdit('tag-li-'+CSS.escape(tag));}
async function saveEditTag(oldTag){
  const el=document.getElementById('tag-edit-'+CSS.escape(oldTag));
  const newTag=(el?el.value:'').trim().toLowerCase().replace(/\s+/g,'-');
  if(!newTag||newTag===oldTag){cancelEdit('tag-li-'+CSS.escape(oldTag));return;}
  if((lookups.tags||[]).includes(newTag)){toast('Tag already exists');return;}
  const idx=(lookups.tags||[]).indexOf(oldTag);
  if(idx>=0) lookups.tags[idx]=newTag;
  lookups.tags.sort();
  items.forEach(i=>{if(i.tags){const ti=i.tags.indexOf(oldTag);if(ti>=0) i.tags[ti]=newTag;}});
  try{if(getApiUrl()){
    await api('renameTag',{oldName:oldTag,newName:newTag});
    const affected=items.filter(i=>(i.tags||[]).includes(newTag));
    for(const it of affected) await api('updateGear',{gear_id:it.gear_id,tags:it.tags}).catch(()=>{});
  }}catch(e){toast('API: '+e.message);}
  saveLocal();renderLookupUI();renderAll();toast(`Tag renamed to "${newTag}"`);
}
async function addTag(){
  const v=(document.getElementById('newTag').value.trim()).toLowerCase().replace(/\s+/g,'-'); if(!v) return;
  if((lookups.tags||[]).includes(v)){toast('Tag already exists');return;}
  if(!lookups.tags) lookups.tags=[];
  try{if(getApiUrl()) await api('addTag',{tag:v});}catch(e){toast('API: '+e.message);}
  lookups.tags.push(v);lookups.tags.sort();saveLocal();document.getElementById('newTag').value='';renderLookupUI();toast('Tag added');
}
function removeTag(t){
  if(!confirm('Remove tag "'+t+'"? It will be removed from all items.')) return;
  lookups.tags=(lookups.tags||[]).filter(x=>x!==t);
  items.forEach(i=>{if(i.tags) i.tags=i.tags.filter(x=>x!==t);});
  if(getApiUrl()){
    api('removeTag',{tag:t}).catch(()=>{});
    const affected=items.filter(()=>true);
    affected.forEach(it=>api('updateGear',{gear_id:it.gear_id,tags:it.tags}).catch(()=>{}));
  }
  saveLocal();renderLookupUI();renderAll();toast('Tag removed');
}
function removeType(cat,typ){
  if(!confirm(`Remove type "${typ}" from ${cat}?`)) return;
  delete lookups.hierarchy[cat][typ]; _hierOpen.types.delete(cat+'\0'+typ); saveLocal(); renderLookupUI();
}

