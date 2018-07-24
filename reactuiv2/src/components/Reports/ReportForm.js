import React, { Component } from 'react';
import { Button, Form, Modal, Checkbox, Input } from 'semantic-ui-react'
import ReactCron from '../reactCron/index'
import { connect } from 'react-redux';
import agent from '../../utils/agent';
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
  { text: 'Inactive Users Report', value: 'Inactive'},
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
    //var pattern = /^\s*$/;
    let valid = true
    //var emailCheck = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    //var selected_entity;


    var copyFinalInputObj = {}
    Object.assign(copyFinalInputObj, this.state.finalReportObj)
    copyFinalInputObj.datasource_id = this.props.datasources[0]['datasource_id']

    var populatedDataForParticularReport = {}
    if (this.props.formType === 'modify_report') {
      populatedDataForParticularReport = this.state.reportDataForReportId
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
    else if ( copyFinalInputObj.report_type && (['Inactive','EmptyGSuiteGroup', 'EmptySlackChannel'].indexOf(copyFinalInputObj.report_type) < 0) && !copyFinalInputObj.selected_entity_type && !populatedDataForParticularReport.selected_entity_type) {
      errorMessage = "Please select User/Group or File/Folder."
      valid = false
    }
    else if (copyFinalInputObj.report_type && (['Inactive','EmptyGSuiteGroup', 'EmptySlackChannel'].indexOf(copyFinalInputObj.report_type) < 0) && !copyFinalInputObj.selected_entity && !populatedDataForParticularReport.selected_entity) {
      errorMessage = "Please select the entity "
      valid = false
    }
    else if (!copyFinalInputObj.receivers && !populatedDataForParticularReport.receivers) {
      errorMessage = "Please enter an email address."
      valid = false
    }



    if (valid && this.props.formType === 'modify_report') {
      success = true
      this.props.updateScheduledReport(populatedDataForParticularReport)
      this.props.close()
    }
    else if (valid && this.props.formType === 'create_report') {
      if(copyFinalInputObj['frequency'] === undefined){
        copyFinalInputObj.frequency = "cron(0 10 1 * ? *)"
      }
      if(['Inactive','EmptyGSuiteGroup', 'EmptySlackChannel'].indexOf(copyFinalInputObj["report_type"]) >= 0){
        copyFinalInputObj.selected_entity = ""
        copyFinalInputObj.selected_entity_type = ""
        copyFinalInputObj.selected_entity_name = ""
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
    if(key === 'report_type'){
      copyFinalReportObj['selected_entity'] = ""
      if(['Inactive','EmptyGSuiteGroup', 'EmptySlackChannel'].indexOf(value) < 0){
        copyFinalReportObj['selected_entity_type'] = "user"
      } else{
        copyFinalReportObj['selected_entity_type'] = value
      } 
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


    if (key === 'selected_entity_type'|| key === 'report_type') {
      if (Object.keys(this.state.reportDataForReportId).length > 0) {
        var reportsMapcopy = {}
        Object.assign(reportsMapcopy, this.state.reportDataForReportId)
        reportsMapcopy['selected_entity'] = "";
        this.setState({
          reportDataForReportId: reportsMapcopy
        })
      }
    }

    this.setState({
      finalReportObj: copyFinalReportObj,
      value: value
    })
  }



  render() {

    //let user = this.props.rowData
    //const { value } = this.state
    
    var report_type = this.state.finalReportObj['report_type'] || this.props.reportsMap['report_type']
    var formRadio =  ['Inactive','EmptyGSuiteGroup', 'EmptySlackChannel'].indexOf(report_type) < 0  ?
    (report_type != 'Activity' ? (<Form.Group inline>
    <Form.Radio label='File/Folder' value='resource'
      checked={( this.state.finalReportObj['selected_entity_type'] || this.handleMultipleOptions('selected_entity_type'))
         === 'resource'}
      onChange={(e, data) => this.onChangeReportInput('selected_entity_type', data.value)}
    />
    <Form.Radio label='Group/User' value='user'
        checked={((this.state.finalReportObj['selected_entity_type'] ||  
        this.handleMultipleOptions('selected_entity_type')) == 'user')}
        onChange={(e, data) => this.onChangeReportInput('selected_entity_type', data.value)}
      />
    </Form.Group>):<span>Group/User</span> ) : null 

  var reportTypeForm = ['EmptyGSuiteGroup','EmptySlackChannel'].indexOf(this.handleMultipleOptions('report_type')) >= 0 ?
      <Form.Input 
      defaultValue={this.handleMultipleOptions('report_type')} /> :
      <Form.Select id='reportType' onChange={(e, data) => this.onChangeReportInput('report_type', data.value)}
      label='Report Type' options={reportOptions} placeholder='Report Type'
      defaultValue={this.handleMultipleOptions('report_type')} />


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

                {reportTypeForm}
                {/* <Form.Input onChange={(e) => this.onChangeReportInput('receivers', e.target.value)}
                  label='Email To' placeholder='Email To' control={Input}
                  defaultValue={this.props.reportsMap['receivers']} /> */}
                <Form.Field><label>Email To</label><GroupSearch emailToBox={true} onChangeReportInput={this.onChangeReportInput} defaultValue={this.props.reportsMap['receivers']} /></Form.Field>
              </div>

            </div>
            <div className="column">
              <Form.Field>
                <Checkbox onChange={(e, data) => this.onChangeReportInput('is_active', data.checked)} label='IsActive' width={2}
                checked={ 'is_active' in this.state.finalReportObj ? this.state.finalReportObj['is_active']: this.props.reportsMap['is_active']} />
              </Form.Field>
              <Form.Field >
                <ReactCron ref='reactCron' stateSetHandler={this.onChangeReportInput}
                  formType={this.props.formType} defaultCronVal={this.props.reportsMap['frequency']} />
              </Form.Field>{ formRadio }
              {(this.state.finalReportObj['selected_entity_type'] || 
                  this.handleMultipleOptions('selected_entity_type')) === 'user' ?
                (<Form.Field><GroupSearch emailToBox={false} onChangeReportInput={this.onChangeReportInput}
                  defaultValue={this.state.reportDataForReportId['selected_entity']} />
                </Form.Field>) : (this.state.finalReportObj['selected_entity_type'] || 
                this.handleMultipleOptions('selected_entity_type') ) === 'resource' ?
                (<Form.Field ><ResourceSearch onChangeReportInput={this.onChangeReportInput}
                  defaultValue={this.state.reportDataForReportId['selected_entity']} /></Form.Field>) : null}
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
