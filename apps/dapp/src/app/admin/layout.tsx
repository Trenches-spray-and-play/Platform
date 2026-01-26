"use client";

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import styles from './admin.module.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.adminContainer}>
            <header className={styles.header}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <Logo variant="horizontal" />
                </Link>
                <a href="/" className={styles.exitLink}>RETURN TO DAPP</a>
            </header>
            <main className={styles.adminMain}>
                {children}
            </main>
        </div>
    );
}
