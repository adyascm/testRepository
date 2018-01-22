import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
//import FileAccessStatus from '../FileAccessStatus';
import TreeCell from '../TreeCell';
import { components } from '../designTokens';
import { FILES_ROOT } from '../constants';
import Pane from '../Pane';
import Button from '../Button';
import PaneToolbar from '../PaneToolbar';
import ToggleHeader from '../ToggleHeader';
import ResourceFlatList from '../ResourceFlatList';
import _ from 'lodash';
import {
  RESOURCE_LIST_TYPE_TREE,
  RESOURCE_LIST_TYPE_FLAT
} from '../constants';
//import TabSwitcherHeader from '../TabSwitcherHeader';
import ExportCsvButton from '../ExportCsvButton';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-dark.css';

const isDatasource = params => params.data[params.data.length - 1] === 'DS';

class FileTree extends Component {
  constructor(props) {
    super(props);
    this.onGridReady = this.onGridReady.bind(this);
    this.onToggleExpand = this.onToggleExpand.bind(this);
    this.onResourceCellClick = this.onResourceCellClick.bind(this);

    this.state = {
      activeRowIndex: -1,
      resourceFlatListData:[],
      isFetched:false
    }

    this.columnDefs = [{
      headerName: 'Name',
      width: 600,
      valueGetter: params => {
        if (params.data[3] === 'F' || params.data[3] === 'D') {
          return params.data[2];
        } else if (isDatasource(params)) {
          return params.data[1];
        }
      },
      cellRenderer: 'group',
      cellRendererFramework: TreeCell,
      cellRendererParams: {
        getIsExpandable: resource => resource[3] === 'D' || resource[resource.length - 1] === 'DS',
        onToggleExpand: this.onToggleExpand,
        getActiveFile: () => this.props.activeFile,
        getMimeIcon: file => {
          const perms = this.props.getFilePermissionsForUser(this.props.activeUser, file);
          if (file[3] === 'F') {
            if (this.props.shouldShowPermissions && perms.isReadable && perms.isWritable) {
              return 'file-r-w';
            } else if(this.props.shouldShowPermissions && perms.isReadable) {
              return 'file-r';
            }else {
              return 'file';
            }
          } else if (file[3] === 'D') {
            if (this.props.shouldShowPermissions && perms.isReadable && perms.isWritable) {
              return 'folder-r-w';
            } else if(this.props.shouldShowPermissions && perms.isReadable) {
              return 'folder-r';
            }else {
              return 'file-directory';
            }
          } else if (file[file.length - 1] === 'DS') {
            return 'database';
          }
        },
        getShouldShowPermissions: () => this.props.shouldShowPermissions,
        getPermissions: file=> this.props.getFilePermissionsForUser(this.props.activeUser, file),
        getIsActive: params => params.node.rowIndex === this.state.activeRowIndex,
      }
    }];
    //  {
    //   headerName: 'Permissions',
    //   width: 100,
    //   cellStyle: { 'text-align': 'center' },
    //   cellRendererFramework: FileAccessStatus,
    //   cellRendererParams: {
    //     getShouldShowPermissions: () => this.props.shouldShowPermissions,
    //     getPermissions: file => this.props.getFilePermissionsForUser(this.props.activeUser, file)
    //   }
    // }];

    this.gridOptions = {
      rowHeight: components.dataTableRow.height,
      enableColResize: true,
      suppressScrollOnNewData: true,
      onRowClicked: this.onResourceCellClick,
      suppressRowClickSelection: true,
      suppressCellSelection: true,
      enableSorting: true,
      enableFilter: true,
      getRowStyle: (params)=> {
        let perms = this.props.getFilePermissionsForUser(this.props.activeUser, params.data);
        if(this.props.shouldShowPermissions) {
          if((perms.isReadable && perms.isWritable) || (perms.isReadable)) {
            return {
              'opacity': '1'
            }
          } else {
            return {
              'opacity': '0.5'
            }
          }
        }
      },
      getNodeChildDetails: resource => {
        if (resource[3] === 'F') {
          return null;
        } else if (resource[3] === 'D') {
          let children = this.props.getFilesForRoot(resource[0], resource[1]);
          //children = _.values(children);
          return {
            group: true,
            children: children || [{ isLoadingIndicator: true }],
            expanded: this.props.getIsFileExpanded(resource[0], resource[1])
          };
        } else if (resource[resource.length-1] === 'DS') {
          let children = this.props.getFilesForRoot(resource[0], FILES_ROOT);
         if(!children) {

         } else {

         }
          //children = _.values(children);
          return {
            group: true,
            children: children || [{ isLoadingIndicator: true }],
            expanded: this.props.getIsFileExpanded(resource[0], FILES_ROOT)
          };
        }
      }
    };
  }

