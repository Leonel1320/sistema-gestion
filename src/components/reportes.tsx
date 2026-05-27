import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, CheckCircle2, DollarSign, Award, 
  PieChart, Download, Calendar, Activity 
} from 'lucide-react';

export default function Reportes() {
  const [datos, setDatos] = useState<any>({
    ingresos: 0,
    cerradas: 0,
    ticketPromedio: 0,
    difIngresosPct: 0,
    difCerradasPct: 0,
    difTicketPct: 0,
    masVendidos: [],
    categorias: []
  });
  const [cargando, setCargando] = useState(true);

  const cargarEstadisticas = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reportes');
      if (res.ok) {
        const resJson = await res.json();
        setDatos(resJson);
      }
    } catch (error) {
      console.error("Error al traer reportes:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // Función interna para renderizar los badges dinámicos de porcentaje
  const renderBadgePorcentaje = (porcentaje: number) => {
    const esPositivo = porcentaje >= 0;
    const signo = esPositivo ? '+' : '';
    const colorClass = esPositivo 
      ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900' 
      : 'text-rose-400 bg-rose-950/30 border-rose-900';
    const flecha = esPositivo ? '↗' : '↘';

    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colorClass}`}>
        {signo}{porcentaje}% {flecha}
      </span>
    );
  };

  return (
    <div className="flex-1 p-8 bg-dark-bg overflow-y-auto select-none">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Reportes y Estadísticas</h1>
          <p className="text-sm text-gray-400 mt-1">Métricas de rendimiento neto extraídas en tiempo real de PostgreSQL.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-dark-panel border border-dark-border hover:bg-dark-hover text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Calendar size={16} /> Este Mes
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-950/20">
            <Download size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* --- TARJETAS KPIs CON MATEMÁTICA REAL --- */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Ganancia Real */}
        <div className="bg-dark-panel border border-dark-border p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ganancia Real (Venta - Costo)</span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400"><TrendingUp size={20} /></div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-black text-white tracking-tight">
                ${Number(datos.ingresos).toLocaleString('es-AR')}
              </h2>
              {renderBadgePorcentaje(datos.difIngresosPct)}
            </div>
          </div>
        </div>

        {/* Card 2: Ventas Cerradas */}
        <div className="bg-dark-panel border border-dark-border p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ventas Cerradas</span>
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400"><CheckCircle2 size={20} /></div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-black text-white tracking-tight">{datos.cerradas}</h2>
              {renderBadgePorcentaje(datos.difCerradasPct)}
            </div>
          </div>
        </div>

        {/* Card 3: Ticket Promedio Real */}
        <div className="bg-dark-panel border border-dark-border p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket Promedio por Venta</span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400"><DollarSign size={20} /></div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-black text-white tracking-tight">
                ${Math.round(datos.ticketPromedio).toLocaleString('es-AR')}
              </h2>
              {renderBadgePorcentaje(datos.difTicketPct)}
            </div>
          </div>
        </div>

      </div>

      {/* --- SECCIÓN INFERIOR: DETALLES --- */}
      <div className="grid grid-cols-3 gap-8">
        
        <div className="col-span-2 bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 border-b border-dark-border pb-4">
            <Award className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold text-white tracking-tight">Equipos más vendidos</h3>
          </div>

          <div className="space-y-6">
            {datos.masVendidos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Sin registros de ventas este mes.</p>
            ) : (
              datos.masVendidos.map((prod: any, idx: number) => {
                const maxUnidades = Number(datos.masVendidos[0]?.unidades || 1);
                const porcentajeBarra = Math.min(100, Math.round((prod.unidades / maxUnidades) * 100));

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-200 font-medium">{prod.nombre}</span>
                      <span className="font-bold text-white font-mono">{prod.unidades} unid.</span>
                    </div>
                    <div className="w-full h-2.5 bg-dark-input rounded-full overflow-hidden border border-dark-border/40">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${porcentajeBarra}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-span-1 bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 border-b border-dark-border pb-4">
              <PieChart className="text-blue-400" size={20} />
              <h3 className="text-lg font-bold text-white tracking-tight">Por Categoría</h3>
            </div>

            <div className="space-y-4">
              {datos.categorias.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Sin categorías registradas.</p>
              ) : (
                datos.categorias.map((cat: any, idx: number) => {
                  const esCamara = cat.nombre.includes('Cámaras');
                  const esAlarma = cat.nombre.includes('Alarmas');
                  const colorCirculo = esCamara ? 'bg-emerald-500' : esAlarma ? 'bg-blue-500' : 'bg-amber-500';

                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border/30 rounded-xl text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${colorCirculo}`}></div>
                        <span className="text-gray-300 font-medium">{cat.nombre}</span>
                      </div>
                      <span className="font-black text-white font-mono">{cat.porcentaje}%</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {datos.categorias.length > 0 && (
            <div className="mt-6 p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-xl flex items-start gap-3">
              <Activity className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-gray-400 leading-normal">
                Las métricas reflejan la rentabilidad neta real cruzando precios de lista contra costos de compra.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}