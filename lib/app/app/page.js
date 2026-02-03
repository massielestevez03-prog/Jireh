"use client";
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Componentes
import LoginView from '@/components/LoginView';
import WaitingView from '@/components/WaitingView';
import InvoiceApp from '@/components/InvoiceApp';

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Buscar datos del usuario en la colección pública
        const userRef = doc(db, 'public_users', currentUser.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          // Crear perfil inicial si no existe
          const newData = {
            email: currentUser.email,
            role: 'agent',
            approved: false,
            displayName: currentUser.email.split('@')[0].toUpperCase(),
            title: 'AGENTE INMOBILIARIO',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newData);
          setUserData(newData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#303F1D] text-white">
        Cargando Jireh System...
      </div>
    );
  }

  if (!user) return <LoginView />;
  
  // Si es admin o está aprobado, entra. Si no, sala de espera.
  if (userData?.role === 'admin' || userData?.approved) {
    return <InvoiceApp user={user} userData={userData} />;
  }

  return <WaitingView user={user} userData={userData} />;
}
