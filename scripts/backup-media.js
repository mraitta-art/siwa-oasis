const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  const projectRoot = process.cwd();
  const mediaRoot = process.env.SIWA_MEDIA_ROOT || process.env.MEDIA_ROOT || path.join(projectRoot, 'media-storage');
  const backupRoot = path.join(projectRoot, 'backups', 'media');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(backupRoot, timestamp);

  ensureDir(backupDir);

  if (!fs.existsSync(mediaRoot)) {
    console.log(`Media root not found, creating: ${mediaRoot}`);
    ensureDir(mediaRoot);
  }

  const sourceDir = path.join(mediaRoot, 'uploads');
  if (!fs.existsSync(sourceDir)) {
    ensureDir(sourceDir);
    console.log('No uploads directory found; created empty one.');
    process.exit(0);
  }

  fs.cpSync(sourceDir, backupDir, { recursive: true, force: true });
  const files = walkFiles(sourceDir).map((file) => path.relative(sourceDir, file).replace(/\\/g, '/'));
  console.log(`Backup created at ${backupDir}`);
  console.log(`Backup contains ${files.length} files`);

  const manifestPath = path.join(backupRoot, `media-backup-${timestamp}.json`);
  const manifest = {
    timestamp,
    source: sourceDir,
    backupDir,
    files
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to ${manifestPath}`);
}

main();
