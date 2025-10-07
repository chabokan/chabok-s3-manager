const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { 
  S3Client, 
  ListObjectsV2Command, 
  GetObjectCommand, 
  ListBucketsCommand,
  CreateBucketCommand,
  PutBucketAclCommand,
  PutBucketPolicyCommand,
  DeleteBucketPolicyCommand,
  PutObjectCommand,
  PutObjectAclCommand,
  DeleteObjectCommand,
  DeleteBucketCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const { pipeline } = require('stream/promises');

let mainWindow;
let s3Client = null;
let s3Config = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('connect-s3', async (event, config) => {
  try {
    s3Config = config;
    s3Client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey
      },
      forcePathStyle: true
    });

    // Test connection by listing buckets
    const command = new ListBucketsCommand({});
    await s3Client.send(command);
    
    return { success: true };
  } catch (error) {
    console.error('S3 Connection Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-buckets', async () => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    const buckets = (response.Buckets || []).map(bucket => ({
      name: bucket.Name,
      creationDate: bucket.CreationDate
    }));

    return { success: true, buckets };
  } catch (error) {
    console.error('List Buckets Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-bucket', async (event, { bucketName, isPublic }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    // Create bucket
    const createCommand = new CreateBucketCommand({
      Bucket: bucketName
    });
    await s3Client.send(createCommand);

    // Set ACL if public
    if (isPublic) {
      try {
        const aclCommand = new PutBucketAclCommand({
          Bucket: bucketName,
          ACL: 'public-read'
        });
        await s3Client.send(aclCommand);
      } catch (aclError) {
        console.warn('Could not set bucket ACL:', aclError.message);
        // Continue even if ACL fails - some services don't support this
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Create Bucket Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-bucket-public', async (event, { bucketName, isPublic }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    if (isPublic) {
      // Use bucket policy for MinIO compatibility
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }]
      };

      const command = new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy)
      });
      
      await s3Client.send(command);
    } else {
      // Remove policy to make private
      try {
        const command = new DeleteBucketPolicyCommand({
          Bucket: bucketName
        });
        await s3Client.send(command);
      } catch (err) {
        // Ignore if no policy exists
        console.log('No policy to delete');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Set Bucket Policy Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-objects', async (event, { bucket, prefix = '' }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: '/'
    });

    const response = await s3Client.send(command);
    
    const folders = (response.CommonPrefixes || []).map(prefix => ({
      type: 'folder',
      name: prefix.Prefix.slice(prefix.Prefix.lastIndexOf('/', prefix.Prefix.length - 2) + 1, -1),
      fullPath: prefix.Prefix,
      size: 0
    }));

    const files = (response.Contents || [])
      .filter(obj => obj.Key !== prefix) // Exclude the prefix itself
      .map(obj => ({
        type: 'file',
        name: obj.Key.split('/').pop(),
        fullPath: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified
      }));

    return { success: true, items: [...folders, ...files] };
  } catch (error) {
    console.error('List Objects Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('upload-file', async (event, { bucket, key, filePath }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    let body;
    
    // If filePath is null, create empty folder (key must end with /)
    if (!filePath) {
      if (!key.endsWith('/')) {
        throw new Error('Folder key must end with /');
      }
      body = Buffer.from('');
    } else {
      body = fs.readFileSync(filePath);
    }
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('Upload Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-file', async (event, { bucket, key }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }
    
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save File',
      defaultPath: path.basename(key),
      buttonLabel: 'Download'
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Download cancelled' };
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await s3Client.send(command);
    const writeStream = fs.createWriteStream(result.filePath);
    
    await pipeline(response.Body, writeStream);

    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Download Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-share-link', async (event, { bucket, key, expiresIn }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    // Generate a presigned URL with custom expiry
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresIn || 604800 });

    return { success: true, url };
  } catch (error) {
    console.error('Share Link Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-object', async (event, { bucket, key }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('Delete Object Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-object-public', async (event, { bucket, key, isPublic }) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new PutObjectAclCommand({
      Bucket: bucket,
      Key: key,
      ACL: isPublic ? 'public-read' : 'private'
    });
    
    await s3Client.send(command);
    
    return { success: true };
  } catch (error) {
    console.error('Set Object ACL Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-bucket', async (event, bucketName) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    // First, list all objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName
    });
    const listResponse = await s3Client.send(listCommand);

    // Delete all objects first
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      for (const obj of listResponse.Contents) {
        const deleteObjCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: obj.Key
        });
        await s3Client.send(deleteObjCommand);
      }
    }

    // Now delete the bucket
    const deleteBucketCommand = new DeleteBucketCommand({
      Bucket: bucketName
    });
    await s3Client.send(deleteBucketCommand);

    return { success: true };
  } catch (error) {
    console.error('Delete Bucket Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('disconnect-s3', async () => {
  s3Client = null;
  s3Config = null;
  return { success: true };
});

