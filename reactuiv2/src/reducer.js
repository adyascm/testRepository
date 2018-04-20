
import auth from './reducers/auth';
import { combineReducers } from 'redux';
import common from './reducers/common';
import dashboard from './reducers/dashboard';
import users from './reducers/users';
import reports from './reducers/reports'
import resources from './reducers/resources'
import message from './reducers/message'
import auditlog from './reducers/auditlog'
import apps from './reducers/apps'
import policy from './reducers/policy'
import alert from './reducers/alert'


export default combineReducers({
  auth,
  common,
  dashboard,
  users,
  resources,
  reports,
  message,
  auditlog,
  apps,
  policy,
  alert
});

// const rootReducer = (state,action) => {
//   if (action.type === 'LOGOUT')
//     state = undefined

//   return appReducer(state,action)
// }

// export default rootReducer
