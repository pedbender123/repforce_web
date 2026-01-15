import React from 'react';

const DynamicFieldRenderer = ({ fieldConfig, value, onChange, disabled = false }) => {
    const { label, type, options, required, key } = fieldConfig;

    const handleChange = (e) => {
        onChange(key, e.target.value);
    };

    const commonClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 sm:text-sm";

    switch (type) {
        case 'long_text':
            return (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                        value={value || ''}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled}
                        rows={4}
                        className={commonClasses}
                    />
                </div>
            );

        case 'text':
        case 'email':
        case 'whatsapp':
            return (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type={type === 'email' ? 'email' : 'text'}
                        value={value || ''}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled}
                        className={commonClasses}
                    />
                </div>
            );

        case 'number':
        case 'currency':
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
                        step={type === 'currency' ? "0.01" : "any"}
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



        case 'list_ref':
             return (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        multiple
                        value={Array.isArray(value) ? value : []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            onChange(key, selected);
                        }}
                        required={required}
                        disabled={disabled}
                        className={`${commonClasses} h-32`}
                    >
                        {options?.map((opt, idx) => {
                             const optLab = typeof opt === 'object' ? (opt.label || opt.name || opt.nome) : opt;
                             const optVal = typeof opt === 'object' ? (opt.value || opt.id) : opt;
                             return (
                                <option key={idx} value={optVal}>
                                    {optLab}
                                </option>
                            );
                        })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Segure Ctrl (ou Cmd) para selecionar múltiplos itens.</p>
                </div>
            );

        case 'select':
        case 'ref':
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
                        {options?.map((opt, idx) => {
                             const optLab = typeof opt === 'object' ? (opt.label || opt.name || opt.nome) : opt;
                             const optVal = typeof opt === 'object' ? (opt.value || opt.id) : opt;
                             return (
                                <option key={idx} value={optVal}>
                                    {optLab}
                                </option>
                            );
                        })}
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
            return (
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} (Tipo desconhecido: {type})
                    </label>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={handleChange}
                        disabled={disabled}
                        className={commonClasses}
                    />
                </div>
            );
    }
};

export default DynamicFieldRenderer;
