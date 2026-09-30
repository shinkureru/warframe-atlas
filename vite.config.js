import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub 專案頁面使用 /repo/，使用者根站與本機使用 /。
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.VITE_BASE_PATH || (repo && !repo.endsWith('.github.io') ? `/${repo}/` : '/');
export default defineConfig({ plugins: [react()], base, server: { host: '127.0.0.1', fs: { deny: ['.env', '.env.*'] } } });
