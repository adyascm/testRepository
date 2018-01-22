import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import throttle from 'lodash/throttle';
import Button from '../Button';
import UserGroupTarget from '../UserGroupTarget';
import PageContent from '../PageContent';
import Pane from '../Pane';
import PaneToolbar from '../PaneToolbar';
import UserGroupSource from '../UserGroupSource';
import LogModal from '../LogModal';
import TabSwitcherHeader from '../TabSwitcherHeader';
import Loader from '../Loader';
import { StyleSheet, css } from 'aphrodite/no-important';
import UserGroupResourceList from '../UserGroupResourceList';
import ExportCsvButton from '../ExportCsvButton';
import LogModelData from '../LogModelData';
import ActivityLog from '../ActivityLog';
import {Glyphicon} from 'react-bootstrap';
import Icon from '../Icon';
import ResourceFlatList from '../ResourceFlatList';
import * as API from '../Reports/ReportsAPI';
import {
  fetchUgtWorkflow,
  fetchUsersWorkflow,
  fetchFilesWorkflow,
  fetchLogWorkflow,
  fetchDatasourcesWorkflow,
  fetchTopLevelUsersWorkflow,
  fetchTopLevelResourcesWorkflow,
  fetchTopLevelUsersGroupsWorkflow,
  fetchFilesDataWorkflow,
  fetchResourceFlatData,
  fetchUsersAndGruops,
  fetchUserGroupEmailNameMap,
  fetchUserSourceDataSourceIdMap,
  SET_SCAN_STATUS as setScanStatus,
  SET_ACTIVE_USER as setActiveUser,
  SET_IS_VIEW_ACCESSIBLE_CLICKED_USER_GROUP as setViewAccessibleClicked,
  SET_ROOT_EXPANDED as setRootExpanded,
  SET_FILE_USER_GROUP_EXPANDED as setFileUserGroupExpanded,
  SET_ACTIVE_FILE as setActiveFile,
  SET_ACTIVE_FILE_USER_GROUP as setActiveFileUserGroup,
  SET_ACTIVE_USER_USER_GROUP as setActiveUserUserGroup,
  SET_ACTIVE_MODE as setActiveMode,
  SET_ACTIVE_MODE_USER_GROUP as setActiveModeUserGroup,
  SET_LOG_DIALOG_VISIBLE as setLogDialogVisible,
  collapseFileTree,
  SET_USER_EXPANDED as setUserExpanded,
  SET_USER_GROUP_EXPANDED as setUserGroupExpanded,
  SET_ACTIVE_USER_LIST_TYPE as setActiveUserListType,
  SET_ACTIVE_USER_GROUP_TYPE as setActiveUserGroupType,
  SET_ACTIVE_TAB_FOR_USER_GROUP_TARGET as setActiveTabForUserGroupTarget,
  SET_ACTIVE_RESOURCE_LIST_TYPE as setActiveResourceListType,
  SET_LOCK_STATE_UL as setLockStateUL,
  SET_LOCK_STATE_FT as setLockStateFT,
  SET_WIDGET_REPORT as setWidgetReport
} from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import { BASE_RATIO } from '../designConstants';
import {
  LOG_TYPE_USER,
  LOG_TYPE_FILE,
  MODE_FILE_PERMISSIONS,
  MODE_USER_PERMISSIONS,
  USER_LIST_TYPE_FLAT,
  USER_LIST_TYPE_GROUPED,
  ALL_USERS_PARENT,
  ALL_GROUPS_PARENT,
  RESOURCE_LIST_TYPE_FLAT,
  RESOURCE_LIST_TYPE_TREE,
  WIDTH
} from '../constants';

