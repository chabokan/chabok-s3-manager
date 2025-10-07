const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectS3: (config) => ipcRenderer.invoke('connect-s3', config),
  listBuckets: () => ipcRenderer.invoke('list-buckets'),
  createBucket: (bucketName, isPublic) => ipcRenderer.invoke('create-bucket', { bucketName, isPublic }),
  setBucketPublic: (bucketName, isPublic) => ipcRenderer.invoke('set-bucket-public', { bucketName, isPublic }),
  deleteBucket: (bucketName) => ipcRenderer.invoke('delete-bucket', bucketName),
  listObjects: (bucket, prefix) => ipcRenderer.invoke('list-objects', { bucket, prefix }),
  uploadFile: (bucket, key, filePath) => ipcRenderer.invoke('upload-file', { bucket, key, filePath }),
  downloadFile: (bucket, key) => ipcRenderer.invoke('download-file', { bucket, key }),
  deleteObject: (bucket, key) => ipcRenderer.invoke('delete-object', { bucket, key }),
  setObjectPublic: (bucket, key, isPublic) => ipcRenderer.invoke('set-object-public', { bucket, key, isPublic }),
  getShareLink: (bucket, key, expiresIn) => ipcRenderer.invoke('get-share-link', { bucket, key, expiresIn }),
  disconnectS3: () => ipcRenderer.invoke('disconnect-s3')
});

