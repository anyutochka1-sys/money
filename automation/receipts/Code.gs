/**
 * Прототип импорта чеков. Не меняет сайт и не публикует финансовые сведения.
 * Настройка: Apps Script -> Services -> Google Drive API (v3).
 * В Script properties: RECEIPTS_FOLDER_ID, LEDGER_SHEET_ID.
 */
const HEADERS = ['file_id','file_name','file_created','imported_at','ocr_text','sum_rub','date','status','comment'];
function scanNewReceipts() {
  const cfg = PropertiesService.getScriptProperties();
  const folderId = cfg.getProperty('RECEIPTS_FOLDER_ID');
  const sheetId = cfg.getProperty('LEDGER_SHEET_ID');
  if (!folderId || !sheetId) throw Error('Укажите RECEIPTS_FOLDER_ID и LEDGER_SHEET_ID в Script properties');
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const book = SpreadsheetApp.openById(sheetId);
    const sheet = book.getSheetByName('Чеки') || book.insertSheet('Чеки');
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    const known = new Set(sheet.getLastRow() < 2 ? [] :
      sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat().map(String));
    const files = DriveApp.getFolderById(folderId).getFiles();
    while (files.hasNext()) {
      const f = files.next(), id = f.getId();
      if (known.has(id)) continue;
      const mime = f.getMimeType();
      let raw = '', error = '';
      if (/^(image\/|application\/pdf)/.test(mime)) {
        try { raw = extractText_(f); } catch (e) { error = String(e.message || e); }
      } else error = 'Неподдерживаемый тип: ' + mime;
      const text = raw.replace(/\s+/g,' ').trim();
      const inferred = guessTotal_(raw);
      sheet.appendRow([id,f.getName(),f.getDateCreated(),new Date(),text,
        inferred, '', error ? 'Проверить' : 'Черновик', error || 'Сумма и позиции требуют подтверждения']);
      known.add(id);
    }
  } finally { lock.releaseLock(); }
}
function extractText_(file) {
  // Google Drive импортирует PDF/изображения в Docs с распознаванием текста.
  // Временный документ удаляется даже при ошибке чтения.
  const resource = {name:'TEMP_OCR_'+file.getId(),mimeType:'application/vnd.google-apps.document'};
  const doc = Drive.Files.create(resource,file.getBlob(),{fields:'id'});
  try { return DocumentApp.openById(doc.id).getBody().getText(); }
  finally { DriveApp.getFileById(doc.id).setTrashed(true); }
}
function guessTotal_(text) {
  // Черновой кандидат, не подтверждённая сумма. Не проводим в расходы автоматически.
  const m=String(text).match(/(?:ИТОГ(?:О)?|К\s*ОПЛАТЕ|СУММА\s*ЧЕКА)\s*[:=]?\s*([\d\s]+[.,]\d{2})/i);
  return m ? Number(m[1].replace(/\s/g,'').replace(',','.')) : '';
}
function installHourlyTrigger() {
  ScriptApp.getProjectTriggers().filter(x=>x.getHandlerFunction()==='scanNewReceipts')
    .forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('scanNewReceipts').timeBased().everyHours(1).create();
}
