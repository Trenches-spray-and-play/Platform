/**
 * Config Validation Service
 *
 * Validates configuration values before saving to prevent invalid data.
 */

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate campaign config fields
 */
export function validateCampaignConfig(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    // manualPrice: > 0, ≤ 1,000,000
    if (config.manualPrice !== undefined && config.manualPrice !== null && config.manualPrice !== '') {
        const price = Number(config.manualPrice);
        if (isNaN(price) || price <= 0 || price > 1000000) {
            errors.push('manualPrice must be between 0 and 1,000,000');
        }
    }

    // roiMultiplier: > 0, ≤ 10
    if (config.roiMultiplier !== undefined) {
        const roi = Number(config.roiMultiplier);
        if (isNaN(roi) || roi <= 0 || roi > 10) {
            errors.push('roiMultiplier must be between 0 and 10');
        }
    }

    // tokenDecimals: 0-24
    if (config.tokenDecimals !== undefined) {
        const decimals = Number(config.tokenDecimals);
        if (isNaN(decimals) || decimals < 0 || decimals > 24) {
            errors.push('tokenDecimals must be between 0 and 24');
        }
    }

    // payoutIntervalSeconds: 1-3600
    if (config.payoutIntervalSeconds !== undefined) {
        const interval = Number(config.payoutIntervalSeconds);
        if (isNaN(interval) || interval < 1 || interval > 3600) {
            errors.push('payoutIntervalSeconds must be between 1 and 3600');
        }
    }

    // tokenAddress: must be non-empty if provided
    if (config.tokenAddress !== undefined && typeof config.tokenAddress === 'string') {
        if (config.tokenAddress.trim() === '') {
            errors.push('tokenAddress cannot be empty');
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate platform config fields
 */
export function validatePlatformConfig(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    // bpToMinutesRate: > 0, ≤ 1000
    if (config.bpToMinutesRate !== undefined) {
        const rate = Number(config.bpToMinutesRate);
        if (isNaN(rate) || rate <= 0 || rate > 1000) {
            errors.push('bpToMinutesRate must be between 0 and 1000');
        }
    }

    // beliefTiers: valid JSON array with ascending minScores
    if (config.beliefTiers !== undefined) {
        try {
            const tiers = typeof config.beliefTiers === 'string'
                ? JSON.parse(config.beliefTiers)
                : config.beliefTiers;

            if (!Array.isArray(tiers)) {
                errors.push('beliefTiers must be an array');
            } else {
                let lastMinScore = -1;
                for (let i = 0; i < tiers.length; i++) {
                    const tier = tiers[i];
                    if (typeof tier.minScore !== 'number' || typeof tier.multiplier !== 'number') {
                        errors.push(`beliefTiers[${i}] must have numeric minScore and multiplier`);
                        continue;
                    }
                    if (tier.minScore < lastMinScore) {
                        errors.push('beliefTiers minScores must be in ascending order');
                    }
                    if (tier.multiplier < 0 || tier.multiplier > 10) {
                        errors.push(`beliefTiers[${i}].multiplier must be between 0 and 10`);
                    }
                    lastMinScore = tier.minScore;
                }
            }
        } catch {
            errors.push('beliefTiers must be valid JSON');
        }
    }

    // URL validations
    const urlFields = ['telegramUrl', 'twitterUrl', 'docsUrl'];
    for (const field of urlFields) {
        if (config[field] !== undefined && typeof config[field] === 'string') {
            const url = config[field] as string;
            if (url && !url.match(/^https?:\/\/.+/)) {
                errors.push(`${field} must be a valid URL starting with http:// or https://`);
            }
        }
    }

    return { valid: errors.length === 0, errors };
}