// How to make this DRY?
// If we're exposing all the selectors here anyway, might as well have a single
// higher order function that imports all the selectors and exposes them in this way.
const mapStateToProps = state => ({
  getWidgetReport: () => selectors.getWidgetReport(state),
  getIsFetchingUsers: () => selectors.getIsFetchingUsers(state),
  getUsers: (parentId) => selectors.getUsers(state, parentId),
  getTopLevelUsers : (email) =>selectors.getTopLevelUsers(state, email),
  getTopLevelResources: (email) => selectors.getTopLevelResources(state, email),
  getIsUserExpanded: userId => selectors.getIsUserExpanded(state, userId),
  getIsUserGroupExpanded: userId => selectors.getIsUserGroupExpanded(state,userId),
  getIsFetchingFiles: root => selectors.getIsFetchingFiles(state, root),
  getFilesForRoot: (root, datasourceId) => selectors.getFilesForRoot(state, root, datasourceId),
  getActiveUser: () => selectors.getActiveUser(state),
  getLockStateUL: () => selectors.getLockStateUL(state),
  getLockStateFT: () => selectors.getLockStateFT(state),
  getIsFileExpanded: (root, datasourceId) => selectors.getIsFileExpanded(state, root, datasourceId),
  getIsFileUserGroupExpanded: (root, datasourceId) => selectors.getIsFileUserGroupExpanded(state, root, datasourceId),
  getActiveFile: () => selectors.getActiveFile(state),
  getActiveFileUserGroup: () => selectors.getActiveFileUserGroup(state),
  getActiveUserUserGroup: () => selectors.getActiveUserUserGroup(state),
  getisViewAccessibleClicked :()=>selectors.getisViewAccessibleClickedUserGroup(state),
  getActiveMode: () => selectors.getActiveMode(state),
  getActiveModeUserGroup: () => selectors.getActiveModeUserGroup(state),
  getIsLogDialogVisible: () => selectors.getIsLogDialogVisible(state),
  getIsFetchingLog: () => selectors.getIsFetchingLog(state),
  getLog: () => selectors.getLog(state),
  getIsPermissionsDialogVisible: () => selectors.getIsPermissionsDialogVisible(state),
  getFilePermissionsForUser: (user, file) => selectors.getFilePermissionsForUser(state, user, file),
  getProfile: () => authSelectors.getProfile(state.auth),
  getUserNameForUserId: userId => selectors.getUserNameForUserId(state, userId),
  getActiveLogType: () => selectors.getActiveLogType(state),
  getActiveLogResourceId: () => selectors.getActiveLogResourceId(state),
  getActiveLogResourceName: () => selectors.getActiveLogResourceName(state),
  getDatasources: () => selectors.getDatasources(state),
  getPathSpecifierForUser: user => selectors.getPathSpecifierForUser(state, user),
  getActiveUserListType: () => selectors.getActiveUserListType(state),
  getActiveUserGroupType: () => selectors.getActiveUserGroupType(state),
  getActiveTabForUserGroupTarget: () => selectors.getActiveTabForUserGroupTarget(state),
  getActiveResourceListType: () => selectors.getActiveResourceListType(state),
  getmodelData: ()=> selectors.getmodelData(state),
  getUserGroups: ()=> selectors.getUserGroups(state),
  getUGTree: ()=> selectors.getUGTree(state),
  getResourceFlatData: ()=>selectors.getResourceFlatData(state),
  getEmailNameMapForUsersourceId:usersourceId=>selectors.getEmailNameMapForUsersourceId(state,usersourceId),
  getUserSourceDataSourceIdMAP:()=>selectors.getUserSourceDataSourceIdMAP(state)
});

