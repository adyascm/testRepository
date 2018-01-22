import React, { Component } from 'react';
import Modal from '../Modal';
//import Columnizer from '../Columnizer';
import Button from '../Button';
import {colors} from '../designTokens';
//import LoaderBox from '../LoaderBox';
import * as ScheduleReportsAPI from '../Report/utils/ScheduleReportsAPI';
//import { Field, reduxForm } from 'redux-form';
import serializeForm from 'form-serialize';
//import ReportModalData from '../ReportModalData';
//import PaneToolbar from '../PaneToolbar';
import Loader from '../Loader';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-dark.css';



class ReportModal extends Component {
  state={
    showingDS: true,
    reportData: [],
    frequencySelected: "daily",
    isWeeklyHidden: true,
    isMonthlyHidden: true,
    isDailySelected: true,
    isDisabled: true,
    numberOfWeeks: 0,
    isActivityLog: false,
    isEmailValid: false,
    isFrquencySelected: true,
    isFreqChanged :  false,
    values: [],
    selectedSource:"File/Folder Path",
    isSourceChanged: false,
    isDialogueVisible: false,
    formType: '',
    email:[],
    show_textArea: false,
    show_textArea2: false,
    pickerList: [],
    previousPickerParentHistory: ["-"],
    pickerParentHistory: ["root"],
    previousPickerParent: "-",
    pickerParent:"root",
    pickerLabel: "/",
    pickerHoverText: "/",
    previousSource: "-",
    pickerInEditMode: false
  }

  getsourcename =() =>{
    let e = this.refs.sources
    console.log("ref: " + e)
    if( e !== undefined && this.state.reportData !== undefined) {

      let sourceId = e.value;
      console.log("=================sourceId: ", sourceId)
      const auth = this.props.auth
      const authToken = auth.profile.authToken
      const email = auth.profile.email
      const parentId = this.state.pickerParent

      let currentSource = this.state.selectedSource
      console.log("currentSource: " + this.state.selectedSource)
      const previousParentId = this.state.previousPickerParent
      const previousSource = this.state.previousSource
      if((previousParentId !== parentId) || (previousSource !== currentSource)) {
        if((previousSource !== currentSource && (this.state.pickerInEditMode === false))) {
          this.clearPicker()
        }

        this.setState({previousSource: currentSource})
        this.setState({previousPickerParent: parentId})
        let ppph = this.state.previousPickerParentHistory.concat(parentId)
        this.setState({previousPickerParentHistory: ppph})

        if(currentSource === "File/Folder Path") {
          console.log("ppph:", ppph)
          console.log("pph:",this.state.pickerParentHistory)
          console.log("parentId:", parentId)
          this.refs.pickerListDropDown.disabled = true;
          if(this.state.pickerInEditMode === true) {
            console.log("path: ", this.state.pickerHoverText)
            ScheduleReportsAPI.getResourcesForPickerFromPath(email, this.state.pickerHoverText, sourceId, authToken)
              .then((response) => {
                  let list = [["", "", "Please select..."]]
                  list = list.concat(response)
                  this.setState({pickerList: list})
                  console.log("pickerListResponse ", list)
                  this.refs.pickerListDropDown.disabled = false;
              })
          } else {
          ScheduleReportsAPI.getResourcesForPicker(email, parentId, sourceId, authToken)
            .then((response) => {
                let list = [["", "", "Please select..."]]
                list = list.concat(response)
                this.setState({pickerList: list})
                console.log("pickerListResponse ", list)
                this.refs.pickerListDropDown.disabled = false;
            })
          }
        }
        else if(currentSource === "Group Path") {
          let list = [["", "Please select..."]]
          let userGroupNameMap = this.props.getEmailNameMapForUsersourceId(sourceId);
          console.log("userGroupNameMap: ", userGroupNameMap)
          if(userGroupNameMap !== null) {
            for(let item of Object.keys(userGroupNameMap)) {
              console.log("item:", item)
              if(userGroupNameMap[item]["isGroup"] === 1) {
                list = list.concat([[item, userGroupNameMap[item]["name"]]])
              }
            }
          }
          this.setState({pickerList: list})
          console.log("pickerListResponse ", list)
        }
        else if(currentSource === "User Email") {
          let list = [["", "Please select..."]]
          let userGroupNameMap = this.props.getEmailNameMapForUsersourceId(sourceId);
          console.log("userGroupNameMap: ", userGroupNameMap)
          if(userGroupNameMap !== null) {

          for(let item of Object.keys(userGroupNameMap)) {
            console.log("item:", item)
            if(userGroupNameMap[item]["isGroup"] === 0) {
              list = list.concat([[item, userGroupNameMap[item]["name"]]])
            }
          }
        }
          this.setState({pickerList: list})
          console.log("pickerListResponse ", list)
        }
      }
    }
  }

