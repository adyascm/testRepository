
import auth from './reducers/auth';
import { combineReducers } from 'redux';
import common from './reducers/common';
import dashboard from './reducers/dashboard';
import users from './reducers/users';
import reports from './reducers/reports'
import resources from './reducers/resources'
import error from './reducers/error'

export default combineReducers({
  auth,
  common,
  dashboard,
  users,
  resources,
  reports,
  error
});
