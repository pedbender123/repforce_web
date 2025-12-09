// Crie a pasta "config" dentro de "src" se não existir.
// Este arquivo mapeia as CHAVES do banco de dados para os COMPONENTES reais do React.

import AppDashboard from '../pages/app/AppDashboard';
import AppClientList from '../pages/app/AppClientList';
import AppClientForm from '../pages/app/AppClientForm';
import AppClientDetails from '../pages/app/AppClientDetails';
import AppOrderCreate from '../pages/app/AppOrderCreate';
import AppRouteCreate from '../pages/app/AppRouteCreate';

// Mapeamento: Chave (DB) -> Componente (React)
const COMPONENT_MAP = {
  'DASHBOARD': AppDashboard,
  'CLIENT_LIST': AppClientList,
  'CLIENT_FORM': AppClientForm,
  'CLIENT_DETAILS': AppClientDetails,
  'ORDER_CREATE': AppOrderCreate,
  'ROUTE_CREATE': AppRouteCreate,
  
  // Placeholders para funcionalidades futuras (evita erro se estiver no banco mas não codado)
  'ORDER_LIST': () => <div className="p-8 font-bold text-gray-500">Lista de Pedidos (Em Desenvolvimento)</div>,
  'PRODUCT_LIST': () => <div className="p-8 font-bold text-gray-500">Catálogo de Produtos (Em Desenvolvimento)</div>
};

export default COMPONENT_MAP;