  onBackButtonClick = () => {
    console.log("Back button click called...")

    if(this.state.pickerInEditMode === true) {
      let newText = this.state.pickerHoverText.substring(0, this.state.pickerHoverText.lastIndexOf('/'))
      let dummyParent = this.state.pickerHoverText.substring(this.state.pickerHoverText.lastIndexOf('/')+1)
      this.setState({pickerHoverText: newText})

      newText = this.trimAbsolutePath(newText)
      console.log("newText: ", newText)
      this.setState({pickerLabel: newText})


      this.setState({pickerParent: dummyParent})

      if(newText.length === 0) {
        this.setState({pickerInEditMode: false})
        this.clearPicker()
      }
    }
    else {
      let ppph = []
      for(let item of this.state.previousPickerParentHistory) {
        ppph = ppph.concat(item)
      }
      let pph = []
      for(let item of this.state.pickerParentHistory) {
        pph = pph.concat(item)
      }

      console.log("ppph:", ppph)
      console.log("pph:", pph)
      ppph.pop()
      ppph.pop()
      pph.pop()
      console.log("ppph:", ppph)
      console.log("pph:", pph)


      this.setState({previousPickerParentHistory: ppph})
      this.setState({pickerParentHistory: pph})

      let newPickerHoverText = this.state.pickerHoverText.substring(0, this.state.pickerHoverText.lastIndexOf('/'))
      let newPickerLabel = this.trimAbsolutePath(newPickerHoverText)

      if(pph.length === 0) {
        this.setState({pickerLabel: "/"})
        this.setState({pickerHoverText: "/"})
        this.setState({previousPickerParentHistory: ["-"]})
        this.setState({pickerParentHistory: ["root"]})
        this.setState({previousPickerParent: "-"})
        this.setState({pickerParent:"root"})
      }
      else {
        this.setState({pickerLabel: newPickerLabel})
        this.setState({pickerHoverText: newPickerHoverText})
        this.setState({previousPickerParent: ppph.slice(-1)[0]})
        this.setState({pickerParent:pph.slice(-1)[0]})
      }
    }
    this.getsourcename()
  }

  clearPicker = () => {
    this.setState({pickerInEditMode: false})
    this.setState({pickerHoverText: ""})
    this.setState({pickerLabel: ""})
    this.setState({previousPickerParent: "-"})
    this.setState({pickerParent:"root"})
    this.setState({previousPickerParentHistory: ["-"]})
    this.setState({pickerParentHistory: ["root"]})
  }


  trimAbsolutePath = (absolutePath) =>  {
      let trimmedPath = absolutePath;
      if (absolutePath.length > 42)
      {
          let extraLength = absolutePath.length - 42 + 3;
          let mid = absolutePath.length / 2;
          let leftWindow = mid - (extraLength / 2);
          let rightWindow = mid + (extraLength / 2);
          trimmedPath = absolutePath.substring(0, leftWindow);
          trimmedPath += "..." + absolutePath.substring(rightWindow);
      }
      return trimmedPath;
  }


