import React from 'react';

// Editor Visual (Lo que ves en pantalla para trabajar)
const InvoicePaper = ({ id, data, setData, userData, isExporting = false }) => {
  
  // Helpers
  const updateItem = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index][field] = value;
    setData({ ...data, items: newItems });
  };

  const removeItem = (id) => {
    if (data.items.length > 1) {
      setData({ ...data, items: data.items.filter(i => i.id !== id) });
    }
  };

  const addItem = () => {
    setData({ ...data, items: [...data.items, { id: Date.now(), desc: '', price: 0, qty: 1 }] });
  };

  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const itbis = data.useItbis ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;
  const format = (v) => v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  return (
    <div 
      id={id} 
      className="font-sans relative flex flex-col shadow-xl"
      style={{
        width: '794px', // A4 Ancho
        minHeight: '1123px', // A4 Alto
        backgroundColor: '#f4eee8',
        color: '#1a2310',
        lineHeight: '1.2'
      }}
    >
      {/* HEADER SVG (Visual) */}
      <div className="w-full bg-[#303F1D]">
        <svg viewBox="0 0 612 95.04" className="w-full block" style={{ shapeRendering: 'geometricPrecision' }}>
            <rect fill="#303F1D" width="612" height="95.04"/>
            <g fill="#FFFFFF">
                <path d="M519.75,75.5h30.88V35.35c0.78,0.36,1.45,0.57,1.99,0.97c0.27,0.21,0.36,0.75,0.36,1.15c0,5.16,0,10.29,0,15.45v24.87H511.9c0-0.36-0.06-0.72-0.06-1.06c0-8.3,0-16.6,0-24.9c0-0.88,0.27-1.24,1.09-1.45c2.23-0.63,4.47-1.36,6.85-2.08v27.23L519.75,75.5z"/>
                <text transform="matrix(1 0 0 1 82.1889 80.8513)" fill="#b8b5ad" fontFamily="Helvetica, Arial, sans-serif" fontSize="11">Inmobiliaria . Arquitectura . Construcción</text>
                <path d="M73.5,20.66v13.36c0,4.07-2.14,7.05-7.57,7.05h-6.92V37.5h6.71c3.21,0,4.18-1.54,4.18-3.5V20.66H73.5z"/>
                <rect x="81.28" y="20.66" width="3.58" height="20.41"/>
                <path d="M103.81,20.66c4.59,0,6.55,2.85,6.55,6.11c0,3.26-1.2,5.27-4.33,6.13l4.75,8.17h-3.97l-4.65-7.88h-5.32c-0.34,0-0.52,0.16-0.52,0.52v7.39h-3.58v-8.07c0-2.3,0.97-3.24,3.21-3.24h7.96c2.04,0,2.84-1.38,2.84-2.84c0-1.46-0.89-2.69-2.84-2.69h-11.2v-3.6h11.07H103.81z"/>
                <path d="M126.93,20.66c4.8,0,6.84,2.32,6.84,5.48c0,3.16-1.02,3.89-2.9,4.7c1.93,0.81,2.98,2.32,2.98,4.78c0,2.45-2.01,5.48-6.81,5.48h-10.31v-3.58h10.31c2.09,0,3.08-0.97,3.08-2.61c0-1.64-1.07-2.45-3.11-2.45h-6.29v-3.24h6.21c2.09,0,3.11-0.76,3.11-2.45c0-1.7-0.94-2.53-3.08-2.53h-10.18v-3.58h10.18H126.93z"/>
            </g>
        </svg>
      </div>

      <div className="flex-1 flex flex-col px-12 py-8">
         <div className="flex justify-between gap-6 mb-8">
            <div className="w-[55%] flex flex-col gap-4">
                <div>
                    <span className="text-xs font-bold block mb-1 uppercase tracking-wider text-[#303F1D]">FECHA DE EMISIÓN</span>
                    <input type="date" value={data.fecha} onChange={(e) => setData({...data, fecha: e.target.value})} className="bg-transparent font-bold text-[#303F1D] text-lg outline-none w-full" />
                </div>
                
                <div className="border-l-[4px] border-[#303F1D] pl-4 flex flex-col gap-2">
                    <div>
                        <div className="text-xs font-bold text-[#303F1D] uppercase tracking-wider mb-1">FACTURAR A:</div>
                        <input className="text-xl font-bold w-full bg-transparent outline-none placeholder-gray-400" placeholder="Nombre del Cliente..." value={data.clientName} onChange={e => setData({...data, clientName: e.target.value})} />
                    </div>
                    <input className="text-sm w-full bg-transparent outline-none placeholder-gray-400" placeholder="RNC / Cédula" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})} />
                    <input className="text-sm w-full bg-transparent outline-none placeholder-gray-400" placeholder="Ubicación / Dirección" value={data.clientLocation} onChange={e => setData({...data, clientLocation: e.target.value})} />
                    <input className="text-sm w-full bg-transparent outline-none placeholder-gray-400" placeholder="Teléfono / Contacto" value={data.clientContact} onChange={e => setData({...data, clientContact: e.target.value})} />
                </div>
            </div>

            <div className="w-[45%] text-right">
                <h2 className="text-[42px] leading-none text-[#303F1D] uppercase font-light m-0">Cotización</h2>
                <div className="mt-6">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#303F1D]">PROYECTO</span>
                    <input className="text-right font-bold text-lg w-full bg-transparent outline-none placeholder-gray-400" placeholder="NOMBRE DEL PROYECTO" value={data.projectTitle} onChange={e => setData({...data, projectTitle: e.target.value})} />
                </div>
                <div className="mt-2 flex justify-end items-center gap-2">
                     <span className="text-[#8e8b82] text-xs font-bold">FOLIO:</span>
                     <input className="w-32 text-right text-[#8e8b82] font-mono text-sm bg-transparent outline-none" placeholder="#001" value={data.projectFolio} onChange={e => setData({...data, projectFolio: e.target.value})} />
                </div>
            </div>
         </div>

         {/* TABLA VISUAL (INTERACTIVA) */}
         <div className="mt-4">
            <div className="flex border-b-[3px] border-[#303F1D] pb-2 mb-2 text-xs font-bold uppercase text-[#303F1D]">
                <div className="w-[8%]">No.</div>
                <div className="w-[52%]">Descripción</div>
                <div className="w-[15%] text-right">Precio</div>
                <div className="w-[10%] text-center">Cant.</div>
                <div className="w-[15%] text-right bg-[#303F1D] text-white px-2">Total</div>
            </div>
            
            {data.items.map((item, index) => (
                <div key={item.id} className="flex border-b border-[#dcd7d0] py-3 text-sm group relative">
                    <div className="w-[8%] font-bold text-gray-500 relative">
                        {isExporting ? null : (
                            <button onClick={() => removeItem(item.id)} className="absolute -left-5 text-red-400 hover:text-red-600 font-bold px-1 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        )}
                        {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="w-[52%] pr-2">
                        <textarea 
                            value={item.desc} 
                            onChange={(e) => updateItem(index, 'desc', e.target.value)}
                            className="w-full bg-transparent outline-none resize-none overflow-hidden placeholder-gray-300 text-gray-800"
                            placeholder="Descripción..."
                            rows={1}
                            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                        />
                    </div>
                    <div className="w-[15%] text-right">
                        <input type="number" className="w-full text-right bg-transparent outline-none placeholder-gray-300" placeholder="0.00" value={item.price || ''} onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="w-[10%] text-center">
                        <input type="number" className="w-full text-center bg-transparent outline-none placeholder-gray-300" placeholder="1" value={item.qty || ''} onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="w-[15%] text-right font-bold text-[#303F1D] bg-[#303F1D]/5 px-2">
                        {format(item.price * item.qty)}
                    </div>
                </div>
            ))}

            {!isExporting && (
                <button onClick={addItem} className="w-full py-2 mt-2 text-xs font-bold text-[#303F1D] border border-dashed border-[#303F1D]/40 rounded hover:bg-[#303F1D]/5 transition uppercase tracking-wider">
                    + Agregar Concepto
                </button>
            )}
         </div>

         <div className="flex justify-between mt-12 mb-8">
            <div className="w-[55%] pr-8">
                <div className="text-xs font-bold text-[#303F1D] uppercase tracking-wider mb-2 border-b border-[#303F1D] pb-1">Observaciones</div>
                <textarea 
                    className="w-full min-h-[100px] text-sm bg-[#fcfaf8] border border-[#e5e0d8] p-3 rounded outline-none resize-none placeholder-gray-400 text-gray-700 leading-relaxed"
                    value={data.notes}
                    onChange={e => setData({...data, notes: e.target.value})}
                    placeholder="Escriba aquí notas importantes..."
                />
            </div>

            <div className="w-[40%] flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-800">RD$ {format(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                        <input type="checkbox" checked={data.useItbis} onChange={(e) => setData({...data, useItbis: e.target.checked})} className="accent-[#303F1D] w-4 h-4" />
                        ITBIS (18%)
                    </label>
                    <span className="font-bold text-gray-800">RD$ {format(itbis)}</span>
                </div>
                <div className="flex justify-between items-center bg-[#303F1D] text-white p-4 rounded shadow-lg mt-2">
                    <span className="font-bold text-lg">TOTAL NETO</span>
                    <span className="font-bold text-2xl">RD$ {format(total)}</span>
                </div>
            </div>
         </div>

         {/* FOOTER INFO */}
         <div className="mt-auto pt-8">
            <div className="flex justify-between items-end gap-12">
                <div className="flex-1">
                    <div className="text-[10px] font-bold text-[#303F1D] uppercase tracking-wider mb-2 border-b border-gray-300 pb-1 w-max">Método de Pago</div>
                    <div className="text-xs text-gray-700 space-y-1">
                        <input className="font-bold w-full bg-transparent outline-none" value={data.bankOwner} onChange={e => setData({...data, bankOwner: e.target.value})} />
                        <input className="w-full bg-transparent outline-none" value={data.bankName} onChange={e => setData({...data, bankName: e.target.value})} />
                        <input className="font-mono w-full bg-transparent outline-none" value={data.bankAccount} onChange={e => setData({...data, bankAccount: e.target.value})} />
                    </div>
                </div>

                <div className="w-64 text-center">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-12">Autorizado Por</div>
                    <div className="border-b-2 border-[#303F1D] mb-2 w-full"></div>
                    <div className="font-bold text-[#303F1D] uppercase text-sm">{userData.displayName}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{userData.title}</div>
                </div>
            </div>
         </div>
      </div>

      <footer className="bg-[#303F1D] px-12 py-6 flex justify-between items-center text-white mt-auto relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
         <div className="flex items-center gap-4 relative z-10">
             <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/80">J</div>
             <div className="text-[10px] leading-tight opacity-90 font-light tracking-wide">
                 Santiago de los Caballeros, R.D.<br/>
                 <span className="font-bold text-white">jir3hrealtygroup@outlook.com</span>
             </div>
         </div>
         <div className="text-right leading-relaxed opacity-90 relative z-10">
             <div className="text-xs font-bold">849.435.2515</div>
             <div className="text-xs font-bold text-white/80">829.344.9793</div>
             <div className="text-xs font-bold text-white/80">US 954.319.4663</div>
         </div>
      </footer>
    </div>
  );
};

export default InvoicePaper;
