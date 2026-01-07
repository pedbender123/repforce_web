import React from 'react';
import { Plus, Type, Hash, Calendar, CheckSquare, AlignLeft, DollarSign, Mail, Phone, List, Edit2, Trash2 } from 'lucide-react';

const FieldsGrid = ({ fields, onAddField, onEditField, onDeleteField }) => {

    const getTypeIcon = (type) => {
        switch (type) {
            case 'text': return <AlignLeft size={16} className="text-gray-500" />;
            case 'long_text': return <AlignLeft size={16} className="text-gray-500" />;
            case 'number': return <Hash size={16} className="text-blue-500" />;
            case 'currency': return <DollarSign size={16} className="text-green-600" />;
            case 'date': return <Calendar size={16} className="text-orange-500" />;
            case 'boolean': return <CheckSquare size={16} className="text-green-500" />;
            case 'email': return <Mail size={16} className="text-purple-500" />;
            case 'whatsapp': return <Phone size={16} className="text-green-400" />;
            case 'select': return <List size={16} className="text-yellow-600" />;
            default: return <Type size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="flex-1 overflow-auto p-6 bg-gray-50/50 dark:bg-black/20">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden w-max min-w-full">
                {/* Header Row */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {/* Fixed ID Column */}
                    <div className="w-16 p-3 text-xs font-mono text-gray-400 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-center">
                        #
                    </div>

                    {/* Dynamic Fields Headers */}
                    {fields.map(field => (
                        <div key={field.id} className="w-48 p-3 border-r border-gray-200 dark:border-gray-700 flex items-center justify-between group flex-shrink-0 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-2">
                                {getTypeIcon(field.field_type)}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={field.name}>
                                    {field.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 transition-opacity">
                                {field.is_required && <span className="text-red-500 text-xs mr-1" title="Obrigatório">*</span>}
                                <button onClick={() => onEditField && onEditField(field)} className="text-gray-400 hover:text-blue-500"><Edit2 size={12} /></button>
                                <button onClick={() => onDeleteField && onDeleteField(field)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}

                    {/* Add Field Button */}
                    <div className="w-32 p-2 flex items-center justify-center flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border-r border-transparent"
                        onClick={onAddField}>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Plus size={16} />
                            <span>Add</span>
                        </div>
                    </div>
                </div>

                {/* Content Placeholder Rows */}
                {[1, 2, 3, 4, 5].map(row => (
                    <div key={row} className="flex border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="w-16 p-3 text-xs text-gray-400 border-r border-gray-100 dark:border-gray-800 font-mono flex items-center justify-center">
                            {row}
                        </div>
                        {fields.map(field => (
                            <div key={field.id} className="w-48 border-r border-gray-100 dark:border-gray-800 p-3 text-sm text-gray-400 italic">
                                —
                            </div>
                        ))}
                        <div className="w-32 border-gray-100 dark:border-gray-800"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FieldsGrid;