  changePickerValue = () => {
    let e = this.refs.pickerListDropDown
    console.log("ref: " + e)
    if( e !== undefined) {
      let text = e.options[e.selectedIndex].text;
      let value = e.value;
      console.log("picker value changed: ", text)
      let label = this.state.pickerLabel

      let currentSource = this.state.selectedSource
      console.log("currentSource: " + this.state.selectedSource)
      let newText = "";
      if(currentSource === "File/Folder Path") {
        let separator = label.endsWith("/") ? "" : "/"
        newText = label + separator + text + ""
        this.setState({pickerHoverText: newText})
      }
      else if(currentSource === "Group Path") {
        newText = text
        this.setState({pickerHoverText: value})
      }
      else if(currentSource === "User Email") {
        newText = text
        this.setState({pickerHoverText: value})
      }

      newText = this.trimAbsolutePath(newText)
      console.log("newText: ", newText)
      this.setState({pickerLabel: newText})
      this.setState({pickerParent: value})
      let pph = this.state.pickerParentHistory.concat(value)
      this.setState({pickerParentHistory: pph})
      let newIndex = this.state.pickerIndex + 1;
      this.setState({pickerIndex: newIndex})
    }
  }

  constructor(props){
    super(props);
    this.submit_runnow = this.submit_runnow.bind(this);

  }

  componentWillMount() {
    this.setState((modalSelectedSource) => ({
     modalSelectedSource
   }))
  }

  componentDidUpdate() {
    console.log("componentDidUpdate was called...")
    this.getsourcename()
  }



  componentWillReceiveProps = (nextProps) => {
    console.log("componentWillReceiveProps was called...")
    console.log("cwrp report data: ", nextProps.reportData)
    this.setState({reportData: nextProps.reportData})
    if(!nextProps.reportData) {
      this.setState({
        numberOfWeeks: 1,
        pickerInEditMode: false
      });
      this.clearPicker()
    }
    else {

      if(nextProps.reportData[2] === "WEEKLY" && nextProps.reportData[3]) {
          console.log("ReportData: ", nextProps.reportData[3])
          let newValue = nextProps.reportData[3].split(",").length
          console.log("Num days selected: ", newValue)
          this.setState({
            numberOfWeeks: newValue,
            isWeeklyHidden: false
          });
      }

      if(nextProps.reportData[4] === "File"){
        this.setState({selectedSource: "File/Folder Path"})
      }else if(nextProps.reportData[4] === "Group"){
        this.setState({selectedSource: "Group Path"})
      }else if(nextProps.reportData[4] === "User"){
        this.setState({selectedSource: "User Email"})
      }

      this.setState({isMonthlyHidden: true})
      this.setState({isWeeklyHidden: true})
      this.setState({isDailySelected: true})

      if(nextProps.reportData[2] === "WEEKLY") {
        this.setState({
          isMonthlyHidden: true,
          isDailySelected: false,
          isWeeklyHidden: false
        })
      }else if(nextProps.reportData[2] === "DAILY"){
        this.setState({
          isMonthlyHidden: true,
          isWeeklyHidden: true,
          isDailySelected: true
        })
      }else if(nextProps.reportData[2] === "MONTHLY"){
        this.setState({
          isMonthlyHidden: false,
          isDailySelected: false,
          isWeeklyHidden: true
        })
      }

      this.setState({pickerInEditMode: true})
      console.log("pickerState:", this.state.pickerInEditMode)
      if(nextProps.reportData[5]) {
        let newText = nextProps.reportData[5]
        this.setState({pickerHoverText: newText})

        newText = this.trimAbsolutePath(newText)
        console.log("newText: ", newText)
        this.setState({pickerLabel: newText})
        this.getsourcename()
      }
  }

  }

  changeSourcesToDS = (e) => {
    console.log("datasource")
    this.setState((state) => ({
      showingDS: true
    }))
    if(e.target.value === "resource") {
      this.setState((selectedSource) => ({
        selectedSource: "File/Folder Path"
      }))
      // this.setState({
      //   selectedSource: "File/Folder Path"
      // })
      this.setState({isSourceChanged: true})
    }
    this.clearPicker()
    this.getsourcename()
  }

  changeSourcesToUS = (e) => {
    console.log("usersource")
    this.setState((state) => ({
      showingDS: false
    }))

    console.log("e.target.value ", e.target.value )


    if(e.target.value === "group"){
      this.setState((selectedSource) => ({
        selectedSource: "Group Path"
      }))
      this.setState({isSourceChanged: true})

    }
    else if(e.target.value === "user"){
      this.setState((selectedSource) => ({
        selectedSource: "User Email"
      }))
      this.setState({isSourceChanged: true})
    }
    this.setState({isSourceChanged: true})

    this.clearPicker()
    this.getsourcename()
  }

