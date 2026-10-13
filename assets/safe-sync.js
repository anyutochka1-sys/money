/* Мои финансы: защищённый просмотр импорта Google Диска. В GitHub нет пользовательских операций. */
(function(root, make) {
  const api = make();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document) {
    root.MoneySafeSync = api;
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => api.mount(root));
    else api.mount(root);
  }
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const SCHEMA = 'money-review-v1', STORE = 'money_review_queue_v1';
  const money = n => Math.round(Number(n) * 100);
  function readPayload(json) {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    if (!p || ![SCHEMA,'money-candidates-v2'].includes(p.schema) || !Array.isArray(p.operations) || p.operations.length > 5000) throw Error('Формат файла не распознан. Нужен экспорт money-review-v1.');
    const used = new Set(), ops = [];
    for (const raw of p.operations) {
      if (!raw || typeof raw !== 'object' || !raw.id || String(raw.id).length > 150 || !/^20\d\d-\d\d-\d\d$/.test(raw.date || '') ||
          !Number.isFinite(money(raw.amount)) || money(raw.amount) <= 0 || money(raw.amount) > 100000000000 ||
          !['Поступление', 'Списание'].includes(raw.direction) || raw.status !== 'REVIEW') throw Error('Повреждённая операция в файле. Импорт остановлен.');
      const id = String(raw.id);
      const date=new Date(raw.date+'T12:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==raw.date)throw Error('Неверная дата операции.');
      if (used.has(id)) throw Error('В файле повторяются идентификаторы операций. Импорт остановлен.');
      used.add(id);
      const max = (v, n) => String(v == null ? '' : v).slice(0, n);
      ops.push({
        id, date: raw.date, bank: max(raw.bank, 60), accountHint: max(raw.accountHint, 80),
        amount: money(raw.amount) / 100, direction: raw.direction,
        description: max(raw.description, 240), category: max(raw.category, 90),
        handling: max(raw.handling, 90), confidence: max(raw.confidence, 40),
        reviewStatus: 'pending', schema: SCHEMA, status:'REVIEW',risk:max(raw.risk,150),sourceFile:max(raw.sourceFile,150),note:max(raw.note,500)
      });
    }
    return ops;
  }
  function mergeQueue(current, incoming) {
    const map = new Map();
    for (const x of Array.isArray(current) ? current : []) if (x && x.id && !map.has(x.id)) map.set(x.id, x);
    let added = 0, existing = 0;
    for (const x of incoming) {
      if (map.has(x.id)) { existing++; continue; }
      map.set(x.id, x); added++;
    }
    return {rows: [...map.values()], added, existing};
  }
  function accountId(row) {
    const b = (row.bank || '').toLowerCase(), hint = row.accountHint || '';
    if (b.includes('сбер')) {
      if (hint.includes('8611')) return 'seed-sber-credit-8611';
      if (hint.includes('6993')) return 'seed-sber-6993';
      if (hint.includes('1814')) return 'seed-sber-1814';
      if (hint.includes('3535')) return 'seed-sber-3535';
      if (/накопител/i.test(hint)) return 'seed-sber-savings';
    }
    if (b.includes('ozon')) {
      if (hint.includes('8746')) return 'seed-ozon';
      if (hint.includes('8930')) return 'seed-ozon-savings';
    }
    if (b.includes('wb')) return 'seed-wb';
    if (b.includes('т-банк') && hint.includes('5733')) return 'seed-tbank';
    if (b.includes('втб') && hint.includes('7539')) return 'seed-vtb-7539';
    return '';
  }
  function possibleOverlap(row, operations) {
    const ac = accountId(row), value = money(row.amount),
      bankOp = x => x && x.date === row.date && money(x.amount) === value && ac && x.account === ac;
    return (Array.isArray(operations) ? operations : []).filter(x => x && (
      x.sourceOperationId === row.id || x.id === 'review-' + row.id || bankOp(x)
    ));
  }
  function stats(queue) {
    const tally = {all: queue.length, pending: 0, reviewed: 0, ignored: 0, expenses: 0, transfers: 0};
    for (const x of queue) {
      if (x.reviewStatus === 'confirmed') tally.reviewed++;
      else if (x.reviewStatus === 'ignored') tally.ignored++;
      else tally.pending++;
      if (x.handling === 'Расход после проверки') tally.expenses++;
      if (x.handling === 'Не учитывать' || x.handling === 'Не учитывать до сверки') tally.transfers++;
    }
    return tally;
  }
  function mount(win) {
    const doc = win.document, settings = doc.querySelector('#settings');
    if (!settings || doc.getElementById('moneySafeSync')) return;
    const el = (tag, cls, content) => {const n = doc.createElement(tag);if (cls) n.className = cls;if(content !== undefined)n.textContent = content;return n;};
    const sec = el('div', 'card money-review-card'); sec.id = 'moneySafeSync';
    sec.appendChild(el('h2', '', 'Проверка кандидатов с Google Диска'));
    const engine=win.MoneyCandidateEngine;if(!engine){sec.appendChild(el('p','','Модуль сверки не загрузился. Запись заблокирована.'));settings.appendChild(sec);return;}
    sec.appendChild(el('p', '', 'Загрузите приватный экспорт из таблицы. Сайт покажет операции для проверки и не изменит текущие остатки, кредиты или расходы.'));
    const actions = el('div', 'money-review-actions');
    const input = el('input'); input.type = 'file'; input.accept = '.json,application/json';input.id = 'moneyReviewFile';
    input.setAttribute('aria-label', 'Файл частного экспорта JSON');
    actions.appendChild(input);
    const preview = el('button', 'secondary', 'Проверить файл'); preview.type = 'button'; actions.appendChild(preview);
    const store = el('button', '', 'Сохранить в очередь проверки');store.type = 'button';store.disabled = true;actions.appendChild(store);
    sec.appendChild(actions);
    const status = el('p','money-review-status','Никакие операции не загружаются автоматически в бюджет.');sec.appendChild(status);
    const filterRow=el('div','money-review-actions');
    const select=el('select');
    [['expense','Покупки на проверке'],['all','Все операции'],['transfer','Переводы'],['income','Поступления'],['other','Возвраты и долги']].forEach(pair=>{const opt=el('option','',pair[1]);opt.value=pair[0];select.appendChild(opt)});
    const show=el('button','secondary','Показать ещё');show.type='button';filterRow.appendChild(select);filterRow.appendChild(show);sec.appendChild(filterRow);
    const summary=el('p','money-review-summary'),list=el('div','money-review-list');sec.appendChild(summary);sec.appendChild(list);
    settings.appendChild(sec);
    const style=el('style');style.textContent=`.money-review-card{margin-top:16px}.money-review-card h2{margin:0 0 8px}.money-review-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:12px 0}.money-review-actions input{max-width:100%;flex:1 1 220px}.money-review-actions button{max-width:100%}.money-review-actions select{flex:1 1 220px;max-width:100%;min-height:40px}.money-review-summary{font-size:13px;color:var(--muted)}.money-review-list{max-height:450px;overflow-y:auto}.money-review-row{padding:11px 0;border-bottom:1px solid #e9decf}.money-review-row strong{font-size:13px}.money-review-row small{display:block;margin:4px 0;color:#746b5b}.money-review-row .btns{display:flex;gap:6px;flex-wrap:wrap}.money-review-row button{padding:6px 10px;font-size:12px}.money-review-badge{display:inline-block;background:#f1e9da;border-radius:12px;padding:3px 7px;margin:0 5px;color:#5b584a}`;
    doc.head.appendChild(style);
    let candidates = null, visible = 24;
    const storageRead = () => {try {const a = JSON.parse(win.localStorage.getItem(STORE) || '[]');return Array.isArray(a)?a:[]} catch(e){return []}};
    const storageSave = list => win.localStorage.setItem(STORE,JSON.stringify(list));
    const stateKey='money_personal_v1';
    const persisted=()=>win.localStorage.getItem(stateKey);
    function guardFresh(){if(persisted()!==JSON.stringify(state)){if(persisted()){win.alert('История изменена в другой вкладке. Перезагрузите сайт перед подтверждением.');return false;}}return true}
    let undo=null;
    const undoButton=el('button','secondary','Отменить последний перенос');undoButton.type='button';undoButton.hidden=true;actions.appendChild(undoButton);
    undoButton.onclick=()=>{if(!undo)return;if(persisted()!==undo.afterState||win.localStorage.getItem(STORE)!==undo.afterQueue){win.alert('После переноса были другие изменения. Автоматический откат остановлен; резервная копия сохранена.');return;}if(!win.confirm('Отменить только последний перенос?'))return;win.localStorage.setItem(stateKey,undo.beforeState);win.localStorage.setItem(STORE,undo.beforeQueue);state=JSON.parse(undo.beforeState);undo=null;undoButton.hidden=true;if(typeof render==='function')render();refresh();};
    const actualOps = () => typeof state === 'undefined' ? [] : state.ops;
    function rowsForView(){let a=storageRead(); if(select.value==='expense')a=a.filter(x=>x.handling==='Расход после проверки');
      else if(select.value==='transfer')a=a.filter(x=>/Не учитывать|перевод/i.test(x.handling+' '+x.category));
      else if(select.value==='income')a=a.filter(x=>/поступления|проценты/i.test(x.category));
      else if(select.value==='other')a=a.filter(x=>/возврат|займ|кредит/i.test(x.category));
      return a.slice().sort((a,b)=>b.date.localeCompare(a.date));}
    function refresh(){const all=storageRead(),s=stats(all);summary.textContent=`В очереди: ${s.all} • ожидают: ${s.pending} • подтверждено: ${s.reviewed} • исключено: ${s.ignored} • вероятные покупки: ${s.expenses}`;
      const classifications=all.map(x=>{try{return engine.analyze(x,state,all).kind}catch(_){return 'invalid'}});const counts={};classifications.forEach(k=>counts[k]=(counts[k]||0)+1);summary.textContent+=' • совпадений по ID: '+(counts.existing||0)+' • сомнительных: '+((counts.ambiguous||0)+(counts.risk||0))+' • неизвестный счёт: '+(counts.unknown||0);
      list.replaceChildren();const filtered=rowsForView();for(const x of filtered.slice(0,visible)) {
        const card=el('div','money-review-row'),top=el('strong','',`${x.date} · ${x.bank} · ${x.amount.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})} ₽`);
        card.appendChild(top);card.appendChild(el('small','',x.description || 'Назначение не определено'));
        card.appendChild(el('span','money-review-badge',x.category));card.appendChild(el('span','money-review-badge',x.reviewStatus==='confirmed'?'Подтверждено':x.reviewStatus==='ignored'?'Не учитывать':'Требует проверки'));
        const audit=engine.analyze(x,state,all);card.appendChild(el('small','',audit.reason));card.appendChild(el('small','','Банковский ID: '+x.id+' · счёт: '+(x.accountHint||'не указан')));
        if(audit.matches.length){const matches=el('details');matches.appendChild(el('summary','','Сравнить с '+audit.matches.length+' записями истории'));for(const op of audit.matches)matches.appendChild(el('p','',op.date+' · '+(op.description||op.category||op.type)+' · '+op.amount+' ₽ · ID '+op.id));card.appendChild(matches)}
        if(x.reviewStatus === 'pending') {const btns=el('div','btns');
          if(x.handling==='Расход после проверки') {const approve=el('button','secondary','Подтвердить покупку');approve.type='button';const needsCheck=audit.kind==='risk'||(audit.kind==='ambiguous'&&audit.canConfirmDistinct);let check=null;if(needsCheck){const label=el('label','','Я сравнила историю и выписку: это отдельная покупка');check=el('input');check.type='checkbox';check.style.width='auto';label.prepend(check);card.appendChild(label);approve.disabled=true;check.onchange=()=>approve.disabled=!check.checked}else approve.disabled=audit.kind!=='new';approve.addEventListener('click',()=>confirmExpense(x.id,Boolean(check&&check.checked)));btns.appendChild(approve);
          if(audit.kind==='existing'||audit.kind==='ambiguous'){const exists=el('button','secondary','Уже учтено · не добавлять');exists.type='button';exists.onclick=()=>{if(!win.confirm('Оставить текущую историю без изменений и отметить кандидата как уже учтённого?'))return;const queue=storageRead(),f=queue.find(o=>o.id===x.id);f.reviewStatus='ignored';f.reviewDecision='already_in_history';storageSave(queue);refresh()};btns.appendChild(exists)}}
          const ignore=el('button','secondary','Не учитывать');ignore.type='button';ignore.addEventListener('click',()=>ignoreRecord(x.id));btns.appendChild(ignore);card.appendChild(btns);
        }list.appendChild(card)}
      show.hidden=filtered.length<=visible;}
    function ignoreRecord(id){const queue=storageRead(),found=queue.find(x=>x.id===id);if(!found||found.reviewStatus!=='pending')return;
      if(!win.confirm('Пометить операцию как исключённую из очереди? Существующие данные бюджета не изменятся.'))return;
      found.reviewStatus='ignored';storageSave(queue);refresh();}
    function confirmExpense(id,acknowledged){
      if(!guardFresh())return;
      const queue=storageRead(),found=queue.find(x=>x.id===id);if(!found||found.reviewStatus!=='pending')return;
      let merged;try{merged=engine.mergeOne(state,found,queue,acknowledged)}catch(e){win.alert(e.message);return;}
      if(!merged.added){status.textContent='Операция уже есть. История не менялась.';return;}
      if(!win.confirm('Записать отдельную покупку '+found.amount.toLocaleString('ru-RU')+' ₽ за '+found.date+'? Контрольные остатки и кредиты не изменятся.'))return;
      const beforeState=JSON.stringify(state),beforeQueue=JSON.stringify(queue);
      const backup={state,reviewQueue:queue,customCategories:JSON.parse(win.localStorage.getItem('money_custom_categories_v1')||'{}'),createdAt:new Date().toISOString()};
      const backupKey='money_before_review_'+Date.now();
      try{win.localStorage.setItem(backupKey,JSON.stringify(backup))}catch(e){win.alert('Не удалось сохранить резервную копию. Перенос отменён.');return;}
      found.reviewStatus='confirmed';const afterState=JSON.stringify(merged.state),afterQueue=JSON.stringify(queue);
      try{win.localStorage.setItem(stateKey,afterState);win.localStorage.setItem(STORE,afterQueue);state=merged.state;undo={beforeState,beforeQueue,afterState,afterQueue};undoButton.hidden=false;if(typeof render==='function')render();if(typeof renderHistory==='function')renderHistory();refresh();status.textContent='Добавлена одна подтверждённая покупка. Резервная копия сохранена.';}
      catch(e){try{win.localStorage.setItem(stateKey,beforeState);win.localStorage.setItem(STORE,beforeQueue);state=JSON.parse(beforeState)}catch(rollback){win.alert('Ошибка отката. Не продолжайте перенос: используйте резервную копию '+backupKey);return;}win.alert('Ошибка записи. Исходная история восстановлена: '+e.message);}
    }
    preview.addEventListener('click', async()=>{store.disabled=true;candidates=null;try {const f=input.files?.[0];if(!f)throw Error('Выберите приватный JSON-файл.');if(f.size>9000000)throw Error('Файл слишком большой.');
      const parsed=readPayload(await f.text()),now=storageRead(),result=mergeQueue(now,parsed);const audits=parsed.map(x=>engine.analyze(x,state,parsed));const count=k=>audits.filter(a=>a.kind===k).length;
      candidates=parsed;store.disabled=false;status.textContent=`Проверено ${parsed.length} записей. Новых для очереди: ${result.added}. Уже в очереди: ${result.existing}. Совпадения по банковскому ID: ${count('existing')}; возможные повторы: ${count('ambiguous')}; ручная проверка: ${count('risk')}; неизвестный счёт: ${count('unknown')}. Бюджет не менялся.`;
    }catch(e){status.textContent='Не удалось проверить файл: '+e.message;}});
    store.addEventListener('click',()=>{if(!candidates)return;try{const current=storageRead(),merged=mergeQueue(current,candidates);storageSave(merged.rows);status.textContent=`Сохранено новых для проверки: ${merged.added}. Уже были: ${merged.existing}. Доходы, расходы и остатки не изменены.`;store.disabled=true;candidates=null;refresh();}catch(e){status.textContent='Ошибка сохранения: '+e.message}});
    select.addEventListener('change',()=>{visible=24;refresh()});show.addEventListener('click',()=>{visible+=30;refresh()});refresh();
  }
  return {readPayload,mergeQueue,accountId,possibleOverlap,stats,mount};
});
