/* Review-only, local-first finance import. No network requests. */
(function(root){
'use strict';
const EXPECTED=['Дата','Категория','Сумма, ₽','Банк','Счёт','Магазин / назначение','Статус','Риск повторного учёта','Операция банка ID','Примечание','Решение владельца','ID файла выписки'];
const normalized=s=>String(s==null?'':s).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,' ').trim();
function parseCSV(input){
 const text=String(input||'').replace(/^\uFEFF/,'');
 const firstLine=text.split(/\r?\n/,1)[0];
 const sep=(firstLine.match(/;/g)||[]).length>(firstLine.match(/,/g)||[]).length?';':',';
 let row=[],field='',quoted=false,rows=[];
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){
   if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted;
  }else if(c===sep&&!quoted){row.push(field);field=''}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v!==''))rows.push(row);row=[];field=''}
  else field+=c;
 }
 if(quoted)throw Error('Ошибка в CSV: незакрытые кавычки');
 if(row.length||field){row.push(field);rows.push(row)}
 return rows;
}
function rubles(v){
 let s=String(v??'').trim().replace(/[\s\u00a0\u202f₽]/g,'');
 if(/,\d{1,2}$/.test(s))s=s.replace(',','.');
 else if(s.includes('.')&&s.includes(','))s=s.replace(/,/g,'');
 else s=s.replace(',','.');
 const n=Number(s);
 return Number.isFinite(n)?Math.round(n*100)/100:NaN;
}
function parseQueue(text){
 const data=parseCSV(text);if(data.length<2)throw Error('CSV пуст. Откройте вкладку «Кандидаты для сайта» и скачайте её в CSV.');
 const head=data.shift().map(s=>s.trim().replace(/^\uFEFF/,''));
 if(EXPECTED.some((s,i)=>s!==head[i]))throw Error('Неверная структура файла. Нужен CSV именно вкладки «Кандидаты для сайта».');
 const ids=new Set(),out=[];
 data.forEach((r,i)=>{
  if(r.length!==EXPECTED.length)throw Error('Строка '+(i+2)+': неверное число колонок');
  const [date,category,amount,bank,account,description,status,risk,sourceId]=r;
  if(!/^20\d\d-(0[1-9]|1[0-2])-[0-3]\d$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Неправильная дата в строке '+(i+2));
  const sum=rubles(amount);
  if(!(sum>0)||!bank||!category||!sourceId||ids.has(sourceId))throw Error('Неоднозначная сумма или повтор ID в строке '+(i+2));
  if(status!=='ОЖИДАЕТ СВЕРКИ')throw Error('Строка '+(i+2)+' ещё не прошла первичную проверку');
  ids.add(sourceId);
  out.push({date,category,amount:sum,bank,account,description,sourceId,risk,sourceFileId:r[11]||'',note:r[9]||''});
 });
 return out;
}
function accountId(item,accounts){
 const n=normalized(item.bank),acct=String(item.account),suffix=(acct.match(/(\d{4})$/)||[])[1];
 let target='';
 if(/сбер/.test(n))target=acct==='Накопительный счёт'?'seed-sber-savings':suffix?'seed-sber-'+(suffix==='8611'?'credit-':'')+suffix:'';
 else if(/ozon|озон/.test(n)){target=suffix==='8746'?'seed-ozon':suffix==='8930'?'seed-ozon-savings':''}
 else if(/wb банк|вб банк/.test(n))target='seed-wb';
 else if(/т банк|t bank/.test(n))target='seed-tbank';
 else if(/втб/.test(n))target='seed-vtb-7539';
 else if(/альфа/.test(n))target='seed-alfa';
 return (accounts||[]).some(a=>a.id===target)?target:'';
}
function analyze(rows,site){
 if(!site||!Array.isArray(site.ops)||!Array.isArray(site.accounts))throw Error('Неверное состояние сайта: нет счетов или операций');
 const group=new Map();
 for(const r of rows){const k=[r.date,r.account,r.bank,Math.round(r.amount*100)].join('|');group.set(k,(group.get(k)||0)+1)}
 const ops=site.ops;
 return rows.map(r=>{
  const acc=accountId(r,site.accounts),pennies=Math.round(r.amount*100);
  const exact=ops.some(o=>String(o.sourceOperationId||'')===r.sourceId||String(o.id||'')==='gsheet-'+r.sourceId);
  const sameValue=ops.filter(o=>o.date===r.date && Math.round(Number(o.amount||0)*100)===pennies && String(o.type||'')!=='planned');
  const sameAccount=sameValue.filter(o=>o.account===acc && !!acc);
  const text=normalized(r.description);
  const probable=sameAccount.some(o=>{const d=normalized(o.description||o.itemName||'');return d&&text&&(d===text||d.includes(text)||text.includes(d)||(/wildberries|вайлдберриз/.test(d)&&/wildberries|вайлдберриз/.test(text))||(/lenta|лента/.test(d)&&/lenta|лента/.test(text)))});
  const duplicateGroup=group.get([r.date,r.account,r.bank,pennies].join('|'))>1;
  const marked=String(r.risk).startsWith('Высокий');
  const cross=sameValue.length>0 && !sameAccount.length;
  const risk=exact?'existing':(probable||sameAccount.length||marked||duplicateGroup||cross)?'review':(!acc?'unknown':'clean');
  return {...r,accountId:acc,riskStatus:risk,matchedOps:sameValue.length,reason:exact?'Уже импортирована по ID':probable?'Похожа на покупку в истории сайта':marked?'Ранее уже обсуждалась / учитывалась':duplicateGroup?'Есть другая покупка в эту дату на ту же сумму':sameAccount.length?'Та же дата, карта и сумма':cross?'Та же дата и сумма на другом счёте':!acc?'Не найден счёт в сайте':'Не найдено совпадений в истории сайта'};
 });
}
function mergeSelected(site,reviewed,selectedIds,overrides){
 if(!site||!Array.isArray(site.ops)||!Array.isArray(site.accounts))throw Error('Сначала загрузите резервную копию сайта');
 const choice=new Set(selectedIds),oldId=new Set(site.ops.map(o=>String(o.sourceOperationId||'')).filter(Boolean));
 const incoming=[],selectedItems=reviewed.filter(r=>choice.has(r.sourceId));
 for(const r of selectedItems){
  if(r.riskStatus==='existing'||oldId.has(r.sourceId))throw Error('Уже учтённая операция: '+r.date);
  const account=(overrides&&overrides[r.sourceId])||r.accountId;
  if(!site.accounts.some(a=>a.id===account))throw Error('Не выбран счёт для '+r.date+' / '+r.bank);
  incoming.push({id:'gsheet-'+r.sourceId,sourceOperationId:r.sourceId,date:r.date,type:'expense',account,amount:r.amount,category:r.category,description:r.description,importSource:'google_sheet_review',sourceFile:r.sourceFileId,imported:true,userReviewed:true});
  oldId.add(r.sourceId);
 }
 return {...site,ops:[...site.ops,...incoming]};
}
const safe={EXPECTED,parseCSV,rubles,parseQueue,accountId,analyze,mergeSelected};
if(typeof module!=='undefined'&&module.exports)module.exports=safe;
if(typeof document==='undefined')return;
const createEl=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
function init(){
 const settings=document.getElementById('settings');if(!settings)return;
 const panel=createEl('details','safe-review-panel');panel.id='safeReview';
 const summary=createEl('summary','','Импорт покупок из Google Таблицы · сначала проверка');panel.appendChild(summary);
 const help=createEl('p','','Данные из CSV читаются только на этом устройстве. Ничего не отправляется на сервер. Бюджет не меняется, пока вы не подтвердите конкретные покупки.');panel.appendChild(help);
 const input=createEl('input');input.type='file';input.accept='.csv,text/csv';input.setAttribute('aria-label','CSV вкладки «Кандидаты для сайта»');panel.appendChild(input);
 const actions=createEl('div','safe-review-actions');panel.appendChild(actions);
 const preview=createEl('button');preview.type='button';preview.textContent='Проверить покупки';actions.appendChild(preview);
 const chooseClean=createEl('button');chooseClean.type='button';chooseClean.textContent='Выбрать без совпадений';chooseClean.disabled=true;actions.appendChild(chooseClean);
 const apply=createEl('button');apply.type='button';apply.textContent='Сохранить выбранные в бюджет';apply.disabled=true;actions.appendChild(apply);
 const status=createEl('p');status.setAttribute('aria-live','polite');panel.appendChild(status);
 const list=createEl('div','safe-review-list');panel.appendChild(list);
 const style=createEl('style');style.textContent='.safe-review-panel{margin:16px 0;border:1px solid #d5ccb5;border-radius:13px;padding:16px;background:#fffdf8}.safe-review-panel summary{font-size:18px;font-weight:700;cursor:pointer}.safe-review-panel input[type=file]{display:block;margin:14px 0;width:100%}.safe-review-actions{display:flex;flex-wrap:wrap;gap:8px}.safe-review-actions button{padding:11px}.safe-review-list{margin-top:16px;max-height:560px;overflow:auto}.safe-review-item{display:grid;grid-template-columns:auto 1fr;gap:9px;padding:10px 0;border-bottom:1px solid #e1dccf;font-size:14px}.safe-review-item b{display:block}.safe-review-item small{display:block;color:#5a6469}.safe-review-item select{max-width:100%;min-width:170px;padding:6px}.safe-review-item input{margin-top:8px}.safe-review-alert{color:#a14616}';panel.appendChild(style);
 settings.appendChild(panel);
 let inspected=[],chosen=new Set(),manualAccounts={};
 const escapeRecord=r=>[r.date,r.bank,r.amount,r.sourceId].join(' ');
 function currentState(){return typeof state!=='undefined'?state:null}
 function paint(){
  list.replaceChildren();if(!inspected.length)return;
  const clean=inspected.filter(r=>r.riskStatus==='clean').length,review=inspected.filter(r=>r.riskStatus==='review').length,unresolved=inspected.filter(r=>r.riskStatus==='unknown').length,existing=inspected.filter(r=>r.riskStatus==='existing').length;
  status.textContent=`Всего ${inspected.length}. Без совпадений: ${clean}; требуют сверки: ${review}; не найден счёт: ${unresolved}; уже импортированы: ${existing}. Выбрано: ${chosen.size}.`;
  for(const r of inspected){
   const item=createEl('div','safe-review-item');const box=createEl('input');box.type='checkbox';box.checked=chosen.has(r.sourceId);box.disabled=r.riskStatus==='existing';box.addEventListener('change',()=>{if(box.checked)chosen.add(r.sourceId);else chosen.delete(r.sourceId);status.textContent=`Выбрано: ${chosen.size} из ${inspected.length}. Внесение в бюджет только после подтверждения.`});item.appendChild(box);
   const details=createEl('div');const headline=createEl('b','',`${r.date} · ${r.bank} · ${r.amount.toLocaleString('ru-RU')} ₽`);details.appendChild(headline);
   const note=createEl('small',r.riskStatus!=='clean'?'safe-review-alert':'',`${r.category} · ${r.description} · ${r.reason}`);details.appendChild(note);
   if(!r.accountId){const select=createEl('select');const empty=createEl('option','','Выберите счёт');empty.value='';select.appendChild(empty);for(const a of currentState().accounts){const option=createEl('option','',a.name||a.id);option.value=a.id;select.appendChild(option)}select.value=manualAccounts[r.sourceId]||'';select.addEventListener('change',()=>{manualAccounts[r.sourceId]=select.value});details.appendChild(select)}
   item.appendChild(details);list.appendChild(item);
  }
 }
 preview.addEventListener('click',async()=>{
  if(!input.files||!input.files[0]){status.textContent='Выберите CSV из вкладки «Кандидаты для сайта».';return}
  try{const data=parseQueue(await input.files[0].text());inspected=analyze(data,currentState());chosen.clear();manualAccounts={};chooseClean.disabled=false;apply.disabled=false;paint()}
  catch(err){inspected=[];chosen.clear();list.replaceChildren();status.textContent='Не удалось проверить: '+err.message}
 });
 chooseClean.addEventListener('click',()=>{chosen=new Set(inspected.filter(r=>r.riskStatus==='clean').map(r=>r.sourceId));paint()});
 apply.addEventListener('click',()=>{
  if(!chosen.size){status.textContent='Сначала выберите хотя бы одну операцию';return}
  try{
   const existing=analyze(inspected,currentState());
   const selected=existing.filter(r=>chosen.has(r.sourceId));
   const risks=selected.filter(r=>r.riskStatus!=='clean');
   if(risks.length&&!confirm(`Среди выбранных ${risks.length} операций с возможными дублями или неясным счётом. Вы проверили их вручную?`))return;
   const patched=mergeSelected(currentState(),existing,chosen,manualAccounts);
   if(!confirm(`Внести ${patched.ops.length-currentState().ops.length} операций в расходы сайта? Сначала скачается резервная копия текущего бюджета.`))return;
   if(typeof downloadData!=='function')throw Error('Не удалось создать резервную копию. Данные не изменены');
   downloadData();
   if(typeof state==='undefined'||typeof save!=='function')throw Error('Сохранение сайта недоступно');
   state.ops=patched.ops;save();
   status.textContent=`Добавлено ${selected.length} подтверждённых операций. Резервная копия текущего состояния скачана.`;
   chosen.clear();inspected=analyze(inspected,currentState());paint();
  }catch(err){status.textContent='Сохранение отменено: '+err.message}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:{});
