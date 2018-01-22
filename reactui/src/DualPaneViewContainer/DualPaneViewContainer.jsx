import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import throttle from 'lodash/throttle';
import Button from '../Button';
import FileTree from '../FileTree';
import PageContent from '../PageContent';
import Pane from '../Pane';
import PaneToolbar from '../PaneToolbar';
import UserList from '../UserList';
import LogModal from '../LogModal';
import TabSwitcherHeader from '../TabSwitcherHeader';
import HomePage from '../HomePage';
import Loader from '../Loader';
import { StyleSheet, css } from 'aphrodite/no-important';
import UserGroupResourceList from '../UserGroupResourceList';
import ExportCsvButton from '../ExportCsvButton';

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
  SET_VIEWACCESSIBLECLICKED as setViewAccessibleClicked,
  SET_ROOT_EXPANDED as setRootExpanded,
  SET_ACTIVE_FILE as setActiveFile,
  SET_ACTIVE_MODE as setActiveMode,
  SET_LOG_DIALOG_VISIBLE as setLogDialogVisible,
  collapseFileTree,
  SET_USER_EXPANDED as setUserExpanded,
  SET_ACTIVE_USER_LIST_TYPE as setActiveUserListType,
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
  getIsFetchingFiles: root => selectors.getIsFetchingFiles(state, root),
  getFilesForRoot: (root, datasourceId) => selectors.getFilesForRoot(state, root, datasourceId),
  getActiveUser: () => selectors.getActiveUser(state),
  getLockStateUL: () => selectors.getLockStateUL(state),
  getLockStateFT: () => selectors.getLockStateFT(state),
  getIsFileExpanded: (root, datasourceId) => selectors.getIsFileExpanded(state, root, datasourceId),
  getActiveFile: () => selectors.getActiveFile(state),
  getisViewAccessibleClicked :()=>selectors.getisViewAccessibleClicked(state),
  getActiveMode: () => selectors.getActiveMode(state),
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
  setLockStateUL,
  setLockStateFT,
  setScanStatus,
  setWidgetReport,
  setRootExpanded,
  setScanStatus,
  setActiveMode,
  fetchLogWorkflow,
  setLogDialogVisible,
  collapseFileTree,
  setUserExpanded,
  setActiveUserListType,
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
  }
});


