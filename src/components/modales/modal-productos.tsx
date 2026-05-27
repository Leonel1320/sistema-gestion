import React, { useState, useEffect } from 'react';
import { Box, X, Save, AlertTriangle } from 'lucide-react';

export default function ModalProducto({ isOpen, onClose, onSave, productoEditando, skuSugerido }) {
  // Estado local para manejar el mensaje de error de precios
  const [error, setError] = useState('');

  // Limpiamos el error cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos
    
    const formData = new FormData(e.target);
    const precioCompra = Number(formData.get('precioCompra'));
    const precioVenta = Number(formData.get('precio'));

    // VALIDACIÓN CLAVE: El precio de venta debe ser MAYOR al costo
    if (precioVenta <= precioCompra) {
      setError('Error: El precio de venta debe ser estrictamente mayor al costo de compra.');
      return; // Frenamos el guardado
    }
    
    const productoData = {
      id: productoEditando ? productoEditando.id : Date.now(), 
      sku: formData.get('sku').toUpperCase(),
      nombre: formData.get('nombre'),
      categoria: formData.get('categoria'),
      precioCompra: precioCompra,
      precio: precioVenta,
      stock: Number(formData.get('stock')),
    };

    onSave(productoData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-sidebar/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Box className="text-emerald-400" size={22} /> 
            {productoEditando ? 'Editar Material' : 'Nuevo Material'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-hover transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            
            {/* Alerta de Error (Solo aparece si la validación falla) */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                <AlertTriangle size={18} />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Descripción del material</label>
                <input required name="nombre" defaultValue={productoEditando?.nombre} placeholder="Ej: Cemento Loma Negra 50kg..." className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>
              
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Código SKU</label>
                <input 
                  required 
                  name="sku" 
                  defaultValue={productoEditando ? productoEditando.sku : skuSugerido} 
                  placeholder="Ej: MAT-0001" 
                  className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors uppercase" 
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Categoría</label>
                <select required name="categoria" defaultValue={productoEditando?.categoria} className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors appearance-none">
                  <option value="Cementos y Cal">Cementos y Cal</option>
                  <option value="Hierros y Mallas">Hierros y Mallas</option>
                  <option value="Ladrillos y Bloques">Ladrillos y Bloques</option>
                  <option value="Áridos">Áridos (Arena/Ripio)</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Varios">Varios</option>
                </select>
              </div>

              {/* Nuevo campo: COSTO */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Costo (Compra) $</label>
                <input required type="number" step="0.01" name="precioCompra" defaultValue={productoEditando?.precioCompra} placeholder="0.00" className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>

              {/* Campo existente: VENTA */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Precio de Venta $</label>
                <input required type="number" step="0.01" name="precio" defaultValue={productoEditando?.precio} placeholder="0.00" className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Stock Actual</label>
                <input required type="number" name="stock" defaultValue={productoEditando?.stock} placeholder="0" className="w-full bg-dark-input border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-dark-border bg-dark-sidebar/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/20">
              <Save size={16} /> Guardar Material
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}