import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      envPrefix: ['VITE_', 'SUPABASE_'],
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            app: path.resolve(__dirname, 'app.html'),
            landing: path.resolve(__dirname, 'landing.html'),
            blog: path.resolve(__dirname, 'blog.html'),
            blogRotina: path.resolve(__dirname, 'blog/rotina-familiar-organizada.html'),
            blogFinancas: path.resolve(__dirname, 'blog/planejamento-financeiro-familiar.html'),
            blogCompras: path.resolve(__dirname, 'blog/lista-compras-inteligente-familia.html')
          }
        }
      }
    };
});
