import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{rollupOptions:{output:{manualChunks:{motion:['motion/react'],gsap:['gsap','gsap/ScrollTrigger'],react:['react','react-dom/client'],validation:['zod']}}}}});
