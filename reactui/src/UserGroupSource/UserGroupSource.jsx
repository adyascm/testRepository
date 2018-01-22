import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import UserGroupCell from '../UserGroupCell';
import EmailCell from '../EmailCell';
import { components } from '../designTokens';
import _ from 'lodash';
import { ALL_USERS_PARENT, RESOURCE_LIST_TYPE_TREE } from '../constants';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-dark.css';
import '../GlobalStyles/UserListGlobalStyles';

const isToplevel = params => params.data[4] === 'TOPLEVEL';
const isGroup = params => params.data[2] === 'GROUP';
const isUser = params => params.data[2] === 'USER';

class UserGroupSource extends Component {
  constructor(props) {
    super(props);
    this.onGridReady = this.onGridReady.bind(this);
    this.onResourceCellClick = this.onResourceCellClick.bind(this);
    this.onToggleExpand = this.onToggleExpand.bind(this);

    this.state = {
      activeRowIndex: -1,
      activeRowIndexList: []
    };

    this.columnDefs = [{
      headerName: 'Name',
      field:'name',
      valueGetter: params => {
        if (isToplevel(params)) {
          return params.data[1];
        } else if (isGroup(params)) {
          return params.data[3];
        } else if (isUser(params)) {
          return params.data[3];
        } else {
          return `${params.data[2]} ${params.data[3]}`;
        }
      },
      cellRendererFramework: UserGroupCell,
      cellRendererParams: {
        getMimeIcon: (user) => {
          const perms = this.props.getFilePermissionsForUser(user, this.props.activeFile);
          if (this.props.shouldShowPermissions && perms.isReadable && perms.isWritable) {
            return 'person-r-w';
          } else if(this.props.shouldShowPermissions && perms.isReadable) {
            return 'person-r';
          } else {
            return 'person';
          }
        },
        getIsActive: params => params.node.rowIndex === this.state.activeRowIndex,
        getIsActiveMultiple: params => {
          return "source";
        },
        getIsExpandable: user => isGroup({ data: user }) || isToplevel({ data: user }),
        onToggleExpand: this.onToggleExpand,
        getShouldShowPermissions: () => this.props.shouldShowPermissions,
        getPermissions: user=> this.props.getFilePermissionsForUser(user, this.props.activeFile),
      }
    },
    {
      headerName: 'Email',
      field:'email',
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        return params.data[1];
      },
    }];

    this.gridOptions = {
      rowHeight: components.dataTableRow.height,
      enableColResize: true,
      onRowClicked: this.onResourceCellClick,
      suppressRowClickSelection: true,
      suppressCellSelection: true,
      suppressScrollOnNewData: true,
      animateRows: true,
      enableSorting: true,
      enableFilter: true,
      getRowStyle: (params)=> {
        let perms = this.props.getFilePermissionsForUser(params.data, this.props.activeFile);
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
      getNodeChildDetails: user => {
        if (isGroup({ data: user })) {
          const children = this.props.getUsers(user[1]);
          return {
            group: true,
            children: children || [{ isLoadingIndicator: true }],
            expanded: this.props.getIsUserExpanded(user[1])
          };
        } else if (isToplevel({ data: user })) {
          let children = this.props.getUsers(user[0]);
          return {
            group: true,
            children: children || [{ isLoadingIndicator: true }],
            expanded: this.props.getIsUserExpanded(user[0])
          };
        }
        return null;
      }
    };
  }

  componentDidMount() {
    if(this.props.getActiveUserListType) {
    } else {
      this.gridOptions.columnApi.setColumnVisible('email', false);
      this.api.sizeColumnsToFit();
    }
  }
  componentWillReceiveProps(nextPrpps) {
    if(nextPrpps.getActiveUserListType) {
        this.gridOptions.columnApi.setColumnVisible('email', true);
        this.gridOptions.columnApi.setColumnWidth('name', (this.props.leftGridWidth/2));
        this.gridOptions.columnApi.setColumnWidth('email', (this.props.leftGridWidth/2));
    } else {
      this.gridOptions.columnApi.setColumnVisible('email', false);
      this.gridOptions.columnApi.setColumnWidth('name', this.props.leftGridWidth);
      this.gridOptions.columnApi.setColumnWidth('email', 0);
    }
    this.api.sizeColumnsToFit();
    setTimeout(()=> this.gridOptions.api.refreshView(),0)
  }

  onGridReady(params) {
    this.api = params.api;
    this.props.registerUserTreeApi(params.api);
    this.gridOptions.columnApi.setColumnWidth('name', this.props.leftGridWidth);

  }


  onResourceCellClick(params) {
    if (!isToplevel(params)) {
      this.props.setActiveUser(params.data);
    } else {
      this.props.setActiveUser(null);
    }
    this.props.setActiveFile(null);
    //this.props.setViewAccessibleClicked(false);
    this.props.setFilePermissionsMode();
    this.setState({ activeRowIndex: params.node.rowIndex });

    // var activeRowIndexPrev = this.state.activeRowIndexList;
    // if (!activeRowIndexPrev.includes(params.node.rowIndex))
    //   activeRowIndexPrev.push(params.node.rowIndex);
    // this.setState({
    //   activeRowIndexList: activeRowIndexPrev
    // })

    //this.props.setActiveResourceListType(RESOURCE_LIST_TYPE_TREE)
    // If we refresh the tree immediately, the click event doesn't get
    // past this handler. I.e, the little triangle expansion buttons
    // never receive the click event.
    setTimeout(() => this.props.refreshAllTrees(), 0);
  }

  onToggleExpand(params) {
    if (isToplevel(params)) {
        if (this.props.getIsUserExpanded(params.data[0])) {
          this.props.setUserExpanded(params.data[0], false);
          params.node.expanded = false;

      } else {
        this.props.setUserExpanded(params.data[0], true);
        params.node.expanded = true;

        this.props.fetchUsers('root', params.data[0]).then(() => {

          this.api.setRowData((this.props.getActiveUserListType) ? this.props.getUsers(ALL_USERS_PARENT) : this.props.getUserSources);
        });
      }
    } else {
    if (this.props.getIsUserExpanded(params.data[1])) {
        this.props.setUserExpanded(params.data[1], false);
        params.node.expanded = false;

    } else {
      this.props.setUserExpanded(params.data[1], true);
      params.node.expanded = true;

      this.props.fetchUsers(params.data[1], params.data[0]).then((data) => {
        if((data !== undefined) && (data.payload.users.length===0)) {
          this.props.setUserExpanded(params.data[1], false);
          params.node.expanded = false;
        }
        this.api.setRowData((this.props.getActiveUserListType) ? this.props.getUsers(ALL_USERS_PARENT) : this.props.getUserSources);
      });
    }
  }
    this.api.onGroupExpandedOrCollapsed();
}
  render() {
    let userSources = (this.props.getActiveUserListType) ? this.props.getUsers(ALL_USERS_PARENT) : this.props.getUserSources;
    if (!userSources || userSources.length === 0) {
      userSources = null;
    }
    return (
      <div className="ag-dark" style={{height: '100%'}}>
        <AgGridReact onGridReady={this.onGridReady}
                     columnDefs={this.columnDefs}
                     rowData={userSources}
                     gridOptions={this.gridOptions} />
      </div>

    );
  }
}

export default UserGroupSource;
