import { createAction } from 'redux-actions';
import * as urls from '../urls';
import { FILES_ROOT, LOG_TYPE_USER } from '../constants';

// TODO: we don't need separate actions for errors. redux-actions handles it.
// Just pass an Error instance to it instead of the payload.
export const FETCH_UGTLIST = createAction(
  'permissions/PermissionsApp/FETCH_UGTLIST',
  (email) => ({email})
);

export const FETCH_USERS = createAction(
  'permissions/PermissionsApp/FETCH_USERS',
  (parentEmail, parentId, usersourceId) => ({ parentEmail, parentId, usersourceId })
);
export const FETCH_USERS_GROUPS = createAction(
  'permissions/PermissionsApp/FETCH_USERS_GROUPS',
  (parentEmail, parentId, usersourceId) => ({ parentEmail, parentId, usersourceId })
);

export const FETCH_TOPLEVEL_USERS = createAction(
  'permissions/PermissionsApp/FETCH_TOPLEVEL_USERS',
  email => ({ email })
);

export const RECEIVE_UGTLIST = createAction(
  'permissions/PermissionsApp/RECEIVE_UGTLIST',
  (email, ugtdata) => ({ email, ugtdata})
);

export const RECEIVE_USERS = createAction(
  'permissions/PermissionsApp/RECEIVE_USERS',
  (parentId, usersourceId, users) => ({ parentId, usersourceId, users })
);

export const RECEIVE_USERS_GROUPS = createAction(
  'permissions/PermissionsApp/RECEIVE_USERS_GROUPS',
  (parentId, usersourceId, users) => ({ parentId, usersourceId, users })
);

export const RECEIVE_TOPLEVEL_USERS = createAction(
  'permissions/PermissionsApp/RECEIVE_TOPLEVEL_USERS',
  (email, users) => ({ email, users })
);

export const FETCH_USERS_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_USERS_ERROR',
  error => ({ error })
);

export const FETCH_USERSOURCES_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_USERSOURCES_ERROR',
  error => ({ error })
);

export const SET_USER_EXPANDED = createAction(
  'permissions/PermissionsApp/SET_USER_EXPANDED',
  (userId, isUserExpanded) => ({ userId, isUserExpanded })
);

export const SET_USER_RESOURCES_EXPANDED = createAction(
  'permissions/PermissionsApp/SET_USER_RESOURCES_EXPANDED',
  (userId, isUserExpanded) => ({ userId, isUserExpanded })
);

export const SET_USER_GROUP_EXPANDED = createAction(
  'permissions/PermissionsApp/SET_USER_GROUP_EXPANDED',
  (userId, isUserExpanded) => ({ userId, isUserExpanded })
);

export const SET_LOCK_STATE_UL = createAction(
  'permissions/PermissionsApp/SET_LOCK_STATE_UL',
  lockStateUL => ({ lockStateUL })
);

export const SET_WIDGET_REPORT = createAction(
  'permissions/PermissionsApp/SET_WIDGET_REPORT',
  widgetReport => ({ widgetReport })
);

export const SET_METADATA = createAction(
  'permissions/PermissionsApp/SET_METADATA',
  metadata => ({ metadata })
);

export const SET_FILTER_SUBMIT = createAction(
  'permissions/PermissionsApp/SET_FILTER_SUBMIT',
  submitted => ({ submitted })
);

export const SET_FILTER_INPUT = createAction(
  'permissions/PermissionsApp/SET_FILTER_INPUT',
  filterInput => ({ filterInput })
);


export const SET_LOCK_ICON_VISIBLE = createAction(
  'permissions/PermissionsApp/SET_LOCK_ICON_VISIBLE',
  lockIconVisible => ({lockIconVisible})
);

export const SET_LOCK_STATE_FT = createAction(
  'permissions/PermissionsApp/SET_LOCK_STATE_FT',
  lockStateFT => ({ lockStateFT })
);

export const SET_SCAN_STATUS = createAction(
  'permissions/PermissionsApp/SET_SCAN_STATUS',
  scanStatus => ({ scanStatus })
);

export const SET_FORGOT_PASSWORD_EMAIL = createAction(
  'permissions/PermissionsApp/SET_FORGOT_PASSWORD_EMAIL',
  forgotPasswordEmail => ({ forgotPasswordEmail })
);

