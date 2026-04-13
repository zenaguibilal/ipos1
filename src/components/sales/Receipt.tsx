'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Interface structure for the Delivery Note (Standard iPOS Zen Elite)
 */
interface DeliveryNoteData {
  docNumber: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  paymentMode: string;
  seller: string;
  orderRef: string;
  items: {
    id: number;
    designation: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  totalQty: number;
  grandTotal: number;
  oldBalance: number;
  payment: number;
  newBalance: number;
  amountInWords: string;
}

/**
 * Advanced French number to words converter (v2.2 - Corrected & Robust)
 */
function numberToWordsFR(n: number): string {
  const intPart = Math.floor(n);
  if (intPart === 0) return "ZÉRO DINAR";

  const units = ["", "UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF"];
  const tens = ["", "DIX", "VINGT", "TRENTE", "QUARANTE", "CINQUANTE", "SOIXANTE", "SOIXANTE-DIX", "QUATRE-VINGTS", "QUATRE-VINGT-DIX"];
  const teens = ["DIX", "ONZE", "DOUZE", "TREIZE", "QUATORZE", "QUINZE", "SEIZE", "DIX-SEPT", "DIX-HUIT", "DIX-NEUF"];

  function convertGroup(num: number, isMille: boolean = false): string {
    let res = "";
    
    // Hundreds
    if (num >= 100) {
      const c = Math.floor(num / 100);
      const rest = num % 100;
      if (c === 1) {
        res += "CENT ";
      } else {
        res += units[c] + " CENT" + (rest === 0 && !isMille ? "S " : " ");
      }
      num = rest;
    }

    // Tens and Units
    if (num >= 20) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      
      if (t === 7 || t === 9) { // 70s or 90s
        const prefix = (t === 7) ? "SOIXANTE" : "QUATRE-VINGT";
        if (u === 1 && t === 7) {
          res += prefix + " ET ONZE";
        } else {
          res += prefix + "-" + teens[u];
        }
      } else {
        const prefix = tens[t];
        if (u === 1) {
          res += prefix + (t === 8 ? "-UN" : " ET UN");
        } else if (u > 1) {
          res += prefix + "-" + units[u];
        } else {
          // Special case for 80 (Quatre-vingts)
          res += prefix + (t === 8 && !isMille ? "S" : "");
        }
      }
    } else if (num >= 10) {
      res += teens[num - 10];
    } else if (num > 0) {
      // Mille is invariable and we don't say "Un Mille"
      if (!(num === 1 && isMille)) {
        res += units[num];
      }
    }
    
    return res.trim();
  }

  let result = "";
  const millions = Math.floor(intPart / 1000000);
  const thousands = Math.floor((intPart % 1000000) / 1000);
  const remainder = intPart % 1000;

  if (millions > 0) {
    result += convertGroup(millions) + " MILLION" + (millions > 1 ? "S " : " ");
  }

  if (thousands > 0) {
    if (thousands === 1) {
      result += "MILLE ";
    } else {
      result += convertGroup(thousands, true) + " MILLE ";
    }
  }

  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return result.trim().toUpperCase() + " DINARS";
}

