"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const LoginView = () => {
  const [mode, setMode] = useState('login'); // 'login', 'register-company', 'register-employee'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } 
      
      else if (mode === 'register-company') {
        // 1. Crear Usuario
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;
        
        // 2. Crear Empresa (ID random + timestamp)
        const newCompanyId = 'EMP-' + Date.now().toString().slice(-6);
        await setDoc(doc(db, 'companies', newCompanyId), {
          name: companyName,
          code: newCompanyId,
          createdAt: new Date().toISOString(),
          ownerId: uid,
          primaryColor: '#303F1D',
          logoUrl: '',
          address: 'Dirección de la empresa...',
          email: email
        });

        // 3. Crear Usuario Admin
        await setDoc(doc(db, 'public_users', uid), {
          email,
          displayName: 'Admin',
          role: 'owner',
          approved: true,
          companyId: newCompanyId,
          title: 'Director',
          createdAt: new Date().toISOString()
        });
      } 
      
      else if (mode === 'register-employee') {
        // 1. Buscar Empresa por Código
        const q = query(collection(db, 'companies'), where('code', '==', companyCode.trim()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error("Código de empresa inválido.");
        }
        const companyId = querySnapshot.docs[0].id;

        // 2. Crear Usuario
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. Crear Perfil (Pendiente)
        await setDoc(doc(db, 'public_users', userCred.user.uid), {
          email,
          displayName: email.split('@')[0],
          role: 'employee',
          approved: false, // Requiere aprobación
          companyId: companyId,
          title: 'Agente',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase:', ''));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">CotizaYa</h1>
          <p className="text-gray-500">Plataforma de Cotización</p>
        </div>
        
        {/* Pestañas */}
        <div className="flex border-b mb-6 text-sm">
           <button onClick={() => setMode('login')} className={`flex-1 pb-2 font-bold ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Ingresar</button>
           <button onClick={() => setMode('register-company')} className={`flex-1 pb-2 font-bold ${mode === 'register-company' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Crear Empresa</button>
           <button onClick={() => setMode('register-employee')} className={`flex-1 pb-2 font-bold ${mode === 'register-employee' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Unirse</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register-company' && (
             <input required placeholder="Nombre de tu Empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          )}
          {mode === 'register-employee' && (
             <input required placeholder="Código de Empresa (Ej: EMP-123)" value={companyCode} onChange={e => setCompanyCode(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          )}
          
          <input type="email" required placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          
          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
          
          <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default LoginView;
