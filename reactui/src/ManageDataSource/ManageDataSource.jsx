import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { /*colors, spaces,*/ components } from '../designTokens';
import Loader from '../Loader';
import ReactDOM from 'react-dom';
import ManageDataSourceCell from '../ManageDataSourceCell';
import {googleAuthurl} from '../urls';

import {connect} from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import PageContent from '../PageContent';
import Button from '../Button';
import {
  fetchTopLevelUsersWorkflow,
  fetchTopLevelResourcesWorkflow,
  SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible,
  deleteAccount,
  deleteDatasource,
  EditDatasource,
  EditUsersource
} from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';
const mapStateToProps = state => ({
  getProfile: () => authSelectors.getProfile(state.auth),
  getTopLevelUsers : (email) =>selectors.getTopLevelUsers(state, email),
  getTopLevelResources: (email) => selectors.getTopLevelResources(state, email),
  getmodelData: ()=> selectors.getmodelData(state)
});

const mapDispatchToProps = {
  fetchTopLevelUsersWorkflow,
  fetchTopLevelResourcesWorkflow,
  setMenuDialogVisible,
  deleteAccount,
  deleteDatasource,
  EditDatasource,
  EditUsersource
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
  }
});

class ManageDataSource extends Component {
  constructor(props) {
    super(props);
    this.onGridReady = this.onGridReady.bind(this);

    this.state = {
      isLoading:true,
      isFetched:true,
      Datasources:[],
      UserSources:[],
      isShow:false,
      selectedDatasource:'',
      rowIndex:-1,
      isEditVal:false,
      EditablerowIndex:-1,
      updateValues:{
        datasourceVal:'',
        usersourceVal:''
      }
    }
    this.gridOptions = {
      rowHeight: components.agGridPopup.height,
      headerHeight:components.agGridPopup.height,
      enableColResize: true,
      onRowClicked: this.onResourceCellClick.bind(this),
      //suppressRowClickSelection: true,
      //suppressCellSelection: true,
      //suppressScrollOnNewData: true,
      animateRows: true,
      enableSorting: true,
      enableFilter: true
    }
    this.columnDefs = [{
      headerName: 'Data Source',
      field:'name',
      valueGetter: params => {
        return params.data[1];
      },
      cellRendererFramework: ManageDataSourceCell,
      cellRendererParams: {
          getIsActive: params => {
            return params.data[0] === this.state.selectedDatasource[0]
          },
          getEdit: params => {
            return params.rowIndex === this.state.EditablerowIndex
          },
          getUserSource: () => {
            return;
          },
          handleDatasourceChange: (event)=> {
            this.setState({
              datasourceVal:event.target.value
            })
            return event.target.value
          }
      }
    },
    {
      headerName: 'Type',
      field:'type',
      valueGetter: params => {
        return params.data[2]
      },
    },
    {
      headerName: 'User Source',
      field:'usersource',
      valueGetter: params => {
        if(this.state.UserSources && !this.state.isLoading) {
          return this.state.UserSources[params.node.id][1];
        }
        //return params.node.id;
        //return this.state.UserSources[params.node.id][2];
      },
      cellRendererFramework: ManageDataSourceCell,
      cellRendererParams: {
          getIsActive: params => {
            return params.data[0] === this.state.selectedDatasource[0]
          },
          getEdit: params => {
            return params.rowIndex === this.state.EditablerowIndex
          },
          getUserSource: () => {
            return ({
              isuserType:true,
              UserSources:this.state.UserSources
            })
          },
          handleusersourceChange: (event)=> {
            this.setState({
              usersourceVal:event.target.value
            })
            return event.target.value
          }
      }
    },
    {
      headerName: 'Access Id',
      field:'access',
      valueGetter: params => {
        return params.data[3]
      },

    },
    {
      headerName: 'Local Directory',
      field:'localDirectory',
      valueGetter: params => {
        if(params.data[2]==='GDRIVE') {
          return '-';
        } else {
          return params.data[params.data.length-2]
        }
      },

    }];

  }
  /*componentWillReceiveProps(nextProps) {
    console.log(nextProps.getProfile());
  }*/
  componentDidUpdate(prevProps, prevState) {
      //if(this.props.getProfile() !== prevProps.getProfile()) {
        const profile = this.props.getProfile();
        this.state.isFetched && this.props.fetchTopLevelResourcesWorkflow(profile.email, profile.authToken).then((data)=>{
          this.setState({
            Datasources:this.props.getTopLevelResources(profile.email),
            isFetched:false,
          })
        });
        this.state.isFetched && this.props.fetchTopLevelUsersWorkflow(profile.email, profile.authToken).then((data)=>{
          this.setState({
            UserSources:this.props.getTopLevelUsers(profile.email),
            isFetched:false,
            isLoading:false
          })
        });
        
      //}
      if(ReactDOM.findDOMNode(this.refs["manageDatasource"])) {
          this.gridOptions.columnApi.setColumnWidth('name', ((ReactDOM.findDOMNode(this.refs["manageDatasource"]).clientWidth-15)/3.8));
          this.gridOptions.columnApi.setColumnWidth('type', ((ReactDOM.findDOMNode(this.refs["manageDatasource"]).clientWidth-15)/6));
          this.gridOptions.columnApi.setColumnWidth('usersource', ((ReactDOM.findDOMNode(this.refs["manageDatasource"]).clientWidth-15)/4));
          this.gridOptions.columnApi.setColumnWidth('access', ((ReactDOM.findDOMNode(this.refs["manageDatasource"]).clientWidth-15)/6));
      }
  }
  onResourceCellClick(params) {
    if(params.rowIndex!==this.state.EditablerowIndex) {
      this.setState({
        rowIndex:params.rowIndex,
        selectedDatasource:params.data,
        isEditVal:true,
        EditablerowIndex:-1,
      })
      this.gridOptions.api.refreshView();
    }
    
  }
  onGridReady(params) {
    this.api = params.api;
    //this.api.sizeColumnsToFit();
  }
  toggleList = (isShow) => {
    this.setState({
      isShow:!isShow
    })
  }
  handleMenuModel(modelData) {
    if(modelData==="windows") {
      this.props.setMenuDialogVisible(true, modelData);
    }
    if(this.state.Datasources && this.state.selectedDatasource) {
      this.props.setMenuDialogVisible(true, modelData, this.state.selectedDatasource);
    }
  }
  handleGoogleAuth() {
    console.log(googleAuthurl(this.props.getProfile().email, this.props.getProfile().authToken));
    let left = (window.innerWidth/4);
    window.open(googleAuthurl(this.props.getProfile().email, this.props.getProfile().authToken), "googleWindow", "width=600,height=500,status=1,top=70,left="+left+"");
  }
  deleteDatasource = (email, datasourceId, authToken)=> {
    this.props.deleteDatasource(email, datasourceId, authToken).then(()=> {
      this.setState({
        isFetched:true,
      });
      this.gridOptions.api.refreshView();
    });
  }
  editCell= (key, char) => {
    if(this.state.rowIndex!== -1) {
      this.setState({
        EditablerowIndex:this.state.rowIndex
      })
      if(this.state.isEditVal) {
        setTimeout(()=> {
          this.gridOptions.api.setFocusedCell(this.state.EditablerowIndexEditablerowIndex, 'name');
          /*this.gridOptions.api.startEditingCell({
              rowIndex: this.state.EditablerowIndex,
              colKey: 'name',
              keyPress: key,
              charPress: char
          });*/
          this.gridOptions.api.refreshView();
        }, 0);
        this.setState({
          isEditVal:false
        })
      }
      
      //this.gridOptions.api.startEditingCell(this.state.rowIndex, 'name', '');
    }
  }
  updateValues = () => {
    if(this.state.selectedDatasource && (this.state.datasourceVal || this.state.usersourceVal)) {
      this.state.datasourceVal && this.props.EditDatasource(this.props.getProfile().email, this.state.selectedDatasource[0], this.state.datasourceVal, this.props.getProfile().authToken).then((data)=> {
        console.log("datasource");
      })
      this.state.usersourceVal && this.props.EditUsersource(this.props.getProfile().email, this.state.UserSources[this.state.rowIndex][0], this.state.usersourceVal, this.props.getProfile().authToken).then((data)=> {
        console.log("usersource");
      })
      this.setState({
        isFetched:true,
        EditablerowIndex:-1,
        usersourceVal:'',
        selectedDatasource:'',
        rowIndex:-1,
        datasourceVal:'',
      });
    } else {
      console.log("no change");
      this.setState({
        isFetched:true,
        EditablerowIndex:-1,
        usersourceVal:'',
        selectedDatasource:'',
        rowIndex:-1,
        datasourceVal:'',
      });
    }
    //console.log(this.state.datasourceVal);
    //console.log(this.state.usersourceVal);
  }
  render() {
    if(this.state.isLoading) {
      return (
        <div className={css(s.loader)}>
          <Loader size='xs'/> 
          <span className={css(s.loaderText)}>Loading...</span>
        </div>
      )
    }
    return (
      <div style={{margin: 0}}>
        <PageContent deleteDatasource={this.deleteDatasource} isOneBlock={true} getmodelData={this.props.getmodelData()} >
          <div ref="manageDatasource" className="ag-dark agGridPop" style={{height: '80%',width:'100%'}}>
            <AgGridReact onGridReady={this.onGridReady}
                columnDefs={this.columnDefs}
                rowData={this.state.Datasources}
                gridOptions={this.gridOptions}
            />
            <div style={{marginTop:20,position:'relative'}}>
              {this.state.isShow && <ul className="manageDataSourceList">
                <li><a onClick={()=>this.handleGoogleAuth()}>Google Drive</a></li>
                <li><a onClick={()=>{this.handleMenuModel('windows')}}>Windows</a></li>
              </ul>}
              <span style={{float:'left',marginRight:10,}}>
                <Button isPrimary={true} disabled={this.state.EditablerowIndex===-1 ? false : true} size='l' label="Add" key="1" onClick={() => this.toggleList(this.state.isShow)} />
              </span>
              <span style={{float:'left',marginRight:10,}}>
                {this.state.EditablerowIndex!==-1 ? <Button isPrimary={true} size='l' label="Update" key="2" onClick={this.updateValues} />
                :
                <Button isPrimary={true} disabled={this.state.selectedDatasource ? false : true} size='l' label="Edit" key="2" onClick={this.editCell} />
                }
              </span>
              <span style={{float:'right',marginRight:0,}}>
                <Button isPrimary={true} disabled={(this.state.selectedDatasource && this.state.EditablerowIndex===-1) ? false : true} size='l' label="Delete" key="3" onClick={() => this.handleMenuModel('manageDataSource')} />
              </span>
              <div style={{clear:'both'}}></div>
            </div>
          </div>
        </PageContent>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageDataSource);
