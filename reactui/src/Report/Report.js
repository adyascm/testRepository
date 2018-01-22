import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '../Button';
import Icon from '../Icon';
import * as ScheduleReportsAPI from './utils/ScheduleReportsAPI';
import PaneToolbar from '../PaneToolbar';
import PageContent from '../PageContent';
import Pane from '../Pane';

import ReportModal from '../ReportModal';
import Modal from '../Modal';
import serializeForm from 'form-serialize';
import escapeRegExp from 'escape-string-regexp';

import {
  fetchUserGroupEmailNameMap
} from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';

const mapStateToProps = state => ({
  getEmailNameMapForUsersourceId:usersourceId=>selectors.getEmailNameMapForUsersourceId(state,usersourceId)

});

const mapDispatchToProps = {

  fetchUserGroupEmailNameMap

};
// const s = StyleSheet.create({
//   body: {
//     margin: '0',
//     padding: '0',
//     fontFamily: 'sans-serif',
//     lineHeight: '1.5',
//   },
//   big-font: {
//     fontSize: '1.2em',
//   },
//   closeCreateReport: {
//     display: 'block',
//     width: '60px',
//     height: '60px',
//     backgroundImage: 'url('./icons/arrow-back.svg')',
//     backgroundPosition: 'center',
//     backgroundRepeat: 'no-repeat',
//     backgroundSize: '30px',
//     fontSize: '0',
//   },
//   createReportForm: {
//     backgroundColor: '#1f232c',
//     width: '500px',
//     height: '600px',
//     padding: '25px',
//     marginTop: '10px',
//     marginLeft: '350px',
//     marginRight: '350px',
//   }
//
//   createReportDetails: {
//     marginLeft: '10px',
//     marginRight: '10px',
//     marginTop: '20px',
//     height: '30px',
//     float:'left',
//   }
//
//   createReportDetailsPadding: {
//     padding: '10px 10px 10px 10px',
//   }
//
//   createReportDetailsPaddingWeekdays: {
//     padding: '40px 10px 10px 98px',
//   }
//
//   createReportDetailsLabel: {
//     marginTop: 'inherit',
//     width: '20%',
//     float: 'left',
//
//     /*font-size: 20px;*/
//   }
//report
//   createReportDetailsInput: {
//     marginTop: 'inherit',
//     width: '70%',report
//     height: 'inherit',
//     /*font-size: inherit;*/
//
//     background: 'transparent',
//     backgroundColor: '#000000',
//
//     border: 'solid 0.5px #979797',
//     borderBottom: '1px solid #ccc',
//   }
//
//
//   createReportDetailsSelect: {
//     marginTop: 'inherit',
//     width: '70%',
//     height: 'inherit',
//     /*font-size: inherit;*/
//
//     background: 'transparent',
//     backgroundColor: '#000000',
//
//     border: '1px solid #979797',
//     borderBottom: '1px solid #ccc',
//   }
//
//   createReportDetailsButton: {
//     marginTop: 'inherit',
//     padding: '10px',
//     background: '#123456',
//     fontSize: 'inherit',
//     width: '150px',
//     height: '35px',
//     marginTop: '20%',
//
//   }
//   listReports: {
//     paddingTop: '40px',
//   }
//   listReportsTop: {
//     position: 'fixed',
//     left: '12px',
//     width: '1300px',
//     top: '100px',
//     padding: '5px 5px 0px 0px',
//     borderBottom: '1px solid #424242',
//     /*display: flex;*/
//     height: '30px',
//   }
//
//   searchReports: {
//     width: '100%',
//     padding: '0px 0px 0px 20px',
//     backgroundImage: 'url('./icons/search.svg')',
//     backgroundRepeat: 'no-repeat',
//     /*background-position: bottom 0px left 30px;*/
//     backgroundSize: '1.2em',
//     fontSize: '0.9em',
//     border: '0',
//     outline: 'none',
//   }
//
//   addReport: {report
//     display: 'block',
//     width: '73px',
//     background: 'white',
//     backgroundImage: url('./icons/person-add.svg'),
//     backgroundRepeat: 'no-repeat',
//     backgroundPosition: 'center',
//     backgroundSize: '28px',
//     fontSize: '0',report
//   }
//
//   showingReports: {
//     textAlign: 'center',
//     margin: '20px 0',
//   }
//   showingReportsButton: {
//     color: 'blue',
//     background: 'transparent',
//     border: 'none',report
//     cursor: 'pointer',
//     fontSize: 'inherit',
//   }
//
//   /*@media (min-width: 600px) {
//     .report-list-item {
//       margin: 20px;
//       border: 1px solid #1f232c;
//       border-radius: 4px;
//     }
//   }*/
//
//   report: {
//     background: '#32363f',
//     /*padding-top: 10px;*/
//     minWidth: '250px',
//     borderRadius: '10px',
//     boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
//   }
//
//   reportDetails: {
//     fontSize: '0.8em',
//     padding: '0px 10px 5px 10px',
//
//   }
//
//   frequency: {
//     fontSize: '1.2em',
//     fontWeight: 'bold',
//   }
//
//   reports: {
//
//   }
//
//   reportTitle: {
//     borderTopLeftadRius: '10px',
//     borderTopRightRadius: '10px',
//     background: '#272c38',
//     padding: '5px 10px 5px 10px',
//     fontSize: '1em',
//     fontWeight: 'bold',
//   }
//
//   reportsGrid: {
//     listStyleType: 'none',
//     padding: '0px 0 0 10px',
//     margin: '0',
//
//     display: 'flex',
//     flexWrap: 'wrap',
//     alignItems: 'baseline',
//   }
//   reportsGridLi: {
//     padding: '15px 20px 0 0',
//     textAlign: 'left',
//   }
//
//   reportListItem: {
//     padding: '15px 20px 0report 0',
//     textAlign: 'left',
//   }
//   reportEmailList: {
//     borderLeft: '1px solid #3f3f4b',
//     paddingLeft: '10px',
//     paddingRight: '10px',
//     /*flex: 1 1 0%;*/
//     fontSize: '0.8em',
//   }
//   .report-content{
//     padding-top: 10px;
//     display: flex;
//     min-width: -moz-max-content;
//     padding-bottom: 10px;
//   }
//   .report-change-feature {
//     /*position: absolute;*/
//     right: 40px;
//     /*bottom: -10px;*/
//     width: 15px;
//     height: 15px;
//     /*border-radius: 50%;*/
//     /*background: #3e3f42;*/
//     background-image: url('./icons/down-arrow.svg');
//     background-repeat: no-repeat;
//     background-position: center;
//     background-size: 15px;report
//     /*box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);*/
//     float: right;
//   }
//   .report-change-feature select {
//     width: 100px;
//     height: 100%;
//     opacity: 0;
//     cursor: pointer;
//     background: #3e3f42;
//
//   }
//   .icon{
//     float: right;
//   }
//   .report-change-feature select option {
//     padding: 5px;
//   }
//   /*.calender{
//     background-image: url('./icons/calender.svg');
//   }*/
//
// });

