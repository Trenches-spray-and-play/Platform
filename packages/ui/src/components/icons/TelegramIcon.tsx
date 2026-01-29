import React from "react";

export const TelegramIcon = ({ size = 16, className = "" }: { size?: number | string, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm5.894-17.471l-2.068 9.754c-.156.691-.563.861-1.141.536l-3.153-2.324-1.521 1.464c-.168.168-.31.31-.635.31l.226-3.21 5.842-5.278c.254-.226-.055-.351-.39-.129l-7.221 4.546-3.111-.973c-.675-.211-.691-.675.14-.997l12.163-4.689c.563-.211 1.055.129.895.787z" />
    </svg>
);

export default TelegramIcon;
