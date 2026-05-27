import React from 'react';
import { Users, X, Save } from 'lucide-react';

export default function ModalCliente({ isOpen, onClose, onSave, clienteEditando }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const clienteData = {
      id: clienteEditando ? clienteEditando.id : Date.now(),
      nombre: formData.get('nombre'),
      tipo: formData.get('tipo'),
      documento: formData.get('documento'),
      telefono: formData.get('telefono'),
      email: formData.get('email'),
      estado: formData.get('estado'),
    };

    onSave(clienteData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-sidebar/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-emerald-400" size={22} /> 
            {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-hover transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Nombre / Razón Social</label>
                <input required name="nombre" defaultValue={clienteEditando?.nombre} placeholder="Ej: Constructora Norte S.A." className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Tipo de Cliente</label>
                <select required name="tipo" defaultValue={clienteEditando?.tipo || 'Consumidor Final'} className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors appearance-none">
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Albañil / Contratista">Albañil / Contratista</option>
                  <option value="Arquitecto / Ingeniero">Arquitecto / Ingeniero</option>
                  <option value="Empresa Constructora">Empresa Constructora</option>
                </select>
              </div>
              
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">DNI / CUIT</label>
                <input name="documento" defaultValue={clienteEditando?.documento} placeholder="Sin guiones" className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Teléfono</label>
                <input required name="telefono" defaultValue={clienteEditando?.telefono} placeholder="Ej: 388-155..." className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input type="email" name="email" defaultValue={clienteEditando?.email} placeholder="correo@ejemplo.com" className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Estado</label>
                <select required name="estado" defaultValue={clienteEditando?.estado || 'Activo'} className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors appearance-none">
                  <option value="Activo">Activo (Habilitado para compras)</option>
                  <option value="Inactivo">Inactivo / Suspendido</option>
                </select>
              </div>

            </div>
          </div>

          <div className="p-6 border-t border-dark-border bg-dark-sidebar/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/20">
              <Save size={16} /> Guardar Cliente
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}