// Templates Genéricos
import GenericListForm from '../templates/GenericListForm';
import DashboardPlaceholder from '../components/DashboardPlaceholder';

// Templates Especializados (Adaptados das suas Pages antigas)
import TenantManager from '../templates/TenantManager';
import SysAdminUserManager from '../templates/SysAdminUserManager';
import AllUserManager from '../templates/AllUserManager';
import SysAdminDashboard from '../templates/SysAdminDashboard';

import AppDashboard from '../templates/AppDashboard';
import ClientList from '../templates/ClientList';
import ClientForm from '../templates/ClientForm';
import ClientDetails from '../templates/ClientDetails';
import OrderCreate from '../templates/OrderCreate';
import RouteCreate from '../templates/RouteCreate';

const TEMPLATES_MAP = {
  // Genéricos (Para telas simples CRUD)
  'GENERIC_LIST': GenericListForm,
  'ROLE_MANAGER': DashboardPlaceholder,
  'TABLE_MANAGER': DashboardPlaceholder,
  
  // SysAdmin Especializados (Visual Rico)
  'DASHBOARD_SYSADMIN': SysAdminDashboard,
  'TENANT_MANAGER': TenantManager,
  'USER_MANAGER_SYS': SysAdminUserManager,
  'ALL_USER_MANAGER': AllUserManager,

  // App/Representante Especializados (Visual Rico)
  'DASHBOARD_APP': AppDashboard,
  'CLIENT_LIST': ClientList,
  'CLIENT_FORM': ClientForm,
  'CLIENT_DETAILS': ClientDetails,
  'ORDER_CREATE': OrderCreate,
  'ROUTE_CREATE': RouteCreate
};

export default TEMPLATES_MAP;