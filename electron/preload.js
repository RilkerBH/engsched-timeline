const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (jsonData, defaultFileName) =>
    ipcRenderer.invoke('save-project', jsonData, defaultFileName),
  loadProject: () =>
    ipcRenderer.invoke('load-project'),
});
