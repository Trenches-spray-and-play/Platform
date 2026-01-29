/**
 * Address Book Service
 * 
 * Manages user payout addresses with email confirmation and 24h activation delay.
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';
import type { AddressChain, AddressStatus } from '@prisma/client';

// ============== Validation Helpers ==============

export function isValidEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidSolanaAddress(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function validateAddress(address: string, chain: AddressChain): { valid: boolean; error?: string } {
    if (chain === 'EVM') {
        if (!isValidEvmAddress(address)) {
            return { valid: false, error: 'Invalid Ethereum address format' };
        }
    } else if (chain === 'SOLANA') {
        if (!isValidSolanaAddress(address)) {
            return { valid: false, error: 'Invalid Solana address format' };
        }
    }
    return { valid: true };
}

// ============== Core Functions ==============

/**
 * Add a new address (creates PENDING, sends email)
 */
export async function addAddress(
    userId: string,
    address: string,
    chain: AddressChain,
    label?: string
): Promise<{ success: boolean; addressId?: string; token?: string; error?: string }> {
    try {
        // Validate address format
        const validation = validateAddress(address, chain);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Check max 5 addresses
        const existingCount = await prisma.withdrawalAddress.count({
            where: { userId }
        });
        if (existingCount >= 5) {
            return { success: false, error: 'Maximum 5 addresses allowed. Remove one first.' };
        }

        // Rate limit: 1 per hour
        const recentAdd = await prisma.withdrawalAddress.findFirst({
            where: {
                userId,
                createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
            }
        });
        if (recentAdd) {
            return { success: false, error: 'Rate limit: Max 1 address per hour' };
        }

        // Check for duplicate
        const existing = await prisma.withdrawalAddress.findFirst({
            where: { userId, address, chain }
        });
        if (existing) {
            return { success: false, error: 'Address already exists in your book' };
        }

        // Generate confirmation token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create PENDING address
        const newAddress = await prisma.withdrawalAddress.create({
            data: {
                userId,
                address,
                chain,
                label,
                status: 'PENDING',
                emailConfirmed: false,
                confirmationToken: token,
                tokenExpiresAt,
            }
        });

        return { success: true, addressId: newAddress.id, token };
    } catch (error) {
        console.error('Error adding address:', error);
        return { success: false, error: 'Failed to add address' };
    }
}

/**
 * Confirm email link clicked - starts 24h countdown
 */
export async function confirmAddress(token: string): Promise<{ success: boolean; error?: string }> {
    try {
        const address = await prisma.withdrawalAddress.findUnique({
            where: { confirmationToken: token }
        });

        if (!address) {
            return { success: false, error: 'Invalid or expired confirmation token' };
        }

        if (address.emailConfirmed) {
            return { success: false, error: 'Address already confirmed' };
        }

        if (address.tokenExpiresAt && address.tokenExpiresAt < new Date()) {
            return { success: false, error: 'Confirmation token expired' };
        }

        // Set email confirmed and start 24h countdown
        const activatesAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.withdrawalAddress.update({
            where: { id: address.id },
            data: {
                emailConfirmed: true,
                activatesAt,
                confirmationToken: null, // Clear token
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error confirming address:', error);
        return { success: false, error: 'Failed to confirm address' };
    }
}

/**
 * Activate pending addresses (cron job - every 5 min)
 */
export async function activatePendingAddresses(): Promise<number> {
    const now = new Date();

    const result = await prisma.withdrawalAddress.updateMany({
        where: {
            status: 'PENDING',
            emailConfirmed: true,
            activatesAt: { lte: now }
        },
        data: {
            status: 'ACTIVE',
            activatedAt: now
        }
    });

    if (result.count > 0) {
        console.log(`Activated ${result.count} addresses`);
    }

    return result.count;
}

/**
 * Set address as primary for its chain
 */
export async function setPrimary(
    userId: string,
    addressId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const address = await prisma.withdrawalAddress.findFirst({
            where: { id: addressId, userId }
        });

        if (!address) {
            return { success: false, error: 'Address not found' };
        }

        if (address.status !== 'ACTIVE') {
            return { success: false, error: 'Only ACTIVE addresses can be set as primary' };
        }

        // Transaction: unset other primaries for this chain, set new primary
        await prisma.$transaction([
            prisma.withdrawalAddress.updateMany({
                where: { userId, chain: address.chain, isPrimary: true },
                data: { isPrimary: false }
            }),
            prisma.withdrawalAddress.update({
                where: { id: addressId },
                data: { isPrimary: true }
            })
        ]);

        return { success: true };
    } catch (error) {
        console.error('Error setting primary:', error);
        return { success: false, error: 'Failed to set primary address' };
    }
}

/**
 * Remove address (hard delete + audit log)
 */
export async function removeAddress(
    userId: string,
    addressId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const address = await prisma.withdrawalAddress.findFirst({
            where: { id: addressId, userId }
        });

        if (!address) {
            return { success: false, error: 'Address not found' };
        }

        if (address.isPrimary) {
            return { success: false, error: 'Cannot remove primary address. Set another as primary first.' };
        }

        // Audit log using ConfigAuditLog
        await prisma.configAuditLog.create({
            data: {
                configType: 'withdrawal_address',
                configId: userId,
                field: 'ADDRESS_REMOVED',
                oldValue: JSON.stringify({ address: address.address, chain: address.chain }),
                newValue: null,
                changedBy: userId,
            }
        });

        // Hard delete
        await prisma.withdrawalAddress.delete({
            where: { id: addressId }
        });

        return { success: true };
    } catch (error) {
        console.error('Error removing address:', error);
        return { success: false, error: 'Failed to remove address' };
    }
}

/**
 * Get payout address for a user on a specific chain
 * Falls back to legacy wallet fields if no primary set
 */
export async function getPayoutAddress(
    userId: string,
    chain: AddressChain
): Promise<string | null> {
    // Check if user needs migration
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            addressBookMigrated: true,
            walletEvm: true,
            walletSol: true,
        }
    });

    if (!user) return null;

    // Auto-migrate if not done yet
    if (!user.addressBookMigrated) {
        await migrateUserAddresses(userId);
    }

    // Find primary for this chain
    const primary = await prisma.withdrawalAddress.findFirst({
        where: { userId, chain, isPrimary: true, status: 'ACTIVE' }
    });

    if (primary) return primary.address;

    // Fallback to legacy fields
    return chain === 'EVM' ? user.walletEvm : user.walletSol;
}

