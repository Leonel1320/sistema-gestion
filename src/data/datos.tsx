// empresaDefault.js

// 1. Definimos los valores de respaldo por si el localStorage está vacío
const valoresBase = {
  nombre: "Corralón Nina",
  telefono: "388-155...",
  direccion: "Av. Siempre Viva 123",
  cuit: "30-12345678-9"
};

// 2. Creamos una función que intente leer los cambios guardados por el modal
const obtenerDatosEmpresa = () => {
  // Verificamos que estemos del lado del cliente (navegador) antes de usar localStorage
  if (typeof window !== 'undefined') {
    const datosLocales = localStorage.getItem('empresa');
    if (datosLocales) {
      try {
        const empresaParseada = JSON.parse(datosLocales);
        // Devolvemos los datos del usuario, rellenando con base si falta algún campo individual
        return {
          nombre: empresaParseada.nombre || valoresBase.nombre,
          telefono: empresaParseada.telefono || valoresBase.telefono,
          direccion: empresaParseada.direccion || valoresBase.direccion,
          cuit: empresaParseada.cuit || valoresBase.cuit
        };
      } catch (error) {
        console.error("Error al leer las variables de empresa guardadas:", error);
      }
    }
  }
  return valoresBase;
};

// 3. Ejecutamos la función para que el objeto exportado contenga las variables reales
const empresaDefault = obtenerDatosEmpresa();

export default empresaDefault;