const mapDispatchToProps = {
  fetchUgtWorkflow,
  fetchUsersWorkflow,
  fetchFilesWorkflow,
  fetchTopLevelResourcesWorkflow,
  fetchDatasourcesWorkflow,
  fetchTopLevelUsersGroupsWorkflow,
  fetchFilesDataWorkflow,
  fetchTopLevelUsersWorkflow,
  fetchUserGroupEmailNameMap,
  fetchUserSourceDataSourceIdMap,
  setActiveUser,
  setActiveFile,
  setActiveFileUserGroup,
  setActiveUserUserGroup,
  setLockStateUL,
  setLockStateFT,
  setScanStatus,
  setWidgetReport,
  setRootExpanded,
  setFileUserGroupExpanded,
  setScanStatus,
  setActiveMode,
  setActiveModeUserGroup,
  fetchLogWorkflow,
  setLogDialogVisible,
  collapseFileTree,
  setUserExpanded,
  setUserGroupExpanded,
  setActiveUserListType,
  setActiveUserGroupType,
  setActiveTabForUserGroupTarget,
  fetchResourceFlatData,
  setActiveResourceListType,
  fetchUsersAndGruops,
  setViewAccessibleClicked
};

const s = StyleSheet.create({
  loader: {
    position:'absolute',
    top:'50%',
    left:'50%',
    transform:'translate(-50%,-50%)'
  },
  loaderText: {
    position:'relative',
    top:'-2px',
    left:5,
    color: 'grey'
  },
  flatlist: {
    // color : '#d88733',
    paddingTop: '7px',
    fontSize: '18px'
  }
});


class UserGroups extends Component {
  constructor(props) {
    super(props);

    this.onViewAccessibleButtonClicked = this.onViewAccessibleButtonClicked.bind(this);

    this.fileGridApi = null;
    this.userGridApi = null;
    this.state = {
      userSources : '',
      resources:'',
      userGroupFlatData:[],
      isLoading:true,
      leftGridWidth:0,
      groups: [],
      users: [],
      datasource:'',
      width:447,
      resourceFlatListData: [],
      isFetched: false,
      columnNames: ["resource_name","resource_path","urp_perm","datasources.name"],
      resourceFlatList: [],
      columnNamesActivityLog: ["ural_activity_log_time_stamp", "ural_activity_log_event", "datasources.name",
      "resource_path_to_id.resource_path", "user_full_name"]
    }

  }

  componentWillMount() {
    if (this.props.getWidgetReport() === true)
      this.props.setWidgetReport(false);
  }

  componentDidMount() {
    const profile = this.props.getProfile();
    // let datasourceavailable = this.state.userSources.length !== 0
    this.props.fetchUgtWorkflow(profile.email, profile.authToken).then((ugtdata)=>{

    //this.props.fetchDatasourcesWorkflow(profile.accountId);
    this.props.fetchUserGroupEmailNameMap(profile.email, profile.authToken);
    this.props.fetchUserSourceDataSourceIdMap(profile.email, profile.authToken);
    this.props.fetchUsersWorkflow(profile.email, ALL_USERS_PARENT, '', profile.authToken)
    this.props.fetchUsersWorkflow(profile.email, ALL_GROUPS_PARENT, '', profile.authToken)
    this.props.fetchTopLevelUsersWorkflow(profile.email, profile.authToken).then((data)=>{
      let ussource =data.payload.users;
      if(ussource.length>0){
        this.setState({
          isLoading:true
          })
      }
      else {
        this.setState({
          isLoading:false
          })
      }
      this.setState({
        usersourceval:data.payload.users
      })
      if(this.state.usersourceval.length!==0){
        if(this.state.usersourceval.length>1){
          this.props.fetchTopLevelUsersWorkflow(profile.email, profile.authToken).then((data)=>{
            this.setState({
              userSources:data.payload.users,
              isLoading:false
            })
          });
        }
        else {
          this.props.fetchTopLevelUsersGroupsWorkflow(profile.email, 'root', '', profile.authToken).then((data)=>{
            this.setState({
              userSources:data.payload.users,
              isLoading:false
            })
          });
        }
      }
    });



    this.props.fetchTopLevelResourcesWorkflow(profile.email, profile.authToken).then((data)=>{
      let dasource =data.payload.dataSources;
      if(dasource.length>0){
        this.setState({
          isLoading:true
          })
      }
      else {
        this.setState({
          isLoading:false
          })
      }
      this.setState({
        datasource:data.payload.dataSources
      })

      if(this.state.datasource.length!==0){
        if(this.state.datasource.length>1){
          this.props.fetchTopLevelResourcesWorkflow(profile.email, profile.authToken).then((data)=>{
            this.setState({
              resources:data.payload.dataSources,
              isLoading:false
            })
          });
        }
        else {
          let datasourceId = this.state.datasource[0][0]
          this.props.fetchFilesDataWorkflow(profile.email,'root',datasourceId, profile.authToken).then((data)=>{
            this.setState({
              resources:data.payload.resources,
              isLoading:false
            })
          });
        }
      }
      else {
        isLoading:true;
      }
    });


  });

  }
  componentWillReceiveProps(nextProps) {
    if(ReactDOM.findDOMNode(this.refs["userList"])) {
      this.setState({
        leftGridWidth:ReactDOM.findDOMNode(this.refs["userList"]).clientWidth
      })
    }
  }
  getUsers = (parentid) => {
    //return this.props.getUsers(parentid);
    if (this.props.getActiveUserGroupType() === USER_LIST_TYPE_GROUPED) {
      return this.props.getUsers(parentid);
    } else {
      return this.props.getUsers(ALL_USERS_PARENT);
    }
  };


// this takes the input userOrParentGroupEmail and return all the email
// for parentGroupEmail


