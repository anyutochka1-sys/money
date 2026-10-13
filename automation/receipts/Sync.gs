/** Добавочный модуль. Code.gs версии 2.7 оставьте без изменений.
 * Web app: выполнять от имени пользователя, доступ — только владелец.
 * Не публикуйте с доступом «Все». Паролей и токенов в коде нет.
 */
const MONEY_SYNC_FOLDER = '1R09l-pPmnOPYU6bNQMA8FRHHUmN1imh8';
const MONEY_SYNC_ORIGIN = 'https://anna-money.anna-piliipenko.chatgpt.site';
const MONEY_SYNC_NAME = 'money-site-state.json';
function setupMoneySync(){
 const p=PropertiesService.getScriptProperties(),email=Session.getEffectiveUser().getEmail();
 if(!email)throw Error('Не удалось определить владельца Google-аккаунта.');
 const owner=p.getProperty('MONEY_SYNC_OWNER');
 if(owner&&owner!==email)throw Error('Владелец уже установлен.');
 DriveApp.getFolderById(MONEY_SYNC_FOLDER).getName();
 p.setProperty('MONEY_SYNC_OWNER',email);
 return 'Настройка завершена. Обработка выписок и её триггеры не менялись.';
}
function moneySyncOwner_(){
 const expected=PropertiesService.getScriptProperties().getProperty('MONEY_SYNC_OWNER');
 const active=Session.getActiveUser().getEmail();
 if(!expected||!active||active!==expected)throw Error('Нет доступа. Войдите под аккаунтом владельца и используйте закрытое развертывание.');
}
function moneySyncFile_(){
 const folder=DriveApp.getFolderById(MONEY_SYNC_FOLDER),files=folder.getFilesByName(MONEY_SYNC_NAME);
 if(!files.hasNext())return null;
 const f=files.next();if(files.hasNext())throw Error('Найдено несколько файлов состояния. Нужна сверка.');return f;
}
function moneySyncState_(s){
 if(!s||typeof s!=='object'||Array.isArray(s))throw Error('Повреждено состояние.');
 for(const key of ['accounts','debts','ops','budgets','planned'])if(!Array.isArray(s[key]))throw Error('Отсутствует '+key);
 if(s.ops.length>50000)throw Error('Слишком много операций.');
 const ids=new Set();
 for(const o of s.ops){if(!o||!/^20\d\d-\d\d-\d\d$/.test(o.date||'')||!Number.isFinite(o.amount)||o.amount<0)throw Error('Повреждена операция.');if(o.id){if(ids.has(o.id))throw Error('Повтор ID операции.');ids.add(o.id)}}
 const json=JSON.stringify(s);if(json.length>8000000)throw Error('Копия превышает 8 МБ. Уберите тяжёлые вложения из копии.');return json;
}
function moneySyncRead_(){
 const file=moneySyncFile_();if(!file)return {schema:'money-site-v1',revision:null,state:null};
 const data=JSON.parse(file.getBlob().getDataAsString('UTF-8'));
 if(data.schema!=='money-site-v1'||typeof data.revision!=='string')throw Error('Неизвестный формат облачной копии.');
 moneySyncState_(data.state);return data;
}
function moneySyncRead(){moneySyncOwner_();return moneySyncRead_()}
function moneySyncSave(request){
 moneySyncOwner_();
 if(!request||typeof request.requestId!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(request.requestId))throw Error('Неверный запрос.');
 moneySyncState_(request.state);
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('Сохранение уже выполняется. Повторите проверку позже.');
 try{
  const current=moneySyncRead_();
  if(current.requestId===request.requestId)return {status:'success',revision:current.revision,updatedAt:current.updatedAt};
  if((request.baseRevision||null)!==(current.revision||null))throw Error('CONFLICT: На другом устройстве уже сохранена новая версия. Сначала загрузите её.');
  const folder=DriveApp.getFolderById(MONEY_SYNC_FOLDER),file=moneySyncFile_();
  if(file){const backups=folder.getFoldersByName('История состояния сайта');const backupFolder=backups.hasNext()?backups.next():folder.createFolder('История состояния сайта');file.makeCopy('money-state-'+current.revision+'.json',backupFolder)}
  const revision=Utilities.getUuid(),updatedAt=new Date().toISOString();
  const next=JSON.stringify({schema:'money-site-v1',revision,updatedAt,requestId:request.requestId,state:request.state});
  if(file)file.setContent(next);else folder.createFile(MONEY_SYNC_NAME,next,'application/json');
  return {status:'success',revision,updatedAt};
 }finally{lock.releaseLock()}
}
function doGet(e){
 moneySyncOwner_();
 const origin=e&&e.parameter&&e.parameter.origin,channel=e&&e.parameter&&e.parameter.channel;
 if(origin!==MONEY_SYNC_ORIGIN||!/^[a-zA-Z0-9_-]{20,100}$/.test(channel||''))return HtmlService.createHtmlOutput('Откройте синхронизацию из настроек сайта «Мои финансы».');
 const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;background:#f5f6f1;color:#283b32;padding:28px;line-height:1.6}main{max-width:500px;margin:auto;background:white;padding:28px;border-radius:20px}button{background:#456c55;color:white;padding:13px;border:0;border-radius:10px;margin:6px}small{color:#738077}</style></head><body><main><h1>Мои финансы · Google Диск</h1><p id="status">Соединяю с вашим сайтом…</p><div id="actions"></div><small>Доступ только владельцу. Старые копии сохраняются в истории на Диске.</small></main><script>
const origin=${JSON.stringify(origin)},channel=${JSON.stringify(channel)};
let client=null,clientOrigin=null,pending=null;
function send(x){try{window.top.opener.postMessage(Object.assign({channel},x),origin)}catch(e){document.getElementById('status').textContent='Браузер разорвал связь с сайтом. Вернитесь к сайту и попробуйте ещё раз.'}}
function reply(id,data,error){send({type:'reply',id,data,error:error?String(error.message||error):null})}
window.addEventListener('message',e=>{
 if(e.origin!==origin||!e.data||e.data.channel!==channel)return;
 try{if(e.source!==window.top.opener)return}catch(_){return}
 const m=e.data;if(!/^[a-zA-Z0-9_-]{16,100}$/.test(m.id||''))return;
 if(m.action==='read'){document.getElementById('status').textContent='Проверяю копию на Google Диске…';google.script.run.withSuccessHandler(d=>{document.getElementById('status').textContent=d.state?'Облачная копия найдена. Продолжите на сайте.':'Облачной копии пока нет. Продолжите на сайте.';reply(m.id,d)}).withFailureHandler(err=>reply(m.id,null,err)).moneySyncRead();}
 if(m.action==='save'&&!pending){pending=m;document.getElementById('status').textContent='Сайт предлагает сохранить '+(m.payload&&m.payload.state&&m.payload.state.ops?m.payload.state.ops.length:0)+' операций. Подтвердите сохранение на Google Диск.';const b=document.createElement('button');b.textContent='Сохранить на Google Диск';document.getElementById('actions').replaceChildren(b);b.onclick=()=>{b.disabled=true;const req=pending;google.script.run.withSuccessHandler(d=>{pending=null;document.getElementById('actions').replaceChildren();document.getElementById('status').textContent='Сохранено. Вернитесь на сайт.';reply(req.id,d)}).withFailureHandler(err=>{pending=null;document.getElementById('actions').replaceChildren();document.getElementById('status').textContent='Не удалось сохранить: '+err.message;reply(req.id,null,err)}).moneySyncSave(req.payload)}}
});send({type:'ready'});
</script></body></html>`;
 return HtmlService.createHtmlOutput(html).setTitle('Мои финансы · синхронизация');
}
