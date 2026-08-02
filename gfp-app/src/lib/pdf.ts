// Branded PDF export of the rich plan. Rendered as HTML by expo-print on the
// device, so every language and script works, then handed to the share sheet.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { translate as t } from '../i18n/locale';
import { trMealName, trMealTime, trMealNote, trFoodLine, trDayName } from '../i18n/food';

const ORANGE = '#FF6A2B';
const INK = '#1a1f25';

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function foodLine(f: any): string {
  const grams = f.grams ? `${f.grams} g ` : '';
  return esc(trFoodLine(`${grams}${f.item}`.trim()) + (f.gives ? ` — ${f.gives}` : ''));
}

export function planHtml(rich: any, userName?: string): string {
  const c = rich?.computed || {};
  const meals = rich?.meals?.slots || [];
  const split = rich?.training?.split || [];
  const supps = rich?.supplements || [];
  const report = rich?.report || [];
  const prog = rich?.training?.progression || {};

  const mealRows = meals.map((m: any) => `
    <div class="meal">
      <div class="mealHead"><b>${esc(trMealName(m.name))}</b><span>${esc(trMealTime(m.time))}</span></div>
      <div class="macros">${m.kcal} kcal · ${m.protein_g}g P · ${m.carbs_g}g C · ${m.fat_g}g F</div>
      <ul>${(m.foods || []).map((f: any) => `<li>${foodLine(f)}</li>`).join('')}</ul>
      <div class="note">${esc(trMealNote(m.note))}</div>
    </div>`).join('');

  const splitRows = split.map((d: any) => `
    <div class="day">
      <div class="dayName">${esc(trDayName(d.name))}</div>
      <table>${(d.blocks || []).map((bl: any) =>
        `<tr><td>${esc(bl.ex)}</td><td>${bl.sets} × ${esc(bl.reps)}</td><td>${bl.rest_s}s ${esc(t('pdf.rest'))}</td></tr>`).join('')}
      </table>
    </div>`).join('');

  const suppRows = supps.map((sx: any) =>
    `<tr><td><b>${esc(sx.name)}</b></td><td>${esc(sx.dose)}</td><td>${esc(sx.timing)}</td></tr>
     <tr class="why"><td colspan="3">${esc(sx.reason)}</td></tr>`).join('');

  const reportRows = report.map((r: any) => `<h3>${esc(r.title)}</h3><p>${esc(r.body)}</p>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,'Segoe UI',Roboto,'Noto Sans',sans-serif;color:${INK};margin:28px;font-size:12px;line-height:1.5}
    .head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid ${ORANGE};padding-bottom:10px;margin-bottom:16px}
    .brand{font-size:20px;font-weight:800}.brand span{color:${ORANGE}}
    .kcal{font-size:30px;font-weight:800;color:${ORANGE}}
    .chips{margin:6px 0 14px}.chips b{background:#f4e9e2;color:${ORANGE};border-radius:12px;padding:3px 10px;margin-right:6px;font-size:11px}
    h2{font-size:15px;border-left:4px solid ${ORANGE};padding-left:8px;margin:18px 0 8px}
    h3{font-size:12.5px;margin:12px 0 4px;color:${ORANGE}}
    .meal{border:1px solid #e5e2de;border-radius:8px;padding:8px 10px;margin-bottom:8px;page-break-inside:avoid}
    .mealHead{display:flex;justify-content:space-between}.mealHead span{color:${ORANGE};font-size:11px}
    .macros{color:#0f9d84;font-size:11px;margin:2px 0}
    ul{margin:4px 0 4px 16px;padding:0}li{margin:1px 0}
    .note{color:#777;font-size:10.5px}
    .day{page-break-inside:avoid;margin-bottom:10px}.dayName{font-weight:700;margin-bottom:3px}
    table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #eee;padding:3px 6px;font-size:11.5px}
    .why td{color:#777;font-size:10.5px;border-bottom:1px solid #e5e2de}
    p{margin:2px 0 8px}
    .foot{margin-top:20px;border-top:1px solid #ddd;padding-top:8px;color:#999;font-size:10px}
  </style></head><body>
    <div class="head">
      <div class="brand">getfitplans<span>.com</span><div style="font-size:10px;color:#888;font-weight:400">PERSONAL PROTOCOL${userName ? ' · ' + esc(userName) : ''}</div></div>
      <div style="text-align:right"><div class="kcal">${c.target_kcal ?? '-'} kcal</div><div style="font-size:10px;color:#888">${esc(t('pdf.perDay'))}</div></div>
    </div>
    <div class="chips"><b>${c.protein_g ?? '-'}g ${esc(t('macro.protein'))}</b><b>${c.carbs_g ?? '-'}g ${esc(t('macro.carbs'))}</b><b>${c.fat_g ?? '-'}g ${esc(t('macro.fat'))}</b><b>${c.fiber_g ?? '-'}g ${esc(t('pdf.fiber'))}</b><b>${c.water_ml ? (c.water_ml / 1000).toFixed(1) : '-'} L ${esc(t('pdf.water'))}</b></div>
    <h2>${esc(t('plan.yourMeals'))}</h2>${mealRows}
    <h2>${esc(t('plan.split'))}</h2>${splitRows}
    <div style="margin:4px 0 10px;color:#555">${esc(prog.rule || '')} ${esc(prog.deload || '')}</div>
    <h2>${esc(t('plan.suppStack'))}</h2><table>${suppRows}</table>
    <h2>${esc(t('plan.fullPlan'))}</h2>${reportRows}
    <div class="foot">getfitplans.com — ${esc(t('pdf.footer'))}</div>
  </body></html>`;
}

export async function sharePlanPdf(rich: any, userName?: string): Promise<boolean> {
  try {
    const { uri } = await Print.printToFileAsync({ html: planHtml(rich, userName) });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'GetFitPlans' });
    }
    return true;
  } catch {
    return false;
  }
}
