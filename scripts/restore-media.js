const fs = require('fs');
const path = require('path');

function main() {
  const projectRoot = process.cwd();
  const backupRoot = path.join(projectRoot, 'backups', 'media');
  const mediaRoot = process.env.SIWA_MEDIA_ROOT || process.env.MEDIA_ROOT || path.join(projectRoot, 'media-storage');
  const uploadsRoot = path.join(mediaRoot, 'uploads');

  if (!fs.existsSync(backupRoot)) {
    console.error(`No backup directory found at ${backupRoot}`);
    process.exit(1);
  }

  const backups = fs.readdirSync(backupRoot)
    .filter((name) => fs.statSync(path.join(backupRoot, name)).isDirectory())
    .sort()
    .reverse();

  if (!backups.length) {
    console.error('No media backup folders found.');
    process.exit(1);
  }

  const latest = path.join(backupRoot, backups[0]);
  fs.mkdirSync(uploadsRoot, { recursive: true });
  fs.cpSync(latest, uploadsRoot, { recursive: true, force: true });
  console.log(`Restored media from ${latest} to ${uploadsRoot}`);
}

main();
