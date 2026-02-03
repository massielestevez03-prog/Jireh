"use client";
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import AdminPanel from './AdminPanel';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf'; // Asegúrate de tener instalado jspdf: npm install jspdf

const InvoiceApp = ({ user, userData }) => {
  // --- ESTADOS DE DATOS ---
  const [items, setItems] = useState([{ id: 1, desc: '', price: 0, qty: 1 }]);
  
  // Datos del Cliente separados para mejor control
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientLocation, setClientLocation] = useState('');
  const [clientContact, setClientContact] = useState('');
  
  // Datos del Proyecto
  const [projectTitle, setProjectTitle] = useState('');
  const [projectFolio, setProjectFolio] = useState('#ARC-2026-001');
  
  // Método de Pago (Editable)
  const [bankOwner, setBankOwner] = useState('JIREH REALTY GROUP');
  const [bankAccount, setBankAccount] = useState('000-000000-0 (Corriente)');
  const [bankName, setBankName] = useState('Banco Popular Dominicano');

  const [notes, setNotes] = useState('');
  const [useItbis, setUseItbis] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // --- AUTO-GUARDADO (Local Storage) ---
  useEffect(() => {
    // 1. Cargar datos al iniciar
    const savedData = localStorage.getItem('jireh_invoice_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setItems(parsed.items || []);
      setClientName(parsed.clientName || '');
      setClientId(parsed.clientId || '');
      setClientLocation(parsed.clientLocation || '');
      setClientContact(parsed.clientContact || '');
      setProjectTitle(parsed.projectTitle || '');
      setProjectFolio(parsed.projectFolio || '');
      setBankOwner(parsed.bankOwner || 'JIREH REALTY GROUP');
      setBankAccount(parsed.bankAccount || '000-000000-0 (Corriente)');
      setBankName(parsed.bankName || 'Banco Popular Dominicano');
      setNotes(parsed.notes || '');
      setUseItbis(parsed.useItbis ?? true);
      setFecha(parsed.fecha || new Date().toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    // 2. Guardar datos cada vez que cambien
    const dataToSave = {
      items, clientName, clientId, clientLocation, clientContact,
      projectTitle, projectFolio, bankOwner, bankAccount, bankName,
      notes, useItbis, fecha
    };
    localStorage.setItem('jireh_invoice_data', JSON.stringify(dataToSave));
  }, [items, clientName, clientId, clientLocation, clientContact, projectTitle, projectFolio, bankOwner, bankAccount, bankName, notes, useItbis, fecha]);

  // --- CALCULOS ---
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const itbis = useItbis ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;
  const format = (v) => v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  // --- ACCIONES ---
  const handlePrint = () => {
    // La mejor forma de que la tabla se divida correctamente en varias páginas
    // y repita el encabezado es usando la impresión nativa del navegador.
    window.print();
  };

  const handleShare = async (formatType) => {
    const element = document.getElementById('invoice-paper');
    // Generamos imagen de alta calidad
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#f4eee8" });
    
    if (formatType === 'jpg') {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "cotizacion.jpg", { type: "image/jpeg" });
            shareFile(file, 'Cotización JIREH', 'Adjunto cotización en imagen.');
        }, 'image/jpeg', 0.9);
    } else if (formatType === 'pdf') {
        // Generar PDF para compartir
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'pt', 'letter');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], "cotizacion.pdf", { type: "application/pdf" });
        shareFile(file, 'Cotización JIREH', 'Adjunto cotización en PDF.');
    }
  };

  const shareFile = async (file, title, text) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, files: [file] });
      } catch (err) {
        console.log("Error al compartir:", err);
      }
    } else {
      // Fallback para PC: descargar
      const link = document.createElement('a');
      link.download = file.name;
      link.href = URL.createObjectURL(file);
      link.click();
      alert("Tu dispositivo no soporta compartir directo. El archivo se ha descargado.");
    }
  };

  const clearForm = () => {
    if(confirm("¿Estás seguro de borrar todos los datos?")) {
      setItems([{ id: Date.now(), desc: '', price: 0, qty: 1 }]);
      setClientName(''); setClientId(''); setClientLocation(''); setClientContact('');
      setProjectTitle(''); setNotes('');
      // No borramos la fecha ni los datos del agente, solo el contenido del cliente
      localStorage.removeItem('jireh_invoice_data'); 
    }
  };

  const updateProfile = async () => {
    const newName = prompt("Nombre para la firma:", userData.displayName);
    const newTitle = prompt("Título / Cargo:", userData.title);
    if(newName) {
      await updateDoc(doc(db, 'public_users', user.uid), { displayName: newName, title: newTitle });
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#333] pb-32">
      
      {/* ESTILOS DE IMPRESIÓN (PDF PERFECTO) */}
      <style jsx global>{`
        @media print {
          /* Ocultar interfaz */
          .no-print, nav, .toolbar-bottom, .admin-modal { display: none !important; }
          
          /* Configuración Papel */
          @page { margin: 0; size: letter; }
          body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          
          /* Layout Impresión */
          #app-root { width: 100%; }
          .invoice-paper {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 40px !important;
            margin: 0 !important;
            min-height: 100vh;
          }

          /* Tablas multipágina */
          table { page-break-inside: auto; width: 100%; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          
          /* Inputs limpios */
          input, textarea { border: none !important; background: transparent !important; resize: none; padding: 0 !important; }
          input::placeholder, textarea::placeholder { color: transparent; }
          
          /* Colores */
          .bg-primary { background-color: #303F1D !important; color: white !important; print-color-adjust: exact; }
          .bg-light { background-color: #e9e4dd !important; print-color-adjust: exact; }
        }

        /* Estilos Pantalla */
        .invoice-paper {
          width: 850px;
          min-height: 1100px;
          background-color: #f4eee8;
          color: #303F1D;
          font-family: 'Helvetica', Arial, sans-serif;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          display: flex; flex-direction: column;
        }
        
        .input-ghost {
          background: transparent; border: none; outline: none; width: 100%;
          font-family: inherit; color: inherit; padding: 2px 0;
        }
        .input-ghost::placeholder { color: #aaa; opacity: 0.6; font-style: italic; }
        .input-ghost:focus { background: rgba(255,255,255,0.5); border-radius: 4px; }
      `}</style>

      {/* NAVBAR */}
      <nav className="w-full bg-[#1a2310] text-white p-4 sticky top-0 z-40 flex justify-between items-center shadow-md no-print">
        <div className="font-bold tracking-wider">JIREH SYSTEM</div>
        <div className="flex gap-2">
          <button onClick={updateProfile} className="bg-[#303F1D] hover:bg-gray-700 px-3 py-1 rounded text-sm flex items-center gap-2 border border-gray-600">
            <i className="fas fa-pen"></i> Mi Firma
          </button>
          {userData.role === 'admin' && (
            <button onClick={() => setShowAdmin(true)} className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm">
              Admin
            </button>
          )}
          <button onClick={() => { localStorage.removeItem('jireh_invoice_data'); signOut(auth); }} className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm">
            Salir
          </button>
        </div>
      </nav>

      {showAdmin && <div className="admin-modal"><AdminPanel onClose={() => setShowAdmin(false)} /></div>}

      {/* ESCALADOR RESPONSIVE */}
      <div className="mt-8 mb-8 w-full flex justify-center overflow-hidden">
        <div className="origin-top scale-[0.42] xs:scale-[0.5] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 transition-transform duration-200">
          <div id="invoice-paper" className="invoice-paper">
              
              {/* ENCABEZADO */}
              <div className="w-full">
                <svg viewBox="0 0 612 95.04" className="w-full block">
                    <rect fill="#303F1D" width="612" height="95.04"/>
                    <g fill="#FFFFFF">
                        <path d="M519.75,75.5h30.88V35.35c0.78,0.36,1.45,0.57,1.99,0.97c0.27,0.21,0.36,0.75,0.36,1.15c0,5.16,0,10.29,0,15.45v24.87H511.9c0-0.36-0.06-0.72-0.06-1.06c0-8.3,0-16.6,0-24.9c0-0.88,0.27-1.24,1.09-1.45c2.23-0.63,4.47-1.36,6.85-2.08v27.23L519.75,75.5z"/>
                        <text transform="matrix(1 0 0 1 82.1889 80.8513)" fill="#8E8B82" fontFamily="Helvetica, Arial, sans-serif" fontSize="11">Inmobiliaria . Arquitectura . Construcción</text>
                        {/* Logo Path Simplificado */}
                        <path d="M73.5,20.66v13.36c0,4.07-2.14,7.05-7.57,7.05h-6.92V37.5h6.71c3.21,0,4.18-1.54,4.18-3.5V20.66H73.5z"/>
                        <rect x="81.28" y="20.66" width="3.58" height="20.41"/>
                        <path d="M103.81,20.66c4.59,0,6.55,2.85,6.55,6.11c0,3.26-1.2,5.27-4.33,6.13l4.75,8.17h-3.97l-4.65-7.88h-5.32c-0.34,0-0.52,0.16-0.52,0.52v7.39h-3.58v-8.07c0-2.3,0.97-3.24,3.21-3.24h7.96c2.04,0,2.84-1.38,2.84-2.84c0-1.46-0.89-2.69-2.84-2.69h-11.2v-3.6h11.07H103.81z"/>
                        <path d="M126.93,20.66c4.8,0,6.84,2.32,6.84,5.48c0,3.16-1.02,3.89-2.9,4.7c1.93,0.81,2.98,2.32,2.98,4.78c0,2.45-2.01,5.48-6.81,5.48h-10.31v-3.58h10.31c2.09,0,3.08-0.97,3.08-2.61c0-1.64-1.07-2.45-3.11-2.45h-6.29v-3.24h6.21c2.09,0,3.11-0.76,3.11-2.45c0-1.7-0.94-2.53-3.08-2.53h-10.18v-3.58h10.18H126.93z"/>
                    </g>
                </svg>
              </div>

              <div className="p-12 flex-1 flex flex-col">
                {/* INFO SUPERIOR */}
                <div className="flex justify-between gap-8 mb-8">
                  <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <span className="text-sm font-bold block mb-1">FECHA:</span>
                      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-ghost text-[#303F1D] w-auto font-bold" />
                    </div>
                    
                    <div className="border-l-[3px] border-[#303F1D] pl-4 text-sm flex flex-col gap-1">
                      <div className="font-bold mb-1 text-base">DATOS DEL CLIENTE</div>
                      <input className="input-ghost font-bold text-base" placeholder="Nombre del Cliente / Empresa" value={clientName} onChange={e => setClientName(e.target.value)} />
                      <input className="input-ghost" placeholder="ID / RNC: 000-00000-0" value={clientId} onChange={e => setClientId(e.target.value)} />
                      <input className="input-ghost" placeholder="Ubicación del Proyecto" value={clientLocation} onChange={e => setClientLocation(e.target.value)} />
                      <input className="input-ghost" placeholder="Tel: (809) 000-0000" value={clientContact} onChange={e => setClientContact(e.target.value)} />
                    </div>
                  </div>

                  <div className="text-right flex-1">
                    <h2 className="text-4xl text-[#303F1D] uppercase tracking-widest font-normal m-0">Cotización</h2>
                    <div className="mt-4 flex flex-col items-end">
                      <span className="font-bold text-sm">PROYECTO:</span>
                      <input className="input-ghost text-right font-normal text-lg" placeholder="NOMBRE DEL PROYECTO" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} />
                    </div>
                    <div className="text-[#8e8b82] text-xs mt-1 flex justify-end items-center gap-1">
                      FOLIO: <input className="input-ghost w-24 text-right text-[#8e8b82]" value={projectFolio} onChange={e => setProjectFolio(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* TABLA PRINCIPAL */}
                <table className="w-full border-collapse mt-6 text-black">
                  <thead>
                    <tr className="border-b-2 border-[#303F1D]">
                      <th className="text-left py-2 text-xs uppercase w-10">No.</th>
                      <th className="text-left py-2 text-xs uppercase">Descripción del Servicio</th>
                      <th className="text-left py-2 text-xs uppercase w-24">Precio</th>
                      <th className="text-left py-2 text-xs uppercase w-16">Cant.</th>
                      <th className="text-right py-2 text-xs uppercase w-28 bg-primary px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b border-[#dcd7d0] group">
                        <td className="py-3 text-sm relative align-top">
                          <button onClick={() => items.length>1 && setItems(items.filter(i=>i.id!==item.id))} className="no-print absolute left-[-25px] text-red-500 opacity-0 group-hover:opacity-100 font-bold text-lg">×</button>
                          {index + 1}
                        </td>
                        <td className="py-3 text-sm align-top">
                          <textarea 
                            value={item.desc} 
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].desc = e.target.value;
                              setItems(newItems);
                            }}
                            className="input-ghost w-full overflow-hidden resize-none" 
                            placeholder="Descripción del concepto..."
                            rows={1}
                            style={{minHeight: '20px'}}
                            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                          />
                        </td>
                        <td className="py-3 text-sm align-top">
                          <input type="number" value={item.price || ''} onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].price = parseFloat(e.target.value) || 0;
                              setItems(newItems);
                            }} className="input-ghost" placeholder="0.00" />
                        </td>
                        <td className="py-3 text-sm align-top">
                          <input type="number" value={item.qty || ''} onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].qty = parseFloat(e.target.value) || 0;
                              setItems(newItems);
                            }} className="input-ghost" placeholder="1" />
                        </td>
                        <td className="py-3 text-sm text-right bg-primary text-white font-bold px-2 align-top">
                          RD${format(item.price * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button onClick={() => setItems([...items, { id: Date.now(), desc: '', price: 0, qty: 1 }])} className="no-print w-full border border-dashed border-[#303F1D] text-[#303F1D] font-bold py-2 mt-4 rounded hover:bg-white/50 transition opacity-60 hover:opacity-100">
                  + Añadir Concepto
                </button>

                {/* TOTALES */}
                <div className="flex justify-between items-end mt-10 text-black">
                  <div>
                    <div className="font-bold text-sm text-[#8e8b82]">MONTO TOTAL:</div>
                    <h3 className="text-2xl font-bold mt-1">RD${format(total)}</h3>
                  </div>
                  <div className="w-72 text-sm">
                    <div className="flex justify-between mb-2"><span>SUBTOTAL</span><span>RD${format(subtotal)}</span></div>
                    <div className="flex justify-between mb-2 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useItbis} onChange={(e) => setUseItbis(e.target.checked)} className="no-print" />
                        ITBIS (18%)
                      </label>
                      <span>RD${format(itbis)}</span>
                    </div>
                    <div className="flex justify-between bg-primary p-3 font-bold rounded text-white"><span>TOTAL NETO</span><span>RD${format(total)}</span></div>
                  </div>
                </div>

                {/* PIE DE PÁGINA DATOS */}
                <div className="mt-auto pt-8 text-black avoid-break">
                  <div className="font-bold text-sm mb-2">Observaciones:</div>
                  <textarea 
                    className="bg-light w-full min-h-[80px] rounded-lg p-4 border border-[#dcd7d0] text-sm input-ghost"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Escriba notas adicionales aquí..."
                  />

                  <div className="flex justify-between items-start mt-8 gap-8">
                    <div className="flex-1 text-xs leading-relaxed">
                      <strong className="text-sm block mb-1">Método de Pago:</strong>
                      <input className="input-ghost block w-full font-bold" value={bankOwner} onChange={e => setBankOwner(e.target.value)} placeholder="Propietario" />
                      <input className="input-ghost block w-full" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="Cuenta" />
                      <input className="input-ghost block w-full" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Banco" />
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

              {/* FOOTER VERDE */}
              <footer className="bg-primary p-8 flex justify-between items-center mt-auto text-white">
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
      </div>

      {/* BARRA INFERIOR FIJA */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 flex justify-around sm:justify-center sm:gap-6 shadow-2xl toolbar-bottom z-50">
        <button onClick={clearForm} className="flex flex-col sm:flex-row items-center gap-1 text-gray-500 hover:text-red-500 text-xs sm:text-sm font-bold p-2 transition">
          <i className="fas fa-trash text-lg"></i>
          <span>Limpiar</span>
        </button>
        
        <button onClick={() => handleShare('jpg')} className="flex flex-col sm:flex-row items-center gap-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-bold p-2 transition">
          <i className="fas fa-image text-lg"></i>
          <span>Compartir JPG</span>
        </button>

        <button onClick={() => handleShare('pdf')} className="flex flex-col sm:flex-row items-center gap-1 text-green-600 hover:text-green-800 text-xs sm:text-sm font-bold p-2 transition">
          <i className="fas fa-share-alt text-lg"></i>
          <span>Compartir PDF</span>
        </button>
        
        <button onClick={handlePrint} className="flex flex-col sm:flex-row items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-xs sm:text-sm font-bold transition shadow-md">
          <i className="fas fa-file-pdf text-lg"></i>
          <span>Guardar PDF</span>
        </button>
      </div>

    </div>
  );
};

export default InvoiceApp;