export const FETCH_RESOURCES = createAction(
  'permissions/PermissionsApp/FETCH_RESOURCES',
  email => ({ email })
);

export const RECEIVE_RESOURCES = createAction(
  'permissions/PermissionsApp/RECEIVE_RESOURCES',
  (email, dataSources) => ({ email, dataSources })
);

export const FETCH_RESOURCES_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_RESOURCES_ERROR',
  error => ({ error })
);

export const FETCH_FILES = createAction(
  'permissions/PermissionsApp/FETCH_FILES',
  (email, parentId, datasourceId) => ({ email, parentId, datasourceId })
);

export const FETCH_USER_GROUP = createAction(
  'permissions/PermissionsApp/FETCHUSER_GROUP',
  (email, datasourceId, resourceId) => ({ email, datasourceId , resourceId})
);

export const RECEIVE_USER_GROUP = createAction(
  'permissions/PermissionsApp/RECEIVE_USER_GROUP',
  (email, datasourceId, resourceId, userGroupFlatData) => ({ email, datasourceId , resourceId, userGroupFlatData})
);

export const RECEIVE_FILES = createAction(
  'permissions/PermissionsApp/RECEIVE_FILES',
  (parentId, datasourceId, resources) => ({ parentId, datasourceId, resources })
);

export const RECEIVE_FILES_DATA = createAction(
  'permissions/PermissionsApp/RECEIVE_FILES_DATA',
  (parentId, datasourceId, resources) => ({ parentId, datasourceId, resources })
);

export const FETCH_FILES_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_FILES_ERROR',
  error => ({ error })
);

export const SET_ROOT_EXPANDED = createAction(
  'permissions/PermissionsApp/SET_ROOT_EXPANDED',
  (datasourceId, root, isFileExpanded) => ({ datasourceId, root, isFileExpanded })
);

export const SET_FILE_RESOURCES_EXPANDED = createAction(
  'permissions/PermissionsApp/SET_FILE_RESOURCES_EXPANDED',
  (datasourceId, root, isFileExpanded) => ({ datasourceId, root, isFileExpanded })
);

export const SET_FILE_USER_GROUP_EXPANDED = createAction(
  'permissions/PermissionsApp/SET_FILE_USER_GROUP_EXPANDED',
  (datasourceId, root, isFileExpanded) => ({ datasourceId, root, isFileExpanded })
);

export const FETCH_LOG = createAction(
  'permissions/PermissionsApp/FETCH_LOG',
  (logType, userId, resourceId) => ({ logType, userId, resourceId })
);

export const RECEIVE_LOG = createAction(
  'permissions/PermissionsApp/RECEIVE_LOG',
  (logType, userId, resourceId, log) => ({ logType, userId, resourceId, log })
);

export const FETCH_LOG_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_LOG_ERROR',
  error => ({ error })
);

export const SET_ACTIVE_USER = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_USER',
  user => ({ user })
);

export const SET_ACTIVE_USER_RESOURCES = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_USER_RESOURCES',
  user => ({ user })
);

export const SET_ACTIVE_USER_USER_GROUP = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_USER_USER_GROUP',
  user => ({ user })
);

export const SET_ACCOUNT_SIGN_UP = createAction(
  'permissions/PermissionsApp/SET_ACCOUNT_SIGN_UP',
  accountSignUp => ({ accountSignUp })
);

export const SET_ACTIVE_FILE = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_FILE',
  file => ({ file })
);

export const SET_ACTIVE_FILE_RESOURCES = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_FILE_RESOURCES',
  file => ({ file })
);

export const SET_ACTIVE_FILE_USER_GROUP = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_FILE_USER_GROUP',
  file => ({ file })
);

export const SET_VIEWACCESSIBLECLICKED = createAction(
  'permissions/PermissionsApp/SET_VIEWACCESSIBLECLICKED',
  isViewAccessibleClicked =>({ isViewAccessibleClicked })
);

export const SET_IS_VIEW_ACCESSIBLE_CLICKED_USER_GROUP = createAction(
  'permissions/PermissionsApp/SET_IS_VIEW_ACCESSIBLE_CLICKED_USER_GROUP',
  isViewAccessibleClicked =>({ isViewAccessibleClicked })
);

export const SET_IS_VIEW_ACCESSIBLE_CLICKED_RESOURCE = createAction(
  'permissions/PermissionsApp/SET_IS_VIEW_ACCESSIBLE_CLICKED_RESOURCE',
  isViewAccessibleClicked =>({ isViewAccessibleClicked })
);

