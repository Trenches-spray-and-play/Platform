import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
    test: {
        environment: 'node',
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