  registerFileTreeApi = api => this.fileTreeApi = api;
  registerUserTreeApi = api => this.userTreeApi = api;

  refreshAllTrees = throttle(() => {
    this.fileTreeApi && this.fileTreeApi.refreshView();
    this.userTreeApi && this.userTreeApi.refreshView();
  }, 300);

  onViewAccessibleButtonClicked() {
    let groupData = this.props.getUGTree();
    let resourceFlatList = [];

    this.setState({
      isFetched:true
    })
    const isviewAccessibleClicked = !this.props.getisViewAccessibleClicked();
    this.props.setViewAccessibleClicked(isviewAccessibleClicked);

    // Here we need to set the resourceFlatList
    if (!(this.props.getActiveUserGroupType()===USER_LIST_TYPE_FLAT)) {
      if (this.props.getActiveUserUserGroup()) {
        if (this.props.getActiveUserUserGroup()[2] === "USER") {
          let item = groupData[this.props.getActiveUserUserGroup()[1]]["allAncestors"]
          resourceFlatList.push(this.props.getActiveUserUserGroup()[1])
          item.forEach( x => resourceFlatList.push(x) );
        }
        else if (this.props.getActiveUserUserGroup()[2] === "GROUP"){
          let item = groupData[this.props.getActiveUserUserGroup()[1]]["allAncestors"]
          resourceFlatList.push(this.props.getActiveUserUserGroup()[1])
          item.forEach( x => resourceFlatList.push(x) );
        }
      }
    }
    else {
        let activeUserEmail = this.props.getActiveUserUserGroup()[1]
        resourceFlatList.push(activeUserEmail)
        if (groupData[activeUserEmail]) {
          let item = groupData[this.props.getActiveUserUserGroup()[1]]["allAncestors"]
          resourceFlatList.push(this.props.getActiveUserUserGroup()[1])
          item.forEach( x => resourceFlatList.push(x) );
        }
        else {
          let allAncestors = this.props.getActiveUserUserGroup()[5]
          if (allAncestors[0]!==null) {
            allAncestors.forEach(x => resourceFlatList.push(x))
          }
        }
    }
    this.setState({
      resourceFlatList: resourceFlatList
    })
    if (this.props.getActiveUserUserGroup()) {
      if (this.props.getActiveUserUserGroup()[2] === "GROUP"){
        this.props.fetchResourceFlatData(this.props.getProfile().email, resourceFlatList, this.props.getProfile().authToken, this.state.columnNames).then(()=> {
          this.setState({
            resourceFlatListData:this.props.getResourceFlatData(),
            isFetched:false
          })
        })
      }
      else {
        this.props.fetchResourceFlatData(this.props.getProfile().email, resourceFlatList, this.props.getProfile().authToken, this.state.columnNames).then(()=> {
          this.setState({
            resourceFlatListData:this.props.getResourceFlatData(),
            isFetched:false
          })
        })
      }
    }
  }

