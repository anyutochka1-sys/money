/**
 * \u041c\u041e\u0418 \u0424\u0418\u041d\u0410\u041d\u0421\u042b. \u0418\u043c\u043f\u043e\u0440\u0442 \u0447\u0435\u043a\u043e\u0432 \u0438 \u0441\u0432\u0435\u0440\u043a\u0430 \u0431\u0430\u043d\u043a\u043e\u0432\u0441\u043a\u0438\u0445 \u0432\u044b\u043f\u0438\u0441\u043e\u043a.
 * Apps Script + Google Drive + Google Sheets, \u0431\u0435\u0437 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 \u0431\u0430\u043d\u043a\u043e\u0432\u0441\u043a\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445.
 * \u0412\u0435\u0440\u0441\u0438\u044f 2.4 (\u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u044b\u0445 \u0432\u043a\u043b\u0430\u0434\u043e\u043a \u0438 \u0438\u0441\u043a\u0430\u0436\u0451\u043d\u043d\u043e\u0439 \u043a\u043e\u0434\u0438\u0440\u043e\u0432\u043a\u0438). \u041f\u0440\u0438 \u0440\u0430\u0431\u043e\u0442\u0435 \u0441 \u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u043c \u0444\u043e\u0440\u043c\u0430\u0442\u043e\u043c \u0432\u044b\u043f\u0438\u0441\u043a\u0438 \u0437\u0430\u043f\u0438\u0441\u0438 \u043e\u0441\u0442\u0430\u044e\u0442\u0441\u044f \u043d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0443.
 */
