import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Grid, Container, Dimmer, Loader, Dropdown, Form, Button, Modal, Checkbox, Header } from 'semantic-ui-react'

import ResourceDetailsSection from './ResourceDetailsSection';
import Actions from '../actions/Actions';
import ResourcesListTable from './ResourceListTable'
import ExportCsvModal from '../ExportCsvModal'
import agent from '../../utils/agent';
import {  RESOURCES_FILTER_CHANGE,
          RESOURCES_SEARCH_EMPTY
      } from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.resources,
  redirectTo: state.dashboard.redirectTo,
  redirectFilter: state.dashboard.filterType,
  selectedUser: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
  changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value }),
  clearSearchData: () => dispatch({ type: RESOURCES_SEARCH_EMPTY })
});


class Resources extends Component {

  constructor(props) {
    super(props);

    this.state = {
      columnHeaders: [
        "Source",
        "Name",
        "Type",
        "Owner",
        "Exposure Type",
        "Parent Folder",
        "Modified On or Before"
      ],
      showExportModal: false,
      isLoading: false,
      selectAllColumns: true,
      checkedColumns: {}
    }
  }

  componentWillMount() {
    window.scrollTo(0, 0)
  }

  componentWillUnmount() {
    this.props.clearSearchData()
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
        if (columnName === "Source")
          filter_params = filter_params + ampersand + "sourceType=" + this.props.filterSourceType
        else if (columnName === "Name") {
          let resource_name = this.props.prefix !== undefined ? this.props.prefix : ''
          filter_params = filter_params + ampersand + "resourceName=" + resource_name
        }
        else if (columnName === "Type")
          filter_params = filter_params + ampersand + "resourceType=" + this.props.filterResourceType
        else if (columnName === "Owner") {
          let ownerEmail = this.props.selectedUser ? this.props.selectedUser.email : ''
          filter_params = filter_params + ampersand + "ownerEmail=" + ownerEmail
        }
        else if (columnName === "Exposure Type")
          filter_params = filter_params + ampersand + "exposureType=" + this.props.filterExposureType
        else if (columnName === "Parent Folder")
          filter_params = filter_params + ampersand + "parentFolder=" + this.props.filterParentFolder
        else if (columnName === "Modified On or Before")
          filter_params = filter_params + ampersand + "modifiedDate=" + this.props.filterByDate
      }
    }

    this.setState({
      isLoading: true
    })

    agent.Resources.exportToCsv(filter_params).then(response => {
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
      textAlign: "left"
    };

    let exportButtonStyle = {
      'position': 'relative', 
      'left': '93%', 
      'margin-top': '-10px', 
      'margin-bottom': '10px'
    }

    var gridWidth = 16;
    if (this.props.rowData)
      gridWidth = 4

    return (
      <Container fluid style={containerStyle}>
        <Button style={exportButtonStyle} onClick={this.handleButtonClick} > Export </Button>
        <Grid divided='vertically' stretched >
          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              <ResourcesListTable />
            </Grid.Column>
            {
              this.props.rowData?
              (<Grid.Column stretched width={16 - gridWidth}>
                <Container fluid >
                  <ResourceDetailsSection />
                </Container>
              </Grid.Column>) : null
            }
          </Grid.Row>
        </Grid>
        <Actions />
        <ExportCsvModal columnHeaders={this.state.columnHeaders} showExportModal={this.state.showExportModal} onClose={() => this.handleButtonClick()} checkedColumns={this.state.checkedColumns} selectAllColumns={this.state.selectAllColumns} 
          onSubmit={() => this.handleSubmit()} isLoading={this.state.isLoading} onCheckboxChange={(event, data) => this.handleCheckboxChange(event, data)} />
      </Container>
    )
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Resources);
