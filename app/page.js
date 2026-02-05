"use client";
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import LoginView from '@/components/LoginView';
import WaitingView from '@/components/WaitingView';
import InvoiceApp from '@/components/InvoiceApp';

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // 1. Cargar Usuario
          const userRef = doc(db, 'public_users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const uData = userSnap.data();
            setUserData(uData);

            // 2. Cargar Empresa si el usuario tiene companyId
            if (uData.companyId) {
              const companyRef = doc(db, 'companies', uData.companyId);
              const companySnap = await getDoc(companyRef);
              if (companySnap.exists()) {
                setCompanyData({ id: companySnap.id, ...companySnap.data() });
              }
            }
          }
        } catch (e) {
          console.error("Error cargando datos:", e);
        }
      } else {
        setUserData(null);
        setCompanyData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-600">Cargando CotizaYa...</div>;

  if (!user) return <LoginView />;
  
  // Si está logueado pero no aprobado
  if (userData && !userData.approved && userData.role !== 'owner') {
     return <WaitingView userData={userData} companyName={companyData?.name} />;
  }

  // Si está aprobado (Owner o Empleado aprobado)
  return <InvoiceApp user={user} userData={userData} companyData={companyData} />;
}