export const SET_ACTIVE_MODE = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_MODE',
  mode => ({ mode })
);

export const SET_ACTIVE_MODE_RESOURCES = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_MODE_RESOURCES',
  mode => ({ mode })
);

export const SET_ACTIVE_MODE_USER_GROUP = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_MODE_USER_GROUP',
  mode => ({ mode })
);

export const SET_ACTIVE_USER_LIST_TYPE = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_USER_LIST_TYPE',
  activeUserListType => ({ activeUserListType })
);

export const SET_ACTIVE_RESOURCES_TYPE = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_RESOURCES_TYPE',
  activeUserListType => ({ activeUserListType })
);

export const SET_ACTIVE_USER_GROUP_TYPE = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_USER_GROUP_TYPE',
  activeUserListType => ({ activeUserListType })
);

export const SET_ACTIVE_TAB_FOR_USER_GROUP_TARGET = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_TAB_FOR_USER_GROUP_TARGET',
  activeTabForUserGroupTarget => ({ activeTabForUserGroupTarget })
);

export const SET_ACTIVE_TAB_FOR_RESOURCES_TARGET = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_TAB_FOR_RESOURCES_TARGET',
  activeTabForResourcesTarget => ({ activeTabForResourcesTarget })
);

export const SET_ACTIVE_RESOURCE_LIST_TYPE = createAction(
  'permissions/PermissionsApp/SET_ACTIVE_RESOURCE_LIST_TYPE',
  activeResourceListType => ({ activeResourceListType })
);

export const SET_LOG_DIALOG_VISIBLE = createAction(
  'permissions/PermissionsApp/SET_LOG_DIALOG_VISIBLE',
  visibility => ({ visibility })
);

export const SET_MENU_DIALOG_VISIBLE = createAction(
  'permissions/PermissionsApp/SET_MENU_DIALOG_VISIBLE',
  (visibility, modelData) => ({ visibility, modelData})
);

export const SET_PERMISSIONS_DIALOG_VISIBILITY = createAction(
  'permissions/PermissionsApp/SET_PERMISSIONS_DIALOG_VISIBILITY',
  visibility => ({ visibility })
);

export const COLLAPSE_FILE_TREE = createAction('permissions/PermissionsApp/COLLAPSE_FILE_TREE');

export const FETCH_DATASOURCES = createAction('permissions/PermissionsApp/FETCH_DATASOURCES');

export const RECEIVE_DATASOURCES = createAction(
  'permissions/PermissionsApp/RECEIVE_DATASOURCES',
  datasources => ({ datasources })
);

export const FETCH_DATASOURCES_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_DATASOURCES_ERROR',
  error => ({ error })
);

export const RECEIVE_DELETE_ACCOUNT_USER = createAction(
    'permissions/PermissionsApp/RECEIVE_DELETE_ACCOUNT_USER',
    (deleteAllData) => ({deleteAllData})
  );



export const RECEIVE_DELETE_DATA_SOURCE = createAction(
  'permissions/PermissionsApp/RECEIVE_DELETE_DATA_SOURCE',
  datasourceId => ({datasourceDelete:true, datasourceId})
);

export const RECEIVE_EDIT_DATA_SOURCE = createAction(
  'permissions/PermissionsApp/RECEIVE_EDIT_DATA_SOURCE',
  datasourceId => ({dsNameChanged:true, datasourceId})
);

export const RECEIVE_EDIT_USER_SOURCE = createAction(
  'permissions/PermissionsApp/RECEIVE_EDIT_USER_SOURCE',
  usersourceId => ({usNameChanged:true, usersourceId})
);


export const FETCH_RESOURCE_FLAT_DATA = createAction('permissions/PermissionsApp/FETCH_RESOURCE_FLAT_DATA');

export const RECEIVE_EMAIL_NAME_MAP = createAction(
  'permissions/PermissionsApp/RECEIVE_EMAIL_NAME_MAP',
  (emailNameMapData) => ({ emailNameMapData })
);
export const FETCH_EMAIL_NAME_MAP = createAction('permissions/PermissionsApp/FETCH_EMAIL_NAME_MAP');

