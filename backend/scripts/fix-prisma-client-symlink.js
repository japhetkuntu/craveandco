const fs = require('fs');
const path = require('path');

const prismaClientDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
const symlinkPath = path.join(prismaClientDir, '.prisma');
const target = path.join('..', '..', '.prisma');

if (!fs.existsSync(prismaClientDir)) {
  process.exit(0);
}

try {
  if (fs.existsSync(symlinkPath) || fs.lstatSync(symlinkPath).isSymbolicLink()) {
    fs.unlinkSync(symlinkPath);
  }
} catch (_err) {
  // ignore
}

try {
  fs.symlinkSync(target, symlinkPath, 'dir');
  console.log(`Created Prisma symlink at ${symlinkPath} -> ${target}`);
} catch (error) {
  console.error(`Unable to create Prisma symlink: ${error.message}`);
  process.exit(1);
}
