import React, { Component, PropTypes } from 'react';
// import '../../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import {Icon, Card, Button, Form, Header, Modal, Checkbox, Input, Loader, Dimmer, Container} from 'semantic-ui-react'
import ReactCron from '../reactCron/index'
import { connect } from 'react-redux';
import ReportForm from './ReportForm';
import ReportView from './ReportView';
import agent from '../../utils/agent';
import ReportsGrid from './ReportsGrid';
import Immutable from 'immutable'

import {
  REPORTS_PAGE_LOADED,
  REPORTS_PAGE_UNLOADED,
  SET_SCHEDULED_REPORTS,
  CREATE_SCHEDULED_REPORT,
  RUN_SCHEDULED_REPORT,
  DELETE_OLD_SCHEDULED_REPORT
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    appName: state.common.appName,
    currentUser: state.common.currentUser,
    ...state.reports
  });

  const mapDispatchToProps = dispatch => ({
    setreports: (reports) =>
      dispatch({ type: SET_SCHEDULED_REPORTS, payload: reports }),
    addScheduledReport: (report) => {
        dispatch({ type: CREATE_SCHEDULED_REPORT, payload: agent.Scheduled_Report.createReport(report) })
      },
    runScheduledReport: (reportId) => {
      dispatch({type:RUN_SCHEDULED_REPORT, payload: agent.Scheduled_Report.getRunReportData(reportId)})
    },
    deleteOldRunReportData: () => {
      dispatch({type:DELETE_OLD_SCHEDULED_REPORT })
    }

  });

class Reports extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      reportsData: {},
      fetchScheduledReport: false,
      isRunreport: false,
      runReportName: '',
      reportFormData: [],
      processedReportsData: {},
      processreport: false,
      formType: '',
      reportDataForReportId: {},
      reportType: ''
    }
  }

  componentWillMount(){
    this.props.setreports(agent.Scheduled_Report.getReports())
    this.setState({
        reportsData: this.props.reports
    })

    //
  }


  reportForm = () => {
    this.setState({
      showModal: true,
      formType: 'create_report'
    })
  }

  handleClose = () => {
    this.setState({
      showModal: false,
      isRunreport: false,
      reportDataForReportId: {}
    })
    this.props.deleteOldRunReportData()
  }

  deleteReport = (reportId) => ev => {
    ev.preventDefault();
    agent.Scheduled_Report.deleteReport(reportId).then(res => {
      this.props.setreports(agent.Scheduled_Report.getReports())
    });
  }

  runReport = (reportId, name, reportType) => ev => {

   this.props.runScheduledReport(reportId)
   this.setState({
     showModal: true,
     isRunreport: true,
     runReportName: name,
     reportType: reportType
   })

  }

  modifyReport = (reportId) => ev => {
    var reportDataForReportId = this.props.reports[reportId]
     this.setState({
       showModal: true,
       formType: 'modify_report',
       reportDataForReportId: reportDataForReportId
     })

  }


  componentWillReceiveProps(nextProps){

    if(nextProps.scheduledReport !== undefined ){
      this.props.deleteOldRunReportData()
      nextProps.setreports(agent.Scheduled_Report.getReports())
    }
  }


  render() {

    if (this.props.currentUser){
      return(
        <div>
          <ReportView report={this.props.reports} deleteReport={this.deleteReport}
            reportForm={this.reportForm} runReport={this.runReport} modifyReport={this.modifyReport}
            getReportError = {this.props.getreportError}/>
          {this.state.showModal === true?
            this.state.isRunreport ?
                this.props.runReportData ?
                    <Modal size='large' className="scrolling" open={this.state.showModal} >
                     <Modal.Header>{this.state.runReportName}</Modal.Header>
                      <Modal.Content>
                        <ReportsGrid reportsData={this.props.runReportData}
                          reportType={this.state.reportType} runReportName={this.state.runReportName}/>
                      </Modal.Content>
                      <Modal.Actions>
                        <Button basic color='red' onClick={this.handleClose}>
                          <Icon name='remove' /> Close
                        </Button>
                     </Modal.Actions>
                    </Modal>
                 :
                    this.props.runReportData && this.props.runReportData.length === 0 ?
                        <Modal className="scrolling"
                         open={this.state.showModal} >
                         <Modal.Header>{this.state.runReportName}</Modal.Header>
                          <Modal.Content>
                           No Data Found
                          </Modal.Content>
                          <Modal.Actions>
                            <Button basic color='green' >
                             Export to csv
                            </Button>
                            <Button basic color='red' onClick={this.handleClose}>
                              <Icon name='remove' /> Close
                            </Button>
                         </Modal.Actions>
                        </Modal>
                    :

                      <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                      </Dimmer>

              :

                <ReportForm showModal={this.state.showModal} close={this.handleClose}
                  showrecent={this.showrecent}  reportsMap={this.state.reportDataForReportId}
                  formType={this.state.formType} />

            : null
          }
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
