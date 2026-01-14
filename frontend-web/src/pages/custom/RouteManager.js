import CustomClientList from './CustomClientList';
import CustomClient360 from './CustomClient360';
import CustomOrderList from './CustomOrderList';

// Map Page Slug -> Component
const ROUTES = {
    // List Pages
    'clientes': CustomClientList,
    'pedidos': CustomOrderList,

    // Subpages (mapped by ID or convention e.g. 'ficha_clientes')
    // We might handle subpages inside the parent component or mapping here.
    // For 360, it's usually inside "clientes/ficha" context.
};

export const getShadowComponent = (pageId, subPageId) => {
    // Logic to return component based on Context
    if (pageId === 'clientes') {
        if (subPageId === 'ficha' || subPageId === 'ficha_360') return CustomClient360;
        return CustomClientList;
    }
    
    if (pageId === 'pedidos') {
        return CustomOrderList;
        // if subPageId ... CustomOrderDetail
    }

    return null;
};