  onBtExport = () => {
    var report_input = {}
    report_input["event_type"] = "generate_csv_report"
    report_input["authtoken"] = this.props.getProfile().authToken
    report_input["email"] = this.props.getProfile().email
    if(this.props.getisViewAccessibleClicked()){
      report_input["flag"] = "get_resource_for_users"
      report_input["column_names"] = this.state.columnNames
      report_input["users"] = this.state.resourceFlatList
      report_input["display_names"] = {
      "resource_name": "File Name",
      "resource_path": "File Path",
      "urp_perm": "Permission",
      "datasources.name": "Datasource Name"
    }

    }
    else if(this.props.getActiveTabForUserGroupTarget() !== RESOURCE_LIST_TYPE_TREE){
          report_input["flag"] = "get_activity_log"
          report_input["column_names"] = this.state.columnNamesActivityLog
          report_input["user_id"] = this.props.getActiveUserUserGroup()[1]
          report_input["display_names"] = {
            "ural_activity_log_time_stamp": "Date" ,
            "ural_activity_log_event" : "Operation",
            "datasources.name" : "Datasource",
            "resource_path_to_id.resource_path" : "Resource",
            "user_full_name": "User"
            }

    }
    API.getCsvReportUrl(report_input).then(response => {
        window.location.assign(response)
    })


    // this.registerDashboardApi.exportDataAsCsv();
  }

