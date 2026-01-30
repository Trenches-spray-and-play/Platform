"use client";

import styles from "./PageHeader.module.css";

interface Action {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "default" | "lg";
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: Action[];
}

export default function PageHeader({ title, subtitle, actions = [] }: PageHeaderProps) {
  const handleClick = (action: Action) => {
    if (action.onClick && !action.loading && !action.disabled) {
      action.onClick();
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action, index) => {
            const btnClass = `${styles.btn} ${styles[`btn${action.variant?.charAt(0).toUpperCase()}${action.variant?.slice(1)}`]} ${styles[`btn${action.size?.charAt(0).toUpperCase()}${action.size?.slice(1)}`]}`.trim();
            
            const content = (
              <>
                {action.icon && (
                  <span className={action.loading ? styles.spinning : ""}>
                    {action.loading ? "↻" : action.icon}
                  </span>
                )}
                {action.label}
              </>
            );

            if (action.href) {
              return (
                <a
                  key={index}
                  href={action.href}
                  className={btnClass}
                  onClick={() => handleClick(action)}
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                key={index}
                className={btnClass}
                onClick={() => handleClick(action)}
                disabled={action.loading || action.disabled}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
