import React, { Component, PropTypes } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import {Card, Button, Form, Header, Modal, Checkbox, Input} from 'semantic-ui-react'
import ReactCron from '../../reactCron/index'
import { connect } from 'react-redux';
import UsersTree from '../Users/UsersTree';
import ResourceTree from '../Resources/ResourcesTree';
import agent from '../../utils/agent';
import * as Helper from '../../reactCron/helpers/index';

import {
  CREATE_SCHEDULED_REPORT
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.reports
  });

const mapDispatchToProps = dispatch => ({
    addScheduledReport: (report) => {
      dispatch({ type: CREATE_SCHEDULED_REPORT, payload: agent.Scheduled_Report.createReport(report) })
    }
  });

const reportOptions = [
{  text: 'Access Permission Report', value: 'Permission' },
{  text: 'Activity Log Report', value: 'Activity' },
]

class ReportForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reportName: '',
      reportDescription: '',
      emailTo: '',
      value:{},
      cronExpression: '',
      IsActive: true,
      reportType: ''
    }
  }


  handleCreateButton(evt) {
    evt.preventDefault()
    this.closeModal();
  }

  getCronValue = () => {
    const cronValue = this.refs.reactCron.__value;
  }

  handleChange = (e, { value }) => this.setState({value })
  submit = () => {
    // if(this.state.reportName == ''){
    //   this.setState({
    //     error:true,
    //     reportNameError: true
    //   })
    // }
    var config = {'report_type':this.state.reportType, "selected_entity":this.state.value, "selected_entity_Type":""}
    var reportData = {"name":this.state.reportName, "description":this.state.reportDescription, "config":config,
                  "frequency":"cron(" + this.state.cronExpression + ")", "receivers":this.state.emailTo, "isactive": this.state.IsActive}

    this.props.addScheduledReport(reportData)
    this.props.close()
  }

  stateSetHandler = (data) => {
      this.setState({
        cronExpression: data
      })
  }


  render() {

    const { value } = this.state
    return(
      <div>
        <Modal className="scrolling"
         open={this.props.showModal}>
          <Modal.Content>
              <Form onSubmit={this.submit}>
              <div class="ui two column very relaxed grid">
                <div class="column">
                  <div class="ui form">
                      <Form.Field>
                        <Checkbox onChange={(e, data) => this.setState({isActive: data.checked})} label='IsActive' width={2}/>
                      </Form.Field>
                      <Form.Input onChange={(e) => this.setState({reportName: e.target.value})}
                      label='Name' placeholder='Name' />
                      <Form.Input onChange={(e) => this.setState({reportDescription: e.target.value})} label='Description' placeholder='Description'  />
                      <Form.Select  id='reportType' onChange={(e, data) => this.setState({reportType: data.value})} label='Report Type' options={reportOptions} placeholder='Report Type' />
                      <Form.Input onChange={(e) => this.setState({emailTo: e.target.value})}
                      label='Email To' placeholder='Email To' control={Input} />
                      <Form.Field >
                        <ReactCron ref='reactCron' stateSetHandler ={this.stateSetHandler} />
                      </Form.Field>
                  </div>
                </div>

                <div class="column">
                    <Form.Group inline>
                      <Form.Radio label='File/Folder' value='resource' checked={value === 'resource'} onChange={this.handleChange} />
                      <Form.Radio label='Group/User' value='group' checked={value === 'group'} onChange={this.handleChange} />
                    </Form.Group>
                    {this.state.value == 'group'?
                       <Form.Field ><UsersTree /></Form.Field> : null}
                       {this.state.value == 'resource'? <Form.Field ><ResourceTree /></Form.Field> : null}
                </div>
              </div>

              </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.props.close}>Close</Button>
            <Button content="Submit" onClick={this.submit} />
          </Modal.Actions>
        </Modal>
     </div>
   )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReportForm);
