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
  footer: `Trenches is a coordination platform. Returns depend on project funds and participation. Not financial advice.`,
};

export const ComplianceDisclaimer = ({
  variant = 'default',
  className = ''
}: ComplianceDisclaimerProps) => {
  const baseStyles = {
    default: 'text-xs mt-4 max-w-2xl leading-relaxed',
    minimal: 'text-[10px] uppercase tracking-wider',
    footer: 'text-[11px] mt-6 pt-4 pb-2 text-center border-t leading-relaxed max-w-3xl mx-auto px-4',
  };

  // Inline styles for CSS variable support (works with both designs)
  const inlineStyles: Record<string, React.CSSProperties> = {
    default: { color: 'var(--text-tertiary, #71717a)' },
    minimal: { color: 'var(--text-tertiary, #71717a)' },
    footer: { 
      color: 'var(--text-tertiary, #71717a)',
      borderColor: 'var(--border-primary, rgba(63, 63, 70, 0.5))'
    },
  };

  return (
    <p 
      className={`${baseStyles[variant]} ${className}`}
      style={inlineStyles[variant]}
    >
      {disclaimerText[variant]}
    </p>
  );
};
