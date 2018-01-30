import { handleActions } from 'redux-actions';
import u from 'updeep';
import * as actions from './actions';
import { REHYDRATE } from 'redux-persist/constants';
// import * as ugtree from './ugtree';
import { MODE_FILE_PERMISSIONS, MODE_USER_PERMISSIONS, USER_LIST_TYPE_GROUPED, ALL_USERS_PARENT, RESOURCE_LIST_TYPE_TREE } from '../constants';

const initialState = {
  accountSignUp: '',
  headNode : {},
  isFetchingUsers: {},
  users: {},
  groups: {},
  allUsers: {},
  allDataSources: {},
  isUserExpanded: {},
  isUserGroupExpanded: {},
  isUserResourcesExpanded: {},
  lockIconVisible: false,
  lockStateUL: false,
  lockStateFT: false,
  scanStatus: false,
  widgetReport: false,
  isFetchingFiles: {},
  files: {},
  isFileExpanded: {},
  isFileUserGroupExpanded: {},
  isFileResourcesExpanded: {},
  activeUser: null,
  activeUserUserGroup: null,
  activeUserResources: null,
  activeFile: null,
  activeFileUserGroup: null,
  activeFileResources: null,
  activeMode: MODE_FILE_PERMISSIONS,
  activeModeUserGroup: MODE_FILE_PERMISSIONS,
  activeModeResources: MODE_USER_PERMISSIONS,
  isLogDialogVisible: false,
  isViewAccessibleClicked:false,
  isViewAccessibleClickedUserGroup: false,
  isViewAccessibleClickedResource: false,
  isMenuDialogVisible: false,
  modelData: 'default',
  isFetchingLog: false,
  isFetchingUserGroup:false,
  log: null,
  activeLogType: null,
  activeLoglogResourceId: null,
  activeLogResourceName: null,
  isPermissionsDialogVisible: false,
  isFetchingDatasources: false,
  datasources: null,
  deleteAllData:false,
  manageDatasource:false,
  activeUserListType: USER_LIST_TYPE_GROUPED,
  activeUserGroupType: USER_LIST_TYPE_GROUPED,
  activeResourcesType: USER_LIST_TYPE_GROUPED,
  activeTabForUserGroupTarget: RESOURCE_LIST_TYPE_TREE,
  activeTabForResourcesTarget: USER_LIST_TYPE_GROUPED,
  activeResourceListType:RESOURCE_LIST_TYPE_TREE,
  usersFlatData:[],
  userGroupFlatData:[],
  emailNameMap:[],
  userSouceDataSourceIdMap:{},
  metadata: [],
  submitted: false,
  filterInput:{}
};

