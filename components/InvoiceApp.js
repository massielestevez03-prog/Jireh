"use client";
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
  const [showShareMenu, setShowShareMenu] = useState(false); // Nuevo estado para menú compartir

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

  // --- CONSTANTES DE DISEÑO ---
  const COLOR_PRIMARY = "#303F1D";
  const COLOR_BG = "#f4eee8";
  const COLOR_TEXT = "#1a2310";
  const COLOR_GRAY = "#8e8b82";

  const formatMoney = (amount) => {
    return "RD$ " + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- GENERACIÓN PDF NATIVA (Vectorial) ---
  const generateNativePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Fondo
    doc.setFillColor(COLOR_BG);
    doc.rect(0, 0, 210, 297, "F");

    // Header
    doc.setFillColor(COLOR_PRIMARY);
    doc.rect(0, 0, 210, 35, "F");

    // Logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("JIREH", 20, 22);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SYSTEM", 20, 26);
    doc.setTextColor(200, 200, 200);
    doc.text("Inmobiliaria . Arquitectura . Construcción", 20, 31);

    // Info Cliente
    let y = 50;
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("FECHA DE EMISIÓN", 20, y);
    doc.setFontSize(12);
    doc.text(data.fecha || "---", 20, y + 6);

    y += 18;
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

    // Titulo Derecha
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

    // Tabla Header
    let startY = 105;
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
        if (currentY > 230) { 
            doc.addPage(); 
            currentY = 40; 
            doc.setFillColor(COLOR_BG); 
            doc.rect(0,0,210,297,"F");
            // Repetir Header Tabla
            doc.setFillColor(COLOR_PRIMARY);
            doc.rect(20, currentY - 10, 170, 8, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("NO.", 23, currentY - 4.5);
            doc.text("DESCRIPCIÓN", 40, currentY - 4.5);
            doc.text("PRECIO", 145, currentY - 4.5, { align: "right" });
            doc.text("CANT.", 160, currentY - 4.5, { align: "center" });
            doc.text("TOTAL", 187, currentY - 4.5, { align: "right" });
            doc.setTextColor(COLOR_TEXT);
            doc.setFont("helvetica", "normal");
        }

        const totalLine = (item.price * item.qty);
        doc.setFontSize(9);
        doc.text((index + 1).toString().padStart(2,'0'), 23, currentY);
        
        const descLines = doc.splitTextToSize(item.desc || "---", 95);
        doc.text(descLines, 40, currentY);
        
        doc.text(formatMoney(item.price), 145, currentY, { align: "right" });
        doc.text(item.qty.toString(), 160, currentY, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.text(formatMoney(totalLine), 187, currentY, { align: "right" });
        doc.setFont("helvetica", "normal");
        
        const lineHeight = Math.max(descLines.length * 5, 8);
        doc.setDrawColor(220, 220, 220);
        doc.line(20, currentY + 3, 190, currentY + 3);
        currentY += lineHeight + 4;
    });

    // Totales
    if (currentY > 190) { 
        doc.addPage(); 
        currentY = 40; 
        doc.setFillColor(COLOR_BG); 
        doc.rect(0,0,210,297,"F"); 
    }
    
    const subtotal = data.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const itbis = data.useItbis ? subtotal * 0.18 : 0;
    const total = subtotal + itbis;
    const totalsX = 130;
    const totalsY = currentY + 10;

    doc.setTextColor(COLOR_TEXT);
    doc.setFontSize(10);
    doc.text("Subtotal:", totalsX, totalsY);
    doc.text(formatMoney(subtotal), 190, totalsY, { align: "right" });
    
    doc.text(data.useItbis ? "ITBIS (18%):" : "ITBIS (0%):", totalsX, totalsY + 6);
    doc.text(formatMoney(itbis), 190, totalsY + 6, { align: "right" });
    
    doc.setFillColor(COLOR_PRIMARY);
    doc.rect(totalsX - 5, totalsY + 10, 70, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL NETO", totalsX, totalsY + 18);
    doc.text(formatMoney(total), 190, totalsY + 18, { align: "right" });

    // Observaciones
    const notesY = currentY + 10;
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFontSize(8);
    doc.text("OBSERVACIONES:", 20, notesY);
    doc.setTextColor(COLOR_TEXT);
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(data.notes || "Sin observaciones adicionales.", 90);
    doc.text(notesLines, 20, notesY + 5);

    // --- PIE DE PÁGINA (Ajustado) ---
    // Subimos la firma a 210mm (antes 225mm) para evitar que se vea "baja"
    const FOOTER_START_Y = 210; 

    // Verificamos espacio
    if (currentY + (notesLines.length * 5) + 35 > FOOTER_START_Y) {
        doc.addPage();
        doc.setFillColor(COLOR_BG); 
        doc.rect(0,0,210,297,"F");
    }
    
    const bottomY = FOOTER_START_Y;
    
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
    doc.line(120, bottomY + 15, 180, bottomY + 15);
    
    doc.setTextColor(COLOR_PRIMARY);
    doc.setFontSize(10);
    doc.text(userData.displayName || "AGENTE", 150, bottomY + 20, { align: "center" });
    doc.setTextColor(COLOR_GRAY);
    doc.setFontSize(7);
    doc.text(userData.title || "", 150, bottomY + 24, { align: "center" });

    // Barra Verde Inferior
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

  // --- GENERACIÓN IMAGEN NATIVA (Canvas API) ---
  // Dibuja la factura en un canvas HTML invisible con alta resolución
  // Esto reemplaza a html2canvas y evita distorsiones
  const generateNativeImage = () => {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            // Escala 5x para alta calidad (A4 @ ~125DPI)
            const SCALE = 5;
            const WIDTH = 210 * SCALE;  // 1050px
            const HEIGHT = 297 * SCALE; // 1485px
            
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            const ctx = canvas.getContext('2d');
            
            // Helpers de escalado
            const s = (val) => val * SCALE;
            
            // FONDO
            ctx.fillStyle = COLOR_BG;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            // HEADER
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.fillRect(0, 0, WIDTH, s(35));

            // Logo
            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${s(24/3)}px Helvetica, Arial, sans-serif`; // Ajuste aprox de tamaño pt a px
            ctx.fillText("JIREH", s(20), s(22));
            ctx.font = `normal ${s(8/3)}px Helvetica, Arial, sans-serif`;
            ctx.fillText("SYSTEM", s(20), s(26));
            ctx.fillStyle = "#C8C8C8";
            ctx.fillText("Inmobiliaria . Arquitectura . Construcción", s(20), s(31));

            // INFO CLIENTE
            let y = 50;
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.font = `bold ${s(9/3)}px Helvetica`;
            ctx.fillText("FECHA DE EMISIÓN", s(20), s(y));
            ctx.font = `normal ${s(12/3)}px Helvetica`;
            ctx.fillText(data.fecha || "---", s(20), s(y+6));

            y += 18;
            ctx.beginPath();
            ctx.strokeStyle = COLOR_PRIMARY;
            ctx.lineWidth = s(1);
            ctx.moveTo(s(20), s(y));
            ctx.lineTo(s(20), s(y+35));
            ctx.stroke();

            ctx.font = `bold ${s(9/3)}px Helvetica`;
            ctx.fillText("FACTURAR A:", s(24), s(y+3));
            ctx.font = `bold ${s(12/3)}px Helvetica`;
            ctx.fillText(data.clientName || "Cliente Mostrador", s(24), s(y+9));
            
            ctx.fillStyle = COLOR_TEXT;
            ctx.font = `normal ${s(10/3)}px Helvetica`;
            ctx.fillText(data.clientId || "", s(24), s(y+15));
            ctx.fillText(data.clientLocation || "", s(24), s(y+20));
            ctx.fillText(data.clientContact || "", s(24), s(y+25));

            // TITULO DERECHA
            ctx.textAlign = "right";
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.font = `normal ${s(32/3)}px Helvetica`;
            ctx.fillText("COTIZACIÓN", s(190), s(60));

            ctx.font = `bold ${s(9/3)}px Helvetica`;
            ctx.fillText("PROYECTO", s(190), s(75));
            ctx.font = `normal ${s(12/3)}px Helvetica`;
            ctx.fillText(data.projectTitle || "---", s(190), s(81));

            ctx.fillStyle = COLOR_GRAY;
            ctx.font = `normal ${s(10/3)}px Helvetica`;
            ctx.fillText(`FOLIO: ${data.projectFolio || "001"}`, s(190), s(88));
            ctx.textAlign = "left"; // Reset

            // TABLA
            const startY = 105;
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.fillRect(s(20), s(startY-8), s(170), s(8)); // Header bg (ajustado coords)
            
            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${s(8/3)}px Helvetica`;
            ctx.fillText("NO.", s(23), s(startY - 2.5));
            ctx.fillText("DESCRIPCIÓN", s(40), s(startY - 2.5));
            ctx.textAlign = "right";
            ctx.fillText("PRECIO", s(145), s(startY - 2.5));
            ctx.textAlign = "center";
            ctx.fillText("CANT.", s(160), s(startY - 2.5));
            ctx.textAlign = "right";
            ctx.fillText("TOTAL", s(187), s(startY - 2.5));
            ctx.textAlign = "left";

            // Items
            let currentY = startY + 6; // offset inicial
            
            data.items.forEach((item, index) => {
                const totalLine = (item.price * item.qty);
                ctx.fillStyle = COLOR_TEXT;
                ctx.font = `normal ${s(9/3)}px Helvetica`;
                
                ctx.fillText((index + 1).toString().padStart(2,'0'), s(23), s(currentY));
                ctx.fillText(item.desc || "---", s(40), s(currentY));
                
                ctx.textAlign = "right";
                ctx.fillText(formatMoney(item.price), s(145), s(currentY));
                ctx.textAlign = "center";
                ctx.fillText(item.qty.toString(), s(160), s(currentY));
                
                ctx.font = `bold ${s(9/3)}px Helvetica`;
                ctx.textAlign = "right";
                ctx.fillText(formatMoney(totalLine), s(187), s(currentY));
                ctx.textAlign = "left";

                ctx.beginPath();
                ctx.strokeStyle = "#DCDCDC";
                ctx.lineWidth = s(0.5);
                ctx.moveTo(s(20), s(currentY + 4));
                ctx.lineTo(s(190), s(currentY + 4));
                ctx.stroke();

                currentY += 12; // Espacio fijo simple para imagen (aprox)
            });

            // TOTALES
            const subtotal = data.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
            const itbis = data.useItbis ? subtotal * 0.18 : 0;
            const total = subtotal + itbis;
            const totalsX = 130;
            const totalsY = currentY + 10;

            ctx.fillStyle = COLOR_TEXT;
            ctx.font = `normal ${s(10/3)}px Helvetica`;
            ctx.fillText("Subtotal:", s(totalsX), s(totalsY));
            ctx.textAlign = "right";
            ctx.fillText(formatMoney(subtotal), s(190), s(totalsY));
            
            ctx.textAlign = "left";
            ctx.fillText(data.useItbis ? "ITBIS (18%):" : "ITBIS (0%):", s(totalsX), s(totalsY + 6));
            ctx.textAlign = "right";
            ctx.fillText(formatMoney(itbis), s(190), s(totalsY + 6));
            
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.fillRect(s(totalsX - 5), s(totalsY + 10), s(70), s(12));
            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${s(12/3)}px Helvetica`;
            ctx.textAlign = "left";
            ctx.fillText("TOTAL NETO", s(totalsX), s(totalsY + 18));
            ctx.textAlign = "right";
            ctx.fillText(formatMoney(total), s(190), s(totalsY + 18));
            ctx.textAlign = "left";

            // NOTAS
            const notesY = currentY + 10;
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.font = `bold ${s(8/3)}px Helvetica`;
            ctx.fillText("OBSERVACIONES:", s(20), s(notesY));
            ctx.fillStyle = COLOR_TEXT;
            ctx.font = `normal ${s(9/3)}px Helvetica`;
            // Nota simple
            ctx.fillText(data.notes || "Sin observaciones.", s(20), s(notesY + 5));

            // FOOTER (Firma y Bancos)
            // Ajustamos Y a 210
            const FOOTER_Y = 210;
            
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.font = `bold ${s(8/3)}px Helvetica`;
            ctx.fillText("MÉTODO DE PAGO", s(20), s(FOOTER_Y));
            ctx.beginPath();
            ctx.strokeStyle = "#C8C8C8";
            ctx.moveTo(s(20), s(FOOTER_Y+2));
            ctx.lineTo(s(80), s(FOOTER_Y+2));
            ctx.stroke();

            ctx.fillStyle = COLOR_TEXT;
            ctx.font = `normal ${s(9/3)}px Helvetica`;
            ctx.fillText(data.bankOwner || "", s(20), s(FOOTER_Y+7));
            ctx.fillText(data.bankName || "", s(20), s(FOOTER_Y+11));
            ctx.font = `normal ${s(9/3)}px Courier New`;
            ctx.fillText(data.bankAccount || "", s(20), s(FOOTER_Y+15));

            // Firma
            ctx.textAlign = "center";
            ctx.fillStyle = COLOR_GRAY;
            ctx.font = `bold ${s(7/3)}px Helvetica`;
            ctx.fillText("AUTORIZADO POR:", s(150), s(FOOTER_Y));
            
            ctx.beginPath();
            ctx.strokeStyle = COLOR_PRIMARY;
            ctx.moveTo(s(120), s(FOOTER_Y+15));
            ctx.lineTo(s(180), s(FOOTER_Y+15));
            ctx.stroke();

            ctx.fillStyle = COLOR_PRIMARY;
            ctx.font = `bold ${s(10/3)}px Helvetica`;
            ctx.fillText(userData.displayName || "AGENTE", s(150), s(FOOTER_Y+20));
            ctx.fillStyle = COLOR_GRAY;
            ctx.font = `normal ${s(7/3)}px Helvetica`;
            ctx.fillText(userData.title || "", s(150), s(FOOTER_Y+24));

            // Footer Verde
            ctx.textAlign = "left";
            ctx.fillStyle = COLOR_PRIMARY;
            ctx.fillRect(0, s(275), WIDTH, s(22));
            
            ctx.fillStyle = "#FFFFFF";
            ctx.font = `normal ${s(8/3)}px Helvetica`;
            ctx.fillText("Santiago de los Caballeros, R.D.", s(30), s(282));
            ctx.font = `bold ${s(8/3)}px Helvetica`;
            ctx.fillText("jir3hrealtygroup@outlook.com", s(30), s(286));

            resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
            reject(e);
        }
    });
  };

  const handleAction = async (actionType) => {
    setIsExporting(true);
    // Cerrar menú si está abierto
    setShowShareMenu(false); 
    const filename = `Cotizacion-${data.projectTitle || 'Jireh'}`;

    try {
        if (actionType === 'pdf') {
            const doc = generateNativePDF();
            doc.save(`${filename}.pdf`);
        }
        else if (actionType === 'image') {
            const dataUrl = await generateNativeImage();
            const link = document.createElement('a');
            link.download = `${filename}.jpg`;
            link.href = dataUrl;
            link.click();
        }
        else if (actionType === 'share-pdf') {
            const doc = generateNativePDF();
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], `${filename}.pdf`, { type: "application/pdf" });
            if (navigator.share) await navigator.share({ files: [file], title: 'Cotización Jireh' });
            else alert("Tu dispositivo no soporta compartir PDF directo.");
        }
        else if (actionType === 'share-image') {
            const dataUrl = await generateNativeImage();
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `${filename}.jpg`, { type: "image/jpeg" });
            if (navigator.share) await navigator.share({ files: [file], title: 'Cotización Jireh' });
            else alert("Tu dispositivo no soporta compartir Imagen directo.");
        }

    } catch (error) {
        console.error("Error en acción:", error);
        alert("Ocurrió un error.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#222] pb-32" onClick={() => setShowShareMenu(false)}>
      
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
                 isExporting={false} 
              />
          </div>
        </div>
      </div>

      {/* TOOLBAR INFERIOR */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur border border-white/20 p-2 rounded-2xl shadow-2xl flex gap-2 z-50 items-center">
        <button onClick={() => openModal('clear', 'Limpiar Formulario')} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-500 transition group">
          <i className="fas fa-trash-alt text-lg mb-1 group-hover:scale-110 transition-transform"></i>
          <span className="text-[9px] font-bold">Limpiar</span>
        </button>
        
        <div className="w-px bg-gray-300 mx-1 my-2 h-8"></div>

        {/* Botón Compartir con Menú */}
        <div className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }} 
                disabled={isExporting} 
                className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-blue-50 text-blue-600 transition group relative"
            >
                <i className="fas fa-share-alt text-lg mb-1 group-hover:scale-110 transition-transform"></i>
                <span className="text-[9px] font-bold">Compartir</span>
            </button>
            
            {/* Menú Desplegable */}
            {showShareMenu && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-32 flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <button onClick={() => handleAction('share-pdf')} className="p-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <i className="fas fa-file-pdf text-red-600"></i> PDF
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button onClick={() => handleAction('share-image')} className="p-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <i className="fas fa-image text-blue-600"></i> Imagen
                    </button>
                </div>
            )}
        </div>

        <button onClick={() => handleAction('pdf')} disabled={isExporting} className="flex flex-col items-center justify-center w-16 h-14 bg-[#303F1D] text-white rounded-xl shadow-lg hover:bg-[#232e15] transition group transform hover:-translate-y-1 ml-2">
          {isExporting ? <i className="fas fa-circle-notch fa-spin text-xl"></i> : <i className="fas fa-download text-xl mb-1 group-hover:scale-110 transition-transform"></i>}
          <span className="text-[9px] font-bold">Guardar</span>
        </button>
      </div>

    </div>
  );
};

export default InvoiceApp;
