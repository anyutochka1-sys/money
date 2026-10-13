/**
 * A bank statement is a document, not a transaction.
 * Deduplicate overlapping statement PDFs using the original transaction identity.
 * NEVER use the date alone: distinct purchases on a single day must be preserved.
 */
function bankOperationKey_(x) {
  const bank = String(x.bank||'').trim().toLowerCase();
  const account = String(x.account||'').replace(/\s+/g,'');
  const date = String(x.date||'');
  const time = String(x.time||'');
  const amount = Number(x.signedAmount);
  if (!bank || !account || !date || !time || !Number.isFinite(amount))
    return null;
  const amountKey = Math.round(amount*100);
  if (bank === 'sberbank' || bank === 'сбербанк') {
    if (!x.authorizationCode) return null;
    return ['sber',account,date,time,String(x.authorizationCode),amountKey].join('|');
  }
  if (bank === 'wb' || bank === 'wb банк' || bank === 'вб банк') {
    if (!x.documentNumber) return null;
    return ['wb',account,date,time,String(x.documentNumber),amountKey].join('|');
  }
  if (bank === 'ozon' || bank === 'ozon банк') {
    if (!x.documentNumber) return null;
    return ['ozon',account,date,time,String(x.documentNumber),amountKey].join('|');
  }
  if (bank === 'exibank') {
    return ['exi',account,date,time,amountKey,String(x.description||'').trim().toLowerCase()].join('|');
  }
  // Unrecognized bank format: do NOT guess a duplicate or remove anything.
  return null;
}
function splitUniqueStatementRows_(existing, incoming) {
  const seen = new Set(existing.map(bankOperationKey_).filter(Boolean));
  const unique=[],duplicates=[],review=[];
  for (const item of incoming) {
    const key=bankOperationKey_(item);
    if (!key){review.push(item);continue}
    if (seen.has(key)){duplicates.push(item);continue}
    seen.add(key);unique.push(item);
  }
  return {unique,duplicates,review};
}
