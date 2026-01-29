import React from "react";

export const TikTokIcon = ({ size = 16, className = "" }: { size?: number | string, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path d="M12.525.02c1.31 0 2.568.354 3.66 1.05a5.59 5.59 0 0 1-1.071 3.25c-.246.336-.525.642-.83.916.03.111.05.225.05.343.003 1.955-.005 3.911.006 5.865a7.124 7.124 0 1 1-5.186-6.843c.094.673.4 1.28.868 1.76a4.425 4.425 0 1 0 4.316 4.373c0-2.458.003-4.917-.005-7.375a5.61 5.61 0 0 0 4.14-1.503 5.584 5.584 0 0 0 1.51-4.116c-1.353 0-2.707.001-4.06-.002a5.514 5.514 0 0 1-.365 2.228 5.615 5.615 0 0 1-3.033 3.033V.02h-4.06z" />
    </svg>
);

export default TikTokIcon;
