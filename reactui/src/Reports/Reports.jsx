import React, {Component} from 'react';
import { SET_WIDGET_REPORT as setWidgetReport, fetchUserGroupEmailNameMap, SET_METADATA as setMetadata,
  SET_FILTER_SUBMIT as setFilterSubmit, SET_FILTER_INPUT as setFilterInput } from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import {connect} from 'react-redux';
import SearchContent from '../SearchContent';
import { StyleSheet, css } from 'aphrodite/no-important';
import * as Api from './ReportsAPI.js';
import ReportsGrid from '../ReportsGrid';
import PageContent from '../PageContent';
import Button from '../Button';
import Icon from '../Icon';
import PaneToolbar from '../PaneToolbar';
import {colors} from '../designTokens';
import Pane from '../Pane';
import ReportModal from '../ReportModal';
import Modal from '../Modal';
import serializeForm from 'form-serialize';
import escapeRegExp from 'escape-string-regexp';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import ExportCsvButton from '../ExportCsvButton';
import SearchFormContent from '../FilterFormContainer/FilterFormContainer';


const mapDispatchToProps = {
  setWidgetReport,
  fetchUserGroupEmailNameMap,
  setMetadata,
  setFilterSubmit,
  setFilterInput
}

const mapStateToProps = state => ({
  getWidgetReport: () => selectors.getWidgetReport(state),
  getEmailNameMapForUsersourceId:usersourceId=>selectors.getEmailNameMapForUsersourceId(state,usersourceId),
  getActiveResourceListType: () => selectors.getActiveResourceListType(state),
  getMetadata: () => selectors.getMetadata(state),
  getFilterSubmit: () => selectors.getFilterSubmit(state),
  getFilterInput:()=>selectors.getFilterInput(state)
});

const s = StyleSheet.create({
  header: {
    color: 'white',
    textAlign: 'center',
    fontSize: '20px'
  }
})

