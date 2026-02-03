"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// Usamos ruta relativa para asegurar que encuentre el archivo
import { auth, db } from '../lib/firebase';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-credential': return "Credenciales incorrectas.";
      case 'auth/user-not-found': return "Usuario no encontrado.";
      case 'auth/wrong-password': return "Contraseña incorrecta.";
      case 'auth/email-already-in-use': return "Este correo ya está registrado.";
      case 'auth/weak-password': return "La contraseña debe tener al menos 6 caracteres.";
      default: return "Error de autenticación. Intente nuevamente.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // VERIFICACIÓN DE SEGURIDAD: Solo escribir si no existe
        const userRef = doc(db, 'public_users', userCred.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: userCred.user.email,
            role: 'agent', // Rol seguro por defecto
            approved: false,
            displayName: email.split('@')[0].toUpperCase(),
            title: 'AGENTE INMOBILIARIO',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setError(getFriendlyError(err.code));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#303F1D] p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="bg-white/95 backdrop-blur p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-[#303F1D]/10 mb-4">
             <i className="fas fa-file-invoice-dollar text-3xl text-[#303F1D]"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-[#303F1D] tracking-tight">JIREH SYSTEM</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Plataforma de Cotización Inteligente</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <input type="email" required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-[#303F1D] focus:border-transparent outline-none transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@jireh.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contraseña</label>
            <input type="password" required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-[#303F1D] focus:border-transparent outline-none transition-all"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          
          <button type="submit" disabled={loading} className="w-full bg-[#303F1D] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#232e15] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98]">
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i> Procesando...
                </span>
            ) : (isRegistering ? 'Crear Cuenta' : 'Ingresar al Sistema')}
          </button>
        </form>
        
        <div className="mt-6 text-center border-t pt-6">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-medium text-gray-600 hover:text-[#303F1D] transition-colors hover:underline">
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo agente? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default LoginView;
