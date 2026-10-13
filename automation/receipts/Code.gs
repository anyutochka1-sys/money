/**
 * Чеки: OCR PDF/изображений, товарные позиции, безопасные черновики.
 * Требуется Advanced Drive API (v3), свойства RECEIPTS_FOLDER_ID, LEDGER_SHEET_ID.
 * На основной сайт данные НЕ отправляются.
 */
const HEADERS=['file_id','file_name','file_created','imported_at','ocr_text','sum_rub','date','status','comment'];
const ITEM_HEADERS=['file_id','дата','магазин','товар','количество','цена','сумма','категория','уверенность','статус проверки'];
function scanNewReceipts(){
 const cfg=PropertiesService.getScriptProperties(),folderId=cfg.getProperty('RECEIPTS_FOLDER_ID'),sheetId=cfg.getProperty('LEDGER_SHEET_ID');
 if(!folderId||!sheetId)throw Error('Нужны RECEIPTS_FOLDER_ID и LEDGER_SHEET_ID');
 const lock=LockService.getScriptLock();lock.waitLock(25000);
 try{
  const book=SpreadsheetApp.openById(sheetId);
  const receipts=book.getSheetByName('Чеки')||book.insertSheet('Чеки');
  const lines=book.getSheetByName('Позиции товаров')||book.insertSheet('Позиции товаров');
  if(!receipts.getLastRow())receipts.appendRow(HEADERS);
  if(!lines.getLastRow())lines.appendRow(ITEM_HEADERS);
  const existing=receipts.getLastRow()>1?receipts.getRange(2,1,receipts.getLastRow()-1,9).getValues():[];
  const known=new Set(existing.map(r=>String(r[0])));
  const files=DriveApp.getFolderById(folderId).getFiles();
  while(files.hasNext()){
   const file=files.next(),id=file.getId();
   if(known.has(id))continue;
   let raw='',err='';
   try{
    if(!/^(image\/|application\/pdf)/.test(file.getMimeType()))throw Error('Неподдерживаемый тип файла');
    raw=extractText_(file);
   }catch(e){err=String(e.message||e)}
   const total=guessTotal_(raw),date=guessDate_(raw,file.getName());
   receipts.appendRow([id,file.getName(),file.getDateCreated(),new Date(),String(raw).replace(/\s+/g,' ').trim(),total,date,err?'Проверить':'Черновик',err||'Проверка товарных позиций ожидается']);
   known.add(id);
  }
  // Дополняем уже загруженные чеки: повторного OCR и повторной строки чека не создаём.
  const all=receipts.getLastRow()>1?receipts.getRange(2,1,receipts.getLastRow()-1,9).getValues():[];
  const completed=new Set(lines.getLastRow()>1?lines.getRange(2,1,lines.getLastRow()-1,1).getValues().flat().map(String):[]);
  all.forEach((row,index)=>{
   const id=String(row[0]),raw=String(row[4]||'');
   if(!id||!raw||completed.has(id))return;
   const parsed=parseItems_(raw),total=typeof row[5]==='number'?row[5]:Number(String(row[5]).replace(',','.'));
   const amount=Math.round(parsed.reduce((s,x)=>s+x.sum,0)*100)/100;
   const ok=parsed.length>0&&Number.isFinite(total)&&Math.abs(amount-total)<0.02;
   if(parsed.length){
    const records=parsed.map(x=>[id,row[6]||guessDate_(raw,row[1]),guessStore_(raw,row[1]),x.name,x.quantity,x.unitPrice,x.sum,category_(x.name),ok?'по строке чека':'проверить',ok?'Черновик':'Проверить']);
    lines.getRange(lines.getLastRow()+1,1,records.length,ITEM_HEADERS.length).setValues(records);
    completed.add(id);
   }
   receipts.getRange(index+2,8,1,2).setValues([[
    ok?'Позиции извлечены · черновик':'Проверить',
    parsed.length?'Позиций: '+parsed.length+'; сумма товаров '+amount.toFixed(2)+' ₽; итог чека '+total+' ₽'+(ok?' · совпадает':' · нужна сверка'):'Не удалось разобрать товары автоматически'
   ]]);
  });
 }finally{lock.releaseLock()}
}
function extractText_(file){
 const doc=Drive.Files.create({name:'TEMP_OCR_'+file.getId(),mimeType:'application/vnd.google-apps.document'},file.getBlob(),{fields:'id'});
 try{return DocumentApp.openById(doc.id).getBody().getText()}
 finally{DriveApp.getFileById(doc.id).setTrashed(true)}
}
function guessTotal_(s){
 const m=String(s).match(/(?:ИТОГ(?:О)?|К\s*ОПЛАТЕ|СУММА\s*ЧЕКА)\s*[:=]?\s*([\d\s]+[.,]\d{2})/i);
 return m?Number(m[1].replace(/\s/g,'').replace(',','.')):'';
}
function guessDate_(text,name){
 const s=String(text)+' '+String(name),m=s.match(/\b(\d{2})\.(\d{2})\.(20\d{2}|\d{2})\b/);
 return m?m[1]+'.'+m[2]+'.'+(m[3].length===2?'20'+m[3]:m[3]):'';
}
function guessStore_(text,name){
 return /лента/i.test(String(text)+' '+name)?'Лента':String(name||'').slice(0,80);
}
function parseItems_(raw){
 const text=String(raw).replace(/\s+/g,' ');
 const start=text.search(/\bПРИХОД\b/i),end=text.search(/\bИТОГО\s*:/i);
 if(start<0||end<=start)return[];
 const section=text.slice(start+6,end);
 const pattern=/(?:^|Признак предмета расчета\s+(?:ТОВАР|ТМ)\s+)(.+?)\s*;\s*(?:шт\.?|кг|л|упак\.?)\s*(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\b/gi;
 const result=[];let m;
 while((m=pattern.exec(section))!==null){
  let name=m[1].replace(/^\s*ПРИХОД\s*/i,'').trim();
  const quantity=Number(m[2].replace(',','.')),unitPrice=Number(m[3].replace(',','.')),sum=Number(m[4].replace(',','.'));
  if(name.length>2&&name.length<200&&quantity>0&&Math.abs(quantity*unitPrice-sum)<Math.max(.03,quantity*.02))
   result.push({name,quantity,unitPrice,sum});
 }
 return result;
}
function category_(name){
 const n=String(name).toLowerCase();
 if(/творог|молоко|сыр|йогурт|кефир|сметан|сливк/.test(n))return 'Молочные продукты';
 if(/яйц/.test(n))return 'Яйца';
 if(/лаваш|хлеб|булоч|батон/.test(n))return 'Хлеб и выпечка';
 if(/салат|огур|помидор|морковь|картоф|овощ|зелень/.test(n))return 'Овощи и зелень';
 if(/куриц|индейк|фарш|говядин|свинин|мясо/.test(n))return 'Мясо и птица';
 if(/рыба|кревет|кальмар/.test(n))return 'Рыба и морепродукты';
 return 'Продукты · уточнить';
}
function installHourlyTrigger(){
 ScriptApp.getProjectTriggers().filter(x=>x.getHandlerFunction()==='scanNewReceipts').forEach(ScriptApp.deleteTrigger);
 ScriptApp.newTrigger('scanNewReceipts').timeBased().everyHours(1).create();
}
