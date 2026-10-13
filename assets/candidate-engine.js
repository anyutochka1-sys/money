(function(root,factory){const api=factory();if(typeof module!=='undefined')module.exports=api;if(root)root.MoneyCandidateEngine=api})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const cents=x=>Math.round(Number(x)*100),clone=x=>JSON.parse(JSON.stringify(x));
 function validateState(s){if(!s||!Array.isArray(s.accounts)||!Array.isArray(s.ops)||!Array.isArray(s.debts))throw Error('Нужна полная резервная копия сайта: счета, операции и кредиты.');return s}
 function validateCandidate(x){if(!x||!x.id||typeof x.id!=='string'||x.id.length>150||!/^20\d\d-\d\d-\d\d$/.test(x.date||'')||!Number.isFinite(x.amount)||x.amount<=0||!Number.isSafeInteger(cents(x.amount)))throw Error('Повреждён кандидат.');const date=new Date(x.date+'T12:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==x.date)throw Error('Неверная дата кандидата.');return x}
 function resolveAccount(x,state){
  const b=String(x.bank||'').toLowerCase(),hint=String(x.accountHint||''),ids=new Set(state.accounts.map(a=>a.id));let id='';
  if(/сбер/.test(b)){const suffix=hint.replace(/\D/g,'').slice(-4);id={'6993':'seed-sber-6993','1814':'seed-sber-1814','3535':'seed-sber-3535','8611':'seed-sber-credit-8611'}[suffix]||'';if(!id&&/накопител/i.test(hint))id='seed-sber-savings'}
  else if(/ozon|озон/.test(b))id={'8746':'seed-ozon','8930':'seed-ozon-savings'}[hint.replace(/\D/g,'').slice(-4)]||'';
  else if(/wb|вб банк/.test(b))id='seed-wb';
  else if(/т-банк/.test(b)&&hint.includes('5733'))id='seed-tbank';
  else if(/втб/.test(b)&&hint.includes('7539'))id='seed-vtb-7539';
  return ids.has(id)?id:'';
 }
 function analyze(candidate,state,queue){validateCandidate(candidate);validateState(state);const account=resolveAccount(candidate,state);
  const linked=state.ops.filter(o=>o.sourceOperationId===candidate.id||o.id==='review-'+candidate.id||o.id===candidate.id);
  if(linked.length){const exact=linked.length===1&&linked[0].date===candidate.date&&cents(linked[0].amount)===cents(candidate.amount)&&(!account||linked[0].account===account)&&linked[0].type==='expense';return {kind:exact?'existing':'ambiguous',account,matches:linked,reason:exact?'Операция с этим банковским ID уже записана.':'Банковский ID найден, но данные отличаются. Нужна сверка.'}}
  if(!account)return {kind:'unknown',account:'',matches:[],reason:'Счёт не определён однозначно. Запись заблокирована.'};
  if(candidate.direction!=='Списание'||candidate.handling!=='Расход после проверки'||(candidate.status&&candidate.status!=='REVIEW'))return {kind:'excluded',account,matches:[],reason:'Это не кандидат на подтверждение покупки.'};
  const similar=state.ops.filter(o=>o.account===account&&o.date===candidate.date&&cents(o.amount)===cents(candidate.amount));
  if(similar.length)return {kind:'ambiguous',account,matches:similar,canConfirmDistinct:true,reason:'В истории есть такая дата, счёт и сумма. Совпадение не доказывает дубль. Сначала сравните назначения и подтвердите, что это отдельная покупка.'};
  const peers=(queue||[]).filter(o=>o.id!==candidate.id&&o.date===candidate.date&&resolveAccount(o,state)===account&&cents(o.amount)===cents(candidate.amount));
  if(/Высокий/i.test(candidate.risk||'')||peers.length)return {kind:'risk',account,matches:[],peers,reason:peers.length?'В очереди есть другая операция на эту сумму и дату. Проверьте отдельные банковские ID.':'В реестре отмечен высокий риск повтора. Проверьте покупку вручную.'};
  return {kind:'new',account,matches:[],reason:'Совпадений в этой копии истории не найдено. Требуется подтверждение покупки.'};
 }
 function mergeOne(state,candidate,queue,acknowledged){const a=analyze(candidate,state,queue);if(a.kind==='existing')return {state:clone(state),added:false,already:true};if(a.kind!=='new'&&!(acknowledged&&(a.kind==='risk'||(a.kind==='ambiguous'&&a.canConfirmDistinct))))throw Error(a.reason);
  const control=state.accounts.find(x=>x.id===a.account);const applyToBalance=Boolean(control&&control.balanceDate&&!control.needsReconciliation&&candidate.date>control.balanceDate);
  const next=clone(state);next.ops.push({id:'review-'+candidate.id,sourceOperationId:candidate.id,sourceFile:candidate.sourceFile||'',date:candidate.date,account:a.account,type:'expense',amount:cents(candidate.amount)/100,description:candidate.description||'',category:candidate.category||'Другое',imported:true,applyToBalance,userReviewed:true,confirmedByUser:true,needsReview:false,importSource:'private_google_drive_review'});return {state:next,added:true,already:false};
 }
 return {analyze,mergeOne,resolveAccount,validateState,validateCandidate};
});