const CONFIG = Object.freeze({
  receiptsFolder: '1fpJgRM7uL_ST2sOcmjtExLzKIbP4H1G3',
  statementsFolder: '17CeSLU6pZirAUjKWs116u35MBfkvY0m7',
  ledger: '1OdgX59VTCm37jejrXWKgOu0aNgJSHFCoB6MjGQXdKHw',
  timezone: 'Asia/Krasnoyarsk'
});
const SCHEMA = {
  '\u0427\u0435\u043a\u0438':['file_id','file_name','file_created','imported_at','ocr_text','sum_rub','date','status','comment'],
  '\u041f\u043e\u0437\u0438\u0446\u0438\u0438 \u0442\u043e\u0432\u0430\u0440\u043e\u0432':['file_id','\u0434\u0430\u0442\u0430','\u043c\u0430\u0433\u0430\u0437\u0438\u043d','\u0442\u043e\u0432\u0430\u0440','\u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e','\u0446\u0435\u043d\u0430','\u0441\u0443\u043c\u043c\u0430','\u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f','\u0443\u0432\u0435\u0440\u0435\u043d\u043d\u043e\u0441\u0442\u044c','\u0441\u0442\u0430\u0442\u0443\u0441 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438'],
  '\u0412\u044b\u043f\u0438\u0441\u043a\u0438':['file_id','file_name','imported_at','bank','raw_text','status','comment'],
  '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u044b\u043f\u0438\u0441\u043e\u043a':['operation_id','file_id','\u0434\u0430\u0442\u0430','\u0431\u0430\u043d\u043a','\u0441\u0447\u0451\u0442','\u0442\u0438\u043f','\u0441\u0443\u043c\u043c\u0430','\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435','\u0441\u0442\u0430\u0442\u0443\u0441','\u0441\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u0439 \u0447\u0435\u043a','\u043f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435'],
  '\u0421\u0432\u0435\u0440\u043a\u0430':['receipt_id','\u0434\u0430\u0442\u0430 \u0447\u0435\u043a\u0430','\u0441\u0443\u043c\u043c\u0430 \u0447\u0435\u043a\u0430','\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435','operation_id','\u0434\u0430\u0442\u0430 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438','\u0441\u0443\u043c\u043c\u0430 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438','\u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442','\u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439'],
  '\u0416\u0443\u0440\u043d\u0430\u043b':['\u0432\u0440\u0435\u043c\u044f','\u044d\u0442\u0430\u043f','\u0444\u0430\u0439\u043b','\u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435']
};
function setupOnce(){
 const book=SpreadsheetApp.openById(CONFIG.ledger);
 Object.keys(SCHEMA).forEach(name=>ensureSheet_(book,name));
 // \u041d\u0435 \u0443\u0434\u0430\u043b\u044f\u0435\u043c \u0440\u0430\u043d\u0435\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u043d\u044b\u0435 \u0442\u0440\u0438\u0433\u0433\u0435\u0440\u044b, \u043a\u0440\u043e\u043c\u0435 \u0441\u0442\u0430\u0440\u044b\u0445 \u0432\u0435\u0440\u0441\u0438\u0439 \u043d\u0430\u0448\u0438\u0445 \u0444\u0443\u043d\u043a\u0446\u0438\u0439.
 ['scanNewReceipts','scanNewStatements','runAll','monthlyReconcile'].forEach(removeTriggers_);
 ScriptApp.newTrigger('runAll').timeBased().everyHours(1).create();
 ScriptApp.newTrigger('monthlyReconcile').timeBased().onMonthDay(2).atHour(9).create();
 runAll();
}
function runAll(){
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(5000)) return;
 try{
  const b=SpreadsheetApp.openById(CONFIG.ledger);
  Object.keys(SCHEMA).forEach(name=>ensureSheet_(b,name));
  importReceipts_(b);
  importStatements_(b);
  importStagedCreditSavings_(b);
  parseReceiptItems_(b);
  reconcile_(b);
 }catch(e){
  try {log_(SpreadsheetApp.openById(CONFIG.ledger),'\u041e\u0448\u0438\u0431\u043a\u0430','',String(e.stack||e));}catch(_){}
  throw e;
 }finally{lock.releaseLock()}
}
function scanNewReceipts(){runAll()}
function scanNewStatements(){runAll()}
function monthlyReconcile(){runAll()}
function installHourlyTrigger(){setupOnce()}
function removeTriggers_(fn){ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===fn).forEach(ScriptApp.deleteTrigger)}
function ensureSheet_(b,name){
 const canonical={'\u0427\u0435\u043a\u0438':407484829,'\u041f\u043e\u0437\u0438\u0446\u0438\u0438 \u0442\u043e\u0432\u0430\u0440\u043e\u0432':937789504,'\u0412\u044b\u043f\u0438\u0441\u043a\u0438':442132535,'\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u044b\u043f\u0438\u0441\u043e\u043a':941385548,'\u0421\u0432\u0435\u0440\u043a\u0430':1996303993,'\u0416\u0443\u0440\u043d\u0430\u043b':915108791};
 const byId=b.getSheets().find(sh=>sh.getSheetId()===canonical[name]);
 const s=byId||b.getSheetByName(name)||b.insertSheet(name),h=SCHEMA[name];
 if(s.getLastRow()===0){s.appendRow(h);s.setFrozenRows(1)}
 return s;
}
function rows_(s,n){return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,n).getValues():[]}
function log_(b,step,file,message){ensureSheet_(b,'\u0416\u0443\u0440\u043d\u0430\u043b').appendRow([new Date(),step,file,String(message).slice(0,1000)])}
function allFiles_(folderId){const it=DriveApp.getFolderById(folderId).getFiles(),out=[];while(it.hasNext())out.push(it.next());return out}
function isSupported_(f){return /^(image\/|application\/pdf)/.test(f.getMimeType())}
function ocr_(f){
 // \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0441\u0435\u0440\u0432\u0438\u0441 Drive API v3 \u0432 Apps Script. \u0421\u043e\u0437\u0434\u0430\u0451\u0442\u0441\u044f \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0439 Google Doc.
 const temp=Drive.Files.create({name:'receipt_ocr_'+f.getId(),mimeType:'application/vnd.google-apps.document'},f.getBlob(),{fields:'id'});
 try{return DocumentApp.openById(temp.id).getBody().getText()}
 finally{DriveApp.getFileById(temp.id).setTrashed(true)}
}
function hash_(text){const d=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8);return Utilities.base64EncodeWebSafe(d).slice(0,22)}
function norm_(text){return String(text||'').toLowerCase().replace(/[\u0451]/g,'\u0435').replace(/\s+/g,' ').trim()}
function num_(text){const v=String(text===null||text===undefined?'':text).replace(/\s|\u00a0/g,'').replace(',','.');if(!v)return NaN;const n=Number(v);return Number.isFinite(n)?n:NaN}
function money_(n){return Math.round(n*100)/100}
function date_(text){
 const m=String(text||'').match(/\b([0-3]\d)[.\/\-]([01]\d)[.\/\-](20\d\d|\d\d)\b/);
 if(!m)return '';
 const year=m[3].length===2?'20'+m[3]:m[3];
 const d=year+'-'+m[2]+'-'+m[1];
 const dt=new Date(d+'T12:00:00Z');return dt.toISOString().slice(0,10)===d?d:'';
}
function total_(text){
 const r=String(text||'').match(/(?:^|\s)(?:\u0418\u0422\u041e\u0413\u041e|\u0412\u0421\u0415\u0413\u041e \u041a \u041e\u041f\u041b\u0410\u0422\u0415|\u041a \u041e\u041f\u041b\u0410\u0422\u0415|\u0421\u0423\u041c\u041c\u0410 \u0427\u0415\u041a\u0410)\s*[:=]?\s*([\d\s\u00a0]+[.,]\d{2})/i);
 return r?num_(r[1]):NaN;
}
function guessShop_(text,filename){
 const t=norm_(text+' '+filename);
 for(const [re,name] of [[/\u043b\u0435\u043d\u0442\u0430/,'\u041b\u0435\u043d\u0442\u0430'],[/\u044f\u0440\u0447\u0435/,'\u042f\u0440\u0447\u0435'],[/\u043f\u044f\u0442\u0435\u0440\u043e\u0447\u043a/,'\u041f\u044f\u0442\u0451\u0440\u043e\u0447\u043a\u0430'],[/wildberries|\u0432\u0430\u0439\u043b\u0434\u0431\u0435\u0440\u0440\u0438\u0437/,'Wildberries'],[/ozon|\u043e\u0437\u043e\u043d/,'Ozon']])if(re.test(t))return name;
 return '\u041d\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0451\u043d';
}
function importReceipts_(book){
 const sheet=book.getSheetByName('\u0427\u0435\u043a\u0438'),known=new Set(rows_(sheet,9).map(r=>String(r[0])));
 for(const f of allFiles_(CONFIG.receiptsFolder)){
  if(known.has(f.getId()))continue;
  let raw='',error='';
  try{if(!isSupported_(f))throw Error('\u041d\u0435\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043c\u044b\u0439 \u0442\u0438\u043f: '+f.getMimeType());raw=ocr_(f)}catch(e){error=String(e.message||e)}
  const total=total_(raw),date=date_(raw)||date_(f.getName());
  sheet.appendRow([f.getId(),f.getName(),f.getDateCreated(),new Date(),raw,Number.isFinite(total)?total:'',date,error?'\u041f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c':'\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a',error||'\u041d\u0435 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u043e']);
  known.add(f.getId());log_(book,'\u0427\u0435\u043a',f.getName(),error||'\u0422\u0435\u043a\u0441\u0442 \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u043d');
 }
}
function category_(item){
 const x=norm_(item);
 if(/\u0442\u0432\u043e\u0440\u043e\u0433|\u0441\u044b\u0440|\u043c\u043e\u043b\u043e\u043a|\u043a\u0435\u0444\u0438\u0440|\u0441\u043c\u0435\u0442\u0430\u043d|\u0439\u043e\u0433\u0443\u0440\u0442|\u0441\u043b\u0438\u0432\u043a/.test(x))return '\u041c\u043e\u043b\u043e\u0447\u043d\u044b\u0435 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u044b';
 if(/\u044f\u0439\u0446/.test(x))return '\u042f\u0439\u0446\u0430';
 if(/\u043b\u0430\u0432\u0430\u0448|\u0445\u043b\u0435\u0431|\u0431\u0443\u043b\u043e\u0447|\u0431\u0430\u0442\u043e\u043d/.test(x))return '\u0425\u043b\u0435\u0431 \u0438 \u0432\u044b\u043f\u0435\u0447\u043a\u0430';
 if(/\u0441\u0430\u043b\u0430\u0442|\u043e\u0433\u0443\u0440|\u043f\u043e\u043c\u0438\u0434\u043e\u0440|\u0437\u0435\u043b\u0435\u043d\u044c|\u043a\u0430\u0440\u0442\u043e\u0444|\u043c\u043e\u0440\u043a\u043e\u0432|\u043f\u0435\u0440\u0435\u0446|\u043a\u0430\u0431\u0430\u0447/.test(x))return '\u041e\u0432\u043e\u0449\u0438 \u0438 \u0437\u0435\u043b\u0435\u043d\u044c';
 if(/\u043a\u0443\u0440\u0438\u0446|\u0438\u043d\u0434\u0435\u0439\u043a|\u0441\u0432\u0438\u043d\u0438\u043d|\u0433\u043e\u0432\u044f\u0434\u0438\u043d|\u0444\u0430\u0440\u0448|\u043c\u044f\u0441/.test(x))return '\u041c\u044f\u0441\u043e \u0438 \u043f\u0442\u0438\u0446\u0430';
 if(/\u0440\u044b\u0431|\u043a\u0440\u0435\u0432\u0435\u0442|\u043a\u0430\u043b\u044c\u043c\u0430\u0440/.test(x))return '\u0420\u044b\u0431\u0430 \u0438 \u043c\u043e\u0440\u0435\u043f\u0440\u043e\u0434\u0443\u043a\u0442\u044b';
 return '\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b \u00b7 \u0443\u0442\u043e\u0447\u043d\u0438\u0442\u044c';
}
function items_(raw){
 // \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043c \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u044b \u0447\u0435\u043a\u043e\u0432 \u0422\u0430\u043a\u0441\u043a\u043e\u043c: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 ; \u0448\u0442. 1 x 27.65 27.65 \u041d\u0414\u0421 ...".
 // \u041d\u0430 \u0438\u043d\u044b\u0445 \u0447\u0435\u043a\u0430\u0445 \u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0435 \u043f\u043e\u0437\u0438\u0446\u0438\u0438 \u043d\u0435 \u043f\u0440\u0438\u0434\u0443\u043c\u044b\u0432\u0430\u0435\u043c.
 const start=raw.search(/\u041f\u0420\u0418\u0425\u041e\u0414/i),end=raw.search(/\u0418\u0422\u041e\u0413\u041e\s*:/i);
 if(start<0||end<=start)return [];
 const text=raw.slice(start+6,end).replace(/\s+/g,' ');
 const chunks=text.split(/\u041f\u0440\u0438\u0437\u043d\u0430\u043a \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430 \u0440\u0430\u0441\u0447\u0435\u0442\u0430\s+(?:\u0422\u041e\u0412\u0410\u0420|\u0422\u041c)/i),result=[];
 for(const chunk of chunks){
  const match=chunk.match(/(.{3,200}?)\s*;\s*(?:\u0448\u0442\.?|\u043a\u0433|\u043b|\u0443\u043f\u0430\u043a\.?)\s*(?:\[\u041c\+\]\s*)?(\d+(?:[.,]\d+)?)\s*[x\u0445\u00d7]\s*(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\b/i);
  if(!match)continue;
  const name=match[1].replace(/^\s*\u041f\u0420\u0418\u0425\u041e\u0414\s*/i,'').trim(),quantity=num_(match[2]),price=num_(match[3]),sum=num_(match[4]);
  if(!name||!Number.isFinite(quantity*price*sum)||Math.abs(quantity*price-sum)>Math.max(.03,quantity*.02))continue;
  result.push({name,quantity,price,sum});
 }
 return result;
}
function parseReceiptItems_(b){
 const receipts=b.getSheetByName('\u0427\u0435\u043a\u0438'),itemsSheet=b.getSheetByName('\u041f\u043e\u0437\u0438\u0446\u0438\u0438 \u0442\u043e\u0432\u0430\u0440\u043e\u0432');
 const known=new Set(rows_(itemsSheet,10).map(r=>String(r[0])));
 const records=rows_(receipts,9);
 records.forEach((r,i)=>{
  const id=String(r[0]),raw=String(r[4]||'');if(!id||known.has(id)||!raw)return;
  const items=items_(raw),total=num_(r[5]),sum=money_(items.reduce((s,x)=>s+x.sum,0));
  const ok=items.length>0&&Number.isFinite(total)&&Math.abs(sum-total)<=.02;
  if(items.length){
   const out=items.map(x=>[id,r[6],guessShop_(raw,r[1]),x.name,x.quantity,x.price,x.sum,category_(x.name),'\u0438\u0437 \u0442\u0435\u043a\u0441\u0442\u0430 \u0447\u0435\u043a\u0430',ok?'\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a':'\u041f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c']);
   itemsSheet.getRange(itemsSheet.getLastRow()+1,1,out.length,10).setValues(out);known.add(id);
  }
  receipts.getRange(i+2,8,1,2).setValues([[ok?'\u041f\u043e\u0437\u0438\u0446\u0438\u0438 \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u043d\u044b \u00b7 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a':'\u041f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c',items.length?'\u0422\u043e\u0432\u0430\u0440\u044b: '+items.length+'; \u0441\u0443\u043c\u043c\u0430 '+sum+' \u20bd; \u0438\u0442\u043e\u0433 '+r[5]+' \u20bd':'\u0422\u043e\u0432\u0430\u0440\u043d\u044b\u0435 \u0441\u0442\u0440\u043e\u043a\u0438 \u043d\u0435 \u0432\u044b\u0434\u0435\u043b\u0435\u043d\u044b; \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430']]);
 });
}
function bank_(text,filename){
 const head=norm_(String(text||'').slice(0,1600));
 const name=norm_(filename);
 // Identify issuing bank by first-page letterhead, not a merchant name.
 if(/www\.sberbank\.ru/.test(head))return '\u0421\u0431\u0435\u0440\u0431\u0430\u043d\u043a';
 if(/exibank\.ru/.test(head))return 'ExiBank';
 if(/tbank\.ru|\u00ab\u0442\u0431\u0430\u043d\u043a\u00bb|\u00ab\u0442-\u0431\u0430\u043d\u043a\u00bb/.test(head))return '\u0422-\u0411\u0430\u043d\u043a';
 if(/\u043e\u043e\u043e \u00ab\u043e\u0437\u043e\u043d \u0431\u0430\u043d\u043a\u00bb/.test(head))return 'Ozon \u0411\u0430\u043d\u043a';
 if(/\u043e\u043e\u043e \u00ab\u0432\u0431 \u0431\u0430\u043d\u043a\u00bb|\u0430\u043e \u00ab\u0432\u0430\u0439\u043b\u0434\u0431\u0435\u0440\u0440\u0438\u0437 \u0431\u0430\u043d\u043a\u00bb/.test(head))return 'WB \u0411\u0430\u043d\u043a';
 if(/\u0430\u043b\u044c\u0444\u0430-?\u0431\u0430\u043d\u043a/.test(head))return '\u0410\u043b\u044c\u0444\u0430-\u0411\u0430\u043d\u043a';
 if(/\u0432\u0442\u0431/.test(head))return '\u0412\u0422\u0411';
 if(/ozon|\u043e\u0437\u043e\u043d/.test(name))return 'Ozon \u0411\u0430\u043d\u043a';
 return '\u041d\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0451\u043d';
}
function parseMoneySigned_(v){
 let t=String(v===null||v===undefined?'':v).replace(/[\s\u00a0\u20bd]/g,'');
 if(t.includes(',')&&t.includes('.'))t=t.replace(/,/g,'');
 else if(t.includes(','))t=t.replace(',','.');
 const n=Number(t);return Number.isFinite(n)?n:NaN;
}

function statementCandidates_(raw,bank){
 const text=String(raw||'').replace(/\r/g,'');
 if(/\u0417\u0430 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u044b\u0439 \u043f\u0435\u0440\u0438\u043e\u0434 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0439 \u043f\u043e \u0441\u0447\u0435\u0442\u0443 \u043d\u0435 \u0431\u044b\u043b\u043e/i.test(text))return [];
 const parsed=[];
 // Ozon: \u0434\u0430\u0442\u0430+\u0432\u0440\u0435\u043c\u044f, \u043d\u043e\u043c\u0435\u0440 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430, \u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0438 \u0434\u0432\u0435 \u043e\u0434\u0438\u043d\u0430\u043a\u043e\u0432\u044b\u0435 \u0441\u0443\u043c\u043c\u044b.
 if(/\u041e\u041e\u041e\s*[\u00ab"]?\u041e\u0417\u041e\u041d \u0411\u0430\u043d\u043a/i.test(text)){
  const re=/(\d{2}\.\d{2}\.20\d{2})\s+(\d{2}:\d{2}:\d{2})\s*\n\s*(\d{8,14})\s*\n([\s\S]*?)\n\s*([+\-]\s*[\d\s\u00a0]+[.,]\d{2})\s*\u20bd\s*\n\s*[+\-]\s*[\d\s\u00a0]+[.,]\d{2}\s*\u20bd/g;
  let m;
  while((m=re.exec(text))!==null){
   const amount=parseMoneySigned_(m[5]);
   if(!Number.isFinite(amount)||!amount)continue;
   const desc=m[4].replace(/\s+/g,' ').trim();
   if(desc.length<4||desc.length>900)continue;
   parsed.push({date:date_(m[1]),time:m[2],externalId:m[3],signed:amount,description:desc});
  }
 }
 // Sberbank payment account: line with operation datetime, category, amount,
 // running balance, followed by processing date, authorization code and description.
 // No guessing from statement totals, headers, address or account balances.
 else if(/www\.sberbank\.ru/i.test(text) && /Расшифровка операций/.test(text)){
  const body=text.slice(text.indexOf('Расшифровка операций'));
  const re=/(?:^|\n)\s*(\d{2}\.\d{2}\.20\d{2})\s+(\d{2}:\d{2})\s+([^\n\d]{3,60}?)\s+(\+?[\d\s\u00a0]+,\d{2})\s+([\d\s\u00a0]+,\d{2})\s+(\d{2}\.\d{2}\.20\d{2})\s+(\d{6})\s+([^\n]+)/g;
  let m;
  while((m=re.exec(body))!==null){
   const value=num_(m[4]);
   if(!Number.isFinite(value)||!value)continue;
   const description=m[8].trim(),category=m[3].trim();
   if(description.length<6 || /Остаток на|ИТОГО ПО ОПЕРАЦИЯМ|За период/i.test(description))continue;
   const signed=String(m[4]).trim().startsWith('+')?Math.abs(value):-Math.abs(value);
   parsed.push({date:date_(m[1]),time:m[2]+':00',externalId:m[7],signed,description:category+' · '+description});
  }
 }
 // VTB account statement: two dates, signed amount, incoming and outgoing columns.
 // The extracted PDF often loses recipient/description position: keep all rows under REVIEW.
 else if(/\b\u0412\u0422\u0411\b|\u041d\u043e\u043c\u0435\u0440 \u0441\u0447\u0451\u0442\u0430/.test(text) && /\u041f\u0440\u0438\u0445\u043e\u0434\s+\u0420\u0430\u0441\u0445\u043e\u0434/.test(text)){
  const re=/\b(\d{2})\.(\d{2})\.(20\d{2})\s+\1\.\2\.\3\s+([+-]?\d[\d ]*\.\d{2}) RUB\s+([+-]?\d[\d ]*\.\d{2}) RUB\s+([+-]?\d[\d ]*\.\d{2}) RUB/g;
  const accountMatch=text.match(/\u041d\u043e\u043c\u0435\u0440 \u0441\u0447\u0451\u0442\u0430\s+(\d{16,22})/);
  const suffix=accountMatch?accountMatch[1].slice(-4):'unknown';
  let recordNumber=0,occurrences={};let m;
  while((m=re.exec(text))!==null){
   const signed=num_(m[4]),income=num_(m[5]),expense=num_(m[6]);
   if(![signed,income,expense].every(Number.isFinite)||!signed)continue;
   if(Math.abs(signed-(income+expense))>0.01||income&&expense)continue;
   const day=date_(m[1]+'.'+m[2]+'.'+m[3]);if(!day)continue;
   const identity=day+'|'+signed;
   const occur=occurrences[identity]=(occurrences[identity]||0)+1;
   parsed.push({date:day,time:'00:00:00',externalId:'vtb-'+identity+'-'+occur,
     idOverride:'vtb-'+suffix+'-'+m[3]+m[2]+m[1]+'-'+String(++recordNumber).padStart(3,'0'),signed,
     description:'VTB statement row (recipient/description needs review)'});
  }
 }
 // WB Bank statement: timestamp, date of reflection, document number, two matching signed amounts.
 // Source statements overlap; the same document operation must be imported only once.
 else if(/www\.wb-bank\.ru/i.test(text)){
  const re=/\b(\d{2}:\d{2})\s+(\d{2}\.\d{2}\.20\d{2})\s+(\d{3,6})\s+([+\-][\d,\s]+\.\d{2})\s*\u20bd\s+([+\-][\d,\s]+\.\d{2})\s*\u20bd\s+([^\n]{3,130})/g;
  let m;
  while((m=re.exec(text))!==null){
   const value=parseMoneySigned_(m[4]),check=parseMoneySigned_(m[5]);
   if(!Number.isFinite(value)||!value||Math.abs(value-check)>0.01)continue;
   const day=date_(m[2]);if(!day)continue;
   const rawDescription=m[6].trim(), description= /\u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u043e\u043f\u043b\u0430\u0442\u044b/i.test(rawDescription)?'\u0412\u043e\u0437\u0432\u0440\u0430\u0442 Wildberries':
      /\u041e\u043f\u043b\u0430\u0442\u0430 \u043d\u0430 Wildberries/i.test(rawDescription)?'\u041e\u043f\u043b\u0430\u0442\u0430 Wildberries':
      value>0?'\u0417\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u0435 WB \u0411\u0430\u043d\u043a (\u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c)':'\u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435 WB \u0411\u0430\u043d\u043a (\u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c)';
   parsed.push({date:day,time:m[1]+':00',externalId:m[3],signed:value,description});
  }
 }
 // ExiBank: \u043d\u043e\u043c\u0435\u0440 \u0441\u0442\u0440\u043e\u043a\u0438, \u0434\u0430\u0442\u0430 UTC, \u0441\u0443\u043c\u043c\u0430 \u0441\u043e \u0437\u043d\u0430\u043a\u043e\u043c \u0438 RUR, \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435.
 else if(/exibank\.ru/i.test(text)){
  const start=text.indexOf('\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0437\u0430 \u043f\u0435\u0440\u0438\u043e\u0434');
  if(start>=0){
   const body=text.slice(start);
   const re=/(?:^|\n)\s*(\d{1,4})\s*\n\s*(\d{2}\.\d{2}\.20\d{2})\s+(\d{2}:\d{2}:\d{2})\s*\(UTC\)\s*\n\s*([+\-][\d\s\u00a0]+[.,]\d{2})\s*RUR\s*\n\s*([^\n]+)/g;
   let m;
   while((m=re.exec(body))!==null){
    const amount=parseMoneySigned_(m[4]);
    if(!Number.isFinite(amount)||!amount)continue;
    parsed.push({date:date_(m[2]),time:m[3],externalId:'row-'+m[1],signed:amount,description:m[5].trim()});
   }
  }
 }
 return parsed.filter(x=>x.date);
}
function bankAccountKey_(raw,bank){
 const s=String(raw||'');
 // Sber payment-account PDFs name a bank account AND a card. The imported legacy
 // rows were stored by card suffix, so prefer the suffix for consistent dedup.
 if(bankToken_(bank)==='sber' && /\u0412\u044b\u043f\u0438\u0441\u043a\u0430 \u043f\u043e \u043f\u043b\u0430\u0442\u0451\u0436\u043d\u043e\u043c\u0443 \u0441\u0447\u0451\u0442\u0443/.test(s)){
  const card=s.match(/\u041a\u0430\u0440\u0442\u044b, \u043f\u0440\u0438\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u0435 \u043a \u0441\u0447\u0451\u0442\u0443[\s\S]{0,95}?[\u2022*]{2}\s*(\d{4})/);
  if(card)return '\u2022\u2022'+card[1];
 }
 const m=s.match(/(?:\u041d\u043e\u043c\u0435\u0440 \u043b\u0438\u0446\u0435\u0432\u043e\u0433\u043e \u0441\u0447[\u0435\u0451]\u0442\u0430|\u041d\u043e\u043c\u0435\u0440 \u0441\u0447\u0435\u0442\u0430|\u041d\u043e\u043c\u0435\u0440 \u0441\u0447[\u0435\u0451]\u0442\u0430)\s*:?\s*\u2116?\s*([\d\s]{16,30})/i);
 return (m?m[1].replace(/\D/g,'').slice(0,20):'')||bank;
}

function bankToken_(bank, account){
 const b=norm_(bank);
 if(/\u0441\u0431\u0435\u0440/.test(b))return 'sber';
 if(/wb|\u0432\u0431 \u0431\u0430\u043d\u043a/.test(b))return 'wb';
 if(/ozon|\u043e\u0437\u043e\u043d/.test(b))return 'ozon';
 if(/exibank/.test(b))return 'exi';
 if(/\u0432\u0442\u0431/.test(b))return 'vtb';
 return b;
}
function accountSuffix_(account){const digits=String(account||'').replace(/\D/g,'');return digits?digits.slice(-4):''}
function signedFromStored_(r){
 const type=String(r[5]||''), note=String(r[10]||'');
 let sign=(note.match(/\u0438\u0441\u0445\u043e\u0434\u043d\u044b\u0439 \u0437\u043d\u0430\u043a ([+\-])/)||note.match(/\u0437\u043d\u0430\u043a ([+\-])/)||[])[1];
 if(!sign){const v=note.match(/\u0438\u0441\u0445\u043e\u0434\u043d\u043e\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435\s+([+\-]?[\d.,]+)/);if(v)sign=v[1].startsWith('-')?'-':'+'}
 if(!sign)sign=/\u041f\u041e\u0421\u0422\u0423\u041f\u041b\u0415\u041d\u0418\u0415|\u0412\u041e\u0417\u0412\u0420\u0410\u0422/.test(type)?'+':'-';
 const n=parseMoneySigned_(r[6]);return Number.isFinite(n)?(sign==='-'?-Math.abs(n):Math.abs(n)):NaN;
}
function naturalBankKey_(bank,account,x){
 const b=bankToken_(bank,account),acct=accountSuffix_(account);
 if(!acct || !x.date || !x.time || !Number.isFinite(x.signed))return '';
 const amount=Math.round(x.signed*100), time=String(x.time).slice(0,5), ext=String(x.externalId||'');
 if(b==='sber' && /^\d{6}$/.test(ext))return [b,acct,x.date,time,ext,amount].join('|');
 if(b==='wb' && /^\d{3,6}$/.test(ext))return [b,acct,x.date,time,ext,amount].join('|');
 if(b==='ozon' && /^\d{8,14}$/.test(ext))return [b,acct,x.date,x.time,ext,amount].join('|');
 if(b==='exi')return [b,acct,x.date,x.time,amount,norm_(x.description)].join('|');
 if(b==='vtb')return [b,acct,x.date,ext,amount].join('|');
 return '';
}
function fallbackBankKey_(bank,account,x){
 const b=bankToken_(bank,account),acct=accountSuffix_(account);
 if(!acct || !x.date || !x.time || !Number.isFinite(x.signed))return '';
 return [b,acct,x.date,b==='ozon'?String(x.time):String(x.time).slice(0,5),Math.round(x.signed*100)].join('|');
}
function storedSourceHint_(r){
 const note=String(r[10]||''),b=bankToken_(r[3],r[4]);
 let t=(note.match(/\u0412\u0440\u0435\u043c\u044f (\d{2}:\d{2}(?::\d{2})?)/)||note.match(/(?:^|[; ])(\d{2}:\d{2}(?::\d{2})?)(?: \u041c\u0421\u041a|;|$)/)||[])[1]||'';
 const ext=(note.match(/\u043a\u043e\u0434 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430 (\d+)/)||note.match(/\u043a\u043e\u0434 (\d+)/)||[])[1]||'';
 return {date:String(r[2]||''),time:t,externalId:ext,signed:signedFromStored_(r),description:String(r[7]||'')};
}
/** Idempotent import: compare actual bank operations, including older manually imported rows. */
function importParsedStatementRows_(book,statementRows){
 const out=book.getSheetByName('\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u044b\u043f\u0438\u0441\u043e\u043a');
 const old=rows_(out,11), existingIds=new Set(old.map(r=>String(r[0]))),known=new Set(),legacyCounts=new Map(),legacyWbNoAccount=new Map();
 for(const r of old){
  const hint=storedSourceHint_(r),key=naturalBankKey_(r[3],r[4],hint);
  if(key)known.add(key);
  else if(hint.time){
   const f=fallbackBankKey_(r[3],r[4],hint);
   if(f)legacyCounts.set(f,(legacyCounts.get(f)||0)+1);
   if(!accountSuffix_(r[4]) && bankToken_(r[3])==='wb' && Number.isFinite(hint.signed)){const bare=['wb',hint.date,String(hint.time).slice(0,5),Math.round(hint.signed*100)].join('|');legacyWbNoAccount.set(bare,(legacyWbNoAccount.get(bare)||0)+1)}
  }
 }
 let inserted=0,duplicates=0,buffer=[];
 for(const r of statementRows){
  const fileId=String(r[0]), name=String(r[1]), raw=String(r[4]||''),bank=bank_(raw,name);
  if(!raw)continue;
  const account=bankAccountKey_(raw,bank),bankKind=bankToken_(bank,account),candidates=statementCandidates_(raw,bank);
  for(const x of candidates){
   const key=naturalBankKey_(bank,account,x);
   if(!key){continue} // Unknown identity is held for review; do not invent duplicates.
   if(known.has(key)){duplicates++;continue}
   if(x.idOverride && existingIds.has(x.idOverride)){known.add(key);duplicates++;continue}
   const bareKey=['wb',x.date,String(x.time).slice(0,5),Math.round(x.signed*100)].join('|');
   if(bankKind==='wb' && (legacyWbNoAccount.get(bareKey)||0)>0){legacyWbNoAccount.set(bareKey,legacyWbNoAccount.get(bareKey)-1);known.add(key);duplicates++;continue}
   const fallback=fallbackBankKey_(bank,account,x),remaining=legacyCounts.get(fallback)||0;
   if(remaining>0){legacyCounts.set(fallback,remaining-1);known.add(key);duplicates++;continue}
   const id=x.idOverride||hash_(key);
   if(existingIds.has(id)){known.add(key);duplicates++;continue}
   known.add(key);existingIds.add(id);
   // Payments and own-account transfers are not merged or applied to the website.
   const isRefund=/\u0412\u043e\u0437\u0432\u0440\u0430\u0442 Wildberries/i.test(x.description);
   const transfer=/\u043f\u0435\u0440\u0435\u0432\u043e\u0434|\u043f\u043e\u043f\u043e\u043b\u043d\u0435\u043d|\u0441\u043e\u0431\u0441\u0442\u0432\u0435\u043d\u043d.*\u0441\u0440\u0435\u0434\u0441\u0442\u0432|SBERBANK ONL@IN|\u041e\u0437\u043e\u043d \u0411\u0430\u043d\u043a|Wildberries \(\u0412\u0430\u0439\u043b\u0434\u0431\u0435\u0440\u0440\u0438\u0437 \u0411\u0430\u043d\u043a/i.test(x.description);
   const type=isRefund?'\u0412\u041e\u0417\u0412\u0420\u0410\u0422_\u041f\u0420\u041e\u0412\u0415\u0420\u0418\u0422\u042c':(bankKind==='wb' && x.signed>0)||transfer?'\u041f\u0415\u0420\u0415\u0412\u041e\u0414_\u041f\u0420\u041e\u0412\u0415\u0420\u0418\u0422\u042c':x.signed<0?'\u0421\u041f\u0418\u0421\u0410\u041d\u0418\u0415_\u041f\u0420\u041e\u0412\u0415\u0420\u0418\u0422\u042c':'\u041f\u041e\u0421\u0422\u0423\u041f\u041b\u0415\u041d\u0418\u0415_\u041f\u0420\u041e\u0412\u0415\u0420\u0418\u0422\u042c';
   const note='\u0412\u0440\u0435\u043c\u044f '+x.time+'; \u043a\u043e\u0434 '+x.externalId+'; \u0438\u0441\u0445\u043e\u0434\u043d\u044b\u0439 \u0437\u043d\u0430\u043a '+(x.signed<0?'-':'+');
   buffer.push([id,fileId,x.date,bank,account,type,Math.abs(x.signed),x.description,'REVIEW','',note]);inserted++;
  }
 }
 if(buffer.length){for(let i=0;i<buffer.length;i+=150){const b=buffer.slice(i,i+150);out.getRange(out.getLastRow()+1,1,b.length,11).setValues(b)}}
 log_(book,'Dedup','','\u041d\u043e\u0432\u044b\u0445: '+inserted+'; \u043f\u043e\u0432\u0442\u043e\u0440\u043e\u0432: '+duplicates+'; \u043d\u0430 \u0441\u0430\u0439\u0442 \u043d\u0435 \u043f\u0435\u0440\u0435\u043d\u043e\u0441\u0438\u043b\u043e\u0441\u044c');
 return inserted;
}

function importStatements_(book){
 const sheet=book.getSheetByName('\u0412\u044b\u043f\u0438\u0441\u043a\u0438');
 const known=new Set(rows_(sheet,7).map(r=>String(r[0])));
 for(const f of allFiles_(CONFIG.statementsFolder)){
  if(known.has(f.getId()))continue;
  let raw='',error='';
  try{if(!isSupported_(f))throw Error('Unsupported type');raw=ocr_(f)}
  catch(e){error=String(e.message||e)}
  const bank=bank_(raw,f.getName());
  sheet.appendRow([f.getId(),f.getName(),new Date(),bank,raw,error?'ERROR':'REVIEW',error||'\u0424\u0430\u0439\u043b \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d; \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0442\u0440\u0435\u0431\u0443\u044e\u0442 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438']);
  known.add(f.getId());log_(book,'Statement',f.getName(),error||'Source retained');
 }
 const current=rows_(sheet,7);
 const added=importParsedStatementRows_(book,current);
 if(added)log_(book,'Parser','', '\u041a\u0430\u043d\u0434\u0438\u0434\u0430\u0442\u043e\u0432 \u043d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0443: '+added+'; \u0440\u0430\u0441\u0445\u043e\u0434\u044b \u043d\u0430 \u0441\u0430\u0439\u0442 \u041d\u0415 \u043f\u0435\u0440\u0435\u0434\u0430\u043d\u044b');
}
/**
 * Backfill two previously verified Sberbank statement formats from a private
 * Drive CSV. Never published to GitHub and never applied to the finance site.
 * The file remains in the owner's private "Processed" folder.
 * Strict source controls make this safe to run every hour: no-op after import.
 */
function importStagedCreditSavings_(book){
 const folder=DriveApp.getFolderById('1JokiCtmvmV67FKmAtXyImgTSy9czwvzZ');
 const name='\u0421\u0431\u0435\u0440\u0431\u0430\u043d\u043a \u2014 \u043a\u0440\u0435\u0434\u0438\u0442\u043d\u0430\u044f \u043a\u0430\u0440\u0442\u0430 \u0438 \u043d\u0430\u043a\u043e\u043f\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0441\u0447\u0451\u0442 2026-10-13.csv';
 const files=folder.getFilesByName(name);
 if(!files.hasNext())return 0;
 const file=files.next();
 if(files.hasNext())throw Error('Multiple matching staging CSVs: manual review needed');
 const text=file.getBlob().getDataAsString('UTF-8').replace(/^\uFEFF/,'');
 const values=Utilities.parseCsv(text);
 // This specifically staged file has 173 credit-card and 177 savings rows.
 if(values.length!==350)throw Error('Staged statement CSV row count mismatch');
 const counts={'\u2022\u20228611':0,'\u041d\u0430\u043a\u043e\u043f\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0441\u0447\u0451\u0442':0};
 const cents={};
 const validated=[],csvIds=new Set();
 for(const line of values){
  const r=line.map(x=>String(x===null||x===undefined?'':x));
  if(r.length!==11)throw Error('Invalid CSV width');
  const id=r[0],account=r[4],amount=Number(r[6]),note=r[10];
  const kind=account==='\u2022\u20228611'?'credit':account==='\u041d\u0430\u043a\u043e\u043f\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0441\u0447\u0451\u0442'?'savings':'';
  const sign=(note.match(/\u0437\u043d\u0430\u043a ([+\-])/)||[])[1];
  if(!/^bankpdf-[0-9a-f]{18}$/.test(id)||csvIds.has(id)||!kind||!sign||
     r[3]!=='\u0421\u0431\u0435\u0440\u0431\u0430\u043d\u043a'||r[8]!=='REVIEW'||
     !/^20\d\d-\d\d-\d\d$/.test(r[2])||!Number.isFinite(amount)||amount<=0||!r[1])
   throw Error('Invalid or repeated bank CSV operation');
  csvIds.add(id);counts[account]++;
  const key=kind+'|'+sign;
  cents[key]=(cents[key]||0)+Math.round(amount*100);
  validated.push([id,r[1],r[2],r[3],account,r[5],amount,r[7],'REVIEW',r[9],note]);
 }
 const expectedCounts={'\u2022\u20228611':173,'\u041d\u0430\u043a\u043e\u043f\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0441\u0447\u0451\u0442':177};
 if(Object.keys(expectedCounts).some(k=>counts[k]!==expectedCounts[k]))throw Error('Unexpected staged account totals');
 if(cents['credit|+']!==10234412||cents['credit|-']!==11116382||
    cents['savings|+']!==24080929||cents['savings|-']!==27086397)
   throw Error('Staged bank totals do not match original PDF statements');
 const dest=book.getSheetByName('\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u044b\u043f\u0438\u0441\u043e\u043a');
 const existing=new Set(rows_(dest,11).map(r=>String(r[0])));
 const pending=validated.filter(row=>!existing.has(row[0]));
 for(let i=0;i<pending.length;i+=50){
  const part=pending.slice(i,i+50);
  dest.getRange(dest.getLastRow()+1,1,part.length,11).setValues(part);
 }
 if(pending.length)log_(book,'Staged import',name,'Review-only rows: '+pending.length+'; source totals verified');
 return pending.length;
}

function repairImportedStatements(){
 const b=SpreadsheetApp.openById(CONFIG.ledger);
 Object.keys(SCHEMA).forEach(name=>ensureSheet_(b,name));
 // Only backfill verified-structure candidates. Historical invalid lines remain in archive.
 const added=importParsedStatementRows_(b,rows_(b.getSheetByName('\u0412\u044b\u043f\u0438\u0441\u043a\u0438'),7));
 log_(b,'Repair','', '\u0421\u043e\u0437\u0434\u0430\u043d\u043e \u0441\u0442\u0440\u043e\u043a \u043d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0443: '+added);
 return added;
}
function reconcile_(book){
 const receipts=rows_(book.getSheetByName('\u0427\u0435\u043a\u0438'),9),ops=rows_(book.getSheetByName('\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u044b\u043f\u0438\u0441\u043e\u043a'),11),sheet=book.getSheetByName('\u0421\u0432\u0435\u0440\u043a\u0430');
 if(sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,9).clearContent(); // Rebuild suggestions only; originals untouched.
 const used=new Set(),out=[];
 for(const r of receipts){
  const receiptId=String(r[0]),sum=num_(r[5]),date=String(r[6]||'');
  const matches=ops.filter(o=>{
   if(!['REVIEW','VERIFIED'].includes(String(o[8])))return false;
   if(!/\u0421\u041f\u0418\u0421\u0410\u041d\u0418\u0415|\u041e\u041f\u041b\u0410\u0422\u0410/.test(String(o[5])))return false;
   const amt=num_(o[6]),opDate=String(o[2]||'');
   if(!Number.isFinite(sum)||!Number.isFinite(amt)||Math.abs(amt-sum)>.01||used.has(String(o[0])))return false;
   if(!date||!opDate)return false;
   return Math.abs((new Date(date+'T12:00:00Z')-new Date(opDate+'T12:00:00Z'))/86400000)<=3;
  });
  const unique=matches.length===1?matches[0]:null;
  if(unique)used.add(String(unique[0]));
  out.push([receiptId,date,r[5],r[1],unique?unique[0]:'',unique?unique[2]:'',unique?unique[6]:'',unique?'\u0412\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0435 \u0441\u043e\u0432\u043f\u0430\u0434\u0435\u043d\u0438\u0435':'\u041f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c',unique?'\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043a\u0430\u0440\u0442\u0443 \u0438 \u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u043f\u043b\u0430\u0442\u0435\u0436\u0430':matches.length>1?'\u041d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u043e\u0432\u043f\u0430\u0434\u0435\u043d\u0438\u0439':'\u0421\u043e\u0432\u043f\u0430\u0434\u0435\u043d\u0438\u0439 \u043f\u043e \u0441\u0443\u043c\u043c\u0435 \u0438 \u0434\u0430\u0442\u0435 \u043d\u0435\u0442']);
 }
 if(out.length)sheet.getRange(2,1,out.length,9).setValues(out);
 // \u0412\u0410\u0416\u041d\u041e: \u0441\u043e\u043f\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u0432\u0441\u0435\u0433\u0434\u0430 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u0438, \u043d\u0435 \u043f\u0440\u043e\u0432\u043e\u0434\u043a\u0438. \u041d\u0438\u043a\u0430\u043a\u0438\u0445 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u0439 \u0438\u0441\u0442\u043e\u0440\u0438\u0438,
 // \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u0435\u0440\u0435\u043d\u043e\u0441\u0430 \u0444\u0430\u0439\u043b\u043e\u0432, \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0431\u0430\u043d\u043a\u043e\u0432\u0441\u043a\u0438\u0445 \u043e\u0441\u0442\u0430\u0442\u043a\u043e\u0432 \u0438 GitHub.
}

/** Diagnostic only: does not modify finance records. */
function checkSystemHealth(){
 const book=SpreadsheetApp.openById(CONFIG.ledger);
 const report={};
 Object.keys(SCHEMA).forEach(name=>{const sh=ensureSheet_(book,name);report[name]=Math.max(0,sh.getLastRow()-1)});
 Logger.log(JSON.stringify(report));
 return report;
}
