'use client';

import { useCallback } from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';

/**
 * useAutoPrint — hook React pour l'impression thermique 80mm.
 *
 * L'impression automatique post-vente est déjà intégrée dans cartStore.ts.
 * Ce hook est fourni pour usage manuel depuis un composant (ex: bouton
 * "Imprimer à nouveau" dans SaleDetailsDialog).
 *
 * Activé/désactivé via localStorage key: 'ipos-autoprint-enabled'
 */
export function useAutoPrint() {
    const isEnabled = useCallback((): boolean => {
        try {
            return (
                localStorage.getItem('ipos-autoprint-enabled') === 'true'
            );
        } catch {
            return false;
        }
    }, []);

    const printThermal = useCallback(
        (sale: Sale, profile: CompanyProfile | null) => {
            if (typeof window === 'undefined') return;

            const companyName = profile?.companyName || 'iPOS Zen';
            const addr        = profile?.address     || '';
            const phone       = profile?.phone       || '';

            const rows = sale.items
                .map(i => {
                    const lineTotal = (
                        Number(i.price) * Number(i.quantity)
                    ).toFixed(2);
                    return `<tr>
                    <td>${String(i.name)}</td>
                    <td style="text-align:center">${i.quantity}</td>
                    <td style="text-align:right">${Number(i.price).toFixed(2)}</td>
                    <td style="text-align:right">${lineTotal}</td>
                </tr>`;
                })
                .join('');

            const change    = Math.max(0, Number(sale.amountPaid) - Number(sale.total));
            const remaining = Math.max(0, Number(sale.remainingBalance));

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page { margin:0; size:80mm auto; }
  body {
    width:80mm; margin:0 auto;
    font-family:'Courier New',Courier,monospace;
    font-size:9pt; color:#000; background:#fff;
    padding:4mm 3mm;
  }
  .c  { text-align:center; }
  .r  { text-align:right;  }
  .b  { font-weight:bold;  }
  .lg { font-size:11pt;    }
  .xs { font-size:7.5pt;   }
  .sep  { border-top:1px dashed #000; margin:3mm 0; }
  .sep2 { border-top:2px solid  #000; margin:3mm 0; }
  table { width:100%; border-collapse:collapse; font-size:8pt; }
  th,td { padding:1px 2px; }
  th { border-bottom:1px solid #000; }
</style>
</head>
<body>
  <div class="c b lg">${companyName.toUpperCase()}</div>
  ${addr  ? `<div class="c xs">${addr}</div>`        : ''}
  ${phone ? `<div class="c xs">Tél: ${phone}</div>` : ''}
  <div class="sep2"></div>
  <div><b>FACTURE N°:</b> ${sale.invoiceNumber}</div>
  <div><b>DATE:</b> ${new Date(sale.createdAt!).toLocaleString('fr-DZ')}</div>
  <div class="sep"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left">ARTICLE</th>
        <th>QTÉ</th>
        <th class="r">P.U</th>
        <th class="r">TOTAL</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sep2"></div>
  <div class="r">SOUS-TOTAL: <b>${Number(sale.subtotal).toFixed(2)} DA</b></div>
  ${sale.discountAmount && sale.discountAmount > 0
      ? `<div class="r">REMISE: -${Number(sale.discountAmount).toFixed(2)} DA</div>`
      : ''}
  <div class="r b lg">TOTAL NET: ${Number(sale.total).toFixed(2)} DA</div>
  <div class="sep"></div>
  <div class="r">REÇU: ${Number(sale.amountPaid).toFixed(2)} DA</div>
  ${change > 0.01
      ? `<div class="r b">MONNAIE RENDUE: ${change.toFixed(2)} DA</div>`
      : remaining > 0.01
      ? `<div class="r b">SOLDE DÛ: ${remaining.toFixed(2)} DA</div>`
      : ''}
  <div class="sep2"></div>
  <div class="c b">Merci de votre visite !</div>
  <div class="c xs" style="margin-top:4mm;opacity:.4">${sale.invoiceNumber}</div>
</body>
</html>`;

            const win = window.open(
                '',
                '_blank',
                'width=420,height=640,toolbar=no',
            );
            if (!win) return;
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => {
                win.print();
                win.close();
            }, 350);
        },
        [],
    );

    return { printThermal, isEnabled };
}
