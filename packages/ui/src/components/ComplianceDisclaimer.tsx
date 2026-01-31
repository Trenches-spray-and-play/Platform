/**
 * Compliance Disclaimer Component
 * 
 * REQUIRED on all pages mentioning financial outcomes, returns, or settlements.
 * This protects against securities law violations.
 * 
 * Usage:
 *   <ComplianceDisclaimer />
 *   <ComplianceDisclaimer variant="minimal" />
 *   <ComplianceDisclaimer variant="footer" />
 */

import React from 'react';

interface ComplianceDisclaimerProps {
  variant?: 'default' | 'minimal' | 'footer';
  className?: string;
}

const disclaimerText = {
  default: `Trenches provides a coordination platform. Returns are based on project marketing fund allocations and user participation. Past performance does not guarantee future results. Always conduct your own research.`,
  minimal: `Returns are targeted, not guaranteed. DYOR.`,
  footer: `*Trenches is a coordination platform. Returns depend on project funds and participation. Not financial advice.`,
};

export const ComplianceDisclaimer = ({
  variant = 'default',
  className = ''
}: ComplianceDisclaimerProps) => {
  const baseStyles = {
    default: 'text-xs text-zinc-400 mt-4 max-w-2xl leading-relaxed',
    minimal: 'text-[10px] text-zinc-500 uppercase tracking-wider',
    footer: 'text-[11px] text-zinc-500 mt-6 pt-4 pb-2 text-center border-t border-zinc-800/50 leading-relaxed max-w-3xl mx-auto px-4',
  };

  return (
    <p className={`${baseStyles[variant]} ${className}`}>
      {disclaimerText[variant]}
    </p>
  );
};