class Report extends Component {

  state = {
    query: '',

    reports: [],
    userSources: [],
    dataSources: [],
    activeReport: [],
    createdReport: [],
    isCreateReportVisible: false,
    isDialogueVisible: false,
    isMessageModalVisible: false,
    formType: '',
    csv: [],
    error: '',
    isLoading:true,
    runnowData: [],
    }

    constructor(props) {
      super(props);
    }

  componentDidMount() {
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    this.props.fetchUserGroupEmailNameMap(email, authToken);
    ScheduleReportsAPI.getAll(email, authToken).then((reports) => {

      this.setState({reports})
      console.log("report ", reports)

      reports.map((r) => {
        console.log(r)
        return r;
      })

    })

    ScheduleReportsAPI.getDataSources(email, authToken).then((dataSources) => {
      this.setState({dataSources})
    })

    ScheduleReportsAPI.getUserSources(email, authToken).then((userSources) => {
      this.setState({userSources})
    })

  }

  getAllReports(){
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    ScheduleReportsAPI.getAll(email, authToken).then((reports) => {
      console.log("getalll " , reports)
      this.setState({reports})
    })
  }

  DeleteReport(reportId){
    console.log(reportId)
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    if (confirm("Do you want to delete ?") === true) {
      ScheduleReportsAPI.deleteReport(email, reportId, authToken).then((reports) => {
          this.setState({reports})
      })
    }else {
      this.getAllReports()
    }
  }