export default handleActions({
  [actions.FETCH_USERS]: (state, action) => u({
    isFetchingUsers: { [action.payload.parentId]: true }
  }, state),

  [actions.RECEIVE_DELETE_ACCOUNT_USER]: (state, action) => u({
    deleteAllData: action.payload.deleteAllData
  }, state),

  [actions.RECEIVE_UGTLIST]: (state, action) => u({
      headNode: JSON.parse(action.payload.ugtdata)
    }, state),

  [actions.RECEIVE_DELETE_DATA_SOURCE]: (state, action) => u({
    manageDatasource:action.payload.datasourceDelete
  }, state),

  [actions.RECEIVE_USERS]: (state, action) => {
    let keyVal = action.payload.parentId==='root' ? action.payload.usersourceId : action.payload.parentId;
    var groupUserMap = [];

    return u({
      isFetchingUsers: { [action.payload.parentId]: false },
      users: { [keyVal]: action.payload.users },//,
      groups: {[keyVal]: groupUserMap}

    }, state);
  },

  [actions.RECEIVE_TOPLEVEL_USERS]: (state, action) => u({
    allUsers: { [action.payload.email]: action.payload.users.map(ds => {ds[ds.length] = "TOPLEVEL";return ds}) }
  }, state),

  [actions.RECEIVE_RESOURCES]: (state, action) => u({
    allDataSources: {
      [action.payload.email]: action.payload.dataSources.map(ds => {
        ds[ds.length] = 'DS';
        return ds
      })
    }
  }, state),

  [actions.SET_USER_EXPANDED]: (state, action) => u({
      isUserExpanded: { [action.payload.userId]: action.payload.isUserExpanded }
    }, state),

  [actions.SET_USER_RESOURCES_EXPANDED]: (state, action) => u({
      isUserResourcesExpanded: { [action.payload.userId]: action.payload.isUserExpanded }
    }, state),

  [actions.SET_USER_GROUP_EXPANDED]: (state, action) => u({
      isUserGroupExpanded: { [action.payload.userId]: action.payload.isUserExpanded }
    }, state),

  [actions.SET_LOCK_ICON_VISIBLE]: (state, action) => u({
    lockIconVisible: action.payload.lockIconVisible
  }, state),

  [actions.SET_LOCK_STATE_UL]: (state, action) => u({
    lockStateUL: action.payload.lockStateUL
  }, state),

  [actions.SET_LOCK_STATE_FT]: (state, action) => u({
    lockStateFT: action.payload.lockStateFT
  }, state),

  [actions.SET_WIDGET_REPORT]: (state, action) => u({
    widgetReport: action.payload.widgetReport
  }, state),

  [actions.SET_METADATA]: (state, action) => u({
    metadata: action.payload.metadata
  }, state),

  [actions.SET_FILTER_SUBMIT]: (state, action) => u({
    submitted: action.payload.submitted
  }, state),

  [actions.SET_FILTER_INPUT]: (state, action) => u({
    filterInput: u.constant(action.payload.filterInput)
  }, state),

  [actions.SET_SCAN_STATUS]: (state, action) => u({
    scanStatus: action.payload.scanStatus
  }, state),

  [actions.SET_FORGOT_PASSWORD_EMAIL]: (state, action) => u({
    forgotPasswordEmail: action.payload.forgotPasswordEmail,
    isRehydrated: true
  }, state),

  [actions.FETCH_FILES]: (state, action) => u({
      isFetchingFiles: {
        [action.payload.datasourceId]: { [action.payload.parentId]: true }
      }
    }, state),

   [actions.FETCH_USER_GROUP]:(state, action)=>u({
    userGroupFlatData :  [],
    isFetchingUserGroup :true
  },state),

    [actions.RECEIVE_USER_GROUP]:(state, action)=>u({
     userGroupFlatData :  action.payload.userGroupFlatData,
     isFetchingUserGroup :false
    },state),

    [actions.RECEIVE_FILES]: (state, action) => {
      var headNode = state.headNode
      for(let resource of action.payload.resources) {
        let additionalPerms = {}
        for(let perm of resource[4]) {
          if(perm[0] in headNode) {
            for(let value of headNode[perm[0]]["allChildren"]) {
              if(perm[1] === "R" || perm[1] === "W") {
                additionalPerms[value] = perm[1]
              }
            }
          }
        }
        for(let perm of Object.keys(additionalPerms)) {
          resource[4].push([perm, additionalPerms[perm]])
        }
      }

      return u({
        isFetchingFiles: {
          [action.payload.datasourceId]: { [action.payload.parentId]: false }
        },
        files: {
          [action.payload.datasourceId]: { [action.payload.parentId]: action.payload.resources }
        }
      }, state); },

   [actions.SET_ROOT_EXPANDED]: (state, action) => u({
      isFileExpanded: {
        [action.payload.datasourceId]: { [action.payload.root]: action.payload.isFileExpanded }
      }
    }, state),

    [actions.SET_FILE_RESOURCES_EXPANDED]: (state, action) => u({
       isFileResourcesExpanded: {
         [action.payload.datasourceId]: { [action.payload.root]: action.payload.isFileExpanded }
       }
     }, state),

    [actions.SET_FILE_USER_GROUP_EXPANDED]: (state, action) => u({
       isFileUserGroupExpanded: {
         [action.payload.datasourceId]: { [action.payload.root]: action.payload.isFileExpanded }
       }
     }, state),

  [actions.COLLAPSE_FILE_TREE]: (state, action) => u({
    isFileExpanded: initialState.isFileExpanded
  }, state),

  [actions.SET_ACTIVE_USER]: (state, action) => u({
    activeUser: action.payload.user
  }, state),

  [actions.SET_ACTIVE_USER_RESOURCES]: (state, action) => u({
    activeUserResources: action.payload.user
  }, state),

  [actions.SET_ACTIVE_USER_USER_GROUP]: (state, action) => u({
    activeUserUserGroup: action.payload.user
  }, state),

  [actions.SET_VIEWACCESSIBLECLICKED]: (state, action) => u({
    isViewAccessibleClicked: action.payload.isViewAccessibleClicked
  }, state),

  [actions.SET_IS_VIEW_ACCESSIBLE_CLICKED_USER_GROUP]: (state, action) => u({
    isViewAccessibleClickedUserGroup: action.payload.isViewAccessibleClicked
  }, state),

  [actions.SET_IS_VIEW_ACCESSIBLE_CLICKED_RESOURCE]: (state, action) => u({
    isViewAccessibleClickedResource: action.payload.isViewAccessibleClicked
  }, state),

  [actions.SET_ACCOUNT_SIGN_UP]: (state, action) => u({
    accountSignUp:  u.constant(action.payload.accountSignUp)
  }, state),

  [actions.SET_ACTIVE_FILE]: (state, action) => u({
    activeFile: action.payload.file
  }, state),

  [actions.SET_ACTIVE_FILE_RESOURCES]: (state, action) => u({
    activeFileResources: action.payload.file
  }, state),

  [actions.SET_ACTIVE_FILE_USER_GROUP]: (state, action) => u({
    activeFileUserGroup: action.payload.file
  }, state),

  [actions.SET_ACTIVE_MODE]: (state, action) => u({
    activeMode: action.payload.mode
  }, state),

  [actions.SET_ACTIVE_MODE_RESOURCES]: (state, action) => u({
    activeModeResources: action.payload.mode
  }, state),

  [actions.SET_ACTIVE_MODE_USER_GROUP]: (state, action) => u({
    activeModeUserGroup: action.payload.mode
  }, state),

  [actions.SET_LOG_DIALOG_VISIBLE]: (state, action) => u({
      isLogDialogVisible: action.payload.visibility,
      log: action.payload.visibility ? state.log : null,
      activeLogType: action.payload.visibility ? state.activeLogType : null,
      activeLoglogResourceId: action.payload.visibility ? state.activeLogResourceId : null,
      activeLoglogResourceName: action.payload.visibility ? state.activeLogResourceName : null
    }, state),

  [actions.SET_MENU_DIALOG_VISIBLE]: (state, action) => u({
     isMenuDialogVisible: action.payload.visibility,
     modelData:action.payload.modelData
  }, state),



  [actions.FETCH_LOG]: (state, action) => u({
    isFetchingLog: true,
    log: null
  }, state),

  [actions.RECEIVE_LOG]: (state, action) => u({
      isFetchingLog: false,
      log: action.payload.log,
      activeLogType: action.payload.logType,
      activeLoglogResourceId: action.payload.userId,
      activeLogResourceName: action.payload.resourceId
    }, state),

  [actions.SET_PERMISSIONS_DIALOG_VISIBILITY]: (state, action) => u({
    isPermissionsDialogVisible: action.payload.visibility
  }, state),

  [actions.FETCH_DATASOURCES]: (state, action) => u({
    isFetchingDataSources: true
  }, state),

  [actions.RECEIVE_DATASOURCES]: (state, action) => u({
      // Add `resource_type` to the data source so we can differentiate between
      // files, directories, and data sources.
      datasources: action.payload.datasources.map(ds => u({
        resource_type: 'DS'
      }, ds))
    }, state),

  [actions.SET_ACTIVE_USER_LIST_TYPE]: (state, action) => u({
      activeUserListType: action.payload.activeUserListType
    }, state),

  [actions.SET_ACTIVE_RESOURCES_TYPE]: (state, action) => u({
      activeResourcesType: action.payload.activeUserListType
    }, state),

  [actions.SET_ACTIVE_USER_GROUP_TYPE]: (state, action) => u({
      activeUserGroupType: action.payload.activeUserListType
    }, state),

  [actions.SET_ACTIVE_TAB_FOR_USER_GROUP_TARGET]: (state, action) => u({
      activeTabForUserGroupTarget: action.payload.activeTabForUserGroupTarget
    }, state),

  [actions.SET_ACTIVE_TAB_FOR_RESOURCES_TARGET]: (state, action) => u({
      activeTabForResourcesTarget: action.payload.activeTabForResourcesTarget
    }, state),


  [actions.SET_ACTIVE_RESOURCE_LIST_TYPE]: (state, action) => u({
      activeResourceListType: action.payload.activeResourceListType
    }, state),

  [actions.FETCH_RESOURCE_FLAT_DATA]: (state, action) => u({
  }, state),

  [actions.RECEIVE_RESOURCE_FLAT_DATA]: (state, action) => u({
      usersFlatData: action.payload.usersFlatData
    }, state),

  [actions.FETCH_USERSOURCE_DATASOURCE_ID_MAP]: (state, action) => u({
    userSouceDataSourceIdMap:{},
    isFetchingUsers:true
  }, state),

  [actions.RECEIVE_USERSOURCE_DATASOURCE_ID_MAP]: (state, action) => u({
      userSouceDataSourceIdMap: action.payload.userSouceDataSourceIdMap,
      isFetchingUsers:false
    }, state),


  [actions.FETCH_EMAIL_NAME_MAP]: (state, action) => u({
    emailNameMap:[],
    isFetchingUsers:true
  }, state),

  [actions.RECEIVE_EMAIL_NAME_MAP]: (state, action) =>{
    let loadedData = action.payload.emailNameMapData
    let emailNameMap ={}
    for(let dataSource in loadedData){
    let resourceData = loadedData[dataSource]
    if(emailNameMap[resourceData] ===undefined)
    {
      emailNameMap[dataSource] = [];
    }
    for(var i=0; i <resourceData.length-1 ;i++){
        let email = resourceData[i][0];
        let name = resourceData[i][1];
        let isGroup = resourceData[i][2];
        emailNameMap[dataSource][email] = {'name':name,'isGroup':isGroup}
    }
  }
    return u({
      emailNameMap:emailNameMap,
      isFetchingUsers:false
    }, state)
  }
}, initialState)



