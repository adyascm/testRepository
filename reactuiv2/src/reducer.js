
import auth from './reducers/auth';
import { combineReducers } from 'redux';
import common from './reducers/common';
import dashboard from './reducers/dashboard';
import users from './reducers/users';

export default combineReducers({
  auth,
  common,
  dashboard,
  users
});
