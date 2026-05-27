import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit2, User, Phone, Mail, 
  MapPin, X, Save, AlertTriangle 
} from 'lucide-react';

export default function Clientes() {
  // 1. ESTADOS DE CONTROL
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
  
  // Estado para el modal estético de eliminación (guarda el objeto completo del cliente)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState<any | null>(null);

  // Estado del formulario alineado con pgAdmin
  const [form, setForm] = useState({
    id: '',
    nombre: '',
    apellido: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
    barrio: ''
  });

  // 2. CARGAR CLIENTES DESDE EL BACKEND (POSTGRESQL)
  const cargarClientes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/clientes');
      if (res.ok) {
        const datos = await res.json();
        setClientes(datos);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // 3. FILTRO DE BÚSQUEDA EN TIEMPO REAL
  const clientesFiltrados = clientes.filter(c => {
    const term = busqueda.toLowerCase();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(term)) ||
      (c.apellido && c.apellido.toLowerCase().includes(term)) ||
      (c.documento && c.documento.toLowerCase().includes(term))
    );
  });

  // 4. CONTROL DEL MODAL DE ALTA / EDICIÓN
  const abrirModal = (cliente: any = null) => {
    if (cliente) {
      setClienteSeleccionado(cliente);
      setForm({
        id: cliente.id || '',
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        documento: cliente.documento || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        barrio: cliente.barrio || ''
      });
    } else {
      setClienteSeleccionado(null);
      setForm({ id: '', nombre: '', apellido: '', documento: '', telefono: '', email: '', direccion: '', barrio: '' });
    }
    setModalAbierto(true);
  };

  // 5. GUARDAR CAMBIOS (CREAR O ACTUALIZAR)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const esEdicion = !!clienteSeleccionado;
    const url = esEdicion 
      ? `http://localhost:5000/api/clientes/${form.id}` 
      : 'http://localhost:5000/api/clientes';
    const method = esEdicion ? 'PUT' : 'POST';

    // Clonamos para limpiar el ID en caso de ser un Alta Nueva
    const payload = { ...form };
    if (!esEdicion) {
      // @ts-ignore
      delete payload.id; 
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setModalAbierto(false);
        cargarClientes();
      } else {
        const errDatos = await res.json();
        alert(`Error al guardar: ${errDatos.error || 'Problema en el servidor'}`);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  // 6. ACCIÓN DE ELIMINACIÓN FÍSICA EN EL BACKEND
  const confirmarEliminacionReal = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/clientes/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setModalEliminarAbierto(null); // Cerramos el modal estético
        cargarClientes(); // Recargamos la grilla
      } else {
        const errDatos = await res.json();
        // Si Postgres frena la baja por foreign key, saltará el aviso seguro
        alert(errDatos.error || "No se pudo eliminar el cliente.");
        setModalEliminarAbierto(null);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Problema de conexión con el servidor.");
    }
  };

  return (
    <div className="flex-1 p-8 bg-dark-bg overflow-y-auto">
      
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Clientes</h1>
          <p className="text-sm text-gray-400 mt-1">Gestión e historial de la base de datos de compradores.</p>
        </div>
        <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, apellido o documento..." className="w-full bg-dark-panel border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-emerald-500" />
      </div>

      {/* TABLA DE CLIENTES */}
      <div className="bg-dark-panel border border-dark-border rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-dark-sidebar text-xs text-gray-400 border-b border-dark-border uppercase">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Ubicación</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/40">
            {clientesFiltrados.map((c) => (
              <tr key={c.id} className="hover:bg-dark-hover transition-colors">
                <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-dark-input rounded-lg text-gray-400"><User size={16}/></div>
                  {`${c.nombre || ''} ${c.apellido || ''}`.trim() || 'Sin Nombre'}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">{c.documento || '-'}</td>
                <td className="px-6 py-4 space-y-0.5 text-xs">
                  {c.telefono && <p className="flex items-center gap-1 text-gray-400"><Phone size={12}/> {c.telefono}</p>}
                  {c.email && <p className="flex items-center gap-1 text-gray-400"><Mail size={12}/> {c.email}</p>}
                </td>
                <td className="px-6 py-4 text-xs">
                  <p className="text-white font-medium">{c.direccion || '-'}</p>
                  {c.barrio && <p className="text-gray-500">B° {c.barrio}</p>}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => abrirModal(c)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-600/20" title="Editar datos"><Edit2 size={14}/></button>
                    {/* El botón del tacho ahora dispara el modal estético */}
                    <button onClick={() => setModalEliminarAbierto(c)} className="p-2 bg-rose-600/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-600/20" title="Eliminar definitivamente"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientesFiltrados.length === 0 && (
          <div className="text-center py-12 text-gray-500">No se encontraron clientes registrados.</div>
        )}
      </div>

      {/* MODAL DE EDICIÓN / ALTA */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <h3 className="text-lg font-bold text-white">{clienteSeleccionado ? '✏️ Editar Cliente' : '👤 Nuevo Cliente'}</h3>
              <button type="button" onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-400 block mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required /></div>
              <div><label className="text-xs font-semibold text-gray-400 block mb-1">Apellido</label><input type="text" value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-400 block mb-1">DNI / CUIT</label><input type="text" value={form.documento} onChange={(e) => setForm({...form, documento: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs font-semibold text-gray-400 block mb-1">Teléfono</label><input type="text" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
            </div>

            <div><label className="text-xs font-semibold text-gray-400 block mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-400 block mb-1">Dirección</label><input type="text" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs font-semibold text-gray-400 block mb-1">Barrio</label><input type="text" value={form.barrio} onChange={(e) => setForm({...form, barrio: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
            </div>

            <div className="flex justify-end gap-3 border-t border-dark-border pt-4">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm bg-dark-input border border-dark-border rounded-xl text-gray-300 hover:bg-dark-hover">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"><Save size={16}/> Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL DE ELIMINACIÓN ESTÉTICO Y DETALLADO --- */}
      {modalEliminarAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200 space-y-4 text-center relative overflow-hidden">
            
            {/* Detalle estético superior: gradiente de peligro */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>

            {/* Ícono de Alerta de Impacto */}
            <div className="flex justify-center mx-auto text-rose-500 bg-rose-500/10 w-16 h-16 rounded-full items-center border border-rose-500/20 shadow-lg shadow-rose-950/20">
              <AlertTriangle size={32} className="animate-pulse" />
            </div>

            {/* Información del Destino del Cliente */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">¿Eliminar Cliente?</h3>
              <p className="text-gray-400 text-sm">Estás a punto de borrar definitivamente a:</p>
              <p className="text-sm font-black text-rose-400 bg-rose-500/5 py-1.5 px-3 rounded-lg border border-rose-500/10 inline-block max-w-full truncate mt-1">
                {modalEliminarAbierto.nombre} {modalEliminarAbierto.apellido || ''}
              </p>
            </div>

            <p className="text-[11px] text-gray-500 leading-normal px-2">
              ⚠️ Esta acción eliminará al comprador de la base de datos física de PostgreSQL. Si el cliente posee cotizaciones activas, el sistema bloqueará la operación por seguridad.
            </p>

            {/* Botones de Despacho */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setModalEliminarAbierto(null)} 
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-300 bg-dark-input hover:bg-dark-hover border border-dark-border rounded-xl transition-colors focus:outline-none"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={() => confirmarEliminacionReal(modalEliminarAbierto.id)} 
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-rose-950/40 focus:outline-none flex items-center justify-center gap-1.5"
              >
                <Trash2 size={16} /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}