export const RECEIVE_USERSOURCE_DATASOURCE_ID_MAP = createAction(
  'permissions/PermissionsApp/RECEIVE_USERSOURCE_DATASOURCE_ID_MAP',
  (userSouceDataSourceIdMap) => ({ userSouceDataSourceIdMap })
);
export const FETCH_USERSOURCE_DATASOURCE_ID_MAP = createAction('permissions/PermissionsApp/FETCH_USERSOURCE_DATASOURCE_ID_MAP');

export const RECEIVE_RESOURCE_FLAT_DATA = createAction(
  'permissions/PermissionsApp/RECEIVE_RESOURCE_FLAT_DATA',
  (usersFlatData) => ({ usersFlatData })
);

export const FETCH_RESOURCE_FLAT_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_RESOURCE_FLAT_ERROR',
  error => ({ error })
);

export const FETCH_USER_GROUP_ERROR = createAction(
  'permissions/PermissionsApp/FETCH_USER_GROUP_ERROR',
  error => ({ error })
);


export const fetchDatasourcesWorkflow = accountId => (dispatch, getState) => {
  const state = getState();

  /*if (selectors.getIsFetchingDatasources(state)) {
    console.info('received duplicate request for fetching datasources, canceling request');
    return Promise.resolve();
  }*/

  dispatch(FETCH_DATASOURCES());
  return fetch(urls.datasources(accountId), {
    headers: urls.getDefaultHeaders(state.auth),
    credentials: 'include'
  })
    .then(response => response.json())
    .then(datasources => {
      if (datasources.data.errorMessage) {
        throw new Error(datasources.data.errorMessage);
      }

      dispatch(RECEIVE_DATASOURCES(datasources.data));
      return datasources.data;
    })
    .catch(e => {
      dispatch(FETCH_DATASOURCES_ERROR(e));
      throw e;
    });
};

export const fetchUgtWorkflow = (email, authToken) =>(dispatch, getState)=> {
  const state = getState();
  dispatch(FETCH_UGTLIST(email));
  return fetch(urls.getUGTFlatList(email, authToken), {
    headers: urls.getDefaultHeaders(state.auth),
    credentials: 'include'
  }).then(response => response.json())
    .then(ugtdata => {
      return dispatch(RECEIVE_UGTLIST(email, ugtdata))
    })
    .catch(e => {
      throw e;
  });
};

export const fetchTopLevelUsersWorkflow = (email, authToken)=>(dispatch, getState)=> {
  const state = getState();
  dispatch(FETCH_TOPLEVEL_USERS(email));
  return fetch(urls.topLevelUsers(email, authToken), {
      headers: urls.getDefaultHeaders(state.auth),
      credentials: 'include'
    }).then(response => response.json())
      .then(allUsers => {
        return dispatch(RECEIVE_TOPLEVEL_USERS(email, allUsers))
      })
      .catch(e => {
        dispatch(FETCH_USERSOURCES_ERROR(e));
        throw e;
      });
}

export const fetchTopLevelUsersGroupsWorkflow = (parentEmail, parentId, usersourceId, authToken) => (dispatch, getState) => {
  const state = getState();

  /*if (selectors.getIsFetcqhingUsers(state, parentId)) {
    console.info('received duplicate request for fetching users, canceling request');
    return Promise.resolve();
  }*/

  dispatch(FETCH_USERS_GROUPS(parentEmail, parentId, usersourceId));
  return fetch(urls.users(parentEmail, parentId, usersourceId, authToken), {
    headers: urls.getDefaultHeaders(state.auth),
    credentials: 'include'
  })
    .then(response => response.json())
    .then(users => {
      return dispatch(RECEIVE_USERS_GROUPS(parentId, usersourceId, users))
    })
    .catch(e => {
      dispatch(FETCH_USERS_ERROR(e));
      throw e;
    });
};


export const fetchUsersWorkflow = (parentEmail, parentId, usersourceId, authToken) => (dispatch, getState) => {
  const state = getState();

  /*if (selectors.getIsFetcqhingUsers(state, parentId)) {
    console.info('received duplicate request for fetching users, canceling request');
    return Promise.resolve();
  }*/

  dispatch(FETCH_USERS(parentEmail, parentId, usersourceId));
  return fetch(urls.users(parentEmail, parentId, usersourceId, authToken), {
    headers: urls.getDefaultHeaders(state.auth),
    credentials: 'include'
  })
    .then(response => response.json())
    .then(users => {
      dispatch(RECEIVE_USERS(parentId, usersourceId, users))
    })
    .catch(e => {
      dispatch(FETCH_USERS_ERROR(e));
      throw e;
    });
};



