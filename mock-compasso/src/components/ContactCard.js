import React from 'react';
import { UserIcon, PhoneIcon, EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ContactCard({ contact, onDelete }) {
  return (
    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded-full">
                    <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{contact.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{contact.role || 'Sem cargo'}</p>
                </div>
            </div>
            {contact.is_primary && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Principal</span>
            )}
        </div>
        
        <div className="mt-3 space-y-1">
            {contact.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400"/>
                    <a href={`mailto:${contact.email}`} className="hover:text-repforce-primary">{contact.email}</a>
                </div>
            )}
            {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <PhoneIcon className="w-4 h-4 text-gray-400"/>
                    <a href={`tel:${contact.phone}`} className="hover:text-repforce-primary">{contact.phone}</a>
                </div>
            )}
        </div>
      </div>

      <button 
        onClick={() => { if(window.confirm('Excluir contato?')) onDelete(contact.id) }}
        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <TrashIcon className="w-4 h-4"/>
      </button>
    </div>
  );
}