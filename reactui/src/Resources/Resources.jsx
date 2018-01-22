import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import throttle from 'lodash/throttle';
import Button from '../Button';
import ResourcesTarget from '../ResourcesTarget';
import PageContent from '../PageContent';
import Pane from '../Pane';
import PaneToolbar from '../PaneToolbar';
import ResourcesSource from '../ResourcesSource';
import LogModal from '../LogModal';
import TabSwitcherHeader from '../TabSwitcherHeader';
import Loader from '../Loader';
import { StyleSheet, css } from 'aphrodite/no-important';
import UserGroupResourceList from '../UserGroupResourceList';
import ExportCsvButton from '../ExportCsvButton';
import LogModelData from '../LogModelData';
import ActivityLog from '../ActivityLog';
import {Glyphicon} from 'react-bootstrap';
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
  SET_ACTIVE_USER_RESOURCES as setActiveUserResources,
  SET_IS_VIEW_ACCESSIBLE_CLICKED_RESOURCE as setViewAccessibleClicked,
  SET_ROOT_EXPANDED as setRootExpanded,
  SET_FILE_RESOURCES_EXPANDED as setFileResourcesExpanded,
  SET_ACTIVE_FILE as setActiveFile,
  SET_ACTIVE_FILE_RESOURCES as setActiveFileResources,
  SET_ACTIVE_MODE as setActiveMode,
  SET_ACTIVE_MODE_RESOURCES as setActiveModeResources,
  SET_LOG_DIALOG_VISIBLE as setLogDialogVisible,
  collapseFileTree,
  SET_USER_EXPANDED as setUserExpanded,
  SET_USER_RESOURCES_EXPANDED as setUserResourcesExpanded,
  SET_ACTIVE_USER_LIST_TYPE as setActiveUserListType,
  SET_ACTIVE_RESOURCES_TYPE as setActiveResourcesType,
  SET_ACTIVE_TAB_FOR_USER_GROUP_TARGET as setActiveTabForUserGroupTarget,
  SET_ACTIVE_TAB_FOR_RESOURCES_TARGET as setActiveTabForResourcesTarget,
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
  getIsUserResourcesExpanded: userId => selectors.getIsUserResourcesExpanded(state, userId),
  getIsFetchingFiles: root => selectors.getIsFetchingFiles(state, root),
  getFilesForRoot: (root, datasourceId) => selectors.getFilesForRoot(state, root, datasourceId),
  getActiveUser: () => selectors.getActiveUser(state),
  getActiveUserResources: () => selectors.getActiveUserResources(state),
  getActiveUserResources: () => selectors.getActiveUserResources(state),
  getLockStateUL: () => selectors.getLockStateUL(state),
  getLockStateFT: () => selectors.getLockStateFT(state),
  getIsFileExpanded: (root, datasourceId) => selectors.getIsFileExpanded(state, root, datasourceId),
  getIsFileResourcesExpanded: (root, datasourceId) => selectors.getIsFileResourcesExpanded(state, root, datasourceId),
  getActiveFile: () => selectors.getActiveFile(state),
  getActiveFileResources: () => selectors.getActiveFileResources(state),
  getisViewAccessibleClicked :()=>selectors.getisViewAccessibleClickedResource(state),
  getActiveMode: () => selectors.getActiveMode(state),
  getActiveModeResources: () => selectors.getActiveModeResources(state),
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
  getActiveResourcesType: () => selectors.getActiveResourcesType(state),
  getActiveTabForUserGroupTarget: () => selectors.getActiveTabForUserGroupTarget(state),
  getActiveTabForResourcesTarget: () => selectors.getActiveTabForResourcesTarget(state),
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
  setActiveUserResources,
  setActiveFile,
  setActiveFileResources,
  setLockStateUL,
  setLockStateFT,
  setScanStatus,
  setWidgetReport,
  setRootExpanded,
  setFileResourcesExpanded,
  setScanStatus,
  setActiveMode,
  setActiveModeResources,
  fetchLogWorkflow,
  setLogDialogVisible,
  collapseFileTree,
  setUserExpanded,
  setUserResourcesExpanded,
  setActiveUserListType,
  setActiveResourcesType,
  setActiveTabForUserGroupTarget,
  setActiveTabForResourcesTarget,
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


