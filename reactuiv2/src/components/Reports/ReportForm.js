import React, { Component, PropTypes } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Card, Button, Form, Header, Modal, Checkbox, Input } from 'semantic-ui-react'
import ReactCron from '../reactCron/index'
import { connect } from 'react-redux';
import UsersTree from '../Users/UsersTree';
import ResourcesList from '../Resources/ResourcesList';
import agent from '../../utils/agent';
import * as Helper from '../reactCron/helpers/index';
import GroupSearch from '../Search/GroupSearch';
import ResourceSearch from '../Search/ResourceSearch';



import {
  CREATE_SCHEDULED_REPORT,
  UPDATE_SCHEDULED_REPORT
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.reports,
  ...state.users,
  ...state.resources,
  ...state.common
});

const mapDispatchToProps = dispatch => ({
  addScheduledReport: (report) => {
    dispatch({ type: CREATE_SCHEDULED_REPORT, payload: agent.Scheduled_Report.createReport(report) })
  },
  updateScheduledReport: (report) => {
    dispatch({ type: UPDATE_SCHEDULED_REPORT, payload: agent.Scheduled_Report.updateReport(report) })
  }

});

const reportOptions = [
  { text: 'Access Permission Report', value: 'Permission' },
  { text: 'Activity Log Report', value: 'Activity' },
]

class ReportForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: {},
      cronExpression: '',
      reportType: '',
      reportNameError: false,
      emailToError: false,
      valueError: false,
      cronExpressionError: false,
      IsActiveError: false,
      reportTypeError: false,
      error: '',
      reportDataForReportId: this.props.reportsMap,
      finalReportObj: {}

    }
  }


  submit = () => {

    var errorMessage = ""
    var success = false
    var pattern = /^\s*$/;
    let valid = true
    var emailCheck = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var selected_entity;


    var copyFinalInputObj = {}
    Object.assign(copyFinalInputObj, this.state.finalReportObj)

    if (!copyFinalInputObj['is_active']) {
      copyFinalInputObj['is_active'] = 0
    }

    var populatedDataForParticularReport = {}
    if (this.props.formType === 'modify_report') {
      var populatedDataForParticularReport = this.state.reportDataForReportId
      Object.assign(populatedDataForParticularReport, copyFinalInputObj)
    }


    if (!copyFinalInputObj.name && !populatedDataForParticularReport.name) {
      errorMessage = "Please enter a name for this report."
      valid = false
    }
    else if (!copyFinalInputObj.report_type && !populatedDataForParticularReport.report_type) {
      errorMessage = " Please select the report type."
      valid = false
    }
    else if (!copyFinalInputObj.selected_entity_type && !populatedDataForParticularReport.selected_entity_type) {
      errorMessage = "Please select User/Group or File/Folder."
      valid = false
    }
    else if (!copyFinalInputObj.selected_entity && !populatedDataForParticularReport.selected_entity) {
      errorMessage = "Please select the entity "
      valid = false
    }
    else if (!copyFinalInputObj.receivers && !populatedDataForParticularReport.receivers) {
      errorMessage = "Please enter an email address."
      valid = false
    }

    copyFinalInputObj.datasource_id = this.props.datasources[0]['datasource_id']

    if (valid && this.props.formType === 'modify_report') {
      copyFinalInputObj['report_id'] = this.state.reportDataForReportId['report_id']

      success = true
      this.props.updateScheduledReport(copyFinalInputObj)
      this.props.close()
    }
    else if (valid && this.props.formType === 'create_report') {
      if(copyFinalInputObj['frequency'] === undefined){
        copyFinalInputObj.frequency = "cron(* * ? * * *)"
      }
      success = true
      this.props.addScheduledReport(copyFinalInputObj)
      this.props.close()

    }

    if (!success) {
      this.setState((state) => ({
        error: errorMessage
      }))

    }

  }

  stateSetHandler = (data) => {
    this.setState({
      cronExpression: data
    })
  }

  handleMultipleOptions = (data) => {

    var value = Object.keys(this.state.reportDataForReportId).length > 0 ?
      this.state.reportDataForReportId[data] : null

    return value
  }

  onChangeReportInput = (key, value) => {
    var copyFinalReportObj = {};
    Object.assign(copyFinalReportObj, this.state.finalReportObj)

    if (key === 'frequency') {
      value = "cron(" + value + ")"
    }

    if (typeof (key) !== "string") {
      for (var i in key) {
        for (var j in value) {
          copyFinalReportObj[key[i]] = value[j]
        }

      }
    }
    else if (typeof (key) === "string") {
      copyFinalReportObj[key] = value
    }


    if (key === 'selected_entity_type') {
      if (Object.keys(this.state.reportDataForReportId).length > 0) {
        var reportsMapcopy = {}
        Object.assign(reportsMapcopy, this.state.reportDataForReportId)
        reportsMapcopy['selected_entity_type'] = "";
        this.setState({
          reportDataForReportId: reportsMapcopy
        })
      }
      else {

      }


    }

    this.setState({
      finalReportObj: copyFinalReportObj,
      value: value
    })

  }



  render() {

    let user = this.props.rowData
    const { value } = this.state
    console.log("this.props.reportsMap ", this.props.reportsMap)

    var modalContent = (
      <div>

        <div style={{ color: 'red' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{this.state.error}</div>
        <Form onSubmit={this.submit}>
          <div className="ui two column very relaxed grid">
            <div className="column">

              <div className="ui form">
                <Form.Input onChange={(e) => this.onChangeReportInput('name', e.target.value)}
                  label='Name' placeholder='Name' defaultValue={this.props.reportsMap['name']} />

                <Form.Input onChange={(e) => this.onChangeReportInput('description', e.target.value)} label='Description' placeholder='Description'
                  defaultValue={this.props.reportsMap['description']} />

                <Form.Select id='reportType' onChange={(e, data) => this.onChangeReportInput('report_type', data.value)}
                  label='Report Type' options={reportOptions} placeholder='Report Type'
                  defaultValue={this.handleMultipleOptions('report_type')} />

                <Form.Input onChange={(e) => this.onChangeReportInput('receivers', e.target.value)}
                  label='Email To' placeholder='Email To' control={Input}
                  defaultValue={this.props.reportsMap['receivers']} />
              </div>

            </div>
            <div className="column">
              <Form.Field>
                <Checkbox onChange={(e, data) => this.onChangeReportInput('is_active', data.checked)} label='IsActive' width={2}
                />
              </Form.Field>
              <Form.Field >
                <ReactCron ref='reactCron' stateSetHandler={this.onChangeReportInput}
                  formType={this.props.formType} defaultCronVal={this.props.reportsMap['frequency']} />
              </Form.Field>
              <Form.Group inline>
                <Form.Radio label='File/Folder' value='resource'
                  checked={this.handleMultipleOptions('selected_entity_type') === 'resource' ||
                    this.state.finalReportObj['selected_entity_type'] === 'resource'}
                  onChange={(e, data) => this.onChangeReportInput('selected_entity_type', data.value)}
                />
                <Form.Radio label='Group/User' value='group'
                  checked={this.handleMultipleOptions('selected_entity_type') === 'group' ||
                    this.state.finalReportObj['selected_entity_type'] === 'group'}
                  onChange={(e, data) => this.onChangeReportInput('selected_entity_type', data.value)}
                />
              </Form.Group>
              {this.state.finalReportObj['selected_entity_type'] === 'group' ||
                this.handleMultipleOptions('selected_entity_type') === 'group' ?
                <Form.Field><GroupSearch onChangeReportInput={this.onChangeReportInput}
                  defaultValue={this.state.reportDataForReportId['selected_entity']} />
                </Form.Field> : null}
              {this.state.finalReportObj['selected_entity_type'] === 'resource' ||
                this.handleMultipleOptions('selected_entity_type') === 'resource' ?
                <Form.Field ><ResourceSearch onChangeReportInput={this.onChangeReportInput}
                  defaultValue={this.state.reportDataForReportId['selected_entity_name']} /></Form.Field> : null}
            </div>
          </div>
        </Form>
      </div>
    )


    return (
      <div>
        <Modal className="scrolling"
          open={this.props.showModal}>
          <Modal.Content>
            {modalContent}
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={this.props.close}>Close</Button>
            <Button positive content="Submit" onClick={this.submit} />
          </Modal.Actions>
        </Modal>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReportForm);