  renderCheckboxes = (dayOfWeek) => (
    <div>
      <label for={dayOfWeek} >
        <input key={dayOfWeek} type="checkbox" name="day_of_week" value={dayOfWeek}/>{dayOfWeek}
      </label>

    </div>
  )

  handleDailyClick = (box) => {
    this.setState({isMonthlyHidden: true})
    this.setState({isWeeklyHidden: true})
    this.setState({isDailySelected: true})

    this.setState({isFreqChanged:true})
  }

  handleWeeklyClick = () => {
    this.setState({isWeeklyHidden: false})
    this.setState({isMonthlyHidden: true})
    this.setState({isDailySelected: false})
    if(this.state.numberOfWeeks === 0) {

      this.setState({isFrquencySelected:false})
      this.setState({isDisabled:true})
    }
    this.setState({isFreqChanged:true})
    console.log(this.state)
  }

  handleMonthlyclick = (box) => {
    this.setState({isMonthlyHidden: false})
    this.setState({isWeeklyHidden: true})
    this.setState({isDailySelected: false})

    this.setState({isFreqChanged:true})
    console.log(this.state)
  }

  emailValidation = (e) => {
    console.log(e)
    var pattern="[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}$"
    if(!e.target.value.match(pattern)){

      this.setState({isEmailValid:false})
      console.log(this.state)
    }
    else{
      this.setState({isEmailValid:true})
      console.log(this.state)
    }
  }



  handleWeekChange= (e) =>  {
    console.log("Number of weeks: (existing)", this.state.numberOfWeeks)
    if(e.target.checked){
      this.setState({isDisabled:false})
      let newValue = this.state.numberOfWeeks + 1
      this.setState({ numberOfWeeks: newValue })
      console.log("Number of weeks (checked): ", newValue)
      this.setState((state) => ({
        error: ""
      }))
      this.setState({isFrequencySelected:true})

      console.log(this.state.error)

    }
    else{
      let newValue = this.state.numberOfWeeks - 1
      this.setState({ numberOfWeeks: newValue })
      let valid = true;
      console.log("Number of weeks (unchecked): ", newValue)
      if( newValue === 0)
      {
        this.setState((state) => ({
          error: "Please select on which day of the week you would like to generate the report."
        }))
        valid = false;
        this.setState({isFrequencySelected:false})
      }
    }
    console.log(e.target.checked)
  }

  fillDaysOfMonths = (daysOfMonth) => {
    //console.log("usersource")
    for(var i =1 ; i<=31;i++){
      daysOfMonth.push(["day_"+i,i]);
    }

    return daysOfMonth;
  }

  renderError = (error) => (
    <label key={error}>{error}</label>
  )

  setStateOfReport = (e) =>{
    this.setState((state) => ({
      frequencySelected: e
    }))
  }
  closer = (props) => {
    console.log("Closing report...");
    this.setState({ isMonthlyHidden: true })
    this.setState({ isWeeklyHidden: true })
    this.setState((state) => ({
      error: ""
    }))
    this.setState({ isActivityLog: false })
    this.setState({ show_textArea: false })

    props.onClose();
    this.clearPicker();
  }

  // setsourceVal = (e) =>{
  //   var datasourceid = e.target.value
  //   this.getresource(datasourceid)
  //
  // }

