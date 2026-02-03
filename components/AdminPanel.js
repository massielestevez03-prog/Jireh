"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminPanel = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, 'public_users'));
      const snapshot = await getDocs(q);
      const usersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const toggleApprove = async (userId, currentStatus) => {
    await updateDoc(doc(db, 'public_users', userId), { approved: !currentStatus });
    setUsers(users.map(u => u.id === userId ? { ...u, approved: !currentStatus } : u));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#303F1D] p-4 text-white flex justify-between items-center">
          <h2 className="font-bold">Panel de Administración</h2>
          <button onClick={onClose} className="hover:text-gray-300">✕</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? <p className="text-black">Cargando...</p> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="text-black">
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.email}<br/><span className="text-xs text-gray-500">{u.displayName}</span></td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${u.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {u.approved ? 'Aprobado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleApprove(u.id, u.approved)}
                        className={`font-medium ${u.approved ? 'text-red-600' : 'text-blue-600'} hover:underline`}
                      >
                        {u.approved ? 'Revocar' : 'Aprobar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
