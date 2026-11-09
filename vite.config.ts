import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.svg'], manifest: {name: 'VU StudyMate AI', short_name: 'StudyMate', description:'VU lecture notes and practice quizzes', theme_color:'#0c1020', background_color:'#0c1020', display:'standalone', start_url:'/', icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]}})] });