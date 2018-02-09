import React, { Component, PropTypes } from 'react';
// import '../../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import {Card, Button, Form, Header, Modal, Checkbox, Input} from 'semantic-ui-react'
import ReactCron from '../../reactCron/index'
import { connect } from 'react-redux';
import ReportForm from './ReportForm';
import ReportView from './ReportView'

import {
  REPORTS_PAGE_LOADED,
  REPORTS_PAGE_UNLOADED
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    appName: state.common.appName,
    currentUser: state.common.currentUser,
    ...state.reports
  });

  const mapDispatchToProps = dispatch => ({

  });

class Reports extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      reportName: '',
      reportDescription: '',
      emailTo: '',
      value:{},
      cronExpression: ''
    }
  }

  reportForm = () => {
    this.setState({
      showModal: true
    })
  }

  handleClose = () => {
    this.setState({
      showModal: false
    })
  }


  render() {
    console.log("scheduledReport : ", this.props.scheduledReport)
    const { value } = this.state
    if (this.props.currentUser){
      return(
        <div>
          <Card.Group>
          {
            this.props.scheduledReport?
                <ReportView report={this.props.scheduledReport} />
              : null }

            <ReportForm showModal={this.state.showModal} close={this.handleClose} />
              <Card>
                <Card.Content>
                  <Card.Description>
                    Click on Add Report to create new report
                        </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <div className='ui buttons'>
                    <Button basic color='green' onClick={this.reportForm}>Add Report</Button>
                  </div>
                </Card.Content>
              </Card>
          </Card.Group>
        </div>
      )
    }
    else{
      return (
        <Redirect to="/login" />
    );
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Reports);
