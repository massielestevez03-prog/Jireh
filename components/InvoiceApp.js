
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AdminPanel from './AdminPanel';
import Modal from './Modal';
import InvoicePaper from './InvoicePaper';

const InvoiceApp = ({ user, userData }) => {
  // --- ESTADO UNIFICADO ---
  const [data, setData] = useState({
    items: [{ id: 1, desc: '', price: 0, qty: 1 }],
    clientName: '', clientId: '', clientLocation: '', clientContact: '',
    projectTitle: '', projectFolio: '',
    bankOwner: 'JIREH REALTY GROUP', bankAccount: '000-000000-0 (Corriente)', bankName: 'Banco Popular Dominicano',
    notes: '', useItbis: true,
    fecha: new Date().toISOString().split('T')[0]
  });

  // UI States
  const [showAdmin, setShowAdmin] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', title: '' });
  const [inputValue, setInputValue] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // --- AUTO-GUARDADO ---
  useEffect(() => {
    const saved = localStorage.getItem('jireh_invoice_v3');
    if (saved) {
      try { setData({ ...data, ...JSON.parse(saved) }); } 
      catch(e) { console.error("Error cargando datos", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jireh_invoice_v3', JSON.stringify(data));
  }, [data]);

  // --- MODAL HANDLERS ---
  const openModal = (type, title, inputVal = '') => {
    setInputValue(inputVal);
    setModalConfig({ isOpen: true, type, title });
  };

  const handleModalConfirm = async () => {
    const { type } = modalConfig;
    if (type === 'clear') {
      setData({
        ...data,
        items: [{ id: Date.now(), desc: '', price: 0, qty: 1 }],
        clientName: '', clientId: '', clientLocation: '', clientContact: '',
        projectTitle: '', projectFolio: '', notes: ''
      });
      localStorage.removeItem('jireh_invoice_v3');
    } 
    else if (type === 'updateName' || type === 'updateTitle') {
      if(inputValue.trim()) {
        const field = type === 'updateName' ? 'displayName' : 'title';
        await updateDoc(doc(db, 'public_users', user.uid), { [field]: inputValue });
        window.location.reload(); 
      }
    }
    setModalConfig({ isOpen: false, type: '', title: '' });
  };

  // --- GENERACIÓN PDF NATIVA (DIBUJADO MANUAL) ---
  const generateNativePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Colores
    const COLOR_PRIMARY = "#303F1D";
    const COLOR_BG = "#f4eee8";
    const COLOR_TEXT = "#1a2310";
    const COLOR_GRAY = "#8e8b82";

    // --- FONDO ---
    doc.setFillColor(COLOR_BG);
    doc.rect(0, 0, 210, 297, "F");

    // --- HEADER ---
    doc.setFillColor(COLOR_PRIMARY);
    doc.rect(0, 0, 210, 35, "F");

    // Logo Simulado (JIREH) - Dibujado vectorial
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("JIREH", 20, 22);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SYSTEM", 20, 26);
    doc.setTextColor(200, 200, 200);
    doc.text("Inmobiliaria . Arquitectura . Construcción", 20, 31);

    // --- INFO CLIENTE (Izquierda) ---
    let y = 50;
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("FECHA DE EMISIÓN", 20, y);
    doc.setFontSize(12);
    doc.text(data.fecha || "---", 20, y + 6);

    y += 18;
    // Barra lateral decorativa
    doc.setDrawColor(COLOR_PRIMARY);
    doc.setLineWidth(1);
    doc.line(20, y, 20, y + 35);

    doc.setFontSize(9);
    doc.text("FACTURAR A:", 24, y + 3);
    
    doc.setFontSize(12);
    doc.text(data.clientName || "Cliente Mostrador", 24, y + 9);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT);
    doc.text(data.clientId || "", 24, y + 15);
    doc.text(data.clientLocation || "", 24, y + 20);
    doc.text(data.clientContact || "", 24, y + 25);

    // --- TITULO Y FOLIO (Derecha) ---
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFontSize(32);
    doc.setFont("helvetica", "normal");
    doc.text("COTIZACIÓN", 190, 60, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PROYECTO", 190, 75, { align: "right" });
    doc.setFontSize(12);
    doc.text(data.projectTitle || "---", 190, 81, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(COLOR_GRAY);
    doc.text(`FOLIO: ${data.projectFolio || "001"}`, 190, 88, { align: "right" });

    // --- TABLA DE ITEMS ---
    let startY = 105;
    
    // Encabezados
    doc.setFillColor(COLOR_PRIMARY);
    doc.rect(20, startY, 170, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("NO.", 23, startY + 5.5);
    doc.text("DESCRIPCIÓN", 40, startY + 5.5);
    doc.text("PRECIO", 145, startY + 5.5, { align: "right" });
    doc.text("CANT.", 160, startY + 5.5, { align: "center" });
    doc.text("TOTAL", 187, startY + 5.5, { align: "right" });

    // Filas
    let currentY = startY + 14;
    doc.setTextColor(COLOR_TEXT);
    doc.setFont("helvetica", "normal");
    
    data.items.forEach((item, index) => {
        const totalLine = (item.price * item.qty);
        
        // No.
        doc.setFontSize(9);
        doc.text((index + 1).toString().padStart(2,'0'), 23, currentY);
        
        // Descripción (con ajuste de línea automático)
        const descLines = doc.splitTextToSize(item.desc || "---", 95);
        doc.text(descLines, 40, currentY);
        
        // Precio
        doc.text(formatMoney(item.price), 145, currentY, { align: "right" });
        
        // Cant
        doc.text(item.qty.toString(), 160, currentY, { align: "center" });
        
        // Total
        doc.setFont("helvetica", "bold");
        doc.text(formatMoney(totalLine), 187, currentY, { align: "right" });
        
        doc.setFont("helvetica", "normal");
        
        // Línea divisoria
        const lineHeight = Math.max(descLines.length * 5, 8); // Altura dinámica
        doc.setDrawColor(220, 220, 220);
        doc.line(20, currentY + 3, 190, currentY + 3);
        
        currentY += lineHeight + 4; // Espacio para siguiente fila
    });

    // --- TOTALES ---
    // Asegurar espacio
    if (currentY > 220) { doc.addPage(); currentY = 40; doc.setFillColor(COLOR_BG); doc.rect(0,0,210,297,"F"); }
    
    const subtotal = data.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const itbis = data.useItbis ? subtotal * 0.18 : 0;
    const total = subtotal + itbis;

    const totalsX = 130;
    const totalsY = currentY + 10;

    doc.setTextColor(COLOR_TEXT);
    doc.setFontSize(10);
    
    // Subtotal
    doc.text("Subtotal:", totalsX, totalsY);
    doc.text(formatMoney(subtotal), 190, totalsY, { align: "right" });
    
    // ITBIS
    doc.text(data.useItbis ? "ITBIS (18%):" : "ITBIS (0%):", totalsX, totalsY + 6);
    doc.text(formatMoney(itbis), 190, totalsY + 6, { align: "right" });
    
    // Total Caja Verde
    doc.setFillColor(COLOR_PRIMARY);
    doc.rect(totalsX - 5, totalsY + 10, 70, 12, "F"); // Caja
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL NETO", totalsX, totalsY + 18);
    doc.text(formatMoney(total), 190, totalsY + 18, { align: "right" });

    // --- OBSERVACIONES ---
    const notesY = currentY + 10;
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFontSize(8);
    doc.text("OBSERVACIONES:", 20, notesY);
    doc.setTextColor(COLOR_TEXT);
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(data.notes || "Sin observaciones adicionales.", 90);
    doc.text(notesLines, 20, notesY + 5);

    // --- FOOTER INFO (Bancos y Firma) ---
    // Posicionar al final de la página
    const bottomY = 250;
    
    // Bancos
    doc.setFontSize(8);
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.text("MÉTODO DE PAGO", 20, bottomY);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, bottomY + 2, 80, bottomY + 2);
    
    doc.setTextColor(COLOR_TEXT);
    doc.setFont("helvetica", "normal");
    doc.text(data.bankOwner || "", 20, bottomY + 7);
    doc.text(data.bankName || "", 20, bottomY + 11);
    doc.setFont("courier", "normal");
    doc.text(data.bankAccount || "", 20, bottomY + 15);

    // Firma
    doc.setTextColor(COLOR_GRAY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("AUTORIZADO POR:", 150, bottomY, { align: "center" });
    
    doc.setDrawColor(COLOR_PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(120, bottomY + 15, 180, bottomY + 15); // Línea firma
    
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFontSize(10);
    doc.text(userData.displayName || "AGENTE", 150, bottomY + 20, { align: "center" });
    doc.setTextColor(COLOR_GRAY);
    doc.setFontSize(7);
    doc.text(userData.title || "", 150, bottomY + 24, { align: "center" });

    // --- FOOTER VERDE FINAL ---
    doc.setFillColor(COLOR_PRIMARY);
    doc.rect(0, 275, 210, 22, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Santiago de los Caballeros, R.D.", 30, 282);
    doc.setFont("helvetica", "bold");
    doc.text("jir3hrealtygroup@outlook.com", 30, 286);
    
    doc.setFont("helvetica", "normal");
    doc.text("849.435.2515", 190, 282, { align: "right" });
    doc.text("829.344.9793", 190, 286, { align: "right" });
    doc.text("US 954.319.4663", 190, 290, { align: "right" });

    return doc;
  };

  const formatMoney = (amount) => {
    return "RD$ " + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleExport = async (formatType) => {
    if (formatType === 'pdf') {
        const pdf = generateNativePDF();
        pdf.save(`Cotizacion-${data.projectTitle || 'Jireh'}.pdf`);
    } else {
        // Para JPG usamos una técnica simple de clonación directa
        // Aunque PDF es la prioridad, dejamos esto funcional
        setIsExporting(true);
        setTimeout(async () => {
            const element = document.getElementById('invoice-paper-interactive');
            if (element) {
                try {
                    const canvas = await html2canvas(element, { 
                        scale: 2, 
                        useCORS: true, 
                        backgroundColor: "#f4eee8" 
                    });
                    const link = document.createElement('a');
                    link.download = `Cotizacion.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                } catch(e) { console.error(e); }
                setIsExporting(false);
            }
        }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#222] pb-32">
      
      {/* NAVBAR */}
      <nav className="w-full bg-[#151c10] text-white p-4 sticky top-0 z-40 flex justify-between items-center shadow-lg border-b border-white/10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#303F1D] rounded flex items-center justify-center font-bold text-lg">J</div>
             <span className="font-bold tracking-wider hidden sm:block">JIREH SYSTEM</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal('updateName', 'Editar Nombre Firma', userData.displayName)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-xs sm:text-sm flex items-center gap-2 border border-gray-600 transition">
            <i className="fas fa-pen"></i> <span className="hidden sm:inline">Firma</span>
          </button>
          <button onClick={() => openModal('updateTitle', 'Editar Título/Cargo', userData.title)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-xs sm:text-sm flex items-center gap-2 border border-gray-600 transition">
            <i className="fas fa-briefcase"></i> <span className="hidden sm:inline">Cargo</span>
          </button>
          {userData.role === 'admin' && (
            <button onClick={() => setShowAdmin(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-xs sm:text-sm transition font-bold">
              ADMIN
            </button>
          )}
          <button onClick={() => signOut(auth)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs sm:text-sm transition ml-2">
            <i className="fas fa-power-off"></i>
          </button>
        </div>
      </nav>

      {/* ADMIN MODAL */}
      {showAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
             <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
                <AdminPanel onClose={() => setShowAdmin(false)} />
             </div>
        </div>
      )}

      {/* MODAL GENÉRICO */}
      <Modal 
        isOpen={modalConfig.isOpen} 
        title={modalConfig.title} 
        onClose={() => setModalConfig({...modalConfig, isOpen: false})}
        onConfirm={handleModalConfirm}
        confirmText={modalConfig.type === 'clear' ? 'Borrar Todo' : 'Guardar'}
        cancelText="Cancelar"
      >
        {modalConfig.type === 'clear' ? (
             <p>¿Estás seguro de que quieres borrar todos los datos del cliente? Esta acción no se puede deshacer.</p>
        ) : (
             <input 
                autoFocus
                className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#303F1D] outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
             />
        )}
      </Modal>

      {/* AREA DE TRABAJO */}
      <div className="mt-8 mb-8 w-full flex justify-center overflow-visible px-2">
        <div 
            className="origin-top transition-transform duration-200 shadow-2xl"
            style={{ 
                transform: 'scale(var(--scale-factor))',
                '--scale-factor': '0.45' 
            }}
        >
          <style jsx>{`
            @media (min-width: 450px) { div[style*="--scale-factor"] { --scale-factor: 0.55 !important; } }
            @media (min-width: 640px) { div[style*="--scale-factor"] { --scale-factor: 0.7 !important; } }
            @media (min-width: 1024px) { div[style*="--scale-factor"] { --scale-factor: 1 !important; } }
          `}</style>
          
          <div id="invoice-paper-interactive">
              <InvoicePaper 
                 data={data} 
                 setData={setData} 
                 userData={userData} 
                 isExporting={isExporting} 
              />
          </div>
        </div>
      </div>

      {/* TOOLBAR INFERIOR */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur border border-white/20 p-2 rounded-2xl shadow-2xl flex gap-2 z-50">
        <button onClick={() => openModal('clear', 'Limpiar Formulario')} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-500 transition group">
          <i className="fas fa-trash-alt text-lg mb-1 group-hover:scale-110 transition-transform"></i>
          <span className="text-[10px] font-bold">Limpiar</span>
        </button>
        
        <div className="w-px bg-gray-300 mx-1 my-2"></div>

        <button onClick={() => handleExport('jpg')} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl hover:bg-blue-50 text-blue-600 transition group">
          <i className="fas fa-image text-lg mb-1 group-hover:scale-110 transition-transform"></i>
          <span className="text-[10px] font-bold">Imagen</span>
        </button>

        <button onClick={() => handleExport('pdf')} className="flex flex-col items-center justify-center w-20 h-14 bg-[#303F1D] text-white rounded-xl shadow-lg hover:bg-[#232e15] transition group transform hover:-translate-y-1">
          <i className="fas fa-file-pdf text-xl mb-1 group-hover:scale-110 transition-transform"></i>
          <span className="text-[10px] font-bold">Descargar PDF</span>
        </button>
      </div>

    </div>
  );
};

export default InvoiceApp;
