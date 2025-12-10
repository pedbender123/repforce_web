// Este arquivo liga a "Chave" que vem do banco (JSON) ao Componente React real.
// Se o banco disser "TEMPLATE: GENERIC_LIST", o React renderiza o GenericListForm.

import GenericListForm from '../templates/GenericListForm';
import RoleManager from '../templates/RoleManager';
import TableManager from '../templates/TableManager';
import DashboardPlaceholder from '../components/DashboardPlaceholder';

const TEMPLATES_MAP = {
  // O template "Coringa" para 90% das telas (Listas e Formulários CRUD)
  'GENERIC_LIST': GenericListForm,
  
  // Templates Especializados (que exigem lógica visual única)
  'ROLE_MANAGER': RoleManager,     // Gestão de Cargos e Permissões
  'TABLE_MANAGER': TableManager,   // Gestão de Tabelas e Colunas Extras
  
  // Dashboards
  'DASHBOARD_SYSADMIN': DashboardPlaceholder, 
  'DASHBOARD_TENANT': DashboardPlaceholder,
};

export default TEMPLATES_MAP;