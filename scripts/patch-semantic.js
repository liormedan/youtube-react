const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'node_modules/semantic-ui-css/semantic.css',
  'node_modules/semantic-ui-css/semantic.min.css',
  'node_modules/semantic-ui-css/components/popup.css',
  'node_modules/semantic-ui-css/components/popup.min.css'
];

filesToPatch.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Fix invalid background-color: none
    content = content.replace(/background-color:\s*none;/g, 'background-color: transparent;');
    
    // Fix pseudo-elements followed by classes (like :after .header) if they exist
    content = content.replace(/(\[data-tooltip\]\[data-inverted\]:after)\s+\.header/g, '$1');
    content = content.replace(/(\[data-tooltip\]:after)\s+\.header/g, '$1');
    content = content.replace(/(:before)\s+\.header/g, '$1');
    content = content.replace(/(:after)\s+\.header/g, '$1');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${file}`);
  }
});
