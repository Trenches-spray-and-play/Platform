/**
 * Config Audit Service
 *
 * Tracks all configuration changes for audit trail and rollback.
 */

import { prisma } from '@/lib/db';

export type ConfigType = 'campaign' | 'platform';

/**
 * Log a config change
 */
export async function logConfigChange(params: {
    configType: ConfigType;
    configId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string;
}): Promise<void> {
    const { configType, configId, field, oldValue, newValue, changedBy } = params;

    await prisma.configAuditLog.create({
        data: {
            configType,
            configId,
            field,
            oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
            newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
            changedBy,
        }
    });
}

/**
 * Log multiple field changes at once
 */
export async function logConfigChanges(params: {
    configType: ConfigType;
    configId: string;
    oldConfig: Record<string, unknown>;
    newConfig: Record<string, unknown>;
    changedBy: string;
}): Promise<number> {
    const { configType, configId, oldConfig, newConfig, changedBy } = params;

    const changes: Array<{
        configType: string;
        configId: string;
        field: string;
        oldValue: string | null;
        newValue: string | null;
        changedBy: string;
    }> = [];

    // Find all fields that changed
    const allFields = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);

    for (const field of allFields) {
        const oldVal = oldConfig[field];
        const newVal = newConfig[field];

        // Compare JSON representations to handle objects/arrays
        const oldJson = oldVal !== undefined ? JSON.stringify(oldVal) : null;
        const newJson = newVal !== undefined ? JSON.stringify(newVal) : null;

        if (oldJson !== newJson) {
            changes.push({
                configType,
                configId,
                field,
                oldValue: oldJson,
                newValue: newJson,
                changedBy,
            });
        }
    }

    if (changes.length > 0) {
        await prisma.configAuditLog.createMany({ data: changes });
    }

    return changes.length;
}

/**
 * Get config change history
 */
export async function getConfigHistory(params: {
    configType?: ConfigType;
    configId?: string;
    limit?: number;
}): Promise<Array<{
    id: string;
    configType: string;
    configId: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    changedBy: string;
    changedAt: Date;
}>> {
    const { configType, configId, limit = 50 } = params;

    return prisma.configAuditLog.findMany({
        where: {
            ...(configType && { configType }),
            ...(configId && { configId }),
        },
        orderBy: { changedAt: 'desc' },
        take: limit,
    });
}

/**
 * Get latest config version before a given date (for rollback)
 */
export async function getConfigAtTime(params: {
    configType: ConfigType;
    configId: string;
    beforeDate: Date;
}): Promise<Record<string, unknown>> {
    const { configType, configId, beforeDate } = params;

    // Get all changes up to that point, in order
    const changes = await prisma.configAuditLog.findMany({
        where: {
            configType,
            configId,
            changedAt: { lte: beforeDate },
        },
        orderBy: { changedAt: 'asc' },
    });

    // Reconstruct the config at that point
    const config: Record<string, unknown> = {};
    for (const change of changes) {
        if (change.newValue !== null) {
            try {
                config[change.field] = JSON.parse(change.newValue);
            } catch {
                config[change.field] = change.newValue;
            }
        }
    }

    return config;
}
