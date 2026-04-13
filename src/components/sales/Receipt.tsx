'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Interface structure for the Delivery Note (Standard iPOS Zen)
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
 * Advanced French number to words converter (Supports Millions)
 */
function numberToWordsFR(n: number): string {
  if (n === 0) return "ZÉRO DINAR";
  
  const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGTS', 'QUATRE-VINGT-DIX'];
  const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];

  function convertGroup(num: number): string {
    let res = "";
    if (num >= 100) {
      const c = Math.floor(num / 100);
      const rest = num % 100;
      if (c === 1) {
        res += "CENT ";
      } else {
        res += units[c] + " CENT" + (rest === 0 ? "S " : " ");
      }
      num = rest;
    }
    
    if (num >= 20) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7 || t === 9) {
        res += tens[t - 1] + (u === 1 ? " ET " : "-") + teens[u];
      } else {
        res += tens[t] + (u === 1 ? " ET " : u > 1 ? "-" : "") + units[u];
      }
    } else if (num >= 10) {
      res += teens[num - 10];
    } else if (num > 0) {
      res += units[num];
    }
    return res.trim();
  }

  const intPart = Math.floor(n);
  let result = "";

  if (intPart >= 1000000) {
    const m = Math.floor(intPart / 1000000);
    result += convertGroup(m) + " MILLION" + (m > 1 ? "S" : "");
    result += " ";
  }
  
  const thousands = Math.floor((intPart % 1000000) / 1000);
  if (thousands > 0) {
    if (thousands === 1) {
      result += "MILLE ";
    } else {
      result += convertGroup(thousands) + " MILLE ";
    }
  }

  const remainder = intPart % 1000;
  if (remainder > 0) {
    result += convertGroup(remainder);
  } else if (intPart === 0 && !result) {
    result = "ZÉRO";
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

    // DZ Standard Number Formatter
    const formatNum = (val: number) => val.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const docData: DeliveryNoteData = {
      docNumber: sale.invoiceNumber,
      date: sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy'),
      companyName: profile?.companyName || 'iPOS ZEN ELITE',
      companyAddress: profile?.address || 'ALGÉRIE',
      companyPhone: profile?.phone || '',
      clientName: customerName || 'Client de passage',
      clientAddress: 'ALGER, ALGÉRIE',
      paymentMode: sale.paymentStatus === 'paid' ? 'COMPTANT' : sale.paymentStatus === 'partial' ? 'VERSEMENT PARTIEL' : 'À CRÉDIT',
      seller: 'ADMINISTRATEUR',
      orderRef: 'Vente Directه',
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
        <div ref={ref} className="bg-white text-black font-mono text-[10pt] w-[80mm] p-4 thermal-receipt">
          <header className="text-center mb-4">
            <p className="font-bold uppercase text-lg">{docData.companyName}</p>
            <p className="text-[8pt]">{docData.companyAddress}</p>
            <p className="text-[8pt]">Tél: {docData.companyPhone}</p>
          </header>
          <div className="border-b-2 border-black mb-4" />
          <p className="font-bold">BL N°: {docData.docNumber}</p>
          <p>DATE: {docData.date}</p>
          <p className="mb-4">CLIENT: {docData.clientName}</p>
          <table className="w-full text-left text-[9pt] mb-4">
            <thead>
              <tr className="border-b border-black">
                <th>ART</th>
                <th className="text-center">QTÉ</th>
                <th className="text-right">TOT</th>
              </tr>
            </thead>
            <tbody>
              {docData.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1">{item.designation}</td>
                  <td className="text-center">{item.qty}</td>
                  <td className="text-right">{formatNum(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t-2 border-black pt-2 text-right font-bold space-y-1">
            <p>TOTAL NET: {formatNum(docData.grandTotal)} DA</p>
            {docData.payment > 0 && <p>PAYÉ: {formatNum(docData.payment)} DA</p>}
            {docData.newBalance > 0.01 && <p>SOLDE DÛ: {formatNum(docData.newBalance)} DA</p>}
          </div>
          <footer className="text-center mt-6 text-[8pt]">MERCI DE VOTRE CONFIANCE</footer>
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
                <p className="text-sm font-bold text-gray-500 uppercase">Date : {docData.date}</p>
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
                { label: 'Date livraison', val: docData.date },
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
                <tr className="bg-[#111827] text-white">
                  <th className="py-4 px-4 text-left text-[10px] font-black uppercase rounded-tl-xl w-12">N°</th>
                  <th className="py-4 px-4 text-left text-[10px] font-black uppercase">Désignation</th>
                  <th className="py-4 px-4 text-center text-[10px] font-black uppercase w-20">Qté</th>
                  <th className="py-4 px-4 text-right text-[10px] font-black uppercase w-32">Prix U. (DA)</th>
                  <th className="py-4 px-4 text-right text-[10px] font-black uppercase rounded-tr-xl w-32">Total (DA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docData.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                    <td className="py-4 px-4 font-mono text-xs text-gray-400">{item.id}</td>
                    <td className="py-4 px-4 font-bold text-sm uppercase tracking-tight text-[#111827]">{item.designation}</td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-sm">{item.qty}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-sm">{formatNum(item.unitPrice)}</td>
                    <td className="py-4 px-4 text-right font-mono font-black text-sm">{formatNum(item.total)}</td>
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