class Resources extends Component {
  constructor(props) {
    super(props);

    this.onViewAccessibleButtonClicked = this.onViewAccessibleButtonClicked.bind(this);
    this.getEmailForGroup = this.getEmailForGroup.bind(this);

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
      columnNamesActivityLog: ["ural_activity_log_time_stamp", "ural_activity_log_event", "datasources.name",
      "resource_path_to_id.resource_path", "user_full_name"],
      columnNames: ["user_full_name", "users_email", "urp_perm", "email_type"],
      resourceId: ""

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
    if (this.props.getActiveTabForResourcesTarget() === USER_LIST_TYPE_GROUPED) {
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

  getEmailForGroup(queriedData,usersourceId){
    let userGroupNameMap = this.props.getEmailNameMapForUsersourceId(usersourceId);

    var headNode = this.props.getUGTree();
    var length = queriedData.length;
    var outputMap= {};
    for(var i=0; i<length;i++){

        var name =queriedData[i]["user_full_name"];
        var emailId =queriedData[i]["users_email"];
        let groupPermission =queriedData[i]["urp_perm"];
        var isGroup =queriedData[i]["email_type"];
        var node = headNode[emailId];
        outputMap[emailId]= [name,groupPermission,isGroup];
        // checking if it is a Group or not
        // allchildren gives all user which is under parentGroup
        if(node && node["allChildren"].length !==0){

          var permission = queriedData[i]["urp_perm"];
          var allChildren = node["allChildren"];

          for(var j=0;j<allChildren.length;j++){
          var childinNameMap =userGroupNameMap[allChildren[j].toLowerCase()];

          if(childinNameMap){
          let childName = childinNameMap['name'];
          let childEmailId= allChildren[j];
          let isGroup = childinNameMap['isGroup'];
          if(outputMap[childEmailId]=== undefined){
            outputMap[childEmailId]=[childName,permission,isGroup];
          }else{
            if(outputMap[childEmailId][1]=='R' && permission=='W'){
                outputMap[childEmailId][1]='W';
            }
          }
        }
        }
      }
    }
    let output = [];
    for(var data in outputMap)
    {
      var map = outputMap[data];
      var newRow = [map[0],data,map[1],map[2]];
      output.push(newRow);
    }
    return output;
  }

  onViewAccessibleButtonClicked(){
    // this.setState({
    //   isLoading:true
    // })
    const isviewAccessibleClicked = !this.props.getisViewAccessibleClicked();
    this.props.setViewAccessibleClicked(isviewAccessibleClicked);

    if(isviewAccessibleClicked) {
      const activeFile = this.props.getActiveFileResources();
      const profile = this.props.getProfile();
      const resourceId = activeFile[0];
      const datasourceId =activeFile[1];
      let userSourceDataSourceIdMap = this.props.getUserSourceDataSourceIdMAP()
      const usersourceId = userSourceDataSourceIdMap[resourceId];
      this.props.fetchUsersAndGruops(profile.email,resourceId,datasourceId,profile.authToken, this.state.columnNames).then((data)=>{
        let userGroupData = this.getEmailForGroup(data.payload.userGroupFlatData,usersourceId);
        this.setState({
          userGroupFlatData:userGroupData,
          isLoading:false
        })
      });
      this.setState({
        resourceId: datasourceId
      })
    }
    else {
      this.setState({
        userGroupFlatData:[],
        isLoading:false
      })
      const activeTab = this.props.getActiveUserListType();
      this.props.setActiveUserListType(activeTab);
    }
  }

  onBtExport = () =>{
    var report_input = {}
    const profile = this.props.getProfile()
    report_input["event_type"] = "generate_csv_report"
    report_input["authtoken"] = this.props.getProfile().authToken
    report_input["email"] = this.props.getProfile().email
    if(this.props.getisViewAccessibleClicked()){
      report_input["flag"] = "get_user_for_resources"
      report_input["column_names"] = this.state.columnNames
      report_input["resource_id"] = this.state.resourceId
      report_input["datasource_id"] = this.state.datasource[0][0]
      report_input["display_names"] = {
        "user_full_name": "Name",
        "users_email": "Email",
        "urp_perm": "Permission",
        "email_type": "Type"
      }
    }
    else if(this.props.getActiveTabForResourcesTarget() === LOG_TYPE_FILE){
          report_input["flag"] = "get_activity_log"
          report_input["column_names"] = this.state.columnNamesActivityLog
          report_input["resource_id"] = this.props.getActiveFileResources()[1]
          report_input["display_names"] = {
            "ural_activity_log_time_stamp": "Date" ,
            "ural_activity_log_event" : "Operation",
            "datasources.name" : "Datasource",
            "resource_path_to_id.resource_path" : "Resource",
            "user_full_name": "User"
            }

    }
    console.log("input : ", report_input)
    API.getCsvReportUrl(report_input).then(response => {
        window.location.assign(response)
    })
  }

  render() {
    const resourcesTargetTabs = [{
      id: USER_LIST_TYPE_GROUPED,
      label: 'Groups',
      icon:'group'
    }, {
      id: USER_LIST_TYPE_FLAT,
      label: 'Users'
    }, {
      id: LOG_TYPE_FILE,
      label: 'Activity'
    }];

    const resourcesSourceTabs = [{
      id: RESOURCE_LIST_TYPE_TREE,
      label: 'Resources',
    }]

    const resourcesSourceTabSwitcher = (
      <TabSwitcherHeader tabs={resourcesSourceTabs} />
    );

    const resourcesTargetTabSwitcher = (
      <TabSwitcherHeader tabs={resourcesTargetTabs}
                         activeTab={this.props.getActiveTabForResourcesTarget()}
                         setActiveTab={this.props.setActiveTabForResourcesTarget} />
    )

    const resourcesSourcePaneToolbar = (
      <PaneToolbar
        isActive={true}
        leftCol={[resourcesSourceTabSwitcher]}
      />
    );

    const resourcesTargetPaneToolbar = (
      <PaneToolbar
        isActive={true}
        leftCol={[resourcesTargetTabSwitcher]}
        rightCol={this.props.getActiveTabForResourcesTarget() !== LOG_TYPE_FILE ? [<Glyphicon glyph="list" className={css(s.flatlist)} onClick={() => this.onViewAccessibleButtonClicked()} />]: []}
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
                   toolbar={resourcesSourcePaneToolbar}>
               <ResourcesSource activeUser={this.props.getActiveUserResources()}
                         getResources={this.state.resources}
                         activeFile={this.props.getActiveFileResources()}
                         shouldShowPermissions={this.props.getActiveModeResources() === MODE_FILE_PERMISSIONS}
                         getFilesForRoot={this.props.getFilesForRoot}
                         getIsFetchingFiles={root => this.props.getIsFetchingFiles(root)}
                         fetchFiles={(root, datasourceId) => this.props.fetchFilesWorkflow(profile.email, root, datasourceId, profile.authToken)}
                         getIsFileExpanded={this.props.getIsFileResourcesExpanded}
                         setRootExpanded={this.props.setFileResourcesExpanded}
                         setActiveFile={this.props.setActiveFileResources}
                         setUserPermissionsMode={() => this.props.setActiveModeResources(MODE_USER_PERMISSIONS)}
                         getFilePermissionsForUser={this.props.getFilePermissionsForUser}
                         registerFileTreeApi={this.registerFileTreeApi}
                         refreshAllTrees={this.refreshAllTrees}
                         setActiveUser={this.props.setActiveUserResources}
                        />
            </Pane>

            <Pane isFullHeight={true}
                  toolbar={resourcesTargetPaneToolbar}>
                {this.props.getActiveTabForResourcesTarget() !== LOG_TYPE_FILE ?
                !this.props.getisViewAccessibleClicked() ?
                <ResourcesTarget ref="userList"
                        getUsers={this.getUsers}
                        getDatasources={this.props.getDatasources}
                        getUserSources={this.state.userSources}
                        fetchUsers={(parentId, usersourceId) => this.props.fetchUsersWorkflow(profile.email, parentId, usersourceId, profile.authToken)}
                        shouldShowPermissions={this.props.getActiveModeResources() === MODE_USER_PERMISSIONS}
                        isFetchingUsers={this.props.getIsFetchingUsers()}
                        activeFile={this.props.getActiveFileResources()}
                        activeUser={this.props.getActiveUserResources()}
                        setActiveUser={this.props.setActiveUserResources}
                        setFilePermissionsMode={() => this.props.setActiveModeResources(MODE_FILE_PERMISSIONS)}
                        getFilePermissionsForUser={this.props.getFilePermissionsForUser}
                        registerUserTreeApi={this.registerUserTreeApi}
                        refreshAllTrees={this.refreshAllTrees}
                        setUserExpanded={this.props.setUserResourcesExpanded}
                        getIsUserExpanded={this.props.getIsUserResourcesExpanded}
                        getActiveUserListType={(this.props.getActiveTabForResourcesTarget()===USER_LIST_TYPE_FLAT) ? true : false}
                        setActiveTab={this.props.setActiveResourcesType}
                        setActiveResourceListType={this.props.setActiveResourceListType}
                        leftGridWidth={this.state.leftGridWidth}
                        setActiveFile={this.props.setActiveFileResources}
                      />
                      :
                      <UserGroupResourceList
                          dataList={this.state.userGroupFlatData}
                          isFetched={this.state.isLoading}
                      />
                      :
                      <ActivityLog
                        log={this.props.getLog()}
                        logType={LOG_TYPE_FILE}
                        showUserColumn={true}
                        fetchLogWorkflow={this.props.fetchLogWorkflow}
                        profile={this.props.getProfile()}
                        activeFile={this.props.getActiveFileResources()}
                        columnNames = {this.state.columnNamesActivityLog}
                      />}
            </Pane>
          </PageContent>
          {(this.props.getActiveTabForResourcesTarget() === LOG_TYPE_FILE) || this.props.getisViewAccessibleClicked() ?
             <ExportCsvButton onBtExport={this.onBtExport} getActiveResourceListType={this.props.getActiveResourcesType}/> : ''}
        </div>
      );
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Resources);
