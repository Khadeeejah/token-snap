const fs = require('fs/promises');
const path = require('path');
const mkdirp = require('mkdirp');

async function prepareArtifacts() {
  const rootPath = path.resolve(__dirname, '..');
  const publicPath = path.join(rootPath, 'public');
  const imagesPath = path.join(publicPath, 'images');
  const distPath = path.join(publicPath, 'dist');

  await mkdirp(distPath);
  await mkdirp(imagesPath);

  await Promise.all([
    fs.copyFile(path.join(rootPath, 'index.html'), path.join(publicPath, 'index.html')),
    fs.copyFile(path.join(rootPath, 'index.css'), path.join(publicPath, 'index.css')),
    fs.copyFile(path.join(rootPath, 'index.js'), path.join(publicPath, 'index.js')),
    fs.copyFile(path.join(rootPath, 'images', 'icon.svg'), path.join(imagesPath, 'icon.svg')),
    fs.copyFile(path.join(rootPath, 'dist', 'bundle.js'), path.join(distPath, 'bundle.js')),
    fs.copyFile(path.join(rootPath, 'snap.manifest.json'), path.join(publicPath, 'snap.manifest.json')),
  ]);
}

prepareArtifacts();
