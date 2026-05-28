import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Corrección para poder usar __dirname en entornos "module"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Corralón Nina ERP",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Apunta a la dirección donde corre tu servidor de Node
  ventana.loadURL('http://localhost:5000');
}

app.whenReady().then(crearVentana);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});