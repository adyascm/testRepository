
import auth from './reducers/auth';
import { combineReducers } from 'redux';
import common from './reducers/common';
import dashboard from './reducers/dashboard';
import users from './reducers/users';
import reports from './reducers/reports'
import resources from './reducers/resources'
import message from './reducers/message'
import auditlog from './reducers/auditlog'

export default combineReducers({
  auth,
  common,
  dashboard,
  users,
  resources,
  reports,
  message,
  auditlog
});
