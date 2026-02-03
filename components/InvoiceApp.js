"use client";
import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import AdminPanel from './AdminPanel';
import html2canvas from 'html2canvas';

// Estilos específicos para impresión
const printStyles = `
  @media print {
    .no-print { display: none !important; }
    body { background: white; -webkit-print-color-adjust: exact; }
    #invoice-container { box-shadow: none; margin: 0; width: 100%; transform: none !important; }
  }
  .invoice-paper {
    width: 850px;
    min-height: 1100px;
    background-color: #f4eee8;
    color: #303F1D;
    font-family: 'Helvetica', Arial, sans-serif;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
`;

const InvoiceApp = ({ user, userData }) => {
  const [items, setItems] = useState([{ id: 1, desc: 'Descripción del servicio...', price: 0, qty: 1 }]);
  const [clientData, setClientData] = useState({
    name: 'Nombre del Cliente / Empresa',
    id: 'ID / RNC: 000-00000-0',
    location: 'Ubicación del Proyecto',
    contact: 'Contacto Directo: (809) 000-0000'
  });
  const [projectData, setProjectData] = useState({ title: 'Nombre del Proyecto', folio: '#ARC-2026-001' });
  const [notes, setNotes] = useState('Escriba notas adicionales aquí...');
  const [useItbis, setUseItbis] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [scale, setScale] = useState(1);
  const sheetRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if(w < 890) setScale((w - 20) / 850);
      else setScale(1);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const itbis = useItbis ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;

  const addItem = () => setItems([...items, { id: Date.now(), desc: 'Nuevo concepto...', price: 0, qty: 1 }]);
  const removeItem = (id) => items.length > 1 && setItems(items.filter(i => i.id !== id));
  const updateItem = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  const downloadPDF = () => {
    const element = sheetRef.current;
    const opt = {
      margin: 0,
      filename: `Cotizacion_JIREH_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#f4eee8" },
      jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' }
    };
    if(window.html2pdf) window.html2pdf().set(opt).from(element).save();
    else alert("Error: Librería PDF no cargada.");
  };

  const updateProfile = async () => {
    const newName = prompt("Nombre para la firma:", userData.displayName);
    const newTitle = prompt("Título / Cargo:", userData.title);
    if(newName) {
      const userRef = doc(db, 'public_users', user.uid);
      await updateDoc(userRef, { displayName: newName, title: newTitle });
      window.location.reload();
    }
  };

  const formatCurrency = (val) => val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  return (
    <div className="flex flex-col items-center min-h-screen pb-20 bg-[#333]">
      <style>{printStyles}</style>

      {/* NAVBAR */}
      <nav className="w-full bg-[#1a2310] text-white p-4 sticky top-0 z-40 flex justify-between items-center shadow-md no-print">
        <div className="font-bold tracking-wider">JIREH SYSTEM <span className="text-xs font-normal opacity-70">v2.0</span></div>
        <div className="flex gap-2">
          <button onClick={updateProfile} className="bg-[#303F1D] hover:bg-gray-700 px-3 py-1 rounded text-sm flex items-center gap-2">
            <i className="fas fa-pen"></i> Mi Firma
          </button>
          {userData.role === 'admin' && (
            <button onClick={() => setShowAdmin(true)} className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm">
              Admin
            </button>
          )}
          <button onClick={() => signOut(auth)} className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm">
            Salir
          </button>
        </div>
      </nav>

      {/* TOOLBAR */}
      <div className="w-full bg-[#222] p-3 flex justify-center gap-3 no-print mb-8">
         <button onClick={() => setItems([{ id: Date.now(), desc: '', price: 0, qty: 1 }])} className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold">Limpiar</button>
         <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Imprimir / PDF</button>
         <button onClick={downloadPDF} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold">Descargar PDF</button>
      </div>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', height: (1100 * scale) + 'px' }}>
        <div id="invoice-container" ref={sheetRef} className="invoice-paper flex flex-col">
            
            {/* HEADER SVG */}
            <div className="w-full">
              <svg viewBox="0 0 612 95.04" className="w-full block">
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

            <div className="p-12 flex-1">
              {/* CONTENT */}
              <div className="flex justify-between gap-8 mb-8">
                <div className="flex-1 flex flex-col gap-6">
                  <div>
                    <span className="text-sm font-bold block mb-1">FECHA:</span>
                    <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-transparent border-none outline-none font-inherit text-[#303F1D]" />
                  </div>
                  <div className="border-l-[3px] border-[#303F1D] pl-4 text-sm">
                    <div className="font-bold mb-2 text-base">DATOS DEL CLIENTE</div>
                    <div 
                      contentEditable 
                      className="outline-none leading-relaxed whitespace-pre-wrap text-black"
                      onBlur={(e) => setClientData({...clientData, text: e.target.innerText})}
                      dangerouslySetInnerHTML={{__html: `${clientData.name}<br/>${clientData.id}<br/>${clientData.location}<br/>${clientData.contact}`}}
                    ></div>
                  </div>
                </div>

                <div className="text-right flex-1">
                  <h2 className="text-4xl text-[#303F1D] uppercase tracking-widest font-normal m-0" contentEditable>Cotización</h2>
                  <div className="font-bold mt-4">PROYECTO: <span className="font-normal outline-none text-black" contentEditable>{projectData.title}</span></div>
                  <div className="text-[#8e8b82] text-xs mt-1">FOLIO: <span className="outline-none" contentEditable>{projectData.folio}</span></div>
                </div>
              </div>

              {/* TABLE */}
              <table className="w-full border-collapse mt-6 text-black">
                <thead>
                  <tr className="border-b-2 border-[#303F1D]">
                    <th className="text-left py-2 text-xs uppercase w-12">No.</th>
                    <th className="text-left py-2 text-xs uppercase">Descripción del Servicio</th>
                    <th className="text-left py-2 text-xs uppercase w-28">Precio Unit.</th>
                    <th className="text-left py-2 text-xs uppercase w-16">Cant.</th>
                    <th className="text-right py-2 text-xs uppercase w-32 bg-[#303F1D] text-white">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-[#dcd7d0] relative group">
                      <td className="py-3 text-sm relative">
                        <button onClick={() => removeItem(item.id)} className="no-print absolute left-[-25px] text-red-500 font-bold opacity-0 group-hover:opacity-100 transition">×</button>
                        {index + 1}
                      </td>
                      <td className="py-3 text-sm">
                        <input 
                          value={item.desc} onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                          className="w-full bg-transparent outline-none placeholder-gray-400" placeholder="Descripción..."
                        />
                      </td>
                      <td className="py-3 text-sm">
                        <input 
                          type="number" value={item.price} onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="py-3 text-sm">
                        <input 
                          type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value))}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="py-3 text-sm text-right bg-[#303F1D] text-white font-bold">
                        RD${formatCurrency(item.price * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={addItem} className="no-print w-full border border-dashed border-[#303F1D] text-[#303F1D] font-bold py-2 mt-4 rounded hover:bg-white/50 transition">
                + Añadir Concepto
              </button>

              {/* SUMMARY */}
              <div className="flex justify-between items-end mt-10 text-black">
                <div>
                  <div className="font-bold text-sm text-[#8e8b82]">MONTO TOTAL A PAGAR:</div>
                  <h3 className="text-2xl font-bold mt-1">RD${formatCurrency(total)}</h3>
                </div>
                <div className="w-72 text-sm">
                  <div className="flex justify-between mb-2"><span>SUBTOTAL</span><span>RD${formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between mb-2 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={useItbis} onChange={(e) => setUseItbis(e.target.checked)} className="no-print" />
                      ITBIS (18%)
                    </label>
                    <span>RD${formatCurrency(itbis)}</span>
                  </div>
                  <div className="flex justify-between bg-[#303F1D] text-white p-3 font-bold rounded">
                    <span>TOTAL NETO</span><span>RD${formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER AREA */}
              <div className="mt-8 text-black">
                <div className="font-bold text-sm mb-2">Observaciones:</div>
                <div 
                  className="bg-[#e9e4dd] min-h-[80px] rounded-lg p-4 border border-[#dcd7d0] text-sm whitespace-pre-wrap outline-none"
                  contentEditable
                >
                  {notes}
                </div>

                <div className="flex justify-between items-start mt-8 gap-8">
                  <div className="flex-1 text-xs leading-relaxed">
                    <strong className="text-sm block mb-1">Método de Pago:</strong>
                    <div contentEditable className="outline-none">
                      Propietario: JIREH REALTY GROUP<br/>
                      Cuenta: 000-000000-0 (Corriente)<br/>
                      Banco: Banco Popular Dominicano
                    </div>
                  </div>

                  <div className="w-60 text-center text-[#303F1D]">
                    <div className="font-bold text-xs tracking-widest mb-10">AUTORIZADO POR:</div>
                    <div className="border-b-2 border-[#303F1D] mb-2 w-full"></div>
                    <div className="font-bold text-sm uppercase">{userData.displayName}</div>
                    <div className="text-xs">{userData.title}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER COLOR */}
            <footer className="bg-[#303F1D] text-white p-8 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-4">
                <i className="fas fa-map-marker-alt text-xl"></i>
                <div className="text-xs leading-tight">
                  C/Prolongación A, Edf. 1, Local 1A, Santiago<br/>
                  <u className="cursor-pointer">jir3hrealtygroup@outlook.com</u>
                </div>
              </div>
              <div className="text-right leading-relaxed">
                <div className="text-sm font-bold flex items-center justify-end gap-2"><i className="fab fa-whatsapp"></i> 849.435.2515</div>
                <div className="text-sm font-bold">829.344.9793</div>
                <div className="text-sm font-bold"><span className="border border-white px-1 text-[10px] rounded mr-1">US</span> 954.319.4663</div>
              </div>
            </footer>
        </div>
      </div>
      <a href="https://wa.me/18494352515" target="_blank" className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition z-50 no-print flex items-center justify-center text-2xl">
        <i className="fab fa-whatsapp"></i>
      </a>
    </div>
  );
};

export default InvoiceApp;
