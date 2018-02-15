import React, { Component, PropTypes } from 'react';
// import '../../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import {Card, Button, Form, Header, Modal, Checkbox, Input} from 'semantic-ui-react'
import ReactCron from '../reactCron/index'
import { connect } from 'react-redux';
import ReportForm from './ReportForm';
import ReportView from './ReportView';
import agent from '../../utils/agent';
// import ReportsGrid from './ReportsGrid';

import {
  REPORTS_PAGE_LOADED,
  REPORTS_PAGE_UNLOADED,
  SET_SCHEDULED_REPORTS,
  CREATE_SCHEDULED_REPORT,
  RUN_SCHEDULED_REPORT
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
    }
    // onLoad: () => {
    //   dispatch({ type: GET_SCHEDULED_REPORTS, payload: agent.Scheduled_Report.getReports()})
    // }

  });

class Reports extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      reportsData: {},
      fetchScheduledReport: false
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
      showModal: true
    })
  }

  handleClose = () => {
    this.setState({
      showModal: false
    })
  }

  deleteReport = (reportId) => ev => {
    ev.preventDefault();
    agent.Scheduled_Report.deleteReport(reportId).then(res => {
      this.props.setreports(agent.Scheduled_Report.getReports())
    });
  }

  runReport = (reportId) => ev => {
   this.props.runScheduledReport(reportId)

  }


  componentWillReceiveProps(nextProps){

    if(nextProps.scheduledReport !== undefined && !this.state.fetchScheduledReport){
      this.setState({
        fetchScheduledReport: true
      })
      nextProps.setreports(agent.Scheduled_Report.getReports())
    }
  }


  render() {
    if(this.props.runReportData){
      console.log("run report data : ", this.props.runReportData)
      // return(
      //   <ReportsGrid reportsData={this.props.runReportData}/>
      // )


    }



    if (this.props.currentUser){
      return(
        <div>

          <ReportView report={this.props.reports} deleteReport={this.deleteReport}
            reportForm={this.reportForm} runReport={this.runReport} />
          <ReportForm showModal={this.state.showModal} close={this.handleClose} showrecent={this.showrecent}/>

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
