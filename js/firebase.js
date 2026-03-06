// â•â•â•â• API â€” Firebase Firestore â•â•â•â•
firebase.initializeApp({
  apiKey:"AIzaSyBbkyMxjjeLs5-tXh6U1PMoaBXOwhArMfc",
  authDomain:"juodziaigear.firebaseapp.com",
  projectId:"juodziaigear",
  storageBucket:"juodziaigear.firebasestorage.app",
  messagingSenderId:"489753380542",
  appId:"1:489753380542:web:d8eb862afb2f05cfe080ef"
});
const _db=firebase.firestore();
function getApiUrl(){return true;} // always connected
function saveApiUrl(){}
function saveAndConnect(){connectAndLoad();}
async function api(action,body=null){return firestoreApi(action,body||{});}
async function firestoreApi(action,body){
  const FieldValue=firebase.firestore.FieldValue;
  const gear =()=>_db.collection('gear');
  const lends=()=>_db.collection('lends');
  const trips=()=>_db.collection('trips');
  const meta =(id)=>_db.collection('meta').doc(id);
  const allDocs=(snap)=>snap.docs.map(d=>({...d.data()}));
  const ts=()=>new Date().toISOString();
  const newId=(pfx)=>pfx+'-'+Date.now().toString(36).toUpperCase();

  switch(action){
    // â”€â”€ GEAR â”€â”€
    case 'getGear':    return allDocs(await gear().get());
    case 'addGear':{
      const id=body.gear_id||newId('GEAR'); const now=ts();
      const item={...body,gear_id:id,created_at:now,updated_at:now};
      await gear().doc(id).set(item); return{gear_id:id};
    }
    case 'updateGear':{
      const{gear_id,...fields}=body;
      await gear().doc(gear_id).update({...fields,updated_at:ts()});
      return{updated:gear_id};
    }
    case 'deleteGear':{
      await gear().doc(body.gear_id).delete();
      const ls=await lends().where('gear_id','==',body.gear_id).get();
      await Promise.all(ls.docs.map(d=>d.ref.delete()));
      return{deleted:body.gear_id};
    }
    // â”€â”€ LENDS â”€â”€
    case 'getLends':   return allDocs(await lends().get());
    case 'addLend':{
      const id=newId('LEND');
      await lends().doc(id).set({...body,lend_id:id,date_returned:'',condition_on_return:''});
      await gear().doc(body.gear_id).update({status:'lent',updated_at:ts()});
      return{lend_id:id};
    }
    case 'returnGear':
      await lends().doc(body.lend_id).update({date_returned:body.date_returned,condition_on_return:body.condition_on_return||''});
      await gear().doc(body.gear_id).update({status:'active',updated_at:ts()});
      return{returned:body.lend_id};
    // â”€â”€ TRIPS â”€â”€
    case 'getTrips':   return allDocs(await trips().get());
    case 'addTrip':{
      const id=body.trip_id||newId('TRIP'); const now=ts();
      await trips().doc(id).set({...body,trip_id:id,created_at:now,updated_at:now});
      return{trip_id:id};
    }
    case 'updateTrip':{
      const{trip_id,...fields}=body;
      await trips().doc(trip_id).update({...fields,updated_at:ts()});
      return{updated:trip_id};
    }
    case 'deleteTrip':
      await trips().doc(body.trip_id).delete(); return{deleted:body.trip_id};
    // â”€â”€ LOOKUPS â”€â”€
    case 'getLookups':{
      const[bSnap,hSnap,tSnap]=await Promise.all([meta('brands').get(),meta('hierarchy').get(),meta('tags').get()]);
      return{brands:bSnap.exists?(bSnap.data().items||[]):[],hierarchy:hSnap.exists?hSnap.data():{},tags:tSnap.exists?(tSnap.data().items||[]):["mountaineering","rock-climbing","ski-touring","snowboarding","cross-country","camping","hiking","via-ferrata"]};
    }
    case 'addBrand':
      await meta('brands').update({items:FieldValue.arrayUnion(body.brand)});
      return{added_brand:body.brand};
    case 'addCategory':{
      const h=await meta('hierarchy').get();
      const d=h.exists?h.data():{};
      if(!d[body.category]) d[body.category]={};
      await meta('hierarchy').set(d); return{added_category:body.category};
    }
    case 'addCategoryType':{
      const h=await meta('hierarchy').get();
      const d=h.exists?h.data():{};
      if(!d[body.category]) d[body.category]={};
      if(!d[body.category][body.type]) d[body.category][body.type]=[];
      if(body.subtype&&!d[body.category][body.type].includes(body.subtype)) d[body.category][body.type].push(body.subtype);
      await meta('hierarchy').set(d); return{added:body};
    }
    case 'renameCategory':{
      const h=await meta('hierarchy').get(); const d=h.exists?h.data():{};
      d[body.newName]=d[body.oldName]; delete d[body.oldName];
      await meta('hierarchy').set(d);
      const gs=await gear().where('category','==',body.oldName).get();
      await Promise.all(gs.docs.map(doc=>doc.ref.update({category:body.newName})));
      return{renamed:body};
    }
    case 'renameBrand':
      await meta('brands').update({items:FieldValue.arrayRemove(body.oldName)});
      await meta('brands').update({items:FieldValue.arrayUnion(body.newName)});
      return{renamed:body};
    case 'addTag':
      await meta('tags').set({items:FieldValue.arrayUnion(body.tag)},{merge:true});
      return{added_tag:body.tag};
    case 'removeTag':
      await meta('tags').set({items:FieldValue.arrayRemove(body.tag)},{merge:true});
      return{removed_tag:body.tag};
    case 'renameTag':
      await meta('tags').set({items:FieldValue.arrayRemove(body.oldName)},{merge:true});
      await meta('tags').set({items:FieldValue.arrayUnion(body.newName)},{merge:true});
      return{renamed:body};
    case 'renameType':{
      const h=await meta('hierarchy').get(); const d=h.exists?h.data():{};
      if(d[body.category]){d[body.category][body.newName]=d[body.category][body.oldName];delete d[body.category][body.oldName];}
      await meta('hierarchy').set(d); return{renamed:body};
    }
    case 'renameSubtype':{
      const h=await meta('hierarchy').get(); const d=h.exists?h.data():{};
      const subs=d[body.category]?.[body.type]||[];
      const idx=subs.indexOf(body.oldName); if(idx>=0) subs[idx]=body.newName;
      await meta('hierarchy').set(d); return{renamed:body};
    }
    case 'removeSubtype':{
      const h=await meta('hierarchy').get(); const d=h.exists?h.data():{};
      if(d[body.category]?.[body.type]) d[body.category][body.type]=d[body.category][body.type].filter(s=>s!==body.subtype);
      await meta('hierarchy').set(d); return{removed:body};
    }
    case 'replaceHierarchy':
      await meta('hierarchy').set(body.hierarchy); return{replaced:true};
    default: throw new Error('Unknown action: '+action);
  }
}
function normalizeItem(i){
  ['date_purchased','date_produced'].forEach(f=>{if(i[f]) i[f]=fmtDate(i[f]);});
  if(!i.tags) i.tags=[];
  return i;
}
function migrateHierarchy(){
  const CAT_MAP={'Mountaineering':'Mountaineering & Climbing','Skiing':'Skiing & Snowboarding'};
  const TYPE_MAP={
    'Mountaineering|Belay':{category:'Mountaineering & Climbing',type:'Belay & Descend'},
    'Mountaineering|Footwear':{category:'Footwear',type:''},
    'Mountaineering|Navigation':{category:'Electronics',type:'GPS'},
    'Mountaineering|Carry':{category:'Carry',type:'Backpacks'},
    'Mountaineering|Apparel':{category:'Apparel',type:''},
    'Camping|Shelter':{category:'Camping',type:'Shelters'},
    'Camping|Sleep':{category:'Camping',type:'Sleeping Systems'},
    'Camping|Cooking':{category:'Camping',type:'Camp Kitchen'},
    'Camping|Carry':{category:'Carry',type:'Backpacks'},
    'Camping|Lighting':{category:'Lighting',type:''},
    'Skiing|Footwear':{category:'Footwear',type:''},
    'Skiing|Safety':{category:'Skiing & Snowboarding',type:''},
    'Skiing|Apparel':{category:'Apparel',type:''},
    'Skiing|Carry':{category:'Carry',type:'Backpacks'},
  };
  // Detect if lookups.hierarchy still has old structure
  const hasOldCats=Object.keys(lookups.hierarchy||{}).some(k=>['Mountaineering','Skiing'].includes(k));
  if(hasOldCats){
    lookups.hierarchy=JSON.parse(JSON.stringify(NEW_HIERARCHY));
    if(getApiUrl()) api('replaceHierarchy',{hierarchy:lookups.hierarchy}).catch(()=>{});
  }
  let itemsChanged=false;
  items.forEach(item=>{
    const typeKey=(item.category||'')+'|'+(item.type||'');
    if(TYPE_MAP[typeKey]){
      const m=TYPE_MAP[typeKey];
      item.category=m.category; item.type=m.type; item.subtype=''; itemsChanged=true;
    } else if(CAT_MAP[item.category]){
      item.category=CAT_MAP[item.category]; itemsChanged=true;
    }
    if(!item.tags) item.tags=[];
  });
  if(hasOldCats||itemsChanged){
    saveLocal();
    if(getApiUrl()&&itemsChanged){
      items.forEach(item=>api('updateGear',{gear_id:item.gear_id,category:item.category,type:item.type,subtype:item.subtype,tags:item.tags}).catch(()=>{}));
    }
  }
}
function normalizeLend(l){
  ['date_lent','date_due','date_returned'].forEach(f=>{if(l[f]) l[f]=fmtDate(l[f]);});
  return l;
}
function normalizeTrip(t){
  ['start_date','end_date'].forEach(f=>{if(t[f]) t[f]=fmtDate(t[f]);});
  return t;
}
async function connectAndLoad({force=false}={}){
  // Serve from cache immediately so UI is instant
  loadLocal();
  initStickyColumns();
  updateBadges(); renderAll(); renderLookupUI();

  // Skip Firebase if cache is fresh and not forced
  if(!force && cacheAgeMs()<CACHE_TTL_MS){
    const mins=Math.floor(cacheAgeMs()/60000);
    setConnStatus('connected','Local cache â€” '+items.length+' items (synced '+mins+'m ago)');
    return;
  }

  setConnStatus('loading','Syncing with Firebase...');
  try{
    const[rawLookups,rawItems,rawLends,rawTrips]=await Promise.all([
      api('getLookups'),api('getGear'),api('getLends'),api('getTrips').catch(()=>[])
    ]);
    lookups=rawLookups;
    if(!lookups.tags) lookups.tags=["mountaineering","rock-climbing","ski-touring","snowboarding","cross-country","camping","hiking","via-ferrata"];
    items=rawItems.map(normalizeItem);
    lends=rawLends.map(normalizeLend);
    trips=rawTrips.map(normalizeTrip);
    migrateHierarchy();
    saveLocal();
    setConnStatus('connected','Firebase â€” '+items.length+' items');
    updateBadges(); renderAll(); renderLookupUI();
  }catch(e){
    setConnStatus('error','Firebase error: '+e.message+' â€” using local data');
    toast('Using local data ('+e.message+')',4000);
  }
}
function setConnStatus(state,msg){
  const dot=document.getElementById('connDot');
  dot.className='conn-dot '+(state==='connected'?'connected':state==='loading'?'loading':'error');
  dot.title=msg;
  const btn=document.getElementById('hdrRefreshBtn');
  if(btn) btn.style.opacity=state==='loading'?'0.5':'1';
  if(btn) btn.querySelector('svg').style.animation=state==='loading'?'spin 1s linear infinite':'';
}

