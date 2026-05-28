import React, { useState } from 'react';
import MainLayout from './layout/main-layout';
import Inicio from './components/inicio';
import Ventas from './components/venta';
import Productos from './components/productos';
import Clientes from './components/clientes';
import NuevaVenta from './components/nueva-venta';
import Reportes from './components/reportes'; // <-- 1. Importamos Reportes

export default function App() {
  const [vistaActual, setVistaActual] = useState('inicio'); 

  return (
    <MainLayout vistaActual={vistaActual} setVistaActual={setVistaActual}>
      
      {/* CORRECCIÓN: Le pasamos la función setVistaActual para que reaccionen los Accesos Rápidos */}
      {vistaActual === 'inicio' && <Inicio setVistaActual={setVistaActual} />}
      {vistaActual === 'productos' && <Productos />}
      {vistaActual === 'clientes' && <Clientes />}
      {vistaActual === 'carrito' && <NuevaVenta />}
      {vistaActual === 'ventas' && <Ventas />}
      {/* 2. Inyectamos el componente de Reportes */}
      {vistaActual === 'reportes' && <Reportes />}

    </MainLayout>
  );
}