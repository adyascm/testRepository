import 'es6-shim';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer, routerMiddleware } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form';
import { persistStore, autoRehydrate } from 'redux-persist';
import createFilter from 'redux-persist-transform-filter';
import CookieStorage from 'redux-persist-cookie-storage';
import PermissionsAppContainer, { permissionsAppReducer } from './PermissionsApp';
import AuthContainer, { authReducer } from './AuthContainer';
import DualPaneViewContainer from './DualPaneViewContainer';
import Dashboard from './Dashboard';
import Reports from './Reports';
import GoogleAuthRedirectHandler from './GoogleAuthRedirectHandler';
import Placeholder from './Placeholder';
import AuthWrapper from './AuthWrapper';
import UserGroups from './UserGroups';
import Resources from './Resources';
import SettingsContainer from './SettingsContainer';
import RealtimeFramework from './RealtimeFramewwork';
//import GDriveScan from './GDriveScan';
//import gdriveScanReport from './GDriveScanReport';
import SearchContainer from './SearchContainer';
import Report from './Report';
import Account from './Account';
import './GlobalStyles/GlobalStyles';
import ResetPassword from './Account/ResetPassword';

require('sanitize.css/sanitize.css');

const reducer = combineReducers({
  permissions: permissionsAppReducer,
  auth: authReducer,
  routing: routerReducer,
  form: formReducer
});

const store = createStore(
  reducer,
  compose(
    applyMiddleware(thunk, routerMiddleware(browserHistory)),
    autoRehydrate(),
    (window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()) || (x => x)
  )
);

const saveProfileFilter = createFilter('auth', ['profile']);

persistStore(store, {
  whitelist: ['auth'],
  transforms: [saveProfileFilter],
  storage: new CookieStorage({ expiration: { default: 365 * 86400 }, indexKey: 'adya_index' }),
  keyPrefix: 'adya_'
});

const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/realtime" component={RealtimeFramework} />
      <Route path="/oauthstatus/:status" component={GoogleAuthRedirectHandler} />
      <Route path="/" component={PermissionsAppContainer}>
        <IndexRoute component={AuthWrapper(Dashboard)} />
        <Route path="/datasources" component={AuthWrapper(SettingsContainer)} />
        <Route path="/auth" component={AuthContainer} />
        <Route path="/reports" component={AuthWrapper(Report)} />
        <Route path="/accounts" component={AuthWrapper(Account)} />
        <Route path="/search" component={AuthWrapper(SearchContainer)} />
        <Route path="/report" component={AuthWrapper(Reports)} />
        <Route path="/usergroups" component={AuthWrapper(UserGroups)} />
        <Route path="/resources" component={AuthWrapper(Resources)} />
        <Route path="*" component={Placeholder} />

      </Route>
    </Router>
  </Provider>,
  document.getElementById('root')
);