  onGridReady(params) {
    this.api = params.api;
    this.props.registerFileTreeApi(params.api);
    this.api.sizeColumnsToFit();
  }

  onResourceCellClick(params) {
    if (!isDatasource(params)) {
      this.props.setActiveFile(params.data);
    } else {
      this.props.setActiveFile(null);
    }
    this.props.setActiveUser(null);
    this.props.setViewAccessibleClicked(false);
    this.props.setUserPermissionsMode();
    this.setState({ activeRowIndex: params.node.rowIndex });

    // If we refresh the tree immediately, the click event doesn't get
    // past this handler. I.e, the little triangle expansion buttons
    // never receive the click event.
    setTimeout(() => this.props.refreshAllTrees(), 100);
  }

  onToggleExpand(params)  {
    const root = params.data;
    let isExpanded;
    if (root[root.length-1] === 'DS') {
      isExpanded = this.props.getIsFileExpanded(root[0], FILES_ROOT);
    } else if (root[3] === 'D') {
      isExpanded = this.props.getIsFileExpanded(root[0], root[1]);
    }

    if (isExpanded) {
      // Tell redux about our state.
      if (root[root.length-1] === 'DS') {
        this.props.setRootExpanded(root[0], FILES_ROOT, false);
      } else if (root[3] === 'D') {
        this.props.setRootExpanded(root[0], root[1], false);
      }

      // Tell ag-grid about our state.
      params.node.expanded = false;

      // Refresh the grid.
      this.api.onGroupExpandedOrCollapsed();
    } else {
      // Same song and dance as above, except we follow it up with a network
      // request.
      if (root[root.length-1] === 'DS') {
        this.props.setRootExpanded(root[0], FILES_ROOT, true);
      } else if (root[3] === 'D') {
        this.props.setRootExpanded(root[0], root[1], true);
      }
      params.node.expanded = true;
      this.api.onGroupExpandedOrCollapsed();

      let datasourceId;
      let resourceId;
      if (root[root.length-1] === 'DS') {
        datasourceId = root[0];
        resourceId = FILES_ROOT;
      } else if (root[3] === 'D') {
        datasourceId = root[0];
        resourceId = root[1];
      }
      this.props.fetchFiles(resourceId, datasourceId).then((data) => {
        if(data.payload.resources.length===0) {

            if (root[root.length-1] === 'DS') {
              this.props.setRootExpanded(root[0], FILES_ROOT, false);
            } else if (root[3] === 'D') {
              this.props.setRootExpanded(root[0], root[1], false);
            }
            params.node.expanded = false;

        }
        // This is ugly, but it forces ag-grid into calling getNodeChildDetails on the tree,
        // which then makes it aware of the new data we just fetched.
        this.api.setRowData(this.props.getResources);
      });
    }
  };

