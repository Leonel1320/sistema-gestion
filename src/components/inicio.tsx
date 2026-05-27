import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, FileText, AlertTriangle, Box, 
  Clock, ArrowRight, PlusCircle, UserPlus, PackagePlus 
} from 'lucide-react';

interface InicioProps {
  setVistaActual: (vista: string) => void;
}

export default function Inicio({ setVistaActual }: { setVistaActual?: (vista: string) => void }) {
  // Estados para las métricas del servidor
  const [metricas, setMetricas] = useState({
    ventasMes: 0,
    pendientes: 0,
    stockBajo: 0,
    totalProductos: 0
  });
  const [actividad, setActividad] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar métricas reales en caliente desde Postgres
  const cargarDatosDashboard = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dashboard');
      if (res.ok) {
        const datos = await res.json();
        setMetricas({
          ventasMes: Number(datos.ventasMes),
          pendientes: Number(datos.pendientes),
          stockBajo: Number(datos.stockBajo),
          totalProductos: Number(datos.totalProductos)
        });
        setActividad(datos.actividadReciente);
      }
    } catch (error) {
      console.error("Error al conectar con la API de métricas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  // Función de escape por si no pasan la propiedad
  const irAVista = (vista: string) => {
    if (setVistaActual) setVistaActual(vista);
  };

  return (
    <div className="flex-1 p-8 bg-dark-bg overflow-y-auto select-none">
      
      {/* SALUDO DE BIENVENIDA */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Hola, Corralón Nina 👋</h1>
        <p className="text-sm text-gray-400 mt-1">Este es el resumen general de hoy conectado a PostgreSQL.</p>
      </div>

      {/* --- SECCIÓN DE TARJETAS INDICADORAS (KPIs) --- */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        
        {/* Tarjeta 1: Ventas del Mes (Etiqueta corregida aquí) */}
        <div className="bg-dark-panel border border-dark-border p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/20 group hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ventas del Mes</span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400"><TrendingUp size={20} /></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white leading-tight">
              ${metricas.ventasMes.toLocaleString('es-AR')}
            </h2>
          </div>
        </div>

        {/* Tarjeta 2: Cotizaciones Pendientes */}
        <div className="bg-dark-panel border border-dark-border p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/20 group hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cotizaciones Pendientes</span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400"><FileText size={20} /></div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{metricas.pendientes}</h2>
          </div>
        </div>

        {/* Tarjeta 3: Materiales con Stock Bajo */}
        <div className="bg-dark-panel border border-dark-border p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/20 group hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Bajo (⚠️)</span>
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400"><AlertTriangle size={20} /></div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">
              {metricas.stockBajo} {metricas.stockBajo === 1 ? 'Material' : 'Materiales'}
            </h2>
          </div>
        </div>

        {/* Tarjeta 4: Total Productos Registrados */}
        <div className="bg-dark-panel border border-dark-border p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/20 group hover:border-blue-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Productos</span>
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400"><Box size={20} /></div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{metricas.totalProductos}</h2>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-3 gap-8">
        
        {/* GRILLA IZQUIERDA: ACTIVIDAD RECIENTE DINÁMICA */}
        <div className="col-span-2 bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Actividad Reciente</h3>
            <button 
              onClick={() => irAVista('ventas')} 
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              Ver todo <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {actividad.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">No se registran movimientos recientes.</div>
            ) : (
              actividad.map((item, idx) => {
                const clienteNombre = `${item.nombre || ''} ${item.apellido || ''}`.trim() || item.cliente || 'Consumidor Final';
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border/40 rounded-xl text-sm hover:bg-dark-hover transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        item.estado === 'CONFIRMADA' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {item.estado === 'CONFIRMADA' ? 'Venta confirmada' : 'Nueva cotización creada'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Comprobante {item.id} para {clienteNombre}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white block">${Number(item.total).toLocaleString('es-AR')}</span>
                      <span className="text-[10px] text-gray-500">{item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : ''}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* GRILLA DERECHA: ACCESOS RÁPIDOS OPERATIVOS */}
        <div className="col-span-1 bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight mb-6">Accesos Rápidos</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => irAVista('carrito')} 
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98]"
              >
                <PlusCircle size={16} /> + Nueva Cotización
              </button>

              <button 
                onClick={() => irAVista('productos')} 
                className="w-full flex items-center justify-center gap-2 py-3 bg-dark-input hover:bg-dark-hover border border-dark-border text-gray-300 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                <PackagePlus size={16} /> + Cargar Producto
              </button>

              <button 
                onClick={() => irAVista('clientes')} 
                className="w-full flex items-center justify-center gap-2 py-3 bg-dark-input hover:bg-dark-hover border border-dark-border text-gray-300 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                <UserPlus size={16} /> + Registrar Cliente
              </button>
            </div>
          </div>

          <div className="text-[10px] text-gray-600 text-center mt-6 border-t border-dark-border/40 pt-4">
            Sistema Nina ERP v1.4 • Conectado a Postgres Local
          </div>
        </div>

      </div>

    </div>
  );
}