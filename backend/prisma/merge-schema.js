/**
 * merge-schema.js
 * 
 * Concatenates all modular .prisma files from the modules/ directory
 * into a single schema.prisma that Prisma can process.
 * 
 * Usage: node merge-schema.js
 * Run this BEFORE `npx prisma generate` or `npx prisma db push`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULES_DIR = path.join(__dirname, 'modules');
const OUTPUT_FILE = path.join(__dirname, 'schema.prisma');

// Files to combine, in order (prefix number controls load order)
const moduleFiles = fs.readdirSync(MODULES_DIR)
  .filter(f => f.endsWith('.prisma'))
  .sort(); // alphabetical sort respects 00_, 01_, etc.

let combined = '';

for (const file of moduleFiles) {
  const filePath = path.join(MODULES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Add file header as comment for traceability
  combined += `// ===== ${file} =====\n\n`;
  combined += content.trim();
  combined += '\n\n';
}

fs.writeFileSync(OUTPUT_FILE, combined.trim() + '\n', 'utf-8');
console.log(`✓ Merged ${moduleFiles.length} module files into schema.prisma`);