
import auth from './reducers/auth';
import { combineReducers } from 'redux';
import common from './reducers/common';
import dashboard from './reducers/dashboard';
import users from './reducers/users';
import reports from './reducers/reports'
import resources from './reducers/resources'
import message from './reducers/message'
<<<<<<< HEAD
import auditlog from './reducers/auditlog'
=======
import auditLog from './reducers/auditLog'
import apps from './reducers/apps'
>>>>>>> 81dcc56987003d2937352d00b283dd95cfda0943

export default combineReducers({
  auth,
  common,
  dashboard,
  users,
  resources,
  reports,
  message,
<<<<<<< HEAD
  auditlog
=======
  auditLog,
  apps
>>>>>>> 81dcc56987003d2937352d00b283dd95cfda0943
});
