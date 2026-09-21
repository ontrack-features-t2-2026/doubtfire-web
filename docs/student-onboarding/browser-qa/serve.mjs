import {spawn} from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Keep the real checkout and its Angular configuration untouched. A copy avoids
// TypeScript resolving source and template scopes through two symlink paths.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = fileURLToPath(new URL('.', import.meta.url));
const destination = mkdtempSync(join(tmpdir(), 'ontrack-tutorial-qa-'));
const dependencies = realpathSync(join(root, 'node_modules'));
const original = JSON.parse(readFileSync(join(root, 'angular.json'), 'utf8'));
const appOptions = original.projects.doubtfire.architect.build.options;
const port = Number(process.env.TUTORIAL_QA_PORT ?? 4317);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('TUTORIAL_QA_PORT must be an integer from 1024 to 65535.');
}

cpSync(join(root, 'src'), join(destination, 'src'), {recursive: true});
for (const path of ['tailwind.config.js', '.postcssrc.json']) {
  cpSync(join(root, path), join(destination, path));
}
cpSync(join(fixture, 'preview.ts'), join(destination, 'preview.ts'));
cpSync(join(fixture, 'fixture.css'), join(destination, 'fixture.css'));
symlinkSync(dependencies, join(destination, 'node_modules'), 'dir');
const index = readFileSync(join(root, 'src/index.html'), 'utf8')
  .replace('<app-root></app-root>', '<preview-root></preview-root>')
  .replace(/<title[^>]*>.*?<\/title>/, '<title>OnTrack tutorial — synthetic browser QA</title>');
writeFileSync(join(destination, 'index.html'), index);

// Use the real global styles, font assets, theme marker and typography class.
// Including the owning module gives the compiler scopes for components reached
// transitively through the existing model/service imports. It is not bootstrapped.
writeFileSync(
  join(destination, 'angular.json'),
  JSON.stringify(
    {
      version: 1,
      projects: {
        preview: {
          root: '',
          sourceRoot: 'src',
          projectType: 'application',
          architect: {
            build: {
              builder: '@angular/build:application',
              options: {
                browser: 'preview.ts',
                index: 'index.html',
                tsConfig: 'tsconfig.json',
                outputPath: 'dist',
                styles: [...appOptions.styles, 'fixture.css'],
                assets: ['src/assets'],
                loader: appOptions.loader,
                stylePreprocessorOptions: appOptions.stylePreprocessorOptions,
                polyfills: ['zone.js'],
                optimization: false,
                aot: true,
              },
            },
            serve: {
              builder: '@angular/build:dev-server',
              options: {buildTarget: 'preview:build', host: '127.0.0.1', port},
            },
          },
        },
      },
    },
    null,
    2,
  ),
);
const tsconfig = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8'));
Object.assign(tsconfig.compilerOptions, {
  rootDir: '.',
  baseUrl: '.',
  outDir: './out-tsc',
  types: [],
});
tsconfig.files = ['preview.ts', 'src/app/doubtfire-angular.module.ts'];
tsconfig.include = [];
writeFileSync(join(destination, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
mkdirSync(join(destination, 'evidence'));
console.log(`Synthetic fixture: ${destination}\nURL: http://127.0.0.1:${port}/`);
console.log(
  'Surrounding controls and API responses are synthetic; full application/real API QA is separate.',
);

const child = spawn(process.execPath, [join(dependencies, '@angular/cli/bin/ng.js'), 'serve'], {
  cwd: destination,
  stdio: 'inherit',
  env: {...process.env, NG_BUILD_MAX_WORKERS: process.env.NG_BUILD_MAX_WORKERS ?? '2'},
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