class DualPaneViewContainer extends Component {
  constructor(props) {
    super(props);

    this.onFileLogClick = this.onFileLogClick.bind(this);
    this.onUserLogClick = this.onUserLogClick.bind(this);
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
      width:447
    }

  }

  componentWillMount() {
    //this.props.setScanStatus(false);
    if (this.props.getWidgetReport() === true)
      this.props.setWidgetReport(false);
    //this.props.setScanStatus(false);
  }

  componentDidMount() {
    console.log("this is ", this);
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
      console.log("all users ussource value : ", ussource);
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
        // .then((data)=>{
    //   this.setState({
    //     users:data.payload.users,
    //     isLoading:false
    //   })
    // });

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
  componentWillReceiveProps(netProps) {
    if(ReactDOM.findDOMNode(this.refs["userList"])) {
      this.setState({
        leftGridWidth:ReactDOM.findDOMNode(this.refs["userList"]).clientWidth
      })
    }
  }
  getUsers = (parentid) => {
    //return this.props.getUsers(parentid);
    if (this.props.getActiveUserListType() === USER_LIST_TYPE_GROUPED) {
      return this.props.getUsers(parentid);
    } else {
      return this.props.getUsers(ALL_USERS_PARENT);
    }
  };

  onFileLogClick() {
    const profile = this.props.getProfile();
    const activeFile = this.props.getActiveFile();
    this.props.fetchLogWorkflow(
      LOG_TYPE_FILE,
      profile.email,
      activeFile[1],
      activeFile[2],
      profile.authToken
    );
    this.props.setLogDialogVisible(true);
  }

  onUserLogClick() {
    const profile = this.props.getProfile();
    const userId = this.props.getActiveUser();
    this.props.fetchLogWorkflow(
      LOG_TYPE_USER,
      profile.email,
      userId[1],
      this.props.getUserNameForUserId(userId),
      profile.authToken
      //this.props.getUserNameForUserId(userId)
    );
    this.props.setLogDialogVisible(true);
  }


// this takes the input userOrParentGroupEmail and return all the email
// for parentGroupEmail
  getEmailForGroup(queriedData,usersourceId){
    let userGroupNameMap = this.props.getEmailNameMapForUsersourceId(usersourceId);

    var headNode = this.props.getUGTree();
    var length = queriedData.length;
    var outputMap= {};
    for(var i=0; i<length;i++){

        var name =queriedData[i][0];
        var emailId =queriedData[i][1];
        let groupPermission =queriedData[i][2];
        var isGroup =queriedData[i][3];

        var node = headNode[emailId];
        outputMap[emailId]= [name,groupPermission,isGroup];
        // checking if it is a Group or not
        // allchildren gives all user which is under parentGroup
        if(node && node["allChildren"].length !==0){

          var permission = queriedData[i][2];
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
    this.setState({
      isLoading:true
    })
    const isviewAccessibleClicked = !this.props.getisViewAccessibleClicked();
    this.props.setViewAccessibleClicked(isviewAccessibleClicked);
    if(isviewAccessibleClicked){
    const activeFile = this.props.getActiveFile();
    const profile = this.props.getProfile();
    const resourceId = activeFile[0];
    const datasourceId =activeFile[1];
    let userSourceDataSourceIdMap = this.props.getUserSourceDataSourceIdMAP()
    const usersourceId = userSourceDataSourceIdMap[resourceId];
    this.props.fetchUsersAndGruops(profile.email,datasourceId,resourceId,profile.authToken).then((data)=>{
      let userGroupData = this.getEmailForGroup(data.payload.datasourceId,usersourceId);
      this.setState({
        userGroupFlatData:userGroupData,
        isLoading:false
      })
      console.log(this.state.userGroupFlatData);
    });
  }else{
    this.setState({
      userGroupFlatData:[],
      isLoading:false
    })
    const activeTab = this.props.getActiveUserListType();
    this.props.setActiveUserListType(activeTab);
  }
  }
  isDisabled() {
    if(this.props.getActiveUser()!==null){
      const userType = this.props.getActiveUser();
      if(userType[2]!=="GROUP")
        return false
    }
    return true;
  }

  registerFileTreeApi = api => this.fileTreeApi = api;
  registerUserTreeApi = api => this.userTreeApi = api;

  refreshAllTrees = throttle(() => {
    this.fileTreeApi && this.fileTreeApi.refreshView();
    this.userTreeApi && this.userTreeApi.refreshView();
  }, 300);

  fileTreeCsvData = (api) => {
    this.fileTreeCsvData = api
    console.log(api);
  };
  userTreeCsvData = api => this.userTreeCsvData = api;

  onBtExport = () => {
    if(this.props.getActiveResourceListType()===RESOURCE_LIST_TYPE_FLAT){
      var params = {};
      var user_group_name = this.props.getActiveUser();
      // var re1 = /\s/g;
      var fn1 = 'View Accessible List for '+user_group_name[3].replace(/\s/g, '_') + '.csv';
      params.fileName = fn1;
      params.customHeader = 'This is a custom csv header for ' + fn1 + '.';
      this.fileTreeCsvData.exportDataAsCsv(params);
    }
    else if(this.props.getisViewAccessibleClicked()===true) {
      var params = {};
      var active_file_name = this.props.getActiveFile();
      console.log(this.props.getActiveFile());
      var fn1 = 'View Accessible List for '+active_file_name[2].replace(/\s/g, '_') + '.csv';
      params.fileName = fn1;
      params.customHeader = 'This is a custom csv header for ' + fn1 + '.';
      this.userTreeCsvData.exportDataAsCsv(params);
    }
  }

  // onBtExportRTL = () => {
  //   this.userTreeCsvData.exportDataAsCsv();
  // }

  render() {
    const usersGroupsTabs = [{
      id: USER_LIST_TYPE_GROUPED,
      label: 'Groups',
      icon:'group'
    }, {
      id: USER_LIST_TYPE_FLAT,
      label: 'Users',
      icon:'person'
    }];
    let exportdivLTR = (this.props.getActiveResourceListType()===RESOURCE_LIST_TYPE_FLAT && this.props.getResourceFlatData() != 0)?
    <ExportCsvButton onBtExport={this.onBtExport} getActiveResourceListType={this.props.getActiveResourceListType}/>: ''

    let exportdivRTL = (this.props.getisViewAccessibleClicked()=== true && this.state.userGroupFlatData !=0)?
    <ExportCsvButton onBtExport={this.onBtExport} getActiveResourceListType={this.props.getActiveResourceListType}/>: ''

    const userFlatList =[{
      id: 'USER_GROUP',
      label: 'USERS & GROUPS',
    }]

    const usersGroupsTabSwitcher = (
      <TabSwitcherHeader tabs={this.props.getisViewAccessibleClicked()? userFlatList :usersGroupsTabs}
                         activeTab={this.props.getActiveUserListType()}
                         setActiveTab={this.props.setActiveUserListType} />
    );

    const usersPaneToolbar = (
      <PaneToolbar
        isActive={true}
        leftCol={[usersGroupsTabSwitcher]}
        rightCol={[<Button isPrimary={true} size='s' label={this.props.getisViewAccessibleClicked() ? "View All":"View Accessible"} key="2" disabled={this.props.getActiveFile() ===null} onClick={() => this.onViewAccessibleButtonClicked()}/>,
        <Button isPrimary={true} size='s' label="Log" key="1" disabled={this.isDisabled()} onClick={() => this.onUserLogClick()} />]}/>
    );

    // const resourcesPaneToolbar = (
    //   <PaneToolbar
    //     isActive={true}
    //     leftCol={[<h2>Resources</h2>]}
    //     rightCol={[
    //       <Button size='s' label="Collapse All" key="2" onClick={() => this.props.collapseFileTree()} />,
    //       <Button isPrimary={true} size='s' label="Log" key="3" onClick={() => this.onFileLogClick()} />
    //     ]}/>
    // );

    const profile = this.props.getProfile();
    const viewaccessibleclicked =!this.props.getisViewAccessibleClicked()
    let loadingval = this.state.isLoading;
    if (this.state.isLoading && viewaccessibleclicked) {
      return (
        <div className={css(s.loader)}>
          <Loader size='xs'/>
          <span className={css(s.loaderText)}>Loading...</span>
        </div>
      )
    }
   else {
      if(this.state.userSources.length===0 && this.state.resources.length===0 ) {
        return (
          <PageContent getmodelData={this.props.getmodelData()}>
            <HomePage authContent={this.props.auth} />
          </PageContent>
        )
      }
      return (
        <div style={{margin: 0}}>
          <PageContent>
            <Pane isFullHeight={true}
                  toolbar={usersPaneToolbar}>
              {!this.props.getisViewAccessibleClicked() ?
                <UserList ref="userList" getUsers={this.getUsers}
                        getDatasources={this.props.getDatasources}
                        getUserSources={this.state.userSources}
                        fetchUsers={(parentId, usersourceId) => this.props.fetchUsersWorkflow(profile.email, parentId, usersourceId, profile.authToken)}
                        shouldShowPermissions={this.props.getActiveMode() === MODE_USER_PERMISSIONS}
                        isFetchingUsers={this.props.getIsFetchingUsers()}
                        activeFile={this.props.getActiveFile()}
                        activeUser={this.props.getActiveUser()}
                        getLockStateUL={this.props.getLockStateUL}
                        setLockStateUL={this.props.setLockStateUL}
                        setActiveUser={this.props.setActiveUser}
                        setFilePermissionsMode={() => this.props.setActiveMode(MODE_FILE_PERMISSIONS)}
                        getFilePermissionsForUser={this.props.getFilePermissionsForUser}
                        registerUserTreeApi={this.registerUserTreeApi}
                        refreshAllTrees={this.refreshAllTrees}
                        setUserExpanded={this.props.setUserExpanded}
                        getIsUserExpanded={this.props.getIsUserExpanded}
                        getActiveUserListType={(this.props.getActiveUserListType()===USER_LIST_TYPE_FLAT) ? true : false}
                        setActiveTab={this.props.setActiveUserListType}
                        getPathSpecifierForUser={this.props.getPathSpecifierForUser}
                        setActiveResourceListType={this.props.setActiveResourceListType}
                        leftGridWidth={this.state.leftGridWidth}
                        setActiveFile={this.props.setActiveFile}
                        setViewAccessibleClicked={this.props.setViewAccessibleClicked}/>
                        :<UserGroupResourceList dataList={this.state.userGroupFlatData} isFetched={this.state.isLoading}
                                                userTreeCsvData={this.userTreeCsvData}/>
                  }
            </Pane>

           {/* <Pane isFullHeight={true}
                  toolbar={resourcesPaneToolbar}> */}
              <FileTree activeUser={this.props.getActiveUser()}
                        getResources={this.state.resources}
                        activeFile={this.props.getActiveFile()}
                        shouldShowPermissions={this.props.getActiveMode() === MODE_FILE_PERMISSIONS}
                        getFilesForRoot={this.props.getFilesForRoot}
                        getIsFetchingFiles={root => this.props.getIsFetchingFiles(root)}
                        fetchFiles={(root, datasourceId) => this.props.fetchFilesWorkflow(profile.email, root, datasourceId, profile.authToken)}
                        getIsFileExpanded={this.props.getIsFileExpanded}
                        setRootExpanded={this.props.setRootExpanded}
                        setActiveFile={this.props.setActiveFile}
                        getLockStateFT={this.props.getLockStateFT}
                        setLockStateFT={this.props.setLockStateFT}
                        setUserPermissionsMode={() => this.props.setActiveMode(MODE_USER_PERMISSIONS)}
                        getFilePermissionsForUser={this.props.getFilePermissionsForUser}
                        registerFileTreeApi={this.registerFileTreeApi}
                        refreshAllTrees={this.refreshAllTrees}
                        onFileLogClick={this.onFileLogClick}
                        fetchResourceFlatData={this.props.fetchResourceFlatData}
                        profile={profile}
                        getUGTree={this.props.getUGTree}
                        getUserGroups={this.props.getUserGroups}
                        userTab={(this.props.getActiveUserListType()===USER_LIST_TYPE_FLAT) ? true : false}
                        getResourceFlatData={this.props.getResourceFlatData}
                        getActiveResourceListType={this.props.getActiveResourceListType}
                        setActiveResourceListType={this.props.setActiveResourceListType}
                        getDatasources={this.props.getDatasources}
                        setActiveUser={this.props.setActiveUser}
                        setViewAccessibleClicked={this.props.setViewAccessibleClicked}
                        fileTreeCsvData={this.fileTreeCsvData}/>
           {/* </Pane> */}
          </PageContent>

          <LogModal isVisible={this.props.getIsLogDialogVisible()}
                    isFetchingLog={this.props.getIsFetchingLog()}
                    onClose={() => this.props.setLogDialogVisible(false)}
                    log={this.props.getLog()}
                    logResourceId={this.props.getActiveLogResourceId()}
                    logResourceName={this.props.getActiveLogResourceName()}
                    getUserNameForUserId={this.props.getUserNameForUserId}
                    logType={this.props.getActiveLogType()} />
         {/*<ExportCsvButton onBtExport={this.onBtExport} />*/}
         {/*<ExportCsvButton onBtExport={this.onBtExportLTR} />*/}
         {exportdivLTR}
        {exportdivRTL}
        </div>
      );
    }
    // Too many props being passed down to UserList and FileTree. These could potentially
    // be their own containers. Or they could be wrapped by containers, simplifying this file.

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DualPaneViewContainer);
