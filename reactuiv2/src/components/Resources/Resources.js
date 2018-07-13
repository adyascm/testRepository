import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Grid, Container, Dimmer, Loader, Dropdown, Form, Button, Modal, Checkbox, Header } from 'semantic-ui-react'

import ResourceDetailsSection from './ResourceDetailsSection';
import Actions from '../actions/Actions';
import ResourcesListTable from './ResourceListTable'
import agent from '../../utils/agent';
import {  RESOURCES_FILTER_CHANGE,
          RESOURCES_SEARCH_EMPTY
      } from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.resources,
  redirectTo: state.dashboard.redirectTo,
  redirectFilter: state.dashboard.filterType
});

const mapDispatchToProps = dispatch => ({
  changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value }),
  clearSearchData: () => dispatch({ type: RESOURCES_SEARCH_EMPTY })
});


class Resources extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showExportModal: false,
      columnHeaders: [
        "Source",
        "Name",
        "Type",
        "Owner",
        "Exposure Type",
        "Parent Folder",
        "Modified On or Before"
      ],
      checkedHeaders: {
        "Source": false,
        "Name": false,
        "Type": false,
        "Owner": false,
        "Exposure Type": false,
        "Parent Folder": false,
        "Modified On or Before": false
      },
      selectAllChecked: false,
      isLoading: false
    }
  }

  componentWillMount() {
    window.scrollTo(0, 0)
  }

  componentWillUnmount() {
    this.props.clearSearchData()
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
    agent.Resources.exportToCsv(exportHeaders).then(response => {
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
        {exportModal}
      </Container>
    )
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Resources);
