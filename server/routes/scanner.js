import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const r = Router();

r.post('/', async (req, res) => {
  const { path: scanPath } = req.body;
  if (!scanPath) return res.status(400).json({ error: 'path required' });
  try {
    const result = await scanDirectory(scanPath);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function scanDirectory(dirPath, maxDepth = 4) {
  const result = {
    path: dirPath,
    exists: false,
    fileCount: 0,
    dirCount: 0,
    totalSize: 0,
    techStack: [],
    framework: null,
    packageJson: null,
    requirementsTxt: null,
    topFiles: [],
    errors: [],
    gitRepo: false,
    hasEnvFile: false,
    hasDockerfile: false,
  };

  try {
    await fsp.access(dirPath);
    result.exists = true;
  } catch {
    result.error = 'Directory not found or not accessible';
    return result;
  }

  const extCounts = {};

  async function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); }
    catch { return; }

    for (const entry of entries) {
      const skipDirs = ['node_modules', '__pycache__', 'venv', '.venv', 'env',
        '.next', 'dist', 'build', '.cache', 'coverage', 'vendor', '.git'];
      if (entry.isDirectory()) {
        if (entry.name === '.git') { result.gitRepo = true; continue; }
        if (skipDirs.includes(entry.name)) continue;
        result.dirCount++;
        await walk(path.join(dir, entry.name), depth + 1);
        continue;
      }

      result.fileCount++;
      const fullPath = path.join(dir, entry.name);
      const ext = path.extname(entry.name).toLowerCase();

      try {
        const stat = await fsp.stat(fullPath);
        result.totalSize += stat.size;
        extCounts[ext] = (extCounts[ext] || 0) + 1;

        if (depth <= 1) {
          result.topFiles.push({ name: entry.name, path: fullPath, size: stat.size, ext });
        }

        // Key file parsing (root level only)
        if (depth === 0) {
          if (entry.name === 'package.json') {
            try { result.packageJson = JSON.parse(await fsp.readFile(fullPath, 'utf8')); } catch {}
          }
          if (entry.name === 'requirements.txt') {
            try { result.requirementsTxt = await fsp.readFile(fullPath, 'utf8'); } catch {}
          }
          if (entry.name === '.env' || entry.name === '.env.local') result.hasEnvFile = true;
          if (entry.name === 'Dockerfile' || entry.name === 'docker-compose.yml') result.hasDockerfile = true;
        }
      } catch {}
    }
  }

  await walk(dirPath, 0);

  // Detect tech stack
  const stack = new Set();

  if (result.packageJson) {
    stack.add('Node.js');
    result.framework = result.packageJson.name;
    const deps = { ...result.packageJson.dependencies, ...result.packageJson.devDependencies };
    const checks = {
      react: 'React', vue: 'Vue', svelte: 'Svelte', angular: 'Angular',
      express: 'Express', fastify: 'Fastify', next: 'Next.js', nuxt: 'Nuxt',
      vite: 'Vite', webpack: 'Webpack',
      typescript: 'TypeScript', '@types/node': 'TypeScript',
      tailwindcss: 'Tailwind CSS', 'styled-components': 'styled-components',
      prisma: 'Prisma', mongoose: 'MongoDB/Mongoose', pg: 'PostgreSQL',
      sequelize: 'Sequelize', typeorm: 'TypeORM',
      jest: 'Jest', vitest: 'Vitest', playwright: 'Playwright',
      socket: 'WebSockets',
    };
    for (const [dep, label] of Object.entries(checks)) {
      if (deps[dep]) stack.add(label);
    }
  }

  if (result.requirementsTxt) {
    stack.add('Python');
    const txt = result.requirementsTxt.toLowerCase();
    const pyChecks = { django: 'Django', flask: 'Flask', fastapi: 'FastAPI',
      tornado: 'Tornado', sqlalchemy: 'SQLAlchemy', celery: 'Celery',
      torch: 'PyTorch', tensorflow: 'TensorFlow', pandas: 'pandas',
      numpy: 'NumPy', pytest: 'pytest' };
    for (const [dep, label] of Object.entries(pyChecks)) {
      if (txt.includes(dep)) stack.add(label);
    }
  }

  const extMap = { '.php': 'PHP', '.py': 'Python', '.rs': 'Rust', '.go': 'Go',
    '.java': 'Java', '.rb': 'Ruby', '.cs': 'C#', '.cpp': 'C++', '.swift': 'Swift' };
  for (const [ext, lang] of Object.entries(extMap)) {
    if (extCounts[ext] > 0) stack.add(lang);
  }

  result.techStack = [...stack];
  result.extensionBreakdown = Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ext, count]) => ({ ext: ext || '(no ext)', count }));

  return result;
}

export default r;