  CreateReportFormAPI(report) {
    console.log("api start")
    ScheduleReportsAPI.create(report).then(report => {
      console.log(report.errorType)
      if(report.errorType === "Exception" ){
        alert("Failure in Report creation. Please try again later")
        this.getAllReports()
        // console.log(this.prevstate.reports)
        // this.setState(state => ({
        //   reports: state.reports
        // }))
      }else{
      alert("Report Created SuccessFully")
      this.setState(state => ({
        reports: state.reports.concat([ report ])
      }))
    }
    })
  }



  updateQuery = (query) => {
    this.setState({ query: query.trim() })
  }

  clearQuery = () => {
    this.setState({ query: '' })
  }

  displayFreqLabel = (freq, dayOfWeek,dayOfMonth) => {


    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    let freqLabel = "";
    let weeks = "";
    if (freq === "DAILY") {
      freqLabel = "Daily"
  	} else if (freq==="WEEKLY") {
      freqLabel = "Weekly on " ;
      if (typeof dayOfWeek === 'string'){
        weeks =  dayOfWeek.split(",");
        console.log(":weeks:weeks ", weeks);
        weeks.map((week) =>(
            freqLabel = freqLabel + " " + weekdays[parseInt(week, 10)] + ","
        ))
        freqLabel = freqLabel.slice(0,-1)
      }
      else{
        freqLabel += weekdays[dayOfWeek]
      }
      // weeks =  dayOfWeek.split(",");
      // weeks.map((week) =>(
      //     freqLabel = freqLabel + "," + weekdays[parseInt(week)]
      // ))
  	  // freqLabel = "Weekly on " + weekdays[parseInt(dayOfWeek)];
  	} else if (freq === "MONTHLY"){
      freqLabel = "Monthly on " + dayOfMonth ;
    }
  	return freqLabel;
  }

  onCreateReportButtonClick = () => {
    this.setState({isCreateReportVisible: true})

  }

  handleSubmit = (e) => {
    const auth = this.props.auth
    const formValues = serializeForm(e.target, { hash: true })
    formValues.email = auth.profile.email
    formValues.authtoken = auth.profile.authToken
    formValues.event_type = "create_report"
    Object.keys(formValues).map((key) => {
      console.log(key)
      return key;
    })

    ScheduleReportsAPI.create(formValues).then(reports =>
      {if(reports.errorType === "Exception" ){
        alert("Failure in Report creation. Please try again later: " + reports.errorMessage)
        this.getAllReports()
      }else{

        //alert("Success in creating report")
        this.setState({ reports })

      }}

    )
    this.setIsDialogueVisible(false,'')
    e.preventDefault();

    // this.CreateReportFormAPI(formValues)
    this.setState({isCreateReportVisible: false})
      e.preventDefault()
  }
  modalClose = () =>{
    this.getAllReports()
    this.setState({
      csv: [],
      isLoading : true
    })
    this.setIsDialogueVisible(false,this.getActiveReport())

  }
  // submit_runnow = (e) => {
  //   e.preventDefault();
  //   console.log("submit runnow")
  //   var getEmailVal = serializeForm(e.target, {hash: true})
  //   console.log("run_now form email values", getEmailVal);
  //   console.log("run_now form eeeee ", e);
  // }
  runReport = (e) =>{
    const auth = this.props.auth
    // let csv_temp =[]
    const formValues = {}
    // let table_string = ""
    // let values = ""
    formValues.email = auth.profile.email
    formValues.authtoken = auth.profile.authToken
    formValues.report_run_context = "report_ui_context"
    formValues.report_type = e[9]
    formValues.source_id = e[4]
    formValues.report_name = e[1]
    formValues.query_frequency = "One time"
    formValues.event_type = "reports_controller"
    formValues.is_limit = "true"

    if(e[4]=== "File"){
      formValues.resource_path = e[5]
    }
    else if(e[4]==="User"){
        formValues.user_id = e[5]
    }
    else if (e[4]==="Group") {
      formValues.group_id = e[5]
    }
    formValues.reportId = e[0]
    formValues.datasource_id = e[7]
    console.log("formValues ", formValues)
    console.log("e-vals ", e)
    ScheduleReportsAPI.create_runnow(formValues).then(response=> {
      console.log("run now response: ", response)
      this.setState({csv: response[0] , isLoading:false, runnowData: response})
      console.log("setState: csv: ", this.state.csv)
      console.log("setState: runnowData: ", this.state.runnowData)

    })

    this.setState((formType) => ({
      formType: "run_now"
    })
    )
    this.setState((activeReport) => ({
      activeReport: e
    })
    )
    this.setState({isDialogueVisible: e})

  }