export const fetchTopLevelResourcesWorkflow = (email, authToken) => (dispatch, getState) => {
  const state = getState();

  /*if (selectors.getIsFetchingFiles(state, root)) {
    console.info('received duplicate request for fetching files, canceling request');
    return Promise.resolve();
  }
*/
  dispatch(FETCH_RESOURCES(email));
  return fetch(urls.topLevelDataSources(email, authToken), {
    headers: urls.getDefaultHeaders(state.auth),
    credentials: 'include'
  })
    .then(response => response.json())
    .then(datasources => {
      return dispatch(RECEIVE_RESOURCES(email, datasources))
    })
    .catch(e => {
      dispatch(FETCH_RESOURCES_ERROR(e));
      throw e;
    });
};

export const fetchFilesDataWorkflow = (email, parentId, datasourceId, authToken) => (dispatch, getState) => {
  const state = getState();
  /*if (selectors.getIsFetchingFiles(state, root)) {
    console.info('received duplicate request for fetching files, canceling request');
    return Promise.resolve();
  }*/

  dispatch(FETCH_FILES(email, parentId, datasourceId));
  return fetch(urls.resources(email, parentId, datasourceId, authToken), {
    headers: urls.getDefaultHeaders(state.auth),
    credentials: 'include'
  })
    .then(response => response.json())
    .then(files => {
      return dispatch(RECEIVE_FILES_DATA(parentId, datasourceId, files))
    })
    .catch(e => {
      dispatch(FETCH_FILES_ERROR(e));
      throw e;
    });
};

export const fetchFilesWorkflow = (email, parentId=FILES_ROOT, datasourceId, authToken) => (dispatch, getState) => {
  const state = getState();
  /*if (selectors.getIsFetchingFiles(state, root)) {
    console.info('received duplicate request for fetching files, canceling request');
    return Promise.resolve();
  }*/

  dispatch(FETCH_FILES(email, parentId, datasourceId));
  return fetch(urls.resources(email, parentId, datasourceId, authToken), {
    headers: urls.getDefaultHeaders(state.auth),
    credentials: 'include'
  })
    .then(response => response.json())
    .then(files => {
      return dispatch(RECEIVE_FILES(parentId, datasourceId, files))
    })
    .catch(e => {
      dispatch(FETCH_FILES_ERROR(e));
      throw e;
    });
};



export const fetchUsersAndGruops = (email,datasourceId,resourceId,authToken, columnNames) => {
  return (dispatch,getState)=>{
    dispatch(FETCH_USER_GROUP(email,resourceId,datasourceId));
    let url = urls.userGroupListForFileId(email,datasourceId,resourceId,authToken, columnNames);
    let data = {
      "email":email,
      "event_type":"getuser_group",
      "authtoken":authToken,
      "column_names":columnNames,
      "datasource_id": datasourceId,
      "resource_id": resourceId
    }
    return fetch(url, {
      headers: urls.getDefaultHeaders(getState().auth),
      method: 'POST',
      credentials: 'include',
      body:JSON.stringify(data)
    })
    .then(response =>response.json())
    .then(userGroupFlatData => dispatch(RECEIVE_USER_GROUP(email,datasourceId, resourceId, userGroupFlatData)))
    .catch(e => {
      dispatch(FETCH_USER_GROUP_ERROR(e));
      throw e;
    });
  };
}


export const fetchLogWorkflow = (logType, email, userId, resourceId, authToken, columnNames) => {
  return (dispatch, getState) => {
    dispatch(FETCH_LOG(logType, userId, resourceId));

    let url = logType === LOG_TYPE_USER ? urls.userActivityLog(email, userId, authToken, columnNames) : urls.fileActivityLog(email, resourceId, authToken, columnNames);

    let data = {
      "email":email,
      "event_type":"get_activity_log",
      "authtoken":authToken,
      "column_names":columnNames
    }
    logType === LOG_TYPE_USER ? data["user_id"] = userId : data["resource_id"] = resourceId
    return fetch(url, {
      headers: urls.getDefaultHeaders(getState().auth),
      method: 'POST',
      credentials: 'include',
      body:JSON.stringify(data)
    })
      .then(response => response.json())
      .then(log => {
        dispatch(RECEIVE_LOG(logType, userId, resourceId, log))
      })
      .catch(e => {
        dispatch(FETCH_LOG_ERROR(e));
        throw e;
      });
  };
};


