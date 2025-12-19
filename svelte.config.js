import adapter from '@sveltejs/adapter-vercel'; // Changed from adapter-auto
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            // This bypasses the error you keep seeing
            runtime: 'nodejs22.x' 
        }),
        // This ensures your API routes are treated as clean paths
        trailingSlash: 'never'
    }
};

export default config;