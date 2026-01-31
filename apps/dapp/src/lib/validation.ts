import { z, ZodError } from 'zod';
import { useUIStore } from '@/store/uiStore';

/**
 * Formats a ZodError into a readable string or array of strings.
 */
export function formatZodError(error: ZodError): string {
    return error.issues
        .map((e) => {
            const field = e.path.join('.');
            return `${field ? `${field}: ` : ''}${e.message}`;
        })
        .join(', ');
}

/**
 * Validates data against a schema. If validation fails, it triggers a global toast
 * and returns null. Otherwise, it returns the parsed data.
 */
export function validateOrToast<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    try {
        return schema.parse(data);
    } catch (err) {
        if (err instanceof ZodError) {
            const errorMessage = formatZodError(err);
            // Access store directly via getState to use outside of React components if needed
            useUIStore.getState().addToast(errorMessage, 'error');
        }
        return null;
    }
}

/**
 * Type-safe helper for API response validation
 */
export async function validateApiResponse<T>(schema: z.ZodSchema<T>, response: Response): Promise<T | null> {
    try {
        const json = await response.json();
        if (!json.success) {
            useUIStore.getState().addToast(json.error || 'API request failed', 'error');
            return null;
        }
        return schema.parse(json.data);
    } catch (err) {
        if (err instanceof ZodError) {
            console.error('API Response Validation Error:', err);
            useUIStore.getState().addToast('Invalid API response format', 'error');
        } else {
            useUIStore.getState().addToast('Failed to parse API response', 'error');
        }
        return null;
    }
}