export const fetchUserGroupEmailNameMap =(email,authToken) => (dispatch,getState)=>{
  const state = getState();
  dispatch(FETCH_EMAIL_NAME_MAP(email,authToken));
  return fetch(urls.userGroupemailNameMap(email,authToken))
  .then(response => response.json())
  .then(emailNameMapData => {
    dispatch(RECEIVE_EMAIL_NAME_MAP(emailNameMapData))
  })
  .catch(e => {
    dispatch(FETCH_USERS_ERROR(e));
    throw e;
  });
};

export const fetchUserSourceDataSourceIdMap =(email,authToken) => (dispatch,getState)=>{
  const state = getState();
  dispatch(FETCH_USERSOURCE_DATASOURCE_ID_MAP(email,authToken));
  return fetch(urls.userSouceDataSourceIdMap(email,authToken))
  .then(response => response.json())
  .then(userSouceDataSourceIdMap => {
    dispatch(RECEIVE_USERSOURCE_DATASOURCE_ID_MAP(userSouceDataSourceIdMap))
  })
  .catch(e => {
    dispatch(FETCH_USERS_ERROR(e));
    throw e;
  });
};

export const fetchResourceFlatData = (email, users, authToken, columnNames) => {
  return (dispatch, getState) => {
    dispatch(FETCH_RESOURCE_FLAT_DATA(users));

    let url = urls.resourceFlatList(email, users, authToken, columnNames);
    let data = {
      "email":email,
      "users":users,
      "event_type":"get_perms_for_users",
      "authtoken":authToken,
      "column_names":columnNames
    }
    return fetch(url, {
      headers: urls.getDefaultHeaders(getState().auth),
      method: 'POST',
      credentials: 'include',
      body:JSON.stringify(data)
    })
      .then(response => response.json())
      .then(usersFlatData => dispatch(RECEIVE_RESOURCE_FLAT_DATA(usersFlatData)))
      .catch(e => {
        dispatch(FETCH_RESOURCE_FLAT_ERROR(e));
        throw e;
      });
  };
};

export const deleteAccount = (email, datasourceId, datasourceType, authToken) => {
  return (dispatch, getState) => {
    return fetch(urls.deleteAccount(email, datasourceId, datasourceType, authToken), {
      headers: urls.getDefaultHeaders(getState().auth),
      credentials: 'include'
    })
      .then(response => response.json())
      .then(details => {
        dispatch(RECEIVE_DELETE_ACCOUNT_USER())
      })
      .catch(e => {
        //dispatch(fetchLogError(e));
        throw e;
      });
  };
};

export const deleteDatasource = (email, datasourceId, authToken) => {
  return (dispatch, getState) => {
    return fetch(urls.deleteDataSource(email, datasourceId, authToken), {
      headers: urls.getDefaultHeaders(getState().auth),
      credentials: 'include'
    })
      .then(response => response.json())
      .then(details => {
        dispatch(RECEIVE_DELETE_DATA_SOURCE(datasourceId))
      })
      .catch(e => {
        //dispatch(fetchLogError(e));
        throw e;
      });
  };
};

export const EditDatasource = (email, datasourceId, name, authToken) => {
  return (dispatch, getState) => {
    return fetch(urls.editDatasource(email, datasourceId, name, authToken), {
      headers: urls.getDefaultHeaders(getState().auth),
      credentials: 'include'
    })
      .then(response => response.json())
      .then(details => {
        dispatch(RECEIVE_EDIT_DATA_SOURCE(datasourceId))
      })
      .catch(e => {
        //dispatch(fetchLogError(e));
        throw e;
      });
  };
};

export const EditUsersource = (email, usersourceId, name, authToken) => {
  return (dispatch, getState) => {
    return fetch(urls.editUsersource(email, usersourceId, name, authToken), {
      headers: urls.getDefaultHeaders(getState().auth),
      credentials: 'include'
    })
      .then(response => response.json())
      .then(details => {
        dispatch(RECEIVE_EDIT_USER_SOURCE(usersourceId))
      })
      .catch(e => {
        //dispatch(fetchLogError(e));
        throw e;
      });
  };
};
