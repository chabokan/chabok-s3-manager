// Quick test to verify project structure
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Chabokan S3 Manager structure...\n');

const requiredFiles = [
    'package.json',
    'main.js',
    'preload.js',
    'index.html',
    'styles.css',
    'renderer.js',
    'README.md'
];

let allGood = true;

requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    if (!exists) allGood = false;
});

console.log('\n📦 Checking dependencies...\n');

const packageJson = require('./package.json');
const dependencies = {...packageJson.dependencies, ...packageJson.devDependencies};

console.log('✅ electron:', dependencies.electron || 'missing');
console.log('✅ @aws-sdk/client-s3:', dependencies['@aws-sdk/client-s3'] || 'missing');
console.log('✅ @aws-sdk/s3-request-presigner:', dependencies['@aws-sdk/s3-request-presigner'] || 'missing');

console.log('\n' + (allGood ? '🎉 Structure looks good! Ready to run: npm start' : '⚠️  Some files are missing!'));