  submit_runnow(e) {
    const auth = this.props.auth
    var errorMessage = ""
    let valid = true;
    //var success = false;
    const formValues = {}
    var pattern = /^\s*$/;
    var emailCheck = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    e.preventDefault();
    const getEmailVal = serializeForm(e.target, {hash: true})
    var getRunNowData = this.props.runnowData
    formValues.email = auth.profile.email
    formValues.authtoken = auth.profile.authToken
    formValues.report_display_name = getRunNowData[2]
    formValues.report_frequency = getRunNowData[3]
    formValues.report_type = getRunNowData[1]
    formValues.report_run_context = "report_email_context"
    formValues.user_id = getRunNowData[4]
    formValues.resource_id = getRunNowData[5]
    formValues.resource_path = getRunNowData[6]
    formValues.group_id = getRunNowData[7]
    formValues.datasource_id = getRunNowData[8]
    formValues.email_list = getEmailVal
    formValues.event_type = "mail_service"
    console.log("getEmailVal are", getEmailVal);
    if(!getEmailVal.email_to){
      errorMessage = "Please enter an email address."
      valid = false

    }
    else if(!getEmailVal.email_to.match(emailCheck)){

      let emails = getEmailVal.email_to.split(',');
      console.log(emails);
      emails.map((email) => {
        let cleaned_email = email.trim();
        if(!cleaned_email.match(emailCheck) || cleaned_email.match(pattern)){
          errorMessage = "Please enter a valid email address."
          valid = false;
        }
        return errorMessage;
      })
    }

    if(valid){
      ScheduleReportsAPI.emailService(formValues)
      .then(response => {
          this.setState({
            show_textArea: false
          })
      })
    }

    if(!valid){
      this.setState((state) => ({
        error: errorMessage
      }))
      e.preventDefault();
    }



    console.log("run_now form email values", getEmailVal);
  }

  submit = (e) => {
    var errorMessage = ""
    var success = false
    console.log(e)
    var pattern = /^\s*$/;
    let valid = true

    var emailCheck  = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    //console.log("check")
    const auth = this.props.auth
    const formValues = serializeForm(e.target, { hash: true })
    console.log("formValues", formValues)
    formValues.email = auth.profile.email
    formValues.authtoken = auth.profile.authToken
    formValues.event_type = "create_report"
    if(!formValues.name){
      errorMessage = "Please enter a name for this report."
      valid = false
    }
    else if(formValues.name.match(pattern)){
      console.log(formValues.name)
      errorMessage = "Please enter valid name for the report."
      valid = false
    }
    else if(!formValues.source){
      errorMessage = "Please select User or Group or File/Folder"
      valid = false
    }
    else if(!formValues.entity_name){
      errorMessage = "Please enter a value for " + this.state.selectedSource
      valid = false
    }
    else if(formValues.entity_name.match(pattern)){
      errorMessage = "Please enter a value for " + this.state.selectedSource
      valid = false
    }
    else if((formValues.frequency === "weekly") && (!formValues.day_of_week)){
      //if(!formValues.day_of_week){
        errorMessage = "Please select on which day of the week you would like to generate the report."
        valid = false
      //}
    }
    else if(!formValues.email_to){
      errorMessage = "Please enter an email address."
      valid = false
    }
    else if(!formValues.email_to.match(emailCheck)){

      let emails = formValues.email_to.split(',');
      console.log(emails);
      emails.map((email) => {
        let cleaned_email = email.trim();
        if(!cleaned_email.match(emailCheck) || cleaned_email.match(pattern)){
          errorMessage = "Please enter a valid email address."
          valid = false
        }
        return errorMessage;
      })
    }
    if(valid){
      ScheduleReportsAPI.create(formValues).then(reports => {
        console.log("reports reports ", reports);
        if(reports.errorType === "Exception" ){
          errorMessage = reports.errorMessage
          if(errorMessage.includes("Internal Error")){
            errorMessage = "Something went wrong"
          } else{
            errorMessage = reports.errorMessage
          }
          this.setState((state) => ({
            error: errorMessage
        }))
      }
        else{
          success = true
          //alert("Success in creating report")
          this.props.handleSuccess()
          this.setState({ reports })
          this.clearPicker()
          this.closer(this.props)
        }
      })
    }
    if(!success){
      this.setState((state) => ({
        error: errorMessage
      }))
      e.preventDefault();
    }
  }



  reportTypeChange =(e) =>{
    if(e.target.value === "activity_log"){
      this.setState({isActivityLog: true})

    }
    else{
      this.setState({isActivityLog: false})
    }
  }
  isDisabled = () => {
    if(this.state.error === ""){
      return false
    }
    return true
  }
  onEditClick = (e) => {
    this.setState({
      show_textArea: !this.state.show_textArea
    })
    this.setState({
      error: ''
    })
  }

  reportTypes = [["access_perms", "Access Permission Report"], ["activity_log", "Activity Log Report"]]
  daysOfMonth=[]
  daysOfMonth = this.fillDaysOfMonths(this.daysOfMonth)

  daysOfWeek = ["M", "Tu", "W", "Th", "F", "Sa", "Su"]

