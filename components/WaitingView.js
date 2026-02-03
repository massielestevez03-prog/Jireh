"use client";
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const WaitingView = ({ userData }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cuenta en Revisión</h2>
        <p className="text-gray-600 mb-6">Hola <b>{userData?.displayName}</b>. Tu cuenta requiere aprobación de un Administrador.</p>
        <button onClick={() => signOut(auth)} className="text-red-500 text-sm underline">Cerrar Sesión</button>
      </div>
    </div>
  );
};
export default WaitingView;