/**
 * Migrate legacy wallet fields to Address Book (one-time)
 */
export async function migrateUserAddresses(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            addressBookMigrated: true,
            walletEvm: true,
            walletSol: true,
        }
    });

    if (!user || user.addressBookMigrated) return;

    const creates = [];

    // Migrate EVM wallet as PRIMARY for EVM chain
    if (user.walletEvm) {
        creates.push(prisma.withdrawalAddress.create({
            data: {
                userId,
                address: user.walletEvm,
                chain: 'EVM',
                label: 'Migrated EVM Wallet',
                status: 'ACTIVE',
                emailConfirmed: true,
                isPrimary: true,
                activatedAt: new Date(),
            }
        }));
    }

    // Migrate Solana wallet as PRIMARY for Solana chain
    if (user.walletSol) {
        creates.push(prisma.withdrawalAddress.create({
            data: {
                userId,
                address: user.walletSol,
                chain: 'SOLANA',
                label: 'Migrated Solana Wallet',
                status: 'ACTIVE',
                emailConfirmed: true,
                isPrimary: true,
                activatedAt: new Date(),
            }
        }));
    }

    // Run all creates + mark migrated
    await prisma.$transaction([
        ...creates,
        prisma.user.update({
            where: { id: userId },
            data: { addressBookMigrated: true }
        })
    ]);

    console.log(`Migrated addresses for user ${userId}`);
}

/**
 * List user's addresses with display status
 */
export async function listAddresses(userId: string): Promise<{
    id: string;
    address: string;
    chain: AddressChain;
    label: string | null;
    status: AddressStatus;
    isPrimary: boolean;
    displayStatus: 'AWAITING_EMAIL' | 'ACTIVATING' | 'ACTIVE' | 'PRIMARY';
    activatesAt: Date | null;
    createdAt: Date;
}[]> {
    const addresses = await prisma.withdrawalAddress.findMany({
        where: { userId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
    });

    const now = new Date();

    return addresses.map(addr => ({
        id: addr.id,
        address: addr.address,
        chain: addr.chain,
        label: addr.label,
        status: addr.status,
        isPrimary: addr.isPrimary,
        displayStatus: addr.isPrimary ? 'PRIMARY'
            : addr.status === 'ACTIVE' ? 'ACTIVE'
                : !addr.emailConfirmed ? 'AWAITING_EMAIL'
                    : addr.activatesAt && addr.activatesAt > now ? 'ACTIVATING'
                        : 'ACTIVE',
        activatesAt: addr.activatesAt,
        createdAt: addr.createdAt,
    }));
}

/**
 * Cleanup expired unconfirmed addresses (daily cron)
 */
export async function cleanupExpiredAddresses(): Promise<number> {
    const result = await prisma.withdrawalAddress.deleteMany({
        where: {
            emailConfirmed: false,
            tokenExpiresAt: { lte: new Date() }
        }
    });

    if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired unconfirmed addresses`);
    }

    return result.count;
}
