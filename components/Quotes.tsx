
import React, { useState, useEffect } from 'react';
import { Quote, QuoteItem, UserSettings } from '../types';
import { Printer, Save, Plus, Trash2, Calculator, DollarSign, Calendar, MapPin, User as UserIcon } from 'lucide-react';

interface QuotesProps {
  activeQuote: Quote | null;
  userSettings: UserSettings | null;
  onUpdateQuote: (quote: Quote) => void;
  onSaveQuote: () => void;
}

export const Quotes: React.FC<QuotesProps> = ({ activeQuote, userSettings, onUpdateQuote, onSaveQuote }) => {
  if (!activeQuote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFCFB] text-[#111] p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-xl shadow-black/5">
           <Calculator size={32} className="opacity-30 text-[#111]" />
        </div>
        <h3 className="text-lg font-bold text-[#111] uppercase tracking-widest mb-2">No Active Quote</h3>
        <p className="text-sm text-[#111] max-w-md">
          Go to the <b>Mockups</b> tab, design a lighting plan, and fill out the "Architect Notes". 
          Then return here to see your auto-generated quote.
        </p>
      </div>
    );
  }

  const handleItemChange = (id: string, field: keyof QuoteItem, value: string | number) => {
    const updatedItems = activeQuote.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate line total
        if (field === 'quantity' || field === 'unitPrice') {
           updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    });
    recalculateTotals(updatedItems);
  };

  const deleteItem = (id: string) => {
    const updatedItems = activeQuote.items.filter(item => item.id !== id);
    recalculateTotals(updatedItems);
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      description: "New Item",
      details: "Enter product details here...",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      type: 'other'
    };
    recalculateTotals([...activeQuote.items, newItem]);
  };

  const recalculateTotals = (items: QuoteItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (activeQuote.taxRate / 100);
    const total = subtotal + taxAmount;
    
    onUpdateQuote({
      ...activeQuote,
      items,
      subtotal,
      taxAmount,
      total
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-4 md:p-8 font-sans text-[#111]">
      
      <div className="max-w-5xl mx-auto">
        
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4">
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-[#111]">Quote Generator</h1>
             <p className="text-xs text-[#111] font-bold uppercase tracking-widest mt-1">
                Draft • {activeQuote.id.slice(-6)}
             </p>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="bg-white border border-gray-200 text-[#111] px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2 shadow-sm"
              >
                <Printer size={14} /> Print PDF
              </button>
              <button 
                onClick={onSaveQuote}
                className="bg-[#111] text-white px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black flex items-center gap-2 shadow-lg shadow-black/10 hover:scale-105 transition-transform"
              >
                <Save size={14} /> Save Quote
              </button>
           </div>
        </div>

        {/* Invoice Paper */}
        <div className="bg-white rounded-none md:rounded-[2px] shadow-xl p-6 md:p-8 min-h-[800px] relative print:shadow-none print:m-0 print:w-full">
           
           {/* Date - Top Right Absolute Position */}
           <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <p className="text-sm text-[#111] font-medium">Date: {activeQuote.date}</p>
           </div>

           {/* Header / Company Info */}
           <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-100 pb-6 mb-8 gap-6">
              <div className="w-full md:w-auto">
                 {userSettings?.logo_url ? (
                   <img src={userSettings.logo_url} alt="Logo" className="h-24 mb-4 object-contain" />
                 ) : (
                   <div className="w-24 h-24 bg-[#111] text-[#F6B45A] flex items-center justify-center font-serif text-4xl font-bold rounded-lg mb-4">O</div>
                 )}
                 <h2 className="text-3xl font-bold text-[#111] w-full">{userSettings?.company_name || "Your Company Name"}</h2>
                 <input 
                   type="text" 
                   defaultValue="Outdoor Lighting Specialists" 
                   className="text-lg text-[#111] mt-1 font-medium bg-transparent focus:outline-none w-full placeholder:text-gray-400 border-none p-0"
                   placeholder="Company Tagline"
                 />
              </div>
           </div>

           {/* Client Details Grid */}
           <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 
                 {/* Left Column: Client Name & Title */}
                 <div className="space-y-6">
                    <div>
                       <h3 className="text-sm font-bold text-[#111] uppercase tracking-[0.2em] mb-2">Quote for</h3>
                       <input 
                         type="text" 
                         value={activeQuote.clientName}
                         onChange={(e) => onUpdateQuote({...activeQuote, clientName: e.target.value})}
                         placeholder="Client Name"
                         className="w-full font-bold text-3xl text-[#111] placeholder:text-gray-300 focus:outline-none border-b border-transparent focus:border-black transition-colors bg-transparent"
                       />
                    </div>
                    
                    <div>
                       <h4 className="text-[10px] font-bold text-[#111] uppercase tracking-[0.2em] mb-1">Job title</h4>
                       <input 
                         type="text"
                         placeholder="Title"
                         className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black font-sans"
                       />
                    </div>
                 </div>

                 {/* Right Column: Address & Contact */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    <div>
                        <h4 className="text-[10px] font-bold text-[#111] uppercase tracking-[0.2em] mb-2">Property address</h4>
                        <textarea
                           value={activeQuote.clientAddress}
                           onChange={(e) => onUpdateQuote({...activeQuote, clientAddress: e.target.value})}
                           placeholder="Address"
                           className="w-full text-sm text-[#111] placeholder:text-gray-400 focus:outline-none bg-transparent resize-none h-20"
                        />
                        <button className="text-xs text-green-600 font-medium hover:underline">Change</button>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold text-[#111] uppercase tracking-[0.2em] mb-2">Contact details</h4>
                        <div className="space-y-3">
                           <input 
                             type="text"
                             placeholder="Phone"
                             className="w-full text-sm text-[#111] placeholder:text-gray-400 focus:outline-none bg-transparent border-b border-gray-100 pb-1"
                           />
                           <input 
                             type="email"
                             placeholder="Email"
                             className="w-full text-sm text-green-600 focus:outline-none bg-transparent border-b border-gray-100 pb-1"
                           />
                        </div>
                    </div>
                 </div>

              </div>
           </div>

           {/* Line Items Table */}
           <div className="mb-8">
              <div className="grid grid-cols-12 gap-4 pb-2 mb-2 hidden md:grid">
                 <div className="col-span-6 text-[12px] font-bold text-[#111]">Product / Service</div>
                 <div className="col-span-2 text-[12px] font-bold text-[#111]">Qty.</div>
                 <div className="col-span-2 text-[12px] font-bold text-[#111]">Unit Price</div>
                 <div className="col-span-2 text-[12px] font-bold text-[#111]">Total</div>
              </div>

              <div className="space-y-3">
                 {activeQuote.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start group border-b md:border-none border-gray-100 pb-4 md:pb-0">
                       
                       {/* Product / Service Column */}
                       <div className="col-span-1 md:col-span-6 space-y-2">
                          <label className="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                          {/* Title Input */}
                          <input 
                             type="text" 
                             value={item.description}
                             onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                             className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-black transition-colors font-sans"
                             placeholder="Item Name"
                          />
                          {/* Details Textarea */}
                          <div className="relative">
                            <textarea
                               value={item.details || ''}
                               onChange={(e) => handleItemChange(item.id, 'details', e.target.value)}
                               className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-[#111] focus:outline-none focus:border-black resize-y min-h-[60px] font-sans"
                               placeholder="Description / Details"
                            />
                             <div className="absolute right-2 bottom-2 pointer-events-none">
                                <span className="text-[10px] text-[#111]">///</span>
                             </div>
                          </div>
                       </div>

                       <div className="col-span-1 md:col-span-6 grid grid-cols-3 gap-3">
                           {/* Qty Column */}
                           <div className="col-span-1 md:col-span-4">
                              <label className="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Qty</label>
                              <input 
                                 type="number" 
                                 value={item.quantity}
                                 onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                 className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-black font-sans"
                              />
                           </div>

                           {/* Unit Price Column */}
                           <div className="col-span-1 md:col-span-4 relative">
                              <label className="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Price</label>
                              <div className="relative">
                                  <span className="absolute left-3 top-2 text-sm text-[#111]">$</span>
                                  <input 
                                     type="number" 
                                     value={item.unitPrice}
                                     onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                                     className="w-full bg-white border border-gray-200 rounded-md pl-6 pr-3 py-2 text-sm text-[#111] focus:outline-none focus:border-black font-sans"
                                  />
                              </div>
                           </div>

                           {/* Total Column & Delete */}
                           <div className="col-span-1 md:col-span-4 space-y-2">
                              <label className="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Total</label>
                              <div className="relative">
                                  <span className="absolute left-3 top-2 text-sm text-[#111]">$</span>
                                  <input 
                                     type="text" 
                                     readOnly
                                     value={item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                     className="w-full bg-white border border-gray-200 rounded-md pl-6 pr-3 py-2 text-sm text-[#111] focus:outline-none font-sans"
                                  />
                              </div>
                              <div className="flex justify-end">
                                <button 
                                    onClick={() => deleteItem(item.id)}
                                    className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                                >
                                    Delete
                                </button>
                              </div>
                           </div>
                       </div>
                       
                    </div>
                 ))}
              </div>

              <button 
                 onClick={addItem}
                 className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F6B45A] hover:text-[#111] transition-colors"
              >
                 <Plus size={14} /> Add Line Item
              </button>
           </div>

           {/* Totals Section */}
           <div className="flex justify-end border-t border-gray-100 pt-6">
              <div className="w-64 space-y-2">
                 <div className="flex justify-between text-sm text-[#111]">
                    <span>Subtotal</span>
                    <span className="font-mono">${activeQuote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-sm text-[#111] items-center">
                    <span className="flex items-center gap-2">
                       Tax 
                       <div className="flex items-center border border-gray-200 px-1 rounded bg-white">
                          <input 
                             type="number" 
                             value={activeQuote.taxRate}
                             onChange={(e) => {
                                const newRate = Number(e.target.value);
                                onUpdateQuote({
                                   ...activeQuote, 
                                   taxRate: newRate, 
                                   taxAmount: activeQuote.subtotal * (newRate/100), 
                                   total: activeQuote.subtotal + (activeQuote.subtotal * (newRate/100))
                                });
                             }}
                             className="w-8 bg-transparent text-right outline-none text-xs text-[#111]"
                          />
                          <span className="text-xs text-[#111]">%</span>
                       </div>
                    </span>
                    <span className="font-mono text-[#111]">${activeQuote.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-xl font-bold text-[#111] pt-4 border-t border-[#111]">
                    <span>Total</span>
                    <span>${activeQuote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
              </div>
           </div>
           
           {/* Footer Notes */}
           <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-[#111] uppercase tracking-[0.2em] mb-2">Notes</h4>
              <textarea 
                 value={activeQuote.notes}
                 onChange={(e) => onUpdateQuote({...activeQuote, notes: e.target.value})}
                 className="w-full text-sm text-[#111] italic bg-transparent focus:outline-none resize-none h-16"
                 placeholder="Thank you for your business. Payment is due within 30 days."
              />
           </div>

        </div>
      </div>
    </div>
  );
};
