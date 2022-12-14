const fs = require('fs/promises');
const path = require('path');
const mkdirp = require('mkdirp');

async function prepareArtifacts() {
  const rootPath = path.resolve(__dirname, '..');
  const publicPath = path.join(rootPath, 'public');
  const imagesPath = path.join(publicPath, 'images');

  await mkdirp(imagesPath);

  await Promise.all([
    fs.copyFile(path.join(rootPath, 'index.html'), path.join(publicPath, 'index.html')),
    fs.copyFile(path.join(rootPath, 'index.css'), path.join(publicPath, 'index.css')),
    fs.copyFile(path.join(rootPath, 'images', 'icon.svg'), path.join(imagesPath, 'icon.svg')),
    fs.writeFile(
      path.join(publicPath, 'index.js'),
      (
        await fs.readFile(path.join(rootPath, 'index.js'), 'utf8')
      ).replace(
        // eslint-disable-next-line no-template-curly-in-string
        'const snapId = `local:${window.location.href}`;',
        'const snapId = `npm:@khadeeejah/tokensnap`;',
      ),
    ),
  ]);
}

prepareArtifacts();
