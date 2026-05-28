import empresaDefault from '../data/datos';
import React, { useState } from 'react';
import { 
  Home, Box, Users, ShoppingCart, FileText, BarChart2, Settings, 
  X, Building2, Phone, Mail, MapPin 
} from 'lucide-react';

export default function MainLayout({ children, vistaActual, setVistaActual }) {
  // Estado para controlar si el modal de configuración está abierto
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [empresa, setEmpresa] = useState(() => {
    const guardado = localStorage.getItem('empresa');

    return guardado
      ? JSON.parse(guardado)
      : empresaDefault;
});

  // Le agregamos la propiedad 'label' a cada botón
  const menuItems = [
    { id: 'inicio', icon: Home, label: 'Inicio' },
    { id: 'productos', icon: Box, label: 'Inventario' },
    { id: 'clientes', icon: Users, label: 'Clientes' },
    { id: 'carrito', icon: ShoppingCart, label: 'Nueva Venta' },
    { id: 'ventas', icon: FileText, label: 'Historial' },
    { id: 'reportes', icon: BarChart2, label: 'Estadísticas' },
  ];

  return (
    <div className="flex h-screen w-full relative">
      
      {/* ESPACIADOR FIJO: Evita que el contenido principal salte cuando la barra se expande */}
      <div className="w-20 flex-shrink-0 bg-dark-bg z-0"></div>

      {/* BARRA LATERAL (Se expande con group-hover) */}
      <aside className="group absolute left-0 top-0 h-full w-20 hover:w-64 bg-dark-sidebar border-r border-dark-border flex flex-col justify-between py-6 z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl shadow-black/50">
        
        <div className="flex flex-col gap-8 w-full">
          {/* Logo y Nombre de la Empresa */}
          <div className="flex items-center px-5 h-10 w-full whitespace-nowrap overflow-hidden">
            <div className="min-w-[40px] w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-bold transition-all">
              CN
            </div>
            <span className="ml-4 font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
              Corralón Nina
            </span>
          </div>
          
          {/* Menú de navegación */}
          <nav className="flex flex-col gap-2 w-full px-3">
            {menuItems.map((item) => {
              const Icono = item.icon;
              const activo = vistaActual === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  className={`flex items-center px-3.5 h-12 rounded-xl transition-all whitespace-nowrap overflow-hidden ${
                    activo 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-dark-hover border border-transparent'
                  }`}
                >
                  <div className="min-w-[20px] flex justify-center">
                    <Icono size={20} />
                  </div>
                  <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Botón de configuración inferior */}
        <div className="px-3">
          <button 
            onClick={() => setMostrarConfig(true)}
            className="flex items-center px-3.5 h-12 w-full rounded-xl text-gray-500 hover:text-gray-300 hover:bg-dark-hover transition-all whitespace-nowrap overflow-hidden border border-transparent"
          >
            <div className="min-w-[20px] flex justify-center">
              <Settings size={20} />
            </div>
            <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
              Configuración
            </span>
          </button>
        </div>
      </aside>

      {/* ÁREA DINÁMICA: Acá se inyecta la pantalla que elijamos */}
      <main className="flex-1 flex overflow-hidden z-10">
        {children}
      </main>

      {/* MODAL DE CONFIGURACIÓN DE LA EMPRESA */}
      {mostrarConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-sidebar/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="text-emerald-400" size={22} /> Datos de la Empresa
              </h2>
              <button 
                onClick={() => setMostrarConfig(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Razón Social / Nombre Comercial</label>
                  <input
                    type="text"
                    value={empresa.nombre}
                    onChange={(e) =>
                      setEmpresa({ ...empresa, nombre: e.target.value })
                    }
                    className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  />                
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">CUIT</label>
                 <input
                    type="text"
                    value={empresa.cuit}
                    onChange={(e) =>
                      setEmpresa({ ...empresa, cuit: e.target.value })
                    }
                    className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3 text-gray-500" />
                    <input
                      type="text"
                      value={empresa.telefono}
                      onChange={(e) =>
                        setEmpresa({ ...empresa, telefono: e.target.value })
                      }
                      className="w-full bg-dark-input border border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Dirección</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-gray-500" />
                    <input
                      type="text"
                      value={empresa.direccion}
                      onChange={(e) =>
                        setEmpresa({ ...empresa, direccion: e.target.value })
                      }
                      className="w-full bg-dark-input border border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-6 border-t border-dark-border bg-dark-sidebar/50 flex justify-end gap-3">
              <button 
                onClick={() => setMostrarConfig(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
             <button 
                onClick={() => {
                  localStorage.setItem('empresa', JSON.stringify(empresa));
                  setMostrarConfig(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/20"
              >
                Guardar Cambios
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}