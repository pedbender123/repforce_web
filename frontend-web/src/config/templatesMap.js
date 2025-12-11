import GenericListForm from '../templates/GenericListForm';
import DashboardPlaceholder from '../components/DashboardPlaceholder';

const TEMPLATES_MAP = {
  'GENERIC_LIST': GenericListForm,
  'ROLE_MANAGER': DashboardPlaceholder, // Placeholder
  'TABLE_MANAGER': DashboardPlaceholder, // Placeholder
  'DASHBOARD': DashboardPlaceholder
};

export default TEMPLATES_MAP;