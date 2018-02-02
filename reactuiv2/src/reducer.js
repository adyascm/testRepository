
import auth from './reducers/auth';
import { combineReducers } from 'redux';
import common from './reducers/common';

export default combineReducers({
  auth,
  common
});