class Reports extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reportsData: [],
      query: '',
      reports: [],
      userSources: [],
      dataSources: [],
      activeReport: [],
      createdReport: [],
      isCreateReportVisible: false,
      isDialogueVisible: false,
      isDialogueVisibleFilter: false,
      isMessageModalVisible: false,
      formType: '',
      csv: [],
      error: '',
      isLoading:true,
      runnowData: [],
      filterclick: false,
      showSearchBar: false,
      widgetInternalName:'',
      widgetReportInput: {},
      columnNames: ["users_email", "resource_name", "rd_type", "rd_size", "rd_owner_user_id", "rd_exposure", "resource_path"]
    }

  }

  componentWillMount(){
    if (this.props.location.state) {
      this.setState({
        widgetReportInput: {}
      })
      var inputValues = {}
      var auth = this.props.auth;
      var widgetInternalName = this.props.location.state['type'];
      console.log("columnNames  : ", this.state.columnNames)
      inputValues.email = auth.profile.email;
      inputValues.authtoken = auth.profile.authToken;
      inputValues.datasource_id = this.props.location.state['datasourceId'];
      inputValues.usersource_id = this.props.location.state['usersourceId'];
      inputValues.widget_internal_name = widgetInternalName
      inputValues.column_names = this.state.columnNames
      inputValues.event_type = "get_widget_report"

      Api.getWidgetInfo(inputValues).then(response => {
          this.setState({
            reportsData: response,
            widgetInternalName: widgetInternalName,
            widgetReportInput: inputValues
          })
      })
    }
  }

  componentWillUnmount(){
    this.props.setFilterSubmit(false)
    this.props.setFilterInput({})

  }

  componentWillReceiveProps(nextProps){
    this.setIsDialogueVisibleFilter(false,'')
  }

  componentDidMount() {
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    this.props.fetchUserGroupEmailNameMap(email, authToken);
    Api.getAll(email, authToken).then((reports) => {

      this.setState({reports})

      reports.map((r) => {
        return r;
      })

    })

    Api.getDataSources(email, authToken).then((dataSources) => {
      this.setState({dataSources})
    })

    Api.getUserSources(email, authToken).then((userSources) => {
      this.setState({userSources})
    })

  }

  getAllReports(){
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    Api.getAll(email, authToken).then((reports) => {
      this.setState({reports})
    })
  }

  DeleteReport(reportId){
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    if (confirm("Do you want to delete ?") === true) {
      Api.deleteReport(email, reportId, authToken).then((reports) => {
          this.setState({reports})
      })
    }else {
      this.getAllReports()
    }
  }

  CreateReportFormAPI(report) {
    Api.create(report).then(report => {
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
      return key;
    })

    Api.create(formValues).then(reports =>
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

  modalCloseFilter = () =>{

    this.setIsDialogueVisibleFilter(false,'')

  }

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
    Api.create_runnow(formValues).then(response=> {
      this.setState({csv: response[0] , isLoading:false, runnowData: response})
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
    this.setState({isCreateSuccessVisible: false})
    // e.preventDefault()
  }
  onEditClick = (e) =>{
    if(e===''){
        this.setFormType('create')
    }
    else{
        this.setFormType('modify')
    }

    this.setIsDialogueVisible(true,e);

  }
  setFormType = (e) => {
    this.setState((formType) => ({
      formType: e
    }))
  }

  getFormType = () =>{
    return this.state.formType
  }

  setIsDialogueVisible = (e,report) => {
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
    this.setIsMessageModalVisible(true)
    setTimeout(this.setIsMessageModalVisible(false), 1000)
  }


  report_type = (report) => {

     if(report=== 'activity_log'){
       return <div className='style-icon-logs' title='Activity Log Report'></div>
     }
     else if (report=== 'access_perms') {
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

    else if(source==='Group') {
      return <div className='style-icon-group' title='Group'>
      </div>
    }
  }
  registerDashboardApi = api => {
    this.registerDashboardApi = api;
  }
  onBtExport = () => {
    var report_input = {}
    if(this.props.getFilterSubmit() === true){
      Object.assign(report_input, this.props.getFilterInput())
      console.log("report_input: filter ", report_input)
      report_input["flag"] = "filter_report"
    }else {
      report_input = this.state.widgetReportInput
      report_input["flag"] = "widget_report"
    }
    report_input["display_names"] = {
      "users_email": "Shared To Email",
      "resource_name": "File Name",
      "rd_type": "File Type",
      "rd_size": "Size",
      "rd_owner_user_id": "Owner",
      "rd_exposure": "File Exposure",
      "resource_path": "File Path"
    }
    report_input["event_type"] = "generate_csv_report"
    console.log("report_input : ", report_input)
    Api.getCsvReportUrl(report_input).then(response => {
        window.location.assign(response)
    })
    // this.registerDashboardApi.exportDataAsCsv();
  }

  setIsDialogueVisibleFilter = (e,data) => {
    this.setState({
      isDialogueVisibleFilter: e
    })
  }

  onEditClickFilter = (e) => {
    if(e === "filter-form") {
      this.setIsDialogueVisibleFilter(true,e)
    }
    this.setState({
      filterclick: true,
      showSearchBar: true
    })
  }

  getIsDialogueVisibleFilter = () => {
    return this.state.isDialogueVisibleFilter
  }

  render() {

     let filtermodalcontent =  <SearchFormContent
      showSearchBar = {this.state.showSearchBar}
      auth = {this.props.auth}
      filterclick = {this.state.filterclick}
      widgetName = {this.state.widgetInternalName}
      // showSearchForm = {this.showSearchForm}
     />

    let filterform = (this.state.filterclick === true)?
         <Modal
           isVisible={this.getIsDialogueVisibleFilter()}
           onClose={() => this.modalCloseFilter()}
           hideTitle={true}
           isExpanded={true}
           footerContent={false}
           filterclick = {this.state.filterclick}
           >
           {filtermodalcontent}
         </Modal>
    :''

    let exportdivDashboard = (this.state.reportsData != 0)?
    <ExportCsvButton onBtExport={this.onBtExport} getActiveResourceListType={this.props.getActiveResourceListType}/>: '';
    if(this.props.getFilterSubmit() === true){
         return (
           <div>
             <PageContent isOneBlock={true}>
               <ReportsGrid
                 ref="SearchContent"
                 reportsData={this.props.getMetadata()}
                 onBtExport={this.onBtExport}
                 registerDashboardApi={this.registerDashboardApi}
                 metadata = {this.props.getMetadata()}
                 displayNames = {this.state.displayNames}

               />
           </PageContent>
           {exportdivDashboard}
           <div className="filter" onClick={() => this.onEditClickFilter('filter-form')}>Filter</div>
           {filterform}
         </div>
       )
       }


    if (this.props.getWidgetReport() === true) {

      return (
        <div>
          <PageContent isOneBlock={true}>
            <ReportsGrid
              ref="SearchContent"
              reportsData={this.state.reportsData}
              onBtExport={this.onBtExport}
              registerDashboardApi={this.registerDashboardApi}
              displayNames = {this.state.displayNames}
            />
        </PageContent>
        {exportdivDashboard}
        <div className="filter" onClick={() => this.onEditClickFilter('filter-form')}>Filter</div>
        {filterform}
        </div>
      );
    }

    const createButton = <Button isPrimary={true} size='s' label="Create Report" onClick={() => this.onEditClick('')}/>

    const toolbar = <PaneToolbar isActive={true} leftCol={[<h3>Scheduled Reports</h3>]} rightCol={[createButton]} />;


    const { query, reports } = this.state

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

    return(
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
  );
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Reports);
