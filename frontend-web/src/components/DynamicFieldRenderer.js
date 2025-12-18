import React from 'react';

const DynamicFieldRenderer = ({ fieldConfig, value, onChange, disabled = false }) => {
    const { label, type, options, required, key } = fieldConfig;

    const handleChange = (e) => {
        onChange(key, e.target.value);
    };

    const commonClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 sm:text-sm";

    switch (type) {
        case 'text':
            return (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled}
                        className={commonClasses}
                    />
                </div>
            );

        case 'number':
            return (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="number"
                        value={value || ''}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled}
                        className={commonClasses}
                    />
                </div>
            );

        case 'date':
            return (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="date"
                        value={value || ''}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled}
                        className={commonClasses}
                    />
                </div>
            );

        case 'select':
            return (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        value={value || ''}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled}
                        className={commonClasses}
                    >
                        <option value="">Selecione...</option>
                        {options?.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case 'boolean':
            return (
                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        id={`field-${key}`}
                        checked={!!value}
                        onChange={(e) => onChange(key, e.target.checked)}
                        disabled={disabled}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`field-${key}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                </div>
            );

        default:
            return null;
    }
};

export default DynamicFieldRenderer;
