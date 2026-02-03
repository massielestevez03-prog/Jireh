"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Guardar en 'public_users' para que sea accesible por el admin
        await setDoc(doc(db, 'public_users', userCred.user.uid), {
          email: userCred.user.email,
          role: 'agent',
          approved: false,
          displayName: email.split('@')[0].toUpperCase(),
          title: 'AGENTE INMOBILIARIO',
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#303F1D] p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#303F1D]">JIREH SYSTEM</h1>
          <p className="text-gray-500 text-sm">Plataforma de Cotización</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input 
              type="email" required 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" required 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-[#303F1D] text-white py-2 px-4 rounded-md hover:bg-[#232e15] transition disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-600 hover:underline">
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
