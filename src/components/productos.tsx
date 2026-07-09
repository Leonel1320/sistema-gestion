import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit2, Box, 
  X, Save, AlertTriangle, Zap, FileSpreadsheet 
} from 'lucide-react';
// Importamos la librería para procesar de manera estricta la plantilla en el cliente
import * as XLSX from 'xlsx';

const CATEGORIAS_CORRALON = [
  "Áridos y Cantera",
  "Liantes y Mezclas",
  "Hierros y Acero",
  "Mampostería",
  "Techados y Cielo Raso",
  "Seguridad y Conectividad",
  "Herramientas y Accesorios",
  "Plomería y Electricidad"
];

export default function Productos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState<any | null>(null);
  const [errorPrecio, setErrorPrecio] = useState<string | null>(null);

  const [modalMasivoAbierto, setModalMasivoAbierto] = useState(false);
  const [base64Excel, setBase64Excel] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  const [resultadoMasivo, setResultadoMasivo] = useState<any | null>(null);

  const [form, setForm] = useState({
    id: '',
    sku: '',
    nombre: '',
    descripcion: '',
    marca: '',
    categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock: ''
  });

  const cargarProductos = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/productos');
      if (res.ok) {
        const datos = await res.json();
        setProductos(datos);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const productosFiltrados = productos.filter(p => {
    const term = busqueda.toLowerCase();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.categoria && p.categoria.toLowerCase().includes(term))
    );
  });

  const abrirModal = (prod: any = null) => {
    setErrorPrecio(null);
    if (prod) {
      setProductoSeleccionado(prod);
      setForm({
        id: prod.id || '',
        sku: prod.sku || '',
        nombre: prod.nombre || '',
        descripcion: prod.descripcion || '',
        marca: prod.marca || '',
        categoria: prod.categoria || '', 
        precio_compra: prod.precio_compra !== undefined ? prod.precio_compra : '',
        precio_venta: prod.precio_venta !== undefined ? prod.precio_venta : '',
        stock: prod.stock !== undefined ? prod.stock : ''
      });
    } else {
      setProductoSeleccionado(null);
      setForm({ id: '', sku: '', nombre: '', descripcion: '', marca: '', categoria: CATEGORIAS_CORRALON[0], precio_compra: '', precio_venta: '', stock: '' });
    }
    setModalAbierto(true);
  };

  // --- NUEVO MANEJADOR DE ARCHIVOS OPTIMIZADO PARA TEXTO PLANO ---
  const handleCambioArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);

    const reader = new FileReader();
    reader.onload = (evento) => {
      try {
        const data = new Uint8Array(evento.target?.result as ArrayBuffer);
        
        // Forzamos la lectura exacta del archivo interpretando celdas como texto visible
        const workbook = XLSX.read(data, { 
          type: 'array',
          raw: false // <-- CLAVE: Captura los formatos "$ 1.915,76" de forma literal para el back
        });
        
        const nombreHoja = workbook.SheetNames[0];
        const hoja = workbook.Sheets[nombreHoja];
        
        // Convertimos la matriz a un objeto JSON estructurado desde el navegador
        const filasJson = XLSX.utils.sheet_to_json(hoja, { defval: "" });
        
        // Lo serializamos y convertimos a un String Base64 limpio libre de pérdidas por codificación regional
        const jsonString = JSON.stringify(filasJson);
        const base64Limpio = btoa(unescape(encodeURIComponent(jsonString)));
        
        setBase64Excel(base64Limpio);
        setErrorPrecio(null);
      } catch (err) {
        console.error("Error al procesar la estructura del archivo:", err);
        alert("No se pudo interpretar el archivo seleccionado.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportacionMasiva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!base64Excel) return alert('Por favor, selecciona un archivo primero.');

    setProcesandoMasivo(true);
    setResultadoMasivo(null);

    try {
      const response = await fetch('http://localhost:5000/api/productos/importar-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64File: base64Excel }),
      });

      const data = await response.json();

      if (response.ok) {
        setResultadoMasivo(data);
        setBase64Excel(null);
        setNombreArchivo('');
        cargarProductos(); // Refresca instantáneamente tu grilla física en pantalla
      } else {
        alert(`Error del servidor: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al conectar con el backend.');
    } finally {
      setProcesandoMasivo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPrecio(null);

    const compraNum = Number(form.precio_compra) || 0;
    const ventaNum = Number(form.precio_venta) || 0;
    const stockInt = parseInt(form.stock) || 0;

    if (compraNum >= ventaNum) {
      setErrorPrecio("⚠️ El precio de venta debe ser mayor al costo de compra para no generar pérdidas.");
      return; 
    }

    if (stockInt < 0) {
      setErrorPrecio("⚠️ El stock inicial no puede ser un número negativo.");
      return;
    }

    const esEdicion = !!productoSeleccionado;
    const url = esEdicion 
      ? `http://localhost:5000/api/productos/${form.id}` 
      : 'http://localhost:5000/api/productos';
    const method = esEdicion ? 'PUT' : 'POST';

    let skuFinal = form.sku;
    if (!esEdicion) {
      const raiz = form.nombre.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'MAT');
      const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
      skuFinal = `${raiz}-${numeroAleatorio}`;
    }

    const payload = {
      sku: skuFinal,
      nombre: form.nombre,
      descripcion: form.descripcion,
      marca: form.marca,
      categoria: form.categoria, 
      precio_compra: compraNum,
      precio_venta: ventaNum,
      stock: stockInt
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setModalAbierto(false);
        cargarProductos();
      } else {
        alert("Error al guardar en la base de datos.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const ejecutarEliminacion = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/productos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setModalEliminarAbierto(null);
        cargarProductos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex-1 p-8 bg-dark-bg overflow-y-auto select-none">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Materiales y Productos</h1>
          <p className="text-sm text-gray-400 mt-1">Esquema físico sincronizado con las columnas reales de pgAdmin.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => { setResultadoMasivo(null); setModalMasivoAbierto(true); }} 
            className="flex items-center gap-2 bg-dark-panel border border-cyan-500/40 hover:bg-dark-hover text-cyan-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg"
          >
            <FileSpreadsheet size={18} /> Carga Masiva
          </button>

          <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-950/20">
            <Plus size={18} /> Nuevo Material
          </button>
        </div>
      </div>

      {/* FILTRO BUSCADOR */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por SKU, nombre o rubro..." className="w-full bg-dark-panel border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-emerald-500" />
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-dark-panel border border-dark-border rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-dark-sidebar text-xs text-gray-400 border-b border-dark-border uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Material / Datos</th>
              <th className="px-6 py-4">Rubro / Marca</th>
              <th className="px-6 py-4 text-right">Costo Compra</th>
              <th className="px-6 py-4 text-right">Precio Venta</th>
              <th className="px-6 py-4 text-center">Stock</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/40">
            {productosFiltrados.map((p) => {
              const stockNum = Number(p.stock || 0);
              const stockCritico = stockNum <= 10;

              return (
                <tr key={p.id} className="hover:bg-dark-hover transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-400">{p.sku || 'S/N'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-dark-input rounded-lg text-gray-400"><Box size={16}/></div>
                      <div>
                        <p className="font-bold text-white">{p.nombre}</p>
                        {p.descripcion && <p className="text-[11px] text-gray-500 truncate w-64">{p.descripcion}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs space-y-0.5">
                    {p.categoria && <p className="text-white font-semibold"><span className="text-gray-500 font-normal">Rubro:</span> {p.categoria}</p>}
                    {p.marca && <p className="text-gray-400"><span className="text-gray-600">Marca:</span> {p.marca}</p>}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-400">${Number(p.precio_compra).toLocaleString('es-AR')}</td>
                  <td className="px-6 py-4 text-right font-extrabold text-white">${Number(p.precio_venta).toLocaleString('es-AR')}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold flex items-center justify-center gap-1.5 mx-auto w-24 ${
                      stockNum <= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      stockCritico ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                    }`}>
                      {stockCritico && <AlertTriangle size={12} />}
                      {stockNum} Unid.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => abrirModal(p)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-600/20"><Edit2 size={14}/></button>
                      <button onClick={() => setModalEliminarAbierto(p)} className="p-2 bg-rose-600/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-600/20"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL IMPORTACIÓN MASIVA */}
      {modalMasivoAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1e] border border-dark-border rounded-2xl p-6 max-w-md w-full relative space-y-4">
            <button onClick={() => setModalMasivoAbierto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="text-cyan-500" /> Importar desde Excel / CSV
            </h3>
            <p className="text-xs text-gray-400">
              Cargá tu archivo estructurado. El sistema sincronizará de forma segura: SKU, Nombre, Marca, Costo, Stock y Detalles.
            </p>

            <form onSubmit={handleImportacionMasiva} className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-xl p-6 bg-dark-input hover:border-cyan-500/50 transition-colors relative">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv"
                  onChange={handleCambioArchivo}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={procesandoMasivo}
                />
                <Zap size={32} className={base64Excel ? "text-emerald-500 mb-2" : "text-gray-600 mb-2"} />
                <span className="text-sm text-gray-300 font-medium text-center">
                  {nombreArchivo ? `✅ ${nombreArchivo}` : "Seleccionar plantilla .xlsx o .csv"}
                </span>
              </div>

              {resultadoMasivo && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800 text-cyan-200 text-xs space-y-1">
                  <p className="font-bold text-white">✨ ¡Sincronización finalizada correctamente!</p>
                  <p>• Nuevos materiales cargados: {resultadoMasivo.estadisticas?.insertados}</p>
                  <p>• Precios e inventario actualizados: {resultadoMasivo.estadisticas?.actualizados}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-dark-border pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalMasivoAbierto(false)} 
                  className="px-4 py-2 text-sm bg-dark-input border border-dark-border rounded-xl text-gray-300 hover:bg-dark-hover"
                  disabled={procesandoMasivo}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-colors"
                  disabled={procesandoMasivo || !base64Excel}
                >
                  {procesandoMasivo ? 'Procesando...' : 'Subir y Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRADICIONAL DE CREAR / EDITAR INDIVIDUAL */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <h3 className="text-lg font-bold text-white">
                {productoSeleccionado ? '✏️ Modificar Registro' : '📦 Crear Nuevo Material'}
              </h3>
              <button type="button" onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>

            {errorPrecio && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                {errorPrecio}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">SKU</label>
                <input type="text" value={productoSeleccionado ? form.sku : "AUTO-GEN ✨"} className="w-full bg-dark-bg border border-dark-border rounded-xl p-2.5 text-sm text-center text-emerald-400 font-mono font-bold cursor-not-allowed" disabled />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-400 block mb-1">Nombre del Material *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Categoría / Rubro *</label>
                <select value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold" required>
                  {CATEGORIAS_CORRALON.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Marca del Fabricante</label>
                <input type="text" value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Descripción Técnica</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 h-16 resize-none" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Costo Comp ($) *</label>
                <input type="number" step="any" value={form.precio_compra} onChange={(e) => setForm({...form, precio_compra: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Precio Venta ($) *</label>
                <input type="number" step="any" value={form.precio_venta} onChange={(e) => setForm({...form, precio_venta: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Stock Inicial *</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} className="w-full bg-dark-input border border-dark-border rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-dark-border pt-4">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm bg-dark-input border border-dark-border rounded-xl text-gray-300 hover:bg-dark-hover">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"><Save size={16}/> Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalEliminarAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-center mx-auto text-rose-500 bg-rose-500/10 w-12 h-12 rounded-full items-center border border-rose-500/20"><AlertTriangle size={24} /></div>
            <h3 className="text-lg font-bold text-white">¿Eliminar material?</h3>
            <p className="text-gray-400 text-sm">Esta acción quitará a <span className="text-rose-400 font-bold">{modalEliminarAbierto.nombre}</span> de PostgreSQL.</p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalEliminarAbierto(null)} className="flex-1 px-4 py-2 text-sm text-gray-300 bg-dark-input border border-dark-border rounded-xl hover:bg-dark-hover">Cancelar</button>
              <button type="button" onClick={() => ejecutarEliminacion(modalEliminarAbierto.id)} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}