    returnBack = (e) => {
    console.log("success")
    this.setState({isCreateSuccessVisible: false})
    // e.preventDefault()
  }
  onEditClick = (e) =>{
    console.log(e);
    if(e===''){
        this.setFormType('create')
    } else{
        this.setFormType('modify')
    }

    this.setIsDialogueVisible(true,e);

  }
  setFormType = (e) => {
    console.log(e);
    this.setState((formType) => ({
      formType: e
    }))
  }

  getFormType = () =>{
    console.log(this.state.formType)
    return this.state.formType
  }

  setIsDialogueVisible = (e,report) => {
    console.log(e);
    console.log(report);
    this.setState({isDialogueVisible: e})
    this.setState((activeReport) => ({
      activeReport: report
    }))
  }

  getIsDialogueVisible = () => {

    return this.state.isDialogueVisible
  }

  getActiveReport = () => {

    return this.state.activeReport
  }

  setIsMessageModalVisible = (e) => {
    this.setState({isMessageModalVisible: e})
  }

  getIsMessageModalVisible = () => {
    return this.state.isMessageModalVisible
  }

  handleSuccess = () => {
    console.log("Report created successfully, Hello")
    this.setIsMessageModalVisible(true)
    setTimeout(this.setIsMessageModalVisible(false), 1000)
  }



//   changeActions = (e,report) => {
//       console.log(report);
//      console.log("inside changeActions");
//      console.log(e);
//     switch (e.target.value) {
//     case "runnow":
//         this.runReport(report);
//         break;
//     case "modify":
//         this.onEditClick(report);
//         break;
//     case "delete":
//         this.DeleteReport(report[0]);
//         break;

// }
//     // alert(e.target.value)
//   }
  report_type = (report) => {
    console.log(report)

     if(report=== 'activity_log'){
       return <div className='style-icon-logs' title='Activity Log Report'></div>
     }
     else if (report=== 'access_perms') {
       //console.log("perms")
       return <div className='style-icon-perms' title='Access Permissions Report'></div>
     }
  }

  source_type = (source) => {

    if(source==='File'){
      return <div className='style-icon-file' title='File'></div>
    }
    else if(source==='User') {

      return <div className='style-icon-user' title='User'></div>
    }
    // else if(source==='Folder') {

    //   return <div className='style-icon-folder' title='Folder'>
    //   </div>
    // }
    else if(source==='Group') {
      console.log("Hello World!")
      return <div className='style-icon-group' title='Group'>
      </div>
    }
  }

