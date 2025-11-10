import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import waitOn from "wait-on"; // We use wait-on to ensure the Vite server is ready before opening Electron

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to install dependencies and start the app
function ensureDependenciesAndStart() {
  const nodeModulesPath = path.join(__dirname, "../node_modules");

  // Check if node_modules directory exists
  if (!fs.existsSync(nodeModulesPath)) {
    console.log("node_modules not found, installing...");

    // Run npm install
    exec("npm install", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(stdout);
      console.error(stderr);

      // After installing dependencies, start the app
      startApp();
    });
  } else {
    startApp(); // If node_modules exists, just start the app
  }
}

// Function to create the window and load the app
function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: { contextIsolation: true }
  });

  // In development mode, load the Vite dev server URL
  win.loadURL("http://localhost:8080");  // Assuming Vite is running on port 8080
}

// Start the app in development or production mode
function startApp() {
    // Start the app in development mode (run npm start)
    console.log("Starting Vite development server...");

    const viteProcess = exec("npm run dev");

    viteProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    viteProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    // After Vite is running, wait for it to be ready
    waitOn({
      resources: ["http://localhost:8080"],  // Vite default dev port
      timeout: 30000,  // Timeout after 30 seconds if Vite is not available
    }).then(() => {
      console.log("Vite server is ready, launching Electron...");
      createWindow();
    }).catch((err) => {
      console.error("Vite server failed to start:", err);
    });
}

// Command line switches for Electron (ignore certificate errors, disable GPU)
app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("disable-gpu");


// app.whenReady().then(ensureDependenciesAndStart);
app.whenReady().then(() => {
 ensureDependenciesAndStart();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
     ensureDependenciesAndStart();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
