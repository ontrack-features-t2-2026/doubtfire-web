// Local synthetic acceptance fixture. No real accounts, database, email or push.
// Build first, then run with Node from the repository checkout. Binds loopback only.
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const port = Number(process.env.DASHBOARD_PREVIEW_PORT || 4328);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Use a port from 1024 to 65535');
await fs.access(path.join(root, 'dist/browser/index.html'));
const user = {
  id: 90001,
  username: 'synthetic.student',
  first_name: 'Synthetic',
  last_name: 'Student',
  display_name: 'Synthetic Student',
  nickname: 'Synthetic',
  system_role: 'Student',
  has_run_first_time_setup: true,
  email: 'student@example.invalid',
  student_id: 'SYNTHETIC',
  theme_preference: 'light',
};
function project(id, active = true) {
  const definitions = Array.from({length: 5}, (_, i) => ({
    id: id * 10 + i,
    abbreviation: `${i + 1}.1P`,
    name: [
      'Review the synthetic accessibility report with a long task title',
      'Design a feedback workflow',
      'Document the implementation',
      'Validate keyboard navigation',
      'Complete the handover',
    ][i],
    description: 'Entirely synthetic task used for regression evidence.',
    target_grade: 0,
    weighting: 1,
    start_date: '2026-07-01',
    target_date: '2026-09-21',
    due_date: '2026-09-21',
    upload_requirements: [],
  }));
  return {
    id,
    enrolled: true,
    target_grade: 0,
    student: user,
    unit: {
      id,
      code: `SYN${id}`,
      name:
        id === 1
          ? 'Synthetic project with a long name covering dashboard responsiveness and accessible feedback'
          : 'Synthetic project ' + id,
      active,
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      task_definitions: definitions,
      grade_definitions: [{value: 0, label: 'Pass', abbreviation: 'P', description: 'Pass'}],
    },
    tasks: definitions.map((def, i) => ({
      id: id * 100 + i,
      task_definition_id: def.id,
      status: i === 4 ? 'complete' : 'redo',
      num_new_comments: i === 0 ? 3 : 0,
      ...(i === 2 ? {} : {has_feedback: i < 2}),
      extensions: 0,
      scorm_extensions: 0,
    })),
  };
}
const projects = [project(1), project(2), project(3), project(4, false)];
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1:4328');
      const send = (data, status = 200) => {
        res.writeHead(status, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'});
        res.end(JSON.stringify(data));
      };
      if (url.pathname.startsWith('/api/')) {
        let data = [];
        if (url.pathname === '/api/auth/access-token')
          data = {
            user,
            auth_token: 'synthetic-test-token',
            auth_token_expiry: '2099-01-01T00:00:00Z',
          };
        else if (url.pathname.startsWith('/api/settings'))
          data = {
            externalName: 'Synthetic OnTrack',
            hasLogo: false,
            logoUrl: '',
            logoLinkUrl: '',
            registration_enabled: false,
            overseerEnabled: false,
            tiiEnabled: false,
            d2lEnabled: false,
            pushEnabled: false,
          };
        else if (url.pathname === '/api/auth/signout_url') data = {auth_signout_url: '/sign_in'};
        else if (url.pathname.replace(/\/$/, '') === '/api/projects')
          data =
            url.searchParams.get('include_inactive') === 'true'
              ? projects
              : projects.filter((p) => p.unit.active);
        else if (url.pathname === '/api/tasks/recommended')
          data = {data: [], meta: {page: 1, total_pages: 1, total_count: 0, per_page: 50}};
        else if (url.pathname.includes('/notifications/unread_count')) data = {unread_count: 3};
        else if (url.pathname.startsWith('/api/users/')) data = user;
        return send(data);
      }
      if (url.pathname === '/ngsw-worker.js' || url.pathname === '/ngsw.json') return send({}, 404);
      const prefix = url.pathname.startsWith('/local-monaco/') ? '/local-monaco/' : '/';
      const base =
        prefix === '/local-monaco/'
          ? path.join(root, 'node_modules/monaco-editor/min/vs')
          : path.join(root, 'dist/browser');
      let file = path.resolve(base, '.' + url.pathname.slice(prefix.length - 1));
      if (!file.startsWith(base + '/')) return send({}, 404);
      try {
        if (!(await fs.stat(file)).isFile()) file = path.join(base, 'index.html');
      } catch {
        file = path.join(base, 'index.html');
      }
      let body = await fs.readFile(file);
      if (file.endsWith('.js'))
        body = Buffer.from(
          body
            .toString()
            .replaceAll(
              'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs',
              '/local-monaco',
            ),
        );
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end('Local fixture error');
    }
  })
  .listen(port, '127.0.0.1', () =>
    console.log(`Synthetic dashboard preview: http://127.0.0.1:${port}/dashboard`),
  );
