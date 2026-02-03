"use client";
import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
// CORRECCIÓN: Usar ruta relativa para garantizar que funcione sin alias '@'
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
  const [inputValue, setInputValue] = useState(''); // Para inputs en modales
  const [isExporting, setIsExporting] = useState(false); // Estado para limpiar la UI antes de exportar
  
  const invoiceRef = useRef(null); // Referencia al wrapper de la hoja

  // --- AUTO-GUARDADO ---
  useEffect(() => {
    const saved = localStorage.getItem('jireh_invoice_v2');
    if (saved) {
      try { setData({ ...data, ...JSON.parse(saved) }); } 
      catch(e) { console.error("Error parsing saved data", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jireh_invoice_v2', JSON.stringify(data));
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
      localStorage.removeItem('jireh_invoice_v2');
    } 
    else if (type === 'updateName' || type === 'updateTitle') {
      if(inputValue.trim()) {
        const field = type === 'updateName' ? 'displayName' : 'title';
        await updateDoc(doc(db, 'public_users', user.uid), { [field]: inputValue });
        window.location.reload(); // Recarga simple para reflejar cambios
      }
    }
    
    setModalConfig({ isOpen: false, type: '', title: '' });
  };

  // --- EXPORTACIÓN PDF "PERFECTA" ---
  const handleExport = async (formatType) => {
    setIsExporting(true);
    
    // Esperar un tick para que React quite botones de borrar (gracias al prop isExporting)
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = document.getElementById('invoice-paper-content');
    if (!element) return;

    try {
      // 1. Configuración de html2canvas para Alta Calidad
      const canvas = await html2canvas(element, {
        scale: 3, // 3x resolución para nitidez
        useCORS: true, // Permitir imágenes externas si las hubiera
        logging: false,
        backgroundColor: "#f4eee8", // Coincide con el color del papel
        windowWidth: 794, // Forzar ancho de escritorio A4
        onclone: (clonedDoc) => {
            // Asegurarse de que el elemento clonado no tenga transformaciones CSS
            // Esto arregla el problema del "Zoom" en móviles
            const clonedElement = clonedDoc.getElementById('invoice-paper-content');
            if(clonedElement) {
                clonedElement.style.transform = 'none';
                clonedElement.style.margin = '0';
            }
        }
      });

      if (formatType === 'jpg') {
        const link = document.createElement('a');
        link.download = `Cotizacion-${data.projectTitle || 'Jireh'}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      } else {
        // PDF Exacto
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Cotizacion-${data.projectTitle || 'Jireh'}.pdf`);
      }

    } catch (err) {
      console.error("Error exportando:", err);
      // Fallback simple si falla (por ejemplo en entornos sin las librerías cargadas)
      alert("Hubo un error al generar el documento. Verifica las dependencias.");
    } finally {
      setIsExporting(false);
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

      {/* AREA DE TRABAJO (Con Zoom Responsivo) */}
      <div className="mt-8 mb-8 w-full flex justify-center overflow-visible px-2">
        {/* Wrapper de Escala: Solo afecta visualización en pantalla */}
        <div 
            className="origin-top transition-transform duration-200"
            style={{ 
                transform: 'scale(var(--scale-factor))',
                '--scale-factor': '0.45' // Default mobile
            }}
        >
          {/* Estilos responsivos inline para ajustar el zoom según el ancho de pantalla */}
          <style jsx>{`
            @media (min-width: 450px) { div[style*="--scale-factor"] { --scale-factor: 0.55 !important; } }
            @media (min-width: 640px) { div[style*="--scale-factor"] { --scale-factor: 0.7 !important; } }
            @media (min-width: 1024px) { div[style*="--scale-factor"] { --scale-factor: 1 !important; } }
          `}</style>
          
          {/* ID Específico para exportación */}
          <div id="invoice-paper-content">
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
