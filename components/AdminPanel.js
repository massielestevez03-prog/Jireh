"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminPanel = ({ onClose, companyId, companyData }) => {
  const [tab, setTab] = useState('company');
  const [formData, setFormData] = useState({ ...companyData });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (companyId) {
          const q = query(collection(db, 'public_users'), where('companyId', '==', companyId));
          const snapshot = await getDocs(q);
          setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };
    fetchUsers();
  }, [companyId]);

  const saveCompany = async () => {
      await updateDoc(doc(db, 'companies', companyId), formData);
      alert('Datos guardados exitosamente. Recarga la página para ver los cambios.');
  };

  const toggleUser = async (uid, status) => {
      await updateDoc(doc(db, 'public_users', uid), { approved: !status });
      setUsers(users.map(u => u.id === uid ? { ...u, approved: !status } : u));
  };

  return (
    <div className="h-full flex flex-col bg-white">
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
            <h2 className="font-bold">Panel de Administración</h2>
            <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        
        <div className="flex border-b">
            <button onClick={() => setTab('company')} className={`flex-1 p-3 font-bold ${tab === 'company' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Empresa</button>
            <button onClick={() => setTab('users')} className={`flex-1 p-3 font-bold ${tab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Empleados</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {tab === 'company' ? (
                <div className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm">
                        <strong>Código de Invitación:</strong> <span className="font-mono bg-white px-2 py-1 ml-2 border rounded select-all">{companyData?.code}</span>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Nombre Empresa</label>
                        <input className="w-full border p-2 rounded" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Color Principal</label>
                        <input type="color" className="w-full h-10 border p-1 rounded" value={formData.primaryColor || '#000000'} onChange={e => setFormData({...formData, primaryColor: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">URL Logo</label>
                        <input className="w-full border p-2 rounded" value={formData.logoUrl || ''} onChange={e => setFormData({...formData, logoUrl: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Dirección / Contacto</label>
                        <textarea className="w-full border p-2 rounded" rows={3} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <button onClick={saveCompany} className="w-full bg-blue-600 text-white font-bold py-2 rounded">Guardar Cambios</button>
                </div>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead><tr className="border-b"><th className="py-2">Usuario</th><th className="py-2">Estado</th><th className="py-2 text-right">Acción</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b">
                                <td className="py-2">{u.displayName}<br/><span className="text-gray-500 text-xs">{u.email}</span></td>
                                <td className="py-2">{u.approved ? <span className="text-green-600 font-bold">Aprobado</span> : <span className="text-yellow-600 font-bold">Pendiente</span>}</td>
                                <td className="py-2 text-right">
                                    {u.role !== 'owner' && (
                                        <button onClick={() => toggleUser(u.id, u.approved)} className={`px-2 py-1 rounded text-xs font-bold ${u.approved ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {u.approved ? 'Revocar' : 'Aprobar'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
};
export default AdminPanel;
