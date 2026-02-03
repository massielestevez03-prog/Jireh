import React from 'react';

// Dimensiones fijas para A4 a 96 DPI (aprox 794px ancho)
// Mantenemos clases de Tailwind pero forzamos estilos en línea para impresión crítica
const InvoicePaper = ({ id, data, setData, userData, isExporting = false }) => {
  
  // Helpers para manejo de datos
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

  // Cálculos
  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const itbis = data.useItbis ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;
  const format = (v) => v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  return (
    <div 
      id={id} 
      className="invoice-paper bg-white text-[#303F1D] font-sans relative flex flex-col shadow-2xl"
      style={{
        width: '794px', // Ancho exacto A4
        minHeight: '1123px', // Alto mínimo A4
        padding: '0',
        margin: '0 auto',
        backgroundColor: '#f4eee8', // Color de fondo crema suave
        color: '#303F1D'
      }}
    >
      {/* HEADER SVG */}
      <div className="w-full">
        <svg viewBox="0 0 612 95.04" className="w-full block" style={{ shapeRendering: 'geometricPrecision' }}>
            <rect fill="#303F1D" width="612" height="95.04"/>
            <g fill="#FFFFFF">
                <path d="M519.75,75.5h30.88V35.35c0.78,0.36,1.45,0.57,1.99,0.97c0.27,0.21,0.36,0.75,0.36,1.15c0,5.16,0,10.29,0,15.45v24.87H511.9c0-0.36-0.06-0.72-0.06-1.06c0-8.3,0-16.6,0-24.9c0-0.88,0.27-1.24,1.09-1.45c2.23-0.63,4.47-1.36,6.85-2.08v27.23L519.75,75.5z"/>
                <text transform="matrix(1 0 0 1 82.1889 80.8513)" fill="#8E8B82" fontFamily="Helvetica, Arial, sans-serif" fontSize="11">Inmobiliaria . Arquitectura . Construcción</text>
                <path d="M73.5,20.66v13.36c0,4.07-2.14,7.05-7.57,7.05h-6.92V37.5h6.71c3.21,0,4.18-1.54,4.18-3.5V20.66H73.5z"/>
                <rect x="81.28" y="20.66" width="3.58" height="20.41"/>
                <path d="M103.81,20.66c4.59,0,6.55,2.85,6.55,6.11c0,3.26-1.2,5.27-4.33,6.13l4.75,8.17h-3.97l-4.65-7.88h-5.32c-0.34,0-0.52,0.16-0.52,0.52v7.39h-3.58v-8.07c0-2.3,0.97-3.24,3.21-3.24h7.96c2.04,0,2.84-1.38,2.84-2.84c0-1.46-0.89-2.69-2.84-2.69h-11.2v-3.6h11.07H103.81z"/>
                <path d="M126.93,20.66c4.8,0,6.84,2.32,6.84,5.48c0,3.16-1.02,3.89-2.9,4.7c1.93,0.81,2.98,2.32,2.98,4.78c0,2.45-2.01,5.48-6.81,5.48h-10.31v-3.58h10.31c2.09,0,3.08-0.97,3.08-2.61c0-1.64-1.07-2.45-3.11-2.45h-6.29v-3.24h6.21c2.09,0,3.11-0.76,3.11-2.45c0-1.7-0.94-2.53-3.08-2.53h-10.18v-3.58h10.18H126.93z"/>
            </g>
        </svg>
      </div>

      <div className="flex-1 flex flex-col p-12">
         {/* INFO SECTION */}
         <div className="flex justify-between gap-8 mb-8">
            <div className="flex-1 flex flex-col gap-4">
                <div>
                    <span className="text-sm font-bold block mb-1">FECHA:</span>
                    <input type="date" value={data.fecha} onChange={(e) => setData({...data, fecha: e.target.value})} className="input-ghost text-[#303F1D] w-auto font-bold bg-transparent border-none outline-none" />
                </div>
                
                <div className="border-l-[3px] border-[#303F1D] pl-4 text-sm flex flex-col gap-1">
                    <div className="font-bold mb-1 text-base">DATOS DEL CLIENTE</div>
                    <input className="input-ghost font-bold text-lg bg-transparent border-none outline-none w-full placeholder-gray-400" placeholder="Nombre del Cliente / Empresa..." value={data.clientName} onChange={e => setData({...data, clientName: e.target.value})} />
                    <input className="input-ghost bg-transparent border-none outline-none w-full placeholder-gray-400" placeholder="ID / RNC: 000-00000-0" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})} />
                    <input className="input-ghost bg-transparent border-none outline-none w-full placeholder-gray-400" placeholder="Ubicación del Proyecto..." value={data.clientLocation} onChange={e => setData({...data, clientLocation: e.target.value})} />
                    <input className="input-ghost bg-transparent border-none outline-none w-full placeholder-gray-400" placeholder="Teléfono / Contacto..." value={data.clientContact} onChange={e => setData({...data, clientContact: e.target.value})} />
                </div>
            </div>

            <div className="text-right flex-1">
                <h2 className="text-4xl text-[#303F1D] uppercase tracking-widest font-normal m-0">Cotización</h2>
                <div className="mt-4 flex flex-col items-end">
                    <span className="font-bold text-sm">PROYECTO:</span>
                    <input className="input-ghost text-right font-normal text-xl bg-transparent border-none outline-none w-full placeholder-gray-400" placeholder="NOMBRE DEL PROYECTO" value={data.projectTitle} onChange={e => setData({...data, projectTitle: e.target.value})} />
                </div>
                <div className="text-[#8e8b82] text-xs mt-1 flex justify-end items-center gap-1">
                    FOLIO: <input className="input-ghost w-32 text-right text-[#8e8b82] bg-transparent border-none outline-none placeholder-gray-300" placeholder="#ARC-2026-001" value={data.projectFolio} onChange={e => setData({...data, projectFolio: e.target.value})} />
                </div>
            </div>
         </div>

         {/* TABLE */}
         <table className="w-full border-collapse mt-6 text-black table-fixed">
            <thead>
                <tr className="border-b-2 border-[#303F1D]">
                    <th className="text-left py-2 text-xs uppercase w-[5%]">No.</th>
                    <th className="text-left py-2 text-xs uppercase w-[50%]">Descripción del Servicio</th>
                    <th className="text-left py-2 text-xs uppercase w-[15%]">Precio</th>
                    <th className="text-left py-2 text-xs uppercase w-[10%]">Cant.</th>
                    <th className="text-right py-2 text-xs uppercase w-[20%] bg-[#303F1D] text-white px-2">Total</th>
                </tr>
            </thead>
            <tbody>
                {data.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-[#dcd7d0] group">
                        <td className="py-3 text-sm relative align-top font-bold text-gray-500">
                           {/* Botón borrar solo visible si no se exporta */}
                           {!isExporting && (
                               <button onClick={() => removeItem(item.id)} className="absolute left-[-20px] top-3 text-red-400 hover:text-red-600 font-bold px-1 transition-opacity opacity-0 group-hover:opacity-100">
                                   &times;
                               </button>
                           )}
                           {index + 1}
                        </td>
                        <td className="py-3 text-sm align-top">
                            <textarea 
                                value={item.desc} 
                                onChange={(e) => updateItem(index, 'desc', e.target.value)}
                                className="input-ghost w-full bg-transparent border-none outline-none resize-none overflow-hidden placeholder-gray-300"
                                placeholder="Descripción del concepto..."
                                rows={1}
                                style={{ minHeight: '1.5em' }}
                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                            />
                        </td>
                        <td className="py-3 text-sm align-top">
                            <input type="number" className="input-ghost w-full bg-transparent border-none outline-none placeholder-gray-300" placeholder="0.00"
                                value={item.price || ''} onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="py-3 text-sm align-top">
                            <input type="number" className="input-ghost w-full bg-transparent border-none outline-none placeholder-gray-300" placeholder="1"
                                value={item.qty || ''} onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="py-3 text-sm text-right bg-[#303F1D] text-white font-bold px-2 align-top rounded-sm">
                            RD${format(item.price * item.qty)}
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>

         {!isExporting && (
             <button onClick={addItem} className="w-full border-2 border-dashed border-[#303F1D]/30 text-[#303F1D] font-bold py-2 mt-4 rounded-lg hover:bg-[#303F1D]/5 transition text-sm uppercase tracking-wide opacity-70 hover:opacity-100">
                 + Agregar Fila
             </button>
         )}

         {/* TOTALS */}
         <div className="flex justify-between items-end mt-10 text-black break-inside-avoid">
            <div>
                <div className="font-bold text-sm text-[#8e8b82]">MONTO TOTAL:</div>
                <h3 className="text-3xl font-bold mt-1 text-[#303F1D]">RD${format(total)}</h3>
            </div>
            <div className="w-72 text-sm">
                <div className="flex justify-between mb-2 border-b border-gray-200 pb-1">
                    <span className="text-gray-600">SUBTOTAL</span>
                    <span className="font-bold">RD${format(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2 items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        {!isExporting ? (
                            <input type="checkbox" checked={data.useItbis} onChange={(e) => setData({...data, useItbis: e.target.checked})} className="accent-[#303F1D] w-4 h-4" />
                        ) : (data.useItbis && <span className="text-xs font-bold">✓</span>)}
                        <span className="text-gray-600">ITBIS (18%)</span>
                    </label>
                    <span className="font-bold">RD${format(itbis)}</span>
                </div>
                <div className="flex justify-between bg-[#303F1D] p-3 font-bold rounded text-white shadow-md">
                    <span>TOTAL NETO</span>
                    <span>RD${format(total)}</span>
                </div>
            </div>
         </div>

         {/* FOOTER DATA */}
         <div className="mt-auto pt-12 text-black break-inside-avoid">
            <div className="font-bold text-sm mb-2 text-[#303F1D]">Observaciones y Notas:</div>
            <textarea 
                className="w-full min-h-[80px] rounded-lg p-3 text-sm bg-white/50 border border-[#dcd7d0] outline-none resize-none focus:bg-white transition-colors placeholder-gray-400"
                value={data.notes}
                onChange={e => setData({...data, notes: e.target.value})}
                placeholder="Escriba condiciones, tiempos de entrega o notas adicionales aquí..."
            />

            <div className="flex justify-between items-end mt-8 gap-8">
                <div className="flex-1 text-xs leading-relaxed text-gray-600">
                    <strong className="text-sm block mb-1 text-[#303F1D]">Método de Pago:</strong>
                    <input className="input-ghost block w-full font-bold bg-transparent border-none outline-none mb-1" value={data.bankOwner} onChange={e => setData({...data, bankOwner: e.target.value})} />
                    <input className="input-ghost block w-full bg-transparent border-none outline-none mb-1" value={data.bankAccount} onChange={e => setData({...data, bankAccount: e.target.value})} />
                    <input className="input-ghost block w-full bg-transparent border-none outline-none" value={data.bankName} onChange={e => setData({...data, bankName: e.target.value})} />
                </div>

                <div className="w-64 text-center text-[#303F1D]">
                    <div className="font-bold text-[10px] tracking-[0.2em] mb-12 uppercase text-gray-400">AUTORIZADO POR:</div>
                    <div className="border-b-2 border-[#303F1D] mb-2 w-full"></div>
                    <div className="font-bold text-sm uppercase tracking-wide">{userData.displayName}</div>
                    <div className="text-xs opacity-80">{userData.title}</div>
                </div>
            </div>
         </div>
      </div>

      {/* FOOTER BAR */}
      <footer className="bg-[#303F1D] p-8 flex justify-between items-center text-white mt-auto">
         <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                 <i className="fas fa-map-marker-alt text-sm"></i>
             </div>
             <div className="text-[10px] leading-tight opacity-90">
                 C/Prolongación A, Edf. 1, Local 1A, Santiago, R.D.<br/>
                 <span className="font-bold text-white">jir3hrealtygroup@outlook.com</span>
             </div>
         </div>
         <div className="text-right leading-relaxed opacity-90">
             <div className="text-xs font-bold flex items-center justify-end gap-2">
                 <i className="fab fa-whatsapp"></i> 849.435.2515
             </div>
             <div className="text-xs font-bold">829.344.9793</div>
             <div className="text-xs font-bold flex items-center justify-end gap-1">
                 <span className="bg-white/20 px-1 rounded text-[9px]">US</span> 954.319.4663
             </div>
         </div>
      </footer>
    </div>
  );
};

export default InvoicePaper;