// TODO: these selectors should not work with the entire state!!!
// They should only work with the part of the state this reducer has access to
// i.e, the "permissions" key.
// Is there a way to generate these automatically? So much repetition here.
export const selectors = {
  getIsFetchingUsers: (state, parentId) => state.permissions.isFetchingUsers[parentId],
  getUsers: (state, parentId) => state.permissions.users[parentId],
  getTopLevelUsers: (state, email)=> {
    return state.permissions.allUsers[email]
  },
  getTopLevelResources: (state, email)=> {
    return state.permissions.allDataSources[email]
  },
  getIsUserExpanded: (state, userId) => state.permissions.isUserExpanded[userId],
  getIsUserResourcesExpanded: (state, userId) => state.permissions.isUserResourcesExpanded[userId],
  getIsUserGroupExpanded: (state,userId) => state.permissions.isUserGroupExpanded[userId],
  getLockIconVisible: (state) => state.permissions.lockIconVisible,
  getLockStateUL: (state) => state.permissions.lockStateUL,
  getLockStateFT: (state) => state.permissions.lockStateFT,
  getWidgetReport: (state) => state.permissions.widgetReport,
  getMetadata: (state) => state.permissions.metadata,
  getFilterSubmit: (state) => state.permissions.submitted,
  getFilterInput: (state) => state.permissions.filterInput,
  getScanStatus: (state) => state.permissions.scanStatus,
  getForgotPasswordEmail: (state) => state.permissions.forgotPasswordEmail,
  getIsFetchingFiles: (state, datasourceId, root) => {
    const datasourceChildren = state.permissions.isFetchingFiles[datasourceId];
    return datasourceChildren && datasourceChildren[root];
  },
  getIsFileExpanded: (state, datasourceId, root) => {
    const datasourceChildren = state.permissions.isFileExpanded[datasourceId];
    return datasourceChildren && datasourceChildren[root];
  },

  getIsFileResourcesExpanded: (state, datasourceId, root) => {
    const datasourceChildren = state.permissions.isFileResourcesExpanded[datasourceId];
    return datasourceChildren && datasourceChildren[root];
  },

  getIsFileUserGroupExpanded: (state, datasourceId, root) => {
    const datasourceChildren = state.permissions.isFileUserGroupExpanded[datasourceId];
    return datasourceChildren && datasourceChildren[root];
  },
  getFilesForRoot: (state, datasourceId, root) => {
    const datasourceChildren = state.permissions.files[datasourceId];
    return datasourceChildren && datasourceChildren[root];
  },
  getIsDeletedAllData: (state) => state.permissions.deleteAllData,
  getDeleteDatasource : state => state.permissions.manageDatasource,
  getActiveUser: state => state.permissions.activeUser,
  getActiveUserResources: state => state.permissions.activeUserResources,
  getActiveUserUserGroup: state => state.permissions.activeUserUserGroup,
  getAccountSignUp: state => state.permissions.accountSignUp,
  getActiveFile: state => state.permissions.activeFile,
  getActiveFileResources: state => state.permissions.activeFileResources,
  getActiveFileUserGroup: state => state.permissions.activeFileUserGroup,
  getisViewAccessibleClicked: state => state.permissions.isViewAccessibleClicked,
  getisViewAccessibleClickedUserGroup: state => state.permissions.isViewAccessibleClickedUserGroup,
  getisViewAccessibleClickedResource: state => state.permissions.isViewAccessibleClickedResource,
  getActiveMode: state => state.permissions.activeMode,
  getActiveModeResources: state => state.permissions.activeModeResources,
  getActiveModeUserGroup: state => state.permissions.activeModeUserGroup,
  getIsLogDialogVisible: state => state.permissions.isLogDialogVisible,
  getIsMenuDialogVisible: state => state.permissions.isMenuDialogVisible,
  getmodelData: state => state.permissions.modelData,
  getIsFetchingLog: state => state.permissions.isFetchingLog,
  getLog: state => state.permissions.log,
  getIsPermissionsDialogVisible: state => state.permissions.isPermissionsDialogVisible,
  getActiveDataSource: state => state.permissions.activeDataSource,
  getFilePermissionsForUser: (state, user, file) => {
    const noPermissions = { isReadable: false, isWritable: false };
    if (!file || !user || !file[4] || file[file.length-1] === 'DS') {
      return noPermissions;
    }

    const userId = user[2]==="GROUP" ? user[1] : user[2]==="USER" ? user[1] : user[1];
    var accessList = file[4].find(al => al[0] === userId);

    // If user is not group then refer group in state to assign value if he belongs to the state.
    if(user[2]!=="GROUP")
    {
         state.permissions.groups.__ALL_USERS__.map((uid) => {
           if(uid[0] === userId){
             if(uid[1] !== null){
               uid[1].map((gid) => {
                 if(accessList === undefined){
                      accessList = file[4].find(al => al[0] === gid);
                 }
                 return accessList;
               });
             }
           }
           return accessList;
         });
    }
    else{
      state.permissions.groups.__ALL_GROUPS__.map((uid) => {
        if(uid[0] === userId){
          if(uid[1] !== null){
            uid[1].map((gid) => {
              if(accessList === undefined){
                accessList = file[4].find(al => al[0] === gid);
              }
              return accessList
            });
          }
        }
        return accessList
      });
    }
    const accessListItem =  accessList;

    if (!accessListItem) {
      return noPermissions;
    }
    return {
      isReadable: accessListItem[1] === 'R' || accessListItem[1] === 'W',
      isWritable: accessListItem[1] === 'W'
    };
  },
  getIsFetchingDatasources: state => state.permissions.isFetchingDatasources,
  getUserNameForUserId: (state, userId) => {
    const user = state.permissions.users.__ALL_USERS__.find(u => u[1] === userId[1]);
    if (!user) {
      return null;
    }

    return `${user[2]} ${user[3]}`;
  },
  getActiveLogType: state => state.permissions.activeLogType,
  getActiveLogResourceId: state => state.permissions.activeLoglogResourceId,
  getActiveLogResourceName: state => state.permissions.activeLogResourceName,
  getDatasources: state => state.permissions.datasources,
  getActiveUserListType: state => state.permissions.activeUserListType,
  getActiveResourcesType: state => state.permissions.activeResourcesType,
  getActiveUserGroupType: state => state.permissions.activeUserGroupType,
  getActiveTabForUserGroupTarget: state => state.permissions.activeTabForUserGroupTarget,
  getActiveTabForResourcesTarget: state => state.permissions.activeTabForResourcesTarget,
  getActiveResourceListType: state=> state.permissions.activeResourceListType,
  getUserGroups: state=> state.permissions.groups,
  getUGTree: state=> state.permissions.headNode,
  getResourceFlatData: state=>state.permissions.usersFlatData,
  getEmailNameMapForUsersourceId: (state,usersourceId) => {
    const emailMap=  state.permissions.emailNameMap;
    if(emailMap[usersourceId]== undefined) {
      return null;
    }else {
      return emailMap[usersourceId];
    }
  },
  getUserSourceDataSourceIdMAP:state=> state.permissions.userSouceDataSourceIdMap,
};
