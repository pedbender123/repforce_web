import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

const DemoModeBanner = () => {
    const { user } = useAuth();

    // Verification: user exists, has tenant, and tenant has demo_mode_start
    const isDemoMode = user?.tenant?.demo_mode_start;

    if (!isDemoMode) return null;

    return (
        <>
            {/* Top Fixed Banner */}
            <div
                className="bg-purple-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-md relative z-50"
                data-tooltip-id="demo-tooltip"
                data-tooltip-content="Todos os dados criados neste modo serão apagados ao encerrar a demonstração."
            >
                <AlertTriangle size={18} className="text-yellow-300" />
                <span>MODO DEMO ATIVO</span>
                <span className="hidden md:inline opacity-90 font-normal">- Dados fictícios.</span>
                <Info size={16} className="ml-1 opacity-80" />
            </div>

            <Tooltip id="demo-tooltip" place="bottom" variant="light" />
        </>
    );
};

export default DemoModeBanner;