  collapseTree = ()=> {
    this.api.collapseAll();
    this.api.onGroupExpandedOrCollapsed();
  }
  getFlatList = () => {
    let groupData = this.props.getUGTree();
    let resourceFlatList = [];
    console.log("active user", this.props.activeUser)
    console.log("groupData",  groupData)

    // Here we need to set the resourceFlatList
    if(!this.props.userTab){
      if(this.props.activeUser) {
        if(this.props.activeUser[2] === "USER"){
          let item = groupData[this.props.activeUser[1]]["allAncestors"]
          console.log(item)
          resourceFlatList.push(this.props.activeUser[1])
          item.forEach( x => resourceFlatList.push(x) );
          console.log("resourceFlatList ", resourceFlatList)

        }
        else if(this.props.activeUser[2] === "GROUP"){
          let item = groupData[this.props.activeUser[1]]["allAncestors"]
          console.log(item)
          resourceFlatList.push(this.props.activeUser[1])
          item.forEach( x => resourceFlatList.push(x) );
          console.log("resourceFlatList ", resourceFlatList)
        }
      }
    }else{
        let activeUserEmail = this.props.activeUser[1]
        resourceFlatList.push(activeUserEmail)
        if(groupData[activeUserEmail]){
          let item = groupData[this.props.activeUser[1]]["allAncestors"]
          resourceFlatList.push(this.props.activeUser[1])
          item.forEach( x => resourceFlatList.push(x) );
        }
        else{
        let allAncestors = this.props.activeUser[5]
        if(allAncestors[0]!==null)
        {
          allAncestors.forEach(x => resourceFlatList.push(x))
        }
      }
    }

    //console.log(resourceFlatList);
    if(this.props.activeUser) {
     // console.log(this.props.activeUser[2])
    if(this.props.activeUser[2] === "GROUP"){
      this.props.fetchResourceFlatData(this.props.profile.email, resourceFlatList, this.props.profile.authToken).then(()=> {
      this.setState({
        resourceFlatListData:this.props.getResourceFlatData(),
        isFetched:false
      })
    })
    }else{
      this.props.fetchResourceFlatData(this.props.profile.email, resourceFlatList, this.props.profile.authToken).then(()=> {
      this.setState({
        resourceFlatListData:this.props.getResourceFlatData(),
        isFetched:false
      })
    })
      }
      }


  }
  setValOfResource = (idVal) => {
    this.setState({
      isFetched:true
    })
    this.props.activeUser && this.props.shouldShowPermissions && this.props.setActiveResourceListType(idVal);
    setTimeout(()=> {
        if(this.props.getActiveResourceListType()===RESOURCE_LIST_TYPE_FLAT ) {
          this.getFlatList();
        } else {
          this.setState({
            resourceFlatListData:[],
            isFetched:false
          })
        }
    }, 0);

  }

  //fileTreeCsvData= api => this.fileTreeCsvData = api;

  onBtnExport() {
    this.fileTreeCsvData.exportDataAsCsv();
  }
  render() {
    const usersGroupsTabs = [{
      id: RESOURCE_LIST_TYPE_TREE,
      label: 'TREE',
      icon:'group'
    }, {
      id: RESOURCE_LIST_TYPE_FLAT,
      label: 'FLAT',
      icon:'person'
    }];

    const resourceGroupSwitch = (
      <ToggleHeader tabs={usersGroupsTabs} key="1"
                          activeUser={this.props.activeUser}
                         activeTab={this.props.getActiveResourceListType()}
                         setActiveTab={this.setValOfResource} />
    );

    const resourcesPaneToolbar = (
      <PaneToolbar
        isActive={true}
        leftCol={[<h3>Resources</h3>,
          <h2>{resourceGroupSwitch}</h2>
        ]}
        rightCol={[
          <Button size='s' isPrimary={true} label="Collapse All" key="2" onClick={this.collapseTree.bind(this)} />,
          <Button isPrimary={true} size='s' label="Log" key="3" onClick={() => this.props.onFileLogClick()} />
        ]}/>
    );

    //const fileList = this.props.getDatasources();
    let resources = this.props.getResources;

    if(!resources || resources.length===0 ) {

      resources = null;
    }
    return (
      <div className="ag-dark" style={{height: '100%'}}>
      <Pane isFullHeight={true}
                toolbar={resourcesPaneToolbar}>
        {this.props.getActiveResourceListType()===RESOURCE_LIST_TYPE_TREE  ?
           <AgGridReact onGridReady={this.onGridReady}
           columnDefs={this.columnDefs}
           rowData={resources}
           gridOptions={this.gridOptions}
          />
          :
          <ResourceFlatList dataList={this.state.resourceFlatListData} 
                            isFetched={this.state.isFetched} 
                            fileTreeCsvData={this.props.fileTreeCsvData}
                            />
        }
      </Pane> 
      </div>
    );
  }
}

export default FileTree;
