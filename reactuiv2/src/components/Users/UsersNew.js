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
});

const mapDispatchToProps = dispatch => ({
  selectUserItem: (payload) =>
    dispatch({ type: USER_ITEM_SELECTED, payload })
});

class UsersNew extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showExportModal: false,
      columnHeaders: [
        "Source",
        "Type",
        "Name",
        "Email",
        "Is Admin",
        "Exposure Type"
      ],
      checkedHeaders: {
        "Source": false,
        "Type": false,
        "Name": false,
        "Email": false,
        "Is Admin": false,
        "Exposure Type": false
      },
      selectAllChecked: false,
      isLoading: false
    }
  }

  componentWillMount() {
    window.scrollTo(0, 0)
    this.props.selectUserItem(undefined)
  }

  handleButtonClick = () => {
    this.setState({
      showExportModal: !this.state.showExportModal
    })
  }

  handleCheckboxChange = (event, data) => {
    let headerName = data.label
    let checkedHeaders = Object.assign({}, this.state.checkedHeaders)
    let selectAllChecked = this.state.selectAllChecked

    if (headerName !== "Select All") {
      checkedHeaders[headerName] = !checkedHeaders[headerName]
      if (selectAllChecked)
        selectAllChecked = !selectAllChecked
    }

    else {
      for (let key in checkedHeaders) {
        if (!this.state.selectAllChecked && !checkedHeaders[key])
          checkedHeaders[key] = true
        else if (this.state.selectAllChecked && checkedHeaders[key])
          checkedHeaders[key] = false
      }
      selectAllChecked = !selectAllChecked
    }

    this.setState({
      checkedHeaders: checkedHeaders,
      selectAllChecked: selectAllChecked
    })
  }

  handleSubmit = () => {
    // Make an api call to export selected headers as csv
    let exportHeaders = ''
    let headers = Object.keys(this.state.checkedHeaders)

    for (let index = 0; index<headers.length; index++) {
      if (this.state.checkedHeaders[headers[index]])
        exportHeaders += headers[index] + "=true"
      
      if (index+1 < headers.length)
        exportHeaders += "&"
    }
    //console.log(exportHeaders)
    this.setState({
      isLoading: true
    })
    agent.Users.exportToCsv(exportHeaders).then(response => {
      console.log(response)
      window.location = response
      this.setState({
        showExportModal: false,
        isLoading: false
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

    let columnHeaderCheckboxInput = this.state.columnHeaders.map((headerName, index) => {
      return (
        <div>
          <Checkbox key={index} label={headerName} checked={this.state.checkedHeaders[headerName]} onChange={(event, data) => this.handleCheckboxChange(event, data)} />
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
            <Checkbox label="Select All" onChange={(event, data) => this.handleCheckboxChange(event, data)} checked={this.state.selectAllChecked} />
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
