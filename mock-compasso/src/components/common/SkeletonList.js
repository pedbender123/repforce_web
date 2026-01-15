
import React from 'react';

const SkeletonList = ({ rows = 5 }) => {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded w-full"></div>
            ))}
        </div>
    );
};

export default SkeletonList;
