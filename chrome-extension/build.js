const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'local';
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const config = {
    local: {
        name: "Economemo - Article Tracker (Local)",
        apiUrl: "https://127.0.0.1:8000",
        hostPermissions: [
            "https://*.economist.com/*",
            "https://localhost:8000/*",
            "https://127.0.0.1:8000/*"
        ]
    },
    dev: {
        name: "Economemo - Article Tracker (Dev)",
        apiUrl: "https://dev-api.economemo.com",
        hostPermissions: [
            "https://*.economist.com/*",
            "https://*.twomustardbytes.com/*"
        ]
    }
};

// Generate manifest.json
const manifest = {
    manifest_version: 3,
    name: config[env].name,
    version: "0.1",
    description: "Track read/unread status of Economist articles.",
    permissions: ["tabs", "storage"],
    host_permissions: config[env].hostPermissions,
    background: {
        service_worker: "background.js"
    },
    content_scripts: [
        {
            matches: ["https://*.economist.com/*"],
            js: ["config.js", "content.js"]
        }
    ],
    action: {
        default_popup: "popup.html"
    }
};

fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('manifest.json generated in dist folder');

// Generate config.js
const configJs = `const config = ${JSON.stringify({ apiUrl: config[env].apiUrl }, null, 2)};`;
fs.writeFileSync(path.join(distDir, 'config.js'), configJs);
console.log('config.js generated in dist folder');

// Copy other necessary files to dist
const filesToCopy = ['background.js', 'content.js', 'popup.html', 'popup.js'];
filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, distPath);
        console.log(`${file} copied to dist folder`);
    } else {
        console.warn(`Warning: ${file} not found in src directory`);
    }
});

console.log(`Build completed for ${env} environment`);