  render() {
    const usersGroupsSourceTabs = [{
      id: USER_LIST_TYPE_GROUPED,
      label: 'Groups',
      icon:'group'
    }, {
      id: USER_LIST_TYPE_FLAT,
      label: 'Users',
      icon:'person'
    }];

    const usersGroupsTargetTabs = [{
      id: RESOURCE_LIST_TYPE_TREE,
      label: 'Perms',
    }, {
      id: LOG_TYPE_USER,
      label: 'Activity'
    }]

    const usersGroupsSourceTabSwitcher = (
      <TabSwitcherHeader tabs={usersGroupsSourceTabs}
                         activeTab={this.props.getActiveUserGroupType()}
                         setActiveTab={this.props.setActiveUserGroupType} />
    );

    const usersGroupsTargetTabSwitcher = (
      <TabSwitcherHeader tabs={usersGroupsTargetTabs}
                         activeTab={this.props.getActiveTabForUserGroupTarget()}
                         setActiveTab={this.props.setActiveTabForUserGroupTarget} />
    )

    const usersGroupsSourcePaneToolbar = (
      <PaneToolbar
        isActive={true}
        leftCol={[usersGroupsSourceTabSwitcher]}
      />
    );

    const usersGroupsTargetPaneToolbar = (
      <PaneToolbar
        isActive={true}
        leftCol={[usersGroupsTargetTabSwitcher]}
        rightCol={this.props.getActiveTabForUserGroupTarget() === RESOURCE_LIST_TYPE_TREE ? [<Glyphicon glyph="list" className={css(s.flatlist)} onClick={() => this.onViewAccessibleButtonClicked()} />]:[]}
      />
    );

    const profile = this.props.getProfile();
    let loadingval = this.state.isLoading;

    if (this.state.isLoading) {
      return (
        <div className={css(s.loader)}>
          <Loader size='xs'/>
          <span className={css(s.loaderText)}>Loading...</span>
        </div>
      )
    }
   else {
      return (
        <div style={{margin: 0}}>
          <PageContent>
            <Pane isFullHeight={true}
                  toolbar={usersGroupsSourcePaneToolbar}>
                <UserGroupSource ref="userList"
                        getUsers={this.getUsers}
                        getUserSources={this.state.userSources}
                        fetchUsers={(parentId, usersourceId) => this.props.fetchUsersWorkflow(profile.email, parentId, usersourceId, profile.authToken)}
                        shouldShowPermissions={this.props.getActiveModeUserGroup() === MODE_USER_PERMISSIONS}
                        isFetchingUsers={this.props.getIsFetchingUsers()}
                        activeFile={this.props.getActiveFileUserGroup()}
                        activeUser={this.props.getActiveUserUserGroup()}
                        setActiveUser={this.props.setActiveUserUserGroup}
                        setFilePermissionsMode={() => this.props.setActiveModeUserGroup(MODE_FILE_PERMISSIONS)}
                        getFilePermissionsForUser={this.props.getFilePermissionsForUser}
                        registerUserTreeApi={this.registerUserTreeApi}
                        refreshAllTrees={this.refreshAllTrees}
                        setUserExpanded={this.props.setUserGroupExpanded}
                        getIsUserExpanded={this.props.getIsUserGroupExpanded}
                        getActiveUserListType={(this.props.getActiveUserGroupType()===USER_LIST_TYPE_FLAT) ? true : false}
                        setActiveTab={this.props.setActiveUserGroupType}
                        setActiveResourceListType={this.props.setActiveResourceListType}
                        leftGridWidth={this.state.leftGridWidth}
                        setActiveFile={this.props.setActiveFileUserGroup}/>
            </Pane>

           <Pane isFullHeight={true}
                  toolbar={usersGroupsTargetPaneToolbar}>
              {this.props.getActiveTabForUserGroupTarget() === RESOURCE_LIST_TYPE_TREE ?
              !this.props.getisViewAccessibleClicked() ?
              <UserGroupTarget activeUser={this.props.getActiveUserUserGroup()}
                        getResources={this.state.resources}
                        activeFile={this.props.getActiveFileUserGroup()}
                        shouldShowPermissions={this.props.getActiveModeUserGroup() === MODE_FILE_PERMISSIONS}
                        getFilesForRoot={this.props.getFilesForRoot}
                        getIsFetchingFiles={root => this.props.getIsFetchingFiles(root)}
                        fetchFiles={(root, datasourceId) => this.props.fetchFilesWorkflow(profile.email, root, datasourceId, profile.authToken)}
                        getIsFileExpanded={this.props.getIsFileUserGroupExpanded}
                        setRootExpanded={this.props.setFileUserGroupExpanded}
                        setActiveFile={this.props.setActiveFileUserGroup}
                        setUserPermissionsMode={() => this.props.setActiveModeUserGroup(MODE_USER_PERMISSIONS)}
                        getFilePermissionsForUser={this.props.getFilePermissionsForUser}
                        registerFileTreeApi={this.registerFileTreeApi}
                        refreshAllTrees={this.refreshAllTrees}
                        setActiveUser={this.props.setActiveUserUserGroup}
                        />
                      :
                      <ResourceFlatList
                        dataList={this.state.resourceFlatListData}
                        isFetched={this.state.isFetched}
                      />
                      :
                      <ActivityLog
                        log={this.props.getLog()}
                        logType={LOG_TYPE_USER}
                        showUserColumn={false}
                        fetchLogWorkflow={this.props.fetchLogWorkflow}
                        profile={this.props.getProfile()}
                        userId={this.props.getActiveUserUserGroup()}
                        columnNames = {this.state.columnNamesActivityLog}
                      />}
           </Pane>
          </PageContent>
          {(this.props.getActiveTabForUserGroupTarget() !== RESOURCE_LIST_TYPE_TREE) || this.props.getisViewAccessibleClicked() ?
             <ExportCsvButton  onBtExport={this.onBtExport} getActiveResourceListType={this.props.getActiveUserGroupType}/> : ''}
        </div>
      );
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserGroups);
