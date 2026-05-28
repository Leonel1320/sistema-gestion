import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit2, FileText, CheckCircle2, 
  AlertTriangle, X, Save, Printer
} from 'lucide-react';

import empresaDefault from '../data/datos'; // Importamos el archivo de configuración por defecto

export default function Ventas({ setVistaActual }: { setVistaActual?: (vista: string) => void }) {
  const [ventas, setVentas] = useState<any[]>([]);
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  
  // Modales
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState<string | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [formEditar, setFormEditar] = useState<any>({ id: '', cliente: '', estado: '' });

  // Estado dinámico para el PDF de la empresa
  const [datosEmpresa, setDatosEmpresa] = useState(() => {
    const local = localStorage.getItem('empresa');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return {
          nombre: parsed.nombre || empresaDefault.nombre,
          telefono: parsed.telefono || empresaDefault.telefono,
          direccion: parsed.direccion || empresaDefault.direccion,
          cuit: parsed.cuit || empresaDefault.cuit
        };
      } catch(e) {}
    }
    return empresaDefault;
  });

  const cargarDatosServidor = async () => {
    try {
      const respuesta = await fetch('http://localhost:5000/api/cotizaciones');
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setVentas(datos);
        if (datos.length > 0 && !ventaSeleccionadaId) {
          setVentaSeleccionadaId(datos[0].id);
        }
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  useEffect(() => {
    cargarDatosServidor();
    // Re-comprobar variables locales al montar la vista
    const local = localStorage.getItem('empresa');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setDatosEmpresa({
          nombre: parsed.nombre || empresaDefault.nombre,
          telefono: parsed.telefono || empresaDefault.telefono,
          direccion: parsed.direccion || empresaDefault.direccion,
          cuit: parsed.cuit || empresaDefault.cuit
        });
      } catch(e) {}
    }
  }, []);

  const ventasFiltradas = ventas.filter(v => {
    const term = busqueda.toLowerCase();
    return (
      v.id.toLowerCase().includes(term) ||
      (v.nombre && v.nombre.toLowerCase().includes(term)) ||
      (v.apellido && v.apellido.toLowerCase().includes(term)) ||
      (v.cliente && v.cliente.toLowerCase().includes(term))
    );
  });

  const ventaActiva = ventas.find(v => v.id === ventaSeleccionadaId);

  const handleNuevaVenta = () => {
    if (setVistaActual) setVistaActual('carrito');
  };

  const confirmarEliminacion = async () => {
    try {
      const respuesta = await fetch(`http://localhost:5000/api/cotizaciones/${modalEliminarAbierto}`, {
        method: 'DELETE',
      });
      if (respuesta.ok) {
        setModalEliminarAbierto(null);
        setVentaSeleccionadaId(null);
        cargarDatosServidor();
      } else {
        alert("No se pudo eliminar la cotización.");
      }
    } catch (err) { console.error(err); }
  };

  const abrirModalEditar = (venta: any) => {
    const nombreCompleto = `${venta.nombre || ''} ${venta.apellido || ''}`.trim() || venta.cliente || 'Consumidor Final';
    setFormEditar({
      id: venta.id,
      cliente: nombreCompleto,
      estado: venta.estado || 'PENDIENTE'
    });
    setModalEditarAbierto(true);
  };

  const guardarEdicionVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const respuesta = await fetch(`http://localhost:5000/api/cotizaciones/${formEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formEditar.id, estado: formEditar.estado })
      });
      if (respuesta.ok) {
        setModalEditarAbierto(false);
        cargarDatosServidor(); 
      } else {
        alert("Error al actualizar el estado.");
      }
    } catch (err) { console.error(err); }
  };

  const handleImprimirTicket = () => {
    window.print();
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-dark-bg relative">
      
      {/* INTERFAZ OSCURA DE PANTALLA */}
      <section className="w-[420px] bg-dark-panel border-r border-dark-border flex flex-col z-0 print:hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white">Historial</h2>
          <button onClick={handleNuevaVenta} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
            <Plus size={16} /> Nueva Venta
          </button>
        </div>

        <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por cliente o comprobante..." className="w-full bg-dark-input border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-6">
          {ventasFiltradas.map((venta) => {
            const nombreCompletoLista = `${venta.nombre || ''} ${venta.apellido || ''}`.trim() || venta.cliente || 'Consumidor Final';
            return (
              <div key={venta.id} onClick={() => setVentaSeleccionadaId(venta.id)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${ventaSeleccionadaId === venta.id ? 'bg-dark-input border-emerald-500/50' : 'bg-dark-sidebar border-dark-border hover:bg-dark-hover'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${ventaSeleccionadaId === venta.id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-dark-input text-gray-400'}`}><FileText size={18} /></div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{venta.id}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 w-32 truncate">{nombreCompletoLista}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    venta.estado === 'CONFIRMADA' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800' :
                    venta.estado === 'PENDIENTE' ? 'text-amber-400 bg-amber-950/40 border-amber-800' :
                    'text-rose-400 bg-rose-950/40 border-rose-800'
                  }`}>{venta.estado}</span>
                  <span className="font-bold text-white text-sm">${Number(venta.total).toLocaleString('es-AR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DETALLE CENTRAL EN PANTALLA */}
      <section className="flex-1 flex flex-col overflow-hidden print:hidden">
        {ventaActiva ? (
          <>
            <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark-panel">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle2 size={24} /></div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white">Comprobante {ventaActiva.id}</h3>
                  <p className="text-sm text-gray-400 mt-1">Generado el {ventaActiva.fecha ? new Date(ventaActiva.fecha).toLocaleDateString('es-AR') : ''}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleImprimirTicket} className="flex items-center gap-2 px-4 py-2 bg-dark-input border border-dark-border text-gray-300 rounded-lg text-sm font-medium"><Printer size={16} /> Imprimir</button>
                <button onClick={() => abrirModalEditar(ventaActiva)} className="p-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => setModalEliminarAbierto(ventaActiva.id)} className="p-2 bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-dark-bg">
              <div className="bg-dark-panel border border-dark-border rounded-xl p-6 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Cliente</p>
                  <p className="text-lg font-bold text-white">{`${ventaActiva.nombre || ''} ${ventaActiva.apellido || ''}`.trim() || ventaActiva.cliente || 'Consumidor Final'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Abonado</p>
                  <p className="text-2xl font-extrabold text-emerald-400">${Number(ventaActiva.total).toLocaleString('es-AR')}</p>
                </div>
              </div>

              <div className="bg-dark-panel border border-dark-border rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-dark-sidebar text-xs text-gray-400 border-b border-dark-border uppercase">
                    <tr>
                      <th className="px-6 py-4">Material</th>
                      <th className="px-6 py-4 text-center">Cantidad</th>
                      <th className="px-6 py-4 text-right">Precio Unit.</th>
                      <th className="px-6 py-4 text-right">Descuento</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaActiva.articulos?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-dark-border/40 text-sm">
                        <td className="px-6 py-4 text-white font-medium">{item.nombre}</td>
                        <td className="px-6 py-4 text-center font-bold">{item.cantidad}</td>
                        <td className="px-6 py-4 text-right">${Number(item.precio).toLocaleString('es-AR')}</td>
                        <td className="px-6 py-4 text-right">{item.descuentoPct > 0 ? `-${item.descuentoPct}%` : '-'}</td>
                        <td className="px-6 py-4 text-right text-white font-semibold">${((item.precio * item.cantidad) * (1 - (item.descuentoPct || 0)/100)).toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500"><FileText size={48} className="opacity-20" /></div>
        )}
      </section>

      {/* ZONA DE IMPRESIÓN COMPLETA CON HOOK DE ESTADO REACTIVO */}
      {ventaActiva && (
        <div className="hidden print:block bg-white text-black p-12 font-sans fixed inset-0 z-[99999] h-screen w-screen bg-white">
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
            <div>
              {/* RENDEREADO DESDE EL ESTADO DINÁMICO */}
              <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900 leading-none uppercase">
                {datosEmpresa.nombre.split(' ')[0]}
              </h1>
              <h1 className="text-4xl font-light tracking-widest text-gray-900 mb-4 leading-none uppercase">
                {datosEmpresa.nombre.split(' ').slice(1).join(' ') || ''}
              </h1>
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Venta de Materiales de Construcción</p>
              <p className="text-[11px] text-gray-700 mt-2">📍 {datosEmpresa.direccion}</p>
              <p className="text-[11px] text-gray-700">📞 Tel: {datosEmpresa.telefono}</p>
              <p className="text-[11px] text-gray-700">📄 CUIT: {datosEmpresa.cuit}</p>
            </div>
            
            <div className="flex flex-col gap-4 items-end">
              <div className="border border-gray-400 rounded p-3 w-72 bg-gray-50 text-left">
                <h3 className="bg-gray-200 font-bold text-[10px] uppercase p-1 mb-2 text-center border-b border-gray-400">PRESUPUESTO COMERCIAL</h3>
                <p className="text-xs"><strong>Documento N°:</strong> {ventaActiva.id}</p>
                <p className="text-xs"><strong>Fecha Emisión:</strong> {ventaActiva.fecha ? new Date(ventaActiva.fecha).toLocaleDateString('es-AR') : ''}</p>
                <p className="text-xs"><strong>Plazo Validez:</strong> 7 Días Corridos</p>
              </div>
              <div className="border border-gray-400 rounded overflow-hidden w-72 text-left">
                <h3 className="bg-gray-100 font-bold text-[10px] uppercase p-1.5 text-center border-b border-gray-400 tracking-wider text-gray-700">DATOS DEL CLIENTE</h3>
                <div className="p-3 bg-white">
                  <p className="text-xs font-bold text-gray-950 uppercase">{`${ventaActiva.nombre || ''} ${ventaActiva.apellido || ''}`.trim() || ventaActiva.cliente || 'Consumidor Final'}</p>
                  <p className="text-xs text-gray-700 mt-1">{ventaActiva.documento ? `CUIT/DNI: ${ventaActiva.documento}` : 'Consumidor Final'}</p>
                  <p className="text-xs text-gray-700">📍 {ventaActiva.direccion || 'San Salvador de Jujuy'} {ventaActiva.barrio ? `- B° ${ventaActiva.barrio}` : ''}</p>
                  {ventaActiva.telefono && <p className="text-xs text-gray-700">📞 Tel: {ventaActiva.telefono}</p>}
                </div>
              </div>
            </div>
          </div>

          <table className="w-full text-left mb-8 border-collapse">
            <thead>
              <tr className="bg-gray-100 text-[10px] text-gray-800 uppercase border-b-2 border-gray-800">
                <th className="p-2 font-bold">Ref/SKU</th>
                <th className="p-2 font-bold">Descripción del Material</th>
                <th className="p-2 font-bold text-right">Precio Unit.</th>
                <th className="p-2 font-bold text-center">Dto.</th>
                <th className="p-2 font-bold text-center">Cant.</th>
                <th className="p-2 font-bold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {ventaActiva.articulos?.map((item: any, index: number) => {
                const preUnit = Number(item.precio || 0);
                const totalItem = (preUnit * item.cantidad) * (1 - (item.descuentoPct || 0)/100);
                return (
                  <tr key={index} className="border-b border-gray-300 text-xs">
                    <td className="p-2 align-top text-gray-500 font-mono font-bold">{item.sku || 'N/A'}</td>
                    <td className="p-2 align-top font-bold text-gray-900">{item.nombre}</td>
                    <td className="p-2 align-top text-right">${preUnit.toLocaleString('es-AR')}</td>
                    <td className="p-2 align-top text-center">{item.descuentoPct > 0 ? `${item.descuentoPct}%` : '-'}</td>
                    <td className="p-2 align-top text-center font-bold">{item.cantidad}</td>
                    <td className="p-2 align-top text-right font-bold">${totalItem.toLocaleString('es-AR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between items-start mt-12">
            <div className="w-1/2 border border-dashed border-gray-400 rounded p-4 bg-gray-50 text-[10px] text-gray-600 leading-relaxed text-left">
              <strong>Condiciones Comerciales y de Acopio:</strong><br/>
              • Todos los precios expresados incluyen el Impuesto al Valor Agregado (IVA).<br/>
              • Los materiales bajo sistema de acopio disponen de un plazo de retiro máximo de 30 días.<br/>
              • Entregas sujetas a la diagramación logística de la flota de camiones.
            </div>
            <div className="w-72 border border-gray-400 rounded overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-50 w-1/2 text-left">Subtotal Bruto</td><td className="p-2 text-right">${Number(ventaActiva.subtotal).toLocaleString('es-AR')}</td></tr>
                  {ventaActiva.descuentoGlobal > 0 && <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-50 text-orange-600 text-left">Dto. Global ({ventaActiva.descuentoGlobal}%)</td><td className="p-2 text-right text-orange-600">-${(ventaActiva.subtotal * (ventaActiva.descuentoGlobal / 100)).toLocaleString('es-AR')}</td></tr>}
                  <tr className="bg-gray-900 text-white"><td className="p-2 font-extrabold text-sm uppercase text-left">Total Final</td><td className="p-2 text-right text-sm font-extrabold text-emerald-400">${Number(ventaActiva.total).toLocaleString('es-AR')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-16 text-center text-[10px] text-gray-500 border-t border-gray-200 pt-4">
            {datosEmpresa.nombre} — Establecimiento Comercial de materiales. <br/>
            Este documento constituye una cotización comercial estrictamente referencial e informativa. No válido como factura fiscal.
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN EXCLUSIVA DE ESTADO */}
      {modalEditarAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <form onSubmit={guardarEdicionVenta} className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Edit2 size={16} className="text-blue-400"/> Cambiar Estado</h3>
              <button type="button" onClick={() => setModalEditarAbierto(false)} className="text-gray-400 hover:text-white"><X size={18}/></button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Cliente</label>
              <input type="text" value={formEditar.cliente} className="w-full bg-dark-bg border border-dark-border rounded-xl p-2.5 text-sm text-gray-400 cursor-not-allowed" disabled />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Estado de la Cotización</label>
              <select value={formEditar.estado} onChange={(e) => setFormEditar({...formEditar, estado: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold">
                <option value="PENDIENTE">PENDIENTE ⏳</option>
                <option value="CONFIRMADA">CONFIRMADA  ✅</option>
                <option value="CANCELADA">CANCELADA ❌</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalEditarAbierto(false)} className="flex-1 px-4 py-2 text-sm bg-dark-input border border-dark-border rounded-xl text-gray-300 hover:bg-dark-hover">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Save size={14}/> Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE ELIMINAR */}
      {modalEliminarAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-center mb-4 text-rose-500 bg-rose-500/10 w-16 h-16 rounded-full items-center mx-auto border border-rose-500/20">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">¿Anular comprobante?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">Estás a punto de eliminar la venta <strong>{modalEliminarAbierto}</strong>.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalEliminarAbierto(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-dark-input hover:bg-dark-hover border border-dark-border rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmarEliminacion} className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}