  render() {

    const createButton = <Button isPrimary={true} size='s' label="Create Report" onClick={() => this.onEditClick('')}/>

    const toolbar = <PaneToolbar isActive={true} leftCol={[<h3>Scheduled Reports</h3>]} rightCol={[createButton]} />;


    const { query, reports } = this.state
    console.log("showingReports, ", this.state.reports);

    const showEmailCount = 3;
    let showingReports = []
    if (query) {
      const match = new RegExp(escapeRegExp(query), 'i')
      showingReports = reports.filter((report) => match.test(report))

    }
    else if (query) {
      const match = new RegExp(escapeRegExp(query), 'i')
      showingReports = reports.filter((report) => match.test(report[9]))
    }
    else {
      showingReports = reports
    }


    return (
      <div>
      <PageContent isOneBlock={true}>
        <Pane isFullHeight={true} toolbar={toolbar}>
       <div className='list-reports'>
        <div className='list-reports-top'>
          <input
            className='search-reports'
            type='text'
            placeholder='Search reports'
            value={query}
            onChange={(event) => this.updateQuery(event.target.value)}
          />
        </div>
        {showingReports.length !== reports.length && (
          <div className='showing-reports'>
            <span>{showingReports.length} of {reports.length} total</span>
            <button onClick={this.clearQuery}>Show all</button>
          </div>
        )}

        <ol className='reports-grid'>
          {showingReports.map((report) => (
            <li key={report[0]}>
              <div className='report'>
                <div className='report-header'>
                  <div className='report-title'>{this.report_type(report[9])}{report[1]}</div>
                  <div className="report-menu">
                    {report[10] === 1 ?
                        <div className='style-icon-active' title='Active'></div>
                      : <div className='style-icon-inactive' title='Inactive'></div>
                    }
                    <div>

                      <div className="dropdown">
                        <div className="dropbtn"></div>
                        <div className="dropdown-content">
                          <a value="modify" onClick={() => this.onEditClick(report)}><Icon name='pencil' size='xs' title='Edit this report'/><span>&emsp;Edit</span></a>
                          <a value="delete" onClick={() => this.DeleteReport(report[0])}><Icon name='trashcan' size='xs' title='Delete this report'/><span>&emsp;Delete</span></a>
                          <a value="run_now" onClick={() => this.runReport(report)}>Run Now</a>

                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                <div className='report-content'>
                <div className='report-details'>
                  <div className='report-details-item'>
                    <div className='style-icon-calender' title='Schedule'></div>
                    <div className='report-details-text'>
                      {this.displayFreqLabel(report[2], report[3],report[8])}
                    </div>
                  </div>

                  <div className='report-details-item'>
                    {this.source_type(report[4])}
                    <div className='report-details-text'>{" "+ report[5]}</div>
                  </div>
                  <div className='report-details-item'>
                    <div className='style-icon-lastrun' title='Time when the report was last run'></div>
                    <div className='report-details-text'>{report[11] ? report[11] : "Never run"}</div>
                  </div>

                </div>

                <div className="report-email-list">
                  <div className='style-icon-email' title='Email'></div>
                  <div className='report-details-text' >
                    {report[6].split(",").slice(0, showEmailCount).map((email, index) => (

                      <div key={index}>{email}</div>
                    ))}
                    {
                      report[6].split(",").length > showEmailCount && (
                        <div title={report[6].split(',').join('\n')}>and {report[6].split(",").length - showEmailCount} more...</div>
                      )
                    }
                  </div>
                </div>
            </div>
          </div>
        </li>
        ))}
      </ol>
      <ReportModal isVisible={this.getIsDialogueVisible()}
                  handleSuccess={this.handleSuccess}
                  dataSources={this.state.dataSources}
                  userSources={this.state.userSources}
                  reportData={this.getActiveReport()}
                  csvData={this.state.csv}
                  loading={this.state.isLoading}
                  formType={this.getFormType()}
                  handleSubmit={this.handleSubmit}
                  auth={this.props.auth}
                  onClose={() => this.modalClose()}
                  runnowData={this.state.runnowData}
                  getEmailNameMapForUsersourceId={this.props.getEmailNameMapForUsersourceId}
                  />

     <Modal isVisible={this.getIsMessageModalVisible()}
            title="Report Created SuccessFully"/>
    </div>

    </Pane>
</PageContent>

</div>
)


  }


}


export default connect(mapStateToProps, mapDispatchToProps)(Report);