interface ReceiptProps {
  sale: Sale;
  profile: CompanyProfile | null;
  receiptType: 'a4' | 'thermal';
  customerName?: string;
  oldBalance?: number;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, profile, receiptType, customerName, oldBalance = 0 }, ref) => {
    const isThermal = receiptType === 'thermal';

    // Formattage monétaire algérien (DZ)
    const formatNum = (val: number) => val.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const docData: DeliveryNoteData = {
      docNumber: sale.invoiceNumber,
      date: sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm'),
      companyName: profile?.companyName || 'iPOS ZEN ELITE',
      companyAddress: profile?.address || 'ALGÉRIE',
      companyPhone: profile?.phone || '',
      clientName: customerName || 'Client de passage',
      clientAddress: 'ALGER, ALGÉRIE',
      paymentMode: sale.paymentStatus === 'paid' ? 'COMPTANT' : sale.paymentStatus === 'partial' ? 'PARTIEL' : 'À CRÉDIT',
      seller: 'ADMINISTRATEUR',
      orderRef: 'Vente Directe',
      items: sale.items.map((item, idx) => ({
        id: idx + 1,
        designation: item.name,
        qty: item.quantity,
        unitPrice: item.price,
        total: item.quantity * item.price,
      })),
      totalQty: sale.items.reduce((sum, i) => sum + i.quantity, 0),
      grandTotal: sale.total,
      oldBalance: oldBalance,
      payment: sale.amountPaid,
      newBalance: (oldBalance + sale.total) - sale.amountPaid,
      amountInWords: numberToWordsFR(sale.total),
    };

    if (isThermal) {
      return (
        <div ref={ref} className="bg-white text-black font-mono text-[9pt] w-[80mm] p-2 thermal-receipt">
          {/* LOGO & COMPANY */}
          <header className="text-center mb-2">
            <p className="font-bold uppercase text-base leading-none">{docData.companyName}</p>
            <p className="text-[7pt] mt-1">{docData.companyAddress}</p>
            {docData.companyPhone && <p className="text-[7pt]">Tél: {docData.companyPhone}</p>}
          </header>

          <div className="border-b border-black border-dashed my-2" />

          {/* DOC INFO */}
          <div className="space-y-0.5 mb-2">
            <p className="font-bold text-center underline mb-1">BON DE LIVRAISON</p>
            <p><span className="font-bold">N°:</span> {docData.docNumber}</p>
            <p><span className="font-bold">Date:</span> {docData.date}</p>
            <p className="truncate"><span className="font-bold">Client:</span> {docData.clientName}</p>
          </div>

          <div className="border-b border-black my-2" />

          {/* ITEMS TABLE */}
          <table className="w-full text-left text-[8pt] mb-2 border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">Désignation</th>
                <th className="text-center py-1">Qté</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {docData.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1 align-top">{item.designation}</td>
                  <td className="text-center py-1 align-top">{item.qty}</td>
                  <td className="text-right py-1 align-top">{formatNum(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black my-2" />

          {/* TOTALS & BALANCES */}
          <div className="space-y-1 font-bold">
            <div className="flex justify-between">
              <span>TOTAL FACTURE:</span>
              <span>{formatNum(docData.grandTotal)} DA</span>
            </div>
            
            {docData.oldBalance > 0.01 && (
              <div className="flex justify-between font-normal text-[8pt]">
                <span>ANCIEN SOLDE:</span>
                <span>{formatNum(docData.oldBalance)} DA</span>
              </div>
            )}

            <div className="flex justify-between text-emerald-700">
              <span>VERSEMENT:</span>
              <span>-{formatNum(docData.payment)} DA</span>
            </div>

            <div className="flex justify-between border-t border-black pt-1 text-[10pt]">
              <span>NET A PAYER:</span>
              <span>{formatNum(docData.newBalance)} DA</span>
            </div>
          </div>

          {/* FOOTER */}
          <footer className="text-center mt-6 pt-2 border-t border-dashed border-gray-400 space-y-1">
            <p className="font-bold uppercase">Merci de votre visite !</p>
            <p className="text-[7pt] opacity-50">iPOS ZEN ELITE SYSTEM</p>
          </footer>
        </div>
      );
    }

    return (
      <div ref={ref} className="bg-white text-[#111827] font-sans print:p-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4; margin: 0; }
            body { background: white; }
            .no-print { display: none !important; }
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 14mm;
            background: white;
            margin: 0 auto;
            position: relative;
          }
        `}} />
        
        <div className="page flex flex-col">
          {/* HEADER HORIZONTAL DESIGN */}
          <div className="flex justify-between items-start border-b-2 border-[#111827] pb-6 mb-8">
            <div className="flex flex-col gap-1 max-w-[60%]">
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-[#111827]">{docData.companyName}</h1>
              <p className="text-sm font-semibold opacity-70 mt-2">{docData.companyAddress}</p>
              <p className="text-sm font-bold">Tél: {docData.companyPhone}</p>
            </div>
            <div className="flex flex-col items-end">
              <h2 className="text-3xl font-black text-blue-600 uppercase tracking-tighter">Bon de Livraison</h2>
              <div className="mt-2 text-right">
                <p className="font-mono font-bold text-lg">N° : {docData.docNumber}</p>
                <p className="text-sm font-bold text-gray-500 uppercase">Date : {docData.date.split(' ')[0]}</p>
              </div>
            </div>
          </div>

          {/* CLIENT & METADATA SECTION */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-7 bg-[#EFF6FF] border border-[#BFDBFE] p-6 rounded-xl shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Destinataire / Client</h3>
              <p className="text-2xl font-black text-[#111827]">{docData.clientName}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">{docData.clientAddress}</p>
            </div>
            <div className="col-span-5 grid grid-cols-2 gap-2">
              {[
                { label: 'Réf. commande', val: docData.orderRef },
                { label: 'Mode paiement', val: docData.paymentMode },
                { label: 'Vendeur', val: docData.seller },
                { label: 'Date livraison', val: docData.date.split(' ')[0] },
              ].map((box, i) => (
                <div key={i} className="border border-gray-200 p-3 rounded-xl flex flex-col justify-center bg-gray-50/50">
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">{box.label}</span>
                  <span className="text-[10px] font-bold truncate text-[#111827]">{box.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ITEMS TABLE - ZEBRA DESIGN */}
          <div className="flex-grow">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#111827] text-white text-left">
                  <th className="py-4 px-4 text-[10px] font-black uppercase rounded-tl-xl w-12 text-center">N°</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase">Désignation</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase w-20 text-center">Qté</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase w-32 text-right">P.U (DA)</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase rounded-tr-xl w-32 text-right">Total (DA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docData.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                    <td className="py-4 px-4 font-mono text-xs text-gray-400 text-center">{item.id}</td>
                    <td className="py-4 px-4 font-bold text-sm uppercase tracking-tight text-[#111827]">{item.designation}</td>
                    <td className="py-4 px-4 font-mono font-bold text-sm text-center">{item.qty}</td>
                    <td className="py-4 px-4 font-mono font-bold text-sm text-right">{formatNum(item.unitPrice)}</td>
                    <td className="py-4 px-4 font-mono font-black text-sm text-right">{formatNum(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS & SUMMARY SECTION */}
          <div className="mt-10 grid grid-cols-2 gap-10 items-end">
            <div className="space-y-8">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Arrêté à la somme de :</p>
                <p className="text-sm font-black italic text-gray-800 leading-relaxed uppercase">
                  {docData.amountInWords}
                </p>
              </div>
              <div className="pt-10 border-t border-dashed border-gray-200">
                <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Signature & Visa du Client</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between px-4 py-2 text-sm font-bold text-gray-500">
                <span>Quantité Totale</span>
                <span className="font-mono text-[#111827]">{docData.totalQty}</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-sm font-bold text-[#111827] border-b border-gray-100">
                <span>Montant Facture</span>
                <span className="font-mono">{formatNum(docData.grandTotal)} DA</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-sm font-bold text-gray-500">
                <span>Ancien solde</span>
                <span className="font-mono text-[#111827]">{formatNum(docData.oldBalance)} DA</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-sm font-bold text-emerald-600">
                <span>Versement Effectué</span>
                <span className="font-mono">-{formatNum(docData.payment)} DA</span>
              </div>
              <div className="bg-[#111827] text-white p-6 rounded-2xl flex justify-between items-center mt-4 shadow-xl">
                <span className="text-xs font-black uppercase tracking-widest opacity-60">TOTAL NET DU (DA)</span>
                <span className="text-3xl font-black font-mono tracking-tighter">{formatNum(docData.newBalance)}</span>
              </div>
            </div>
          </div>

          {/* SIGNATURES AREAS */}
          <div className="mt-20 grid grid-cols-2 gap-10">
            <div className="text-center h-36 border-2 border-dashed border-gray-100 rounded-2xl p-4 flex flex-col justify-between bg-gray-50/20">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Signature & Cachet — Le Fournisseur</p>
              <div className="text-[8px] font-bold opacity-10 uppercase tracking-widest">iPOS ZEN ELITE SYSTEM</div>
            </div>
            <div className="text-center h-36 border-2 border-dashed border-gray-100 rounded-2xl p-4 flex flex-col justify-between bg-gray-50/20">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Lu et approuvé — Le Client</p>
              <div className="text-[8px] font-bold opacity-10 uppercase tracking-widest">BON POUR RÉCEPTION</div>
            </div>
          </div>

          {/* FOOTER */}
          <footer className="mt-auto pt-10 border-t border-gray-100 flex justify-between items-center text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em]">
            <span>{docData.companyName} — ÉLITE POS SOLUTION</span>
            <span>Généré par iPOS — {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
          </footer>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
