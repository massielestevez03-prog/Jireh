"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AdminPanel = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
          const q = query(collection(db, 'public_users'));
          const snapshot = await getDocs(q);
          setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
          console.error("Error fetching users:", e);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const toggleApprove = async (userId, currentStatus) => {
    await updateDoc(doc(db, 'public_users', userId), { approved: !currentStatus });
    setUsers(users.map(u => u.id === userId ? { ...u, approved: !currentStatus } : u));
  };

  return (
    <div className="h-full flex flex-col bg-white">
        <div className="bg-[#303F1D] p-4 text-white flex justify-between items-center">
          <h2 className="font-bold text-lg">Panel de Administración</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300 text-xl font-bold">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
              <div className="flex items-center justify-center h-40">
                  <span className="text-gray-500 animate-pulse">Cargando usuarios...</span>
              </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                    <tr><th className="px-4 py-3 border-b">Usuario</th><th className="px-4 py-3 border-b">Estado</th><th className="px-4 py-3 border-b text-right">Acción</th></tr>
                </thead>
                <tbody className="text-gray-700">
                    {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                            <div className="font-bold text-[#303F1D]">{u.displayName}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                            {u.approved ? 
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Aprobado</span> : 
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Pendiente</span>
                            }
                        </td>
                        <td className="px-4 py-3 text-right">
                        <button 
                            onClick={() => toggleApprove(u.id, u.approved)} 
                            className={`text-xs font-bold px-3 py-1 rounded transition-colors ${u.approved ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                            {u.approved ? 'Revocar' : 'Aprobar'}
                        </button>
                        </td>
                    </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan="3" className="text-center py-8 text-gray-400">No hay usuarios registrados.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          )}
        </div>
    </div>
  );
};
export default AdminPanel;
