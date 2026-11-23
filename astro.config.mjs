// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  server: {
    host: '127.0.0.1', // Local loopback only for privacy and security
    port: 4321,
  },
});
