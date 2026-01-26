// Re-export from shared auth package
// This file exists for backwards compatibility with existing imports
import { createClient as createServerClientBase } from '@trenches/auth/server';

export const createClient = createServerClientBase;