  onBtExport() {

    // this.gridApi.exportDataAsCsv(this.props.csvdata); // won't work
  }
  render() {
    let dataSources = "";
    let res = [];
    let showWeeklyFrequency = false;
    let showMonthlyFrequency = false;
    if(this.state.isSourceChanged){
      if(this.state.showingDS){
        dataSources = this.props.dataSources
      }
      else {
        dataSources = this.props.userSources

      }

    }else{
      if(this.props.formType === "modify"){
        if(this.props.reportData[4] === "File" )
        {
          dataSources = this.props.dataSources
         }else{
            dataSources =   this.props.userSources
        }

      }

      else{
        if(this.state.showingDS){
          dataSources = this.props.dataSources

        } else {
          dataSources = this.props.userSources
        }
      }
    }
    if(this.state.isFreqChanged){
      showWeeklyFrequency = this.state.isWeeklyHidden
      showMonthlyFrequency =  this.state.isMonthlyHidden
    }else{
      if(this.props.formType === "modify"){
        showWeeklyFrequency = this.props.reportData[2]!=="WEEKLY"
        showMonthlyFrequency = this.props.reportData[2] !== "MONTHLY"
      }
      else{
        showWeeklyFrequency = this.state.isWeeklyHidden
        showMonthlyFrequency =  this.state.isMonthlyHidden
    }
  }
    let modalContent
    const emailButton = <Button isPrimary={true} size='s' label="Email To"/>

    //const toolbar = <PaneToolbar isActive={true}  rightCol={[emailButton]} />;

    let month = `day_${this.props.reportData[8]}`;
    //let weeks = `${this.props.reportData[8]}`

    if(this.props.formType !== 'run_now'){

      modalContent= (
        <div>
          <div className="errors">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{this.state.error}</div>
          <form  onSubmit={this.submit} className="create-report-form" >

            <div className="vertical-box">


              <div className="inner-box">

                <div className="rect-box">
                  <input type="checkbox" name="status" value="1" defaultChecked={this.props.reportData[10]===1 || this.props.formType === "create"}/>
                  <label>Active</label>
                </div>
                <div className="field-name">
                <label>Name</label>
                <input name='name' type="text" defaultValue={this.props.reportData[1]}/>
                <label>Report</label>
                <select name="report_type" onChange={this.reportTypeChange} defaultValue={this.props.reportData[9]}>
                  {this.reportTypes.map((reportType) =>
                    <option key={reportType[0]} name="{reportType[0]}" value={reportType[0]} >{reportType[1]}</option>
                  )}
                </select>

                <input type="hidden" name="queryType" value={this.props.formType}/>
                <input type="hidden" name="report_id" value={this.props.reportData[0]}/>
                <input type='hidden' value='0' name='status'/>

              </div>
            </div>


              <div className="spacer"></div>
              <div className="inner-box">
                <div className="rect-box">
                  <input type="radio" onChange={this.changeSourcesToDS} name="source" id="resource_id" value="resource" ref="resource"
                   defaultChecked={this.props.reportData[4] === "File" || this.props.formType === "create" || this.state.isActivityLog}/>
                  <label>File/Folder</label>
                  <input type="radio" onChange={this.changeSourcesToUS} name="source" id="group_id" value="group" ref="group"
                  disabled={this.state.isActivityLog}  defaultChecked={this.props.reportData[4] === "Group"}/>
                  <label>Group</label>
                  <input type="radio" onChange={this.changeSourcesToUS} name="source" id="user_id" value="user" ref="user"
                  defaultChecked={this.props.reportData[4] === "User"} />
                  <label>User</label>
                </div>
                <select ref="sources" name="sources" defaultValue={this.props.reportData[7]} >
                  {dataSources.map((ds) =>
                    <option key={ds[0]} name="source_id" value={ds[0]}>{ds[1]}</option>
                  )}
                </select>

                  <div className="field-name">
                    <label>{this.state.selectedSource} </label>
                  </div>
                  <div className="picker">
                    <label title={this.state.pickerHoverText} style={{whiteSpace: "nowrap", width:"300px", float:"left", minHeight: "30px"}}>{this.state.pickerLabel}</label>
                    <div className="picker-back-button">
                      <label title="Go back"   onClick={this.onBackButtonClick} ></label>
                    </div>
                  </div>
                  <input name="entity_name" type="hidden" value={this.state.pickerHoverText} style={{direction:"rtl"}} readOnly/>
                  <select ref="pickerListDropDown" name="source_name"  defaultValue={this.state.pickerList} onChange={this.changePickerValue}>
                    {this.state.selectedSource === "File/Folder Path" ?
                      this.state.pickerList.map((rs) =>
                      <option key={rs[1]} name="resource_id" value={rs[1]}>{rs[2]}</option>
                    ) :this.state.selectedSource === "User Email" ?
                    this.state.pickerList.map((rs) =>
                    <option key={rs[1]} name="resource_id" value={rs[0]}>{rs[1]}</option>
                  ) :   this.state.pickerList.map((rs) =>
                    <option key={rs[1]} name="resource_id" value={rs[1]}>{rs[1]}</option>)}
                  </select>

              </div>
            </div>

            <div className="verticle-middle-box"></div>
            <div className="vertical-box">
              <div className="inner-box">
                <div className="field-name">
                  <label>Frequency</label>
                </div>
                <div className="rect-box">
                  <input type="radio" name="frequency" onChange={this.handleDailyClick}  id="freq1" value="daily" defaultChecked={this.props.reportData[2] === "DAILY" || this.props.formType === "create"} />
                  <label>Daily</label>
                  <input type="radio" name="frequency" id="freq2" onChange={this.handleWeeklyClick}  value="weekly" defaultChecked={this.props.reportData[2] === "WEEKLY"}/>
                  <label>Weekly</label>
                  <input type="radio" name="frequency" id="freq3" onChange={this.handleMonthlyclick}  value="monthly" defaultChecked={this.props.reportData[2] === "MONTHLY"} />
                  <label>Monthly</label>
                </div>
                <div className="rect-box" hidden={showWeeklyFrequency}>
                  {this.daysOfWeek.map((dayOfWeek, index) => (
                    <div key={index}>
                      <div className="horiz-box">
                        <input id={dayOfWeek} value={dayOfWeek} type="checkbox"
                        onChange={this.handleWeekChange} name="day_of_week"
                        defaultChecked={this.props.reportData[2] === "WEEKLY"
                        ?
                        this.props.reportData[3].includes(index.toString())
                        :
                        index === 0}/>{dayOfWeek}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="horiz-box" hidden={showMonthlyFrequency} >
                  <label>Day of the Month</label>
                  <select name="day_of_month" defaultValue={month}>
                    {this.daysOfMonth.map((dayOfMonth) =>(
                      <option key={dayOfMonth[0]} name="{dayOfMonth[0]}" value={dayOfMonth[0]}>{dayOfMonth[1]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="right-middle-box"></div>
              <div className="inner-box">
                <div className="field-name">
                  <label >Email To </label>
                  {/* <div className="rect-box"> */}
                  <textarea className="create-report-form-textarea" name='email_to' type="text"
                    defaultValue={this.props.reportData[6]} placeholder="Please enter comma separated email addresses...">
                  </textarea>
                  {/* </div> */}
                  <div className="temp-left-pad">
                    <button>Submit</button>
                  </div>
              </div>
              </div>
            </div>
          </form>
        </div>
      )}
      else{
        console.log("csvdata", this.props.csvData)
        if (this.props.loading) {
           modalContent = (
             <div className="loader">
               <Loader size='xs'/>
               <span className="loaderText" style={{color:colors.text}}>Loading...</span>
             </div>
           )
         }
         else{
        if(this.props.reportData[9]==="activity_log"){
          modalContent = (
              <div>
                <div className="export_button">
                  <div onClick={this.onBtExport.bind(this)}>Export to CSV</div>
                </div>
                <div className="email_runnow_wrapper">
                  <div className="email_button">
                    <div style={{display:'inline-block'}}>Email To</div>
                      <div className="report-menu">
                        <div className="dropdown">
                        <div className="dropbtn" onClick={() => this.onEditClick()}></div>
                      </div>
                      </div>
                  </div>

                    {
                      this.state.show_textArea?

                      (

                        <div className="email_runnow_dialog">
                        <form onSubmit={this.submit_runnow} className="create-report-form-runnow">
                          <div className="textarea_wrapper">
                            <div style={{width:'162px', margin:'auto'}}>
                              <div>
                                <div className="errors">{this.state.error}</div>
                              </div>
                              <textarea type="text" name='email_to' placeholder="Enter email..."></textarea>
                              <button>Submit</button>
                            </div>
                          </div>
                        </form>
                        </div>
                    ): null
                    }

                </div>
            <table>
                <tbody>
                <tr>
                  <th>
                    Time
                  </th>
                  <th>
                    Data Source
                  </th>
                  <th>
                    Activity
                  </th>
                  <th>
                    File/Folder
                  </th>
                  <th>
                    User
                  </th>
                </tr>
                {this.props.csvData.map((log_list, index) =>(
                  <tr key={index}>
                    <td>
                      {log_list[4]}
                    </td>
                    <td>
                      {log_list[0]}
                    </td>
                    <td>
                      {log_list[1]}
                    </td>
                    <td>
                      {log_list[3]}
                    </td>
                    <td>
                      {log_list[2]}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>

          </div>
          )
        }
        else {
          modalContent = (
            <div>
              <div className="export_button">
                  <div onClick={this.onBtExport.bind(this)}>Export to CSV</div>
              </div>
              <div className="email_runnow_wrapper">
                  <div className="email_button">
                    <div style={{display:'inline-block'}}>Email To</div>
                      <div className="report-menu">
                        <div className="dropdown">
                        <div className="dropbtn" onClick={() => this.onEditClick()}></div>
                      </div>
                      </div>
                  </div>

                    {
                      this.state.show_textArea?

                      ( <div className="email_runnow_dialog">
                        <form onSubmit={this.submit_runnow} className="create-report-form-runnow">
                          <div className="textarea_wrapper">
                            <div style={{width:'162px', margin:'auto',color:colors.text}}>
                              <textarea type="text" rows="3" name='email_to' placeholder="Enter email..."></textarea>
                              <button>Submit</button>
                            </div>
                          </div>
                        </form>
                      </div> ): null
                    }

                </div>
              <table style={{color:colors.text}}>
              <tbody >
                {/* <div className="scrollit"> */}
                <tr>
                  <th>
                    Datasource
                  </th>
                  <th>
                    File
                  </th>
                  <th>
                    Path
                  </th>
                  <th>
                    User/Group
                  </th>
                  <th>
                    Email
                  </th>
                  <th>
                    Access
                  </th>
                </tr>
                {console.log("csv Data in table " , this.props.csvData)}
                {this.props.csvData.map((log_list, index) =>(
                  <tr key={index}>
                    <td>
                      {log_list[1]}
                    </td>
                    <td >
                      {log_list[2]}
                    </td>
                    <td>
                      {log_list[3]}
                    </td>
                    <td>
                      {log_list[4]}
                    </td>
                    <td>
                      {log_list[5]}
                    </td>
                    <td>
                      {log_list[6]}
                    </td>
                  </tr>
                ))}
                {/* </div> */}
              </tbody>
              </table>

          </div>)
        }
    }
}


let modalFooterEl
// if(this.props.formType === "run_now" && this.props.csvData.length > 0){
//   modalFooterEl = (
//     <div >
//
//       <Columnizer hasGutter={true}>
//         <label>Mail to
//           <textarea name='email_to' autoFocus onChange={this.emailValidation}  rows="3" cols="45" type="text" defaultValue={this.props.reportData[6]} >
//           </textarea>
//         </label>
//         <div className="footer-align">
//           <Button size='s' label="Mail" isPrimary={true}  />
//           <Button size='s' label="Close" isPrimary={false} onClick={() => this.closer(this.props) }/>
//         </div>
//       </Columnizer>
//     </div>
//   )
// }else{
  // modalFooterEl = (
  //   <div></div>
  //
  // )
// }

return (
  <Modal isVisible={this.props.isVisible}
    hideTitle={true}
    isExpanded={false}
    footerContent={modalFooterEl}
    onClose={() => this.closer(this.props) }>{modalContent}</Modal>
  );
}

}

export default ReportModal;
