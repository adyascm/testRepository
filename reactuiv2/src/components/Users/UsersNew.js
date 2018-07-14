import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Checkbox, Button, Modal, Header } from 'semantic-ui-react'

import agent from '../../utils/agent';
import Actions from '../actions/Actions'


import {
  USERS_PAGE_UNLOADED,
  USER_ITEM_SELECTED
} from '../../constants/actionTypes';

import UsersTree from './UsersTree';
import UserListNew from './UserListNew'
import UsersDetails from './UsersDetails';
import GroupsDetails from './GroupsDetails';

import Dropdown from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';

const mapStateToProps = state => ({
  selectedUserItem: state.users.selectedUserItem,
  ...state.users
});

const mapDispatchToProps = dispatch => ({
  selectUserItem: (payload) =>
    dispatch({ type: USER_ITEM_SELECTED, payload })
});

class UsersNew extends Component {
  constructor(props) {
    super(props);

    this.state = {
      columnHeaders: [
        "Source",
        "Type",
        "Name",
        "Email",
        "Is Admin",
        "Member Type"
      ],
      checkedColumns: {},
      selectAllColumns: true,
      isLoading: false,
      showExportModal: false
    }
  }

  componentWillMount() {
    window.scrollTo(0, 0)
    this.props.selectUserItem(undefined)
  }

  handleButtonClick = () => {
    let checkedColumns = {}
    let selectAllColumns = this.state.selectAllColumns

    if (!this.state.showExportModal) {
      for (let index=0; index<this.state.columnHeaders.length; index++) {
        checkedColumns[this.state.columnHeaders[index]] = true
      }
      if (!selectAllColumns)
        selectAllColumns = !selectAllColumns
    }
    this.setState({
      showExportModal: !this.state.showExportModal,
      checkedColumns: checkedColumns,
      selectAllColumns: selectAllColumns
    })
  }

  handleCheckboxChange = (event, data) => {
    let columnName = data.label
    let checkedColumns = Object.assign({}, this.state.checkedColumns)
    let selectAllColumns = this.state.selectAllColumns

    if (columnName !== "Select All") {
      checkedColumns[columnName] = !checkedColumns[columnName]
      if (selectAllColumns)
        selectAllColumns = !selectAllColumns
    }
    else {
      for (let columnName in checkedColumns) {
        if ((selectAllColumns && checkedColumns[columnName]) || (!selectAllColumns && !checkedColumns[columnName]))
          checkedColumns[columnName] = !checkedColumns[columnName] 
      }
      selectAllColumns = !selectAllColumns
    }
    this.setState({
      checkedColumns: checkedColumns,
      selectAllColumns: selectAllColumns
    })
  }

  handleSubmit = () => {
    //Constructing the query parameters 
    let filter_params = ''

    for (let index=0; index<this.state.columnHeaders.length; index++) {
      let columnName = this.state.columnHeaders[index]
      if (this.state.checkedColumns[columnName]) {
        let ampersand = index > 0 ? "&" : ""
        if (columnName === "Source") {
          let userSource = this.props.listFilters.datasource_id ? this.props.listFilters.datasource_id.value : ""
          filter_params = filter_params + ampersand + "userSource=" + userSource
        }
        else if (columnName === "Name") {
          let userName = this.props.listFilters.full_name ? this.props.listFilters.full_name.value : ""
          filter_params = filter_params + ampersand + "userName=" + userName
        }
        else if (columnName === "Type") {
          let userType = this.props.listFilters.type ? this.props.listFilters.type.value : ""
          filter_params = filter_params + ampersand + "userType=" + userType
        }
        else if (columnName === "Email") {
          let userEmail = this.props.listFilters.email ? this.props.listFilters.email.value : ""
          filter_params = filter_params + ampersand + "userEmail=" + userEmail
        }
        else if (columnName === "Member Type") {
          let memberType = this.props.listFilters.member_type ? this.props.listFilters.member_type.value : ""
          filter_params = filter_params + ampersand + "memberType=" + memberType
        }
        else if (columnName === "Is Admin") {
          let userAdmin = this.props.listFilters.is_admin ? this.props.listFilters.is_admin.value : ""
          filter_params = filter_params + ampersand + "userAdmin=" + userAdmin
        }
      }
    }

    this.setState({
      isLoading: true
    })

    agent.Users.exportToCsv(filter_params).then(response => {
      console.log(response)
      window.location = response
      this.setState({
        isLoading: false,
        showExportModal: false
      })
    })
  }

  render() {
    let containerStyle = {
      height: "100%",
    };

    let exportButtonStyle = {
      'position': 'relative', 
      'left': '46%', 
      'margin-top': '-10px', 
      'margin-bottom': '10px'
    }

    let columnHeaderCheckboxInput = this.state.columnHeaders.map((columnName, index) => {
      return (
        <div>
          <Checkbox key={index} label={columnName} onChange={(event, data) => this.handleCheckboxChange(event, data)} checked={this.state.checkedColumns[columnName]} />
        </div>
        )
    }) 

    let dimmer = (
      <Dimmer active inverted>
          <Loader inverted content='Loading' />
      </Dimmer>
    )

    let exportModal = (
      <Modal size='small' open={this.state.showExportModal}>
          <Modal.Header>
              Export documents as csv
          </Modal.Header>
          <Modal.Content>
            <Header> Fields to export </Header>
            <Checkbox label="Select All" onChange={(event, data) => this.handleCheckboxChange(event, data)} checked={this.state.selectAllColumns} />
            {columnHeaderCheckboxInput}
            <div style={{'marginTop': '10px'}}>
              <Button negative size="tiny" onClick={this.handleButtonClick}>Close</Button>
              <Button positive size="tiny" content='Submit' onClick={this.handleSubmit} ></Button>
            </div>
          </Modal.Content>
          {this.state.isLoading ? dimmer : null}
      </Modal>
    )

    var gridWidth = 16;

    if (this.props.selectedUserItem) {
      gridWidth = 5;
    }

    let detailsSection = null;
    if (this.props.selectedUserItem) {
      if (this.props.selectedUserItem.type == "USER") {
        detailsSection = (<Grid.Column width='11'><UsersDetails {...this.props.selectedUserItem} /></Grid.Column>);
      }

      else {
        detailsSection = (<Grid.Column width='11'><GroupsDetails {...this.props.selectedUserItem} /></Grid.Column>);
      }
    }

    return (
      <div style={containerStyle}>
        <Button style={exportButtonStyle} onClick={this.handleButtonClick} > Export </Button>
        <Grid divided='vertically'>
          <Grid.Row>
            <Grid.Column fluid width={gridWidth}>
              <UserListNew />
            </Grid.Column>
            {detailsSection}
          </Grid.Row>
        </Grid>
        <Actions />
        {exportModal}
      </div >
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersNew);
