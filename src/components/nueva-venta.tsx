import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Trash2, User, Plus, Minus, Box, CheckCircle2, Percent, AlertTriangle, Printer, FileCheck2, Barcode 
} from 'lucide-react';
import empresaDefault from '../data/datos'; 

export default function NuevaVenta() {
  const [productosInventario, setProductosInventario] = useState<any[]>([]);
  const [clientesDirectorio, setClientesDirectorio] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarDesplegable, setMostrarDesplegable] = useState(false);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [descuentoGlobalPct, setDescuentoGlobalPct] = useState(0);
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [idCotizacionActual, setIdCotizacionActual] = useState('');
  
  // --- ESTADOS NUEVOS PARA EL LECTOR DE CÓDIGO DE BARRAS ---
  const [productoEscaneado, setProductoEscaneado] = useState<any | null>(null);
  const bufferRef = useRef(''); // Guarda los números que tipea la pistola en milisegundos
  const ultimoPistolazoRef = useRef(0);

  const [datosEmpresa, setDatosEmpresa] = useState({
    nombre: empresaDefault.nombre,
    telefono: empresaDefault.telefono,
    direccion: empresaDefault.direccion,
    cuit: empresaDefault.cuit
  });

  // Carga inicial desde PostgreSQL
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resProd, resCli, resEmp] = await Promise.all([
          fetch('http://localhost:5000/api/productos'),
          fetch('http://localhost:5000/api/clientes'),
          fetch('http://localhost:5000/api/empresa')
        ]);
        
        const dataProd = await resProd.json();
        const dataCli = await resCli.json();
        
        setProductosInventario(dataProd.map((p: any) => ({
          id: p.id,
          sku: p.sku, // <--- Este campo de pgAdmin va a ser tu código de barras físico
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioCompra: Number(p.precio_compra),
          precio: Number(p.precio_venta),
          stock: p.stock
        })));
        
        setClientesDirectorio(dataCli);
        
        if (dataCli.length > 0) {
          setClienteSeleccionado(dataCli[0].id);
          setBusquedaCliente(dataCli[0].nombre);
        }

        if (resEmp.ok) {
          const dataEmp = await resEmp.json();
          if (dataEmp) {
            setDatosEmpresa({
              nombre: dataEmp.razon_social || empresaDefault.nombre,
              telefono: dataEmp.telefono || empresaDefault.telefono,
              direccion: dataEmp.direccion || empresaDefault.direccion,
              cuit: dataEmp.cuit || empresaDefault.cuit
            });
          }
        }
      } catch (err) { 
        console.error("Error al cargar datos desde PostgreSQL:", err); 
      }
    };
    cargarDatos();
  }, []);

  // =========================================================================
  // 💥 ESCUCHADOR GLOBAL DE LA PISTOLA DE CÓDIGO DE BARRAS
  // =========================================================================
  useEffect(() => {
    const handleKeyPressGlobal = (e: KeyboardEvent) => {
      // Ignorar si el usuario está tipeando manualmente adentro del buscador o campos de texto
      const elementoActivo = document.activeElement?.tagName;
      if (elementoActivo === 'INPUT' || elementoActivo === 'TEXTAREA' || elementoActivo === 'SELECT') {
        // Excepción: Si el foco está en un input pero se presiona 'Enter', procesamos lo acumulado
        if (e.key !== 'Enter') return;
      }

      const tiempoActual = Date.now();
      
      // Si pasó mucho tiempo entre tecla y tecla, asumimos que es un humano lento y limpiamos el buffer
      if (tiempoActual - ultimoPistolazoRef.current > 50 && e.key !== 'Enter') {
        bufferRef.current = '';
      }
      
      ultimoPistolazoRef.current = tiempoActual;

      if (e.key === 'Enter') {
        // Al apretar Enter la pistola finaliza la lectura
        const codigoFinal = bufferRef.current.trim().toUpperCase();
        if (codigoFinal.length > 2) {
          // Buscamos si el código de barras matchea con alguna columna SKU de la base de datos
          const encontrado = productosInventario.find(p => p.sku && p.sku.toUpperCase() === codigoFinal);
          if (encontrado) {
            setProductoEscaneado(encontrado); // Abre la alerta flotante con el producto
          } else {
            // Si no coincide, podemos opcionalmente alertar o buscar coincidencias parciales
            console.log(`Código escaneado "${codigoFinal}" no registrado en Postgres.`);
          }
        }
        bufferRef.current = ''; // Limpiamos para el próximo pistolazo
      } else {
        // Vamos acumulando los caracteres que tipea la ráfaga láser de la pistola
        if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPressGlobal);
    return () => window.removeEventListener('keydown', handleKeyPressGlobal);
  }, [productosInventario]);

  // Atajo de teclado: Si la alerta de escaneo está abierta y presionás "Enter", se agrega directo
  useEffect(() => {
    const presionarEnterConfirmar = (e: KeyboardEvent) => {
      if (productoEscaneado && e.key === 'Enter') {
        e.preventDefault();
        agregarAlCarrito(productoEscaneado);
        setProductoEscaneado(null);
      }
    };
    window.addEventListener('keydown', presionarEnterConfirmar);
    return () => window.removeEventListener('keydown', presionarEnterConfirmar);
  }, [productoEscaneado]);


  const clienteActivo = clientesDirectorio.find(c => c.id === Number(clienteSeleccionado)) || clientesDirectorio[0] || { nombre: 'Consumidor Final', documento: '', telefono: '', direccion: '' };
  const clientesFiltrados = clientesDirectorio.filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()));

  const agregarAlCarrito = (producto: any) => {
    setCarrito((prev: any[]) => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1, descuentoPct: 0 }];
    });
  };

  const actualizarCantidad = (id: number, delta: number) => {
    setCarrito((prev: any[]) => prev.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidad + delta;
        return { ...item, cantidad: nuevaCant > 0 ? nuevaCant : 1 };
      }
      return item;
    }));
  };

  const actualizarCantidadInput = (id: number, valor: string) => {
    const nuevaCant = parseInt(valor);
    setCarrito((prev: any[]) => prev.map(item => 
      item.id === id ? { ...item, cantidad: isNaN(nuevaCant) || nuevaCant < 1 ? 1 : nuevaCant } : item
    ));
  };

  const actualizarDescuentoItem = (id: number, porcentaje: string) => {
    const pct = Number(porcentaje);
    setCarrito((prev: any[]) => prev.map(item => 
      item.id === id ? { ...item, descuentoPct: pct >= 0 && pct <= 100 ? pct : 0 } : item
    ));
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito((prev: any[]) => prev.filter(item => item.id !== id));
  };

  const subtotalBruto = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const ahorroPorItems = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad * (item.descuentoPct / 100)), 0);
  const subtotalNeto = subtotalBruto - ahorroPorItems;
  const ahorroGlobal = subtotalNeto * ((descuentoGlobalPct || 0) / 100);
  const totalFinal = subtotalNeto - ahorroGlobal;

  const tieneErroresMargen = carrito.some(item => {
    const descIndividualMult = 1 - (item.descuentoPct / 100);
    const descGlobalMult = 1 - ((descuentoGlobalPct || 0) / 100);
    const precioFinalUnidad = item.precio * descIndividualMult * descGlobalMult;
    return precioFinalUnidad < item.precioCompra;
  });

  const productosFiltrados = productosInventario.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleConfirmarVenta = async () => {
    const nuevoId = `COT-${Date.now().toString().slice(-6)}`;
    setIdCotizacionActual(nuevoId);

    const nuevaCotizacion = {
      id: nuevoId,
      cliente_id: clienteActivo.id,
      subtotal: subtotalNeto,
      descuentoGlobal: descuentoGlobalPct,
      total: totalFinal,
      articulos: carrito
    };

    try {
      const respuesta = await fetch('http://localhost:5000/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaCotizacion)
      });
      if (respuesta.ok) setVentaExitosa(true);
    } catch (err) { 
      console.error("Error en el POST:", err); 
    }
  };

  const resetearPuntoDeVenta = () => {
    setCarrito([]);
    setDescuentoGlobalPct(0);
    setBusqueda('');
    setVentaExitosa(false);
    if (clientesDirectorio.length > 0) {
      setClienteSeleccionado(clientesDirectorio[0].id);
      setBusquedaCliente(clientesDirectorio[0].nombre);
    }
  };
  
  const imprimirTicket = () => window.print();

  return (
    <>
      <div className="flex flex-1 overflow-hidden bg-dark-bg relative print:hidden h-full">
        
        {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
        <section className="flex-1 flex flex-col border-r border-dark-border z-0">
          <div className="p-6 border-b border-dark-border bg-dark-panel flex justify-between items-center gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3">Punto de Venta</h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar materiales por nombre o código..." 
                  className="w-full bg-dark-input border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Icono de estado del Lector Láser */}
            <div className="bg-dark-input border border-dark-border/60 rounded-xl px-4 py-3 flex items-center gap-2.5 mt-8 text-gray-400 select-none">
              <Barcode size={20} className="text-emerald-400 animate-pulse" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none">Lector de Barra</p>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5 leading-none">Listo / Escuchando</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Materiales Frecuentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {productosFiltrados.map((prod) => (
                <button 
                  key={prod.id}
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-dark-panel border border-dark-border hover:border-emerald-500/50 hover:bg-dark-hover rounded-xl p-4 text-left transition-all flex flex-col gap-2 group"
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="p-2 bg-dark-input border border-dark-border rounded-lg text-gray-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors font-mono text-[10px] font-bold">
                      {prod.sku}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-dark-bg px-2 py-1 rounded-md border border-dark-border">
                      Stock: {prod.stock}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm mt-1 leading-tight truncate w-40">{prod.nombre}</p>
                    <p className="font-bold text-emerald-400 mt-2">${prod.precio.toLocaleString('es-AR')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN DERECHA: CARRITO */}
        <section className="w-[480px] bg-dark-panel flex flex-col z-0 shadow-2xl">
          <div className="p-6 border-b border-dark-border bg-dark-sidebar/50 relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <User size={18} className="text-emerald-400" /> Cliente
              </h3>
            </div>
            
            <div className="relative">
              <input 
                type="text"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setMostrarDesplegable(true);
                }}
                onFocus={() => setMostrarDesplegable(true)}
                onBlur={() => setTimeout(() => setMostrarDesplegable(false), 250)}
                placeholder="Escribí el nombre del cliente..."
                className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              
              {mostrarDesplegable && busquedaCliente && (
                <div className="absolute w-full bg-dark-input border border-dark-border rounded-xl mt-1 z-50 max-h-48 overflow-y-auto shadow-2xl divide-y divide-dark-border">
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map(cliente => (
                      <div 
                        key={cliente.id}
                        onMouseDown={() => {
                          setClienteSeleccionado(cliente.id);
                          setBusquedaCliente(cliente.nombre);
                          setMostrarDesplegable(false);
                        }}
                        className="px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-hover hover:text-white cursor-pointer transition-colors"
                      >
                        {cliente.nombre}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2.5 text-sm text-gray-500">No se encontraron coincidencias</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-gray-400" />
                <h3 className="font-bold text-white">Detalle de Cotización</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              {carrito.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-dark-border rounded-xl">
                  <p className="text-gray-500 text-sm">Cotización vacía.</p>
                </div>
              ) : (
                carrito.map((item) => {
                  const subtotalItem = item.precio * item.cantidad;
                  const totalConDescItem = subtotalItem - (subtotalItem * (item.descuentoPct / 100));
                  const descIndividualMult = 1 - (item.descuentoPct / 100);
                  const descGlobalMult = 1 - ((descuentoGlobalPct || 0) / 100);
                  const errorMargen = (item.precio * descIndividualMult * descGlobalMult) < item.precioCompra;

                  return (
                    <div key={item.id} className={`flex flex-col gap-3 p-4 bg-dark-bg border rounded-xl relative group transition-colors ${errorMargen ? 'border-rose-500/50' : 'border-dark-border'}`}>
                      <button onClick={() => eliminarDelCarrito(item.id)} className="absolute top-3 right-3 text-gray-500 hover:text-rose-400">
                        <Trash2 size={16} />
                      </button>
                      <p className="text-sm font-medium text-white leading-tight pr-8">{item.nombre}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1 bg-dark-input rounded-lg border border-dark-border p-1">
                          <button onClick={() => actualizarCantidad(item.id, -1)} className="text-gray-400 hover:text-white p-1"><Minus size={14} /></button>
                          <input 
                            type="number" min="1" value={item.cantidad}
                            onChange={(e) => actualizarCantidadInput(item.id, e.target.value)}
                            className="w-10 bg-transparent text-sm font-bold text-white text-center focus:outline-none appearance-none"
                          />
                          <button onClick={() => actualizarCantidad(item.id, 1)} className="text-gray-400 hover:text-white p-1"><Plus size={14} /></button>
                        </div>
                        <div className="flex items-center gap-1 bg-dark-input rounded-lg border border-dark-border px-2 py-1">
                          <Percent size={12} className="text-amber-400" />
                          <input 
                            type="number" min="0" max="100" value={item.descuentoPct}
                            onChange={(e) => actualizarDescuentoItem(item.id, e.target.value)}
                            className="w-8 bg-transparent text-xs text-white text-center focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${errorMargen ? 'text-rose-400' : 'text-emerald-400'}`}>
                            ${totalConDescItem.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-6 bg-dark-sidebar border-t border-dark-border">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Descuento Global (%)</span>
                <div className="flex items-center gap-1 bg-dark-input rounded-lg border border-dark-border px-2 py-1 w-20">
                  <Percent size={14} className="text-amber-400" />
                  <input type="number" min="0" max="100" value={descuentoGlobalPct} onChange={(e) => setDescuentoGlobalPct(Number(e.target.value))} className="w-full bg-transparent text-sm text-white text-right focus:outline-none" />
                </div>
              </div>
              <div className="h-px bg-dark-border w-full my-2"></div>
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-white">Total Final</span>
                <span className="text-3xl font-extrabold text-emerald-400">${totalFinal.toLocaleString('es-AR')}</span>
              </div>
            </div>
            
            <button 
              onClick={handleConfirmarVenta}
              disabled={carrito.length === 0 || tieneErroresMargen}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 px-4 rounded-xl transition-all shadow-lg ${carrito.length === 0 ? 'bg-dark-input text-gray-500' : tieneErroresMargen ? 'bg-rose-500/20 text-rose-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {tieneErroresMargen ? <><AlertTriangle size={20} /> Revisar Costos</> : <><CheckCircle2 size={20} /> Generar Cotización</>}
            </button>
          </div>
        </section>

        {/* --- MODAL FLOTANTE INTERACTIVO DE ESCANEO EXITOSO --- */}
        {productoEscaneado && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl text-left space-y-4 animate-in fade-in zoom-in duration-100">
              
              <div className="flex justify-between items-center border-b border-dark-border pb-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Barcode size={22} />
                  <h3 className="text-lg font-bold text-white">¡Material Escaneado!</h3>
                </div>
                <button onClick={() => setProductoEscaneado(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="bg-dark-bg border border-dark-border/50 rounded-xl p-4 flex gap-4 items-center">
                <div className="p-3 bg-dark-panel border border-dark-border text-emerald-400 rounded-xl"><Box size={24} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] font-bold text-gray-500 tracking-wider">SKU / CÓDIGO</p>
                  <p className="font-mono text-sm font-bold text-emerald-400 truncate leading-tight">{productoEscaneado.sku}</p>
                  <p className="font-bold text-white text-base mt-1 truncate leading-tight">{productoEscaneado.nombre}</p>
                </div>
              </div>

              <div className="flex justify-between items-baseline px-2 font-mono">
                <span className="text-xs text-gray-400">Precio de Lista:</span>
                <span className="text-2xl font-black text-white">${productoEscaneado.precio.toLocaleString('es-AR')}</span>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-gray-400 text-center">
                💡 Presioná <strong className="text-white bg-dark-input border px-1.5 py-0.5 rounded font-mono">Enter ↵</strong> para mandar directo al mostrador.
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setProductoEscaneado(null)} 
                  className="col-span-1 py-2.5 text-sm font-semibold bg-dark-input border border-dark-border text-gray-300 rounded-xl hover:bg-dark-hover transition-colors"
                >
                  Descartar
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    agregarAlCarrito(productoEscaneado);
                    setProductoEscaneado(null);
                  }} 
                  className="col-span-2 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={16} /> Agregar al Carrito
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL DE ÉXITO */}
        {ventaExitosa && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-sm p-8 text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-6">
                <FileCheck2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Cotización Generada</h2>
              <p className="text-gray-400 text-sm mb-6">
                El comprobante fue generado por <br/>
                <strong className="text-white text-lg">${totalFinal.toLocaleString('es-AR')}</strong>
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button onClick={imprimirTicket} className="w-full flex items-center justify-center gap-2 bg-dark-input hover:bg-dark-hover border border-dark-border text-white font-medium py-3 px-4 rounded-xl transition-colors">
                  <Printer size={18} className="text-gray-400" /> Imprimir Cotización
                </button>
                <button onClick={resetearPuntoDeVenta} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                  <Plus size={18} /> Nueva Operación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. COMPROBANTE OFICIAL DINÁMICO PARA IMPRESIÓN / PDF */}
      <div className="hidden print:block bg-white text-black p-8 font-sans w-[210mm] min-h-[297mm] mx-auto">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div className="w-1/2">
            <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900 leading-none uppercase">
              {datosEmpresa.nombre.split(' ')[0]}
            </h1>
            <h1 className="text-4xl font-light tracking-widest text-gray-900 mb-4 leading-none uppercase">
              {datosEmpresa.nombre.split(' ').slice(1).join(' ') || ''}
            </h1>
            <p className="text-[11px] font-bold mt-2 text-emerald-700 uppercase tracking-wider">Venta de Materiales de Construcción</p>
            <p className="text-[11px] text-gray-700 mt-2">📍 {datosEmpresa.direccion}</p>
            <p className="text-[11px] text-gray-700">📞 Tel: {datosEmpresa.telefono}</p>
            <p className="text-[11px] text-gray-700">📄 CUIT: {datosEmpresa.cuit}</p>
          </div>
          
          <div className="w-1/2 flex flex-col gap-4 items-end">
            <div className="border border-gray-300 rounded p-3 w-64 bg-gray-50">
              <h3 className="bg-gray-200 font-bold text-[10px] uppercase p-1 mb-2 text-center border-b border-gray-300 tracking-wider">PRESUPUESTO COMERCIAL</h3>
              <p className="text-xs"><strong>Documento N°:</strong> {idCotizacionActual || 'COT-XXXXXX'}</p>
              <p className="text-xs"><strong>Fecha Emisión:</strong> {new Date().toLocaleDateString('es-AR')}</p>
              <p className="text-xs"><strong>Plazo Validez:</strong> 7 Días Corridos</p>
            </div>
            
            <div className="border border-gray-300 rounded overflow-hidden w-64">
              <h3 className="bg-gray-100 font-bold text-[10px] uppercase p-1.5 text-center border-b border-gray-300 tracking-wider text-gray-700">
                DATOS DEL CLIENTE
              </h3>
              <div className="p-3 bg-white">
                <p className="text-xs font-bold text-gray-950 uppercase">{clienteActivo.nombre}</p>
                <p className="text-xs text-gray-700 mt-1">{clienteActivo.documento ? `CUIT/DNI: ${clienteActivo.documento}` : 'Consumidor Final'}</p>
                <p className="text-xs text-gray-700">📍 {clienteActivo.direccion || 'San Salvador de Jujuy, Jujuy'}</p>
                {clienteActivo.telefono && <p className="text-xs text-gray-700">📞 Tel: {clienteActivo.telefono}</p>}
              </div>
            </div>
          </div>
        </div>

        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-[10px] text-gray-800 uppercase border-b-2 border-gray-800">
              <th className="p-2 font-bold w-24">Ref/SKU</th>
              <th className="p-2 font-bold">Descripción del Material</th>
              <th className="p-2 font-bold text-right">Precio Unit.</th>
              <th className="p-2 font-bold text-center">Dto.</th>
              <th className="p-2 font-bold text-center">Cant.</th>
              <th className="p-2 font-bold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((item, index) => {
              const subtotalItem = item.precio * item.cantidad;
              const totalConDescItem = subtotalItem - (subtotalItem * (item.descuentoPct / 100));
              return (
                <tr key={index} className="border-b border-gray-200 text-xs">
                  <td className="p-2 align-top text-gray-500 font-mono font-bold">{item.sku || 'N/A'}</td>
                  <td className="p-2 align-top">
                    <p className="font-bold text-gray-900">{item.nombre}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{item.descripcion || 'Materiales para obras y terminaciones estructurales.'}</p>
                  </td>
                  <td className="p-2 align-top text-right">${item.precio.toLocaleString('es-AR')}</td>
                  <td className="p-2 align-top text-center">{item.descuentoPct > 0 ? `${item.descuentoPct}%` : '-'}</td>
                  <td className="p-2 align-top text-center font-bold">{item.cantidad}</td>
                  <td className="p-2 align-top text-right font-bold">${totalConDescItem.toLocaleString('es-AR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between items-start mt-10">
          <div className="w-1/2 border border-dashed border-gray-300 rounded p-3 bg-gray-50 text-[10px] text-gray-600 leading-relaxed">
            <strong>Condiciones Comerciales y de Acopio:</strong><br/>
            • Todos los precios expresados incluyen el Impuesto al Valor Agregado (IVA).<br/>
            • Los materiales bajo sistema de acopio disponen de un plazo de retiro máximo de 30 días.<br/>
            • Entregas sujetas a la diagramación logística de la flota de camiones.
          </div>
          <div className="w-64 border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-bold bg-gray-50 w-1/2">Subtotal Bruto</td>
                  <td className="p-2 text-right">${subtotalBruto.toLocaleString('es-AR')}</td>
                </tr>
                {descuentoGlobalPct > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-2 font-bold bg-gray-50 text-orange-600">Dto. Global ({descuentoGlobalPct}%)</td>
                    <td className="p-2 text-right text-orange-600">-${(subtotalNeto * (descuentoGlobalPct / 100)).toLocaleString('es-AR')}</td>
                  </tr>
                )}
                <tr className="bg-gray-900 text-white">
                  <td className="p-2 font-extrabold text-sm uppercase">Total Final</td>
                  <td className="p-2 font-extrabold text-right text-sm text-emerald-400">${totalFinal.toLocaleString('es-AR')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 text-center text-[10px] text-gray-500 border-t border-gray-200 pt-4">
          {datosEmpresa.nombre} — Establecimiento Comercial de materiales. <br/>
          Este documento constituye una cotización comercial estrictamente referencial e informativa. No válido como factura fiscal.
        </div>
      </div>
    </>
  );
}