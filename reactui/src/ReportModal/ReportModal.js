import React, { Component } from 'react';
import Modal from '../Modal';
import Columnizer from '../Columnizer';
// import Button from '../Button';
// import LoaderBox from '../LoaderBox';
// import * as ScheduleReportsAPI from '../Report/utils/ScheduleReportsAPI';
// import { Field, reduxForm } from 'redux-form';
//
// import serializeForm from 'form-serialize'
//
//
// class ReportModal extends Component {
//   state={
//   sources:this.props.dataSources,
//   reportData: this.props.reportData,
//   frequencySelected:this.props.reportData[3],
//   isWeeklyHidden:true,
//   isMonthlyHidden:true,
//   isDailySelected: true,
//   isDisabled: true,
//   numberOfWeeks: 0,
//   isNameFilled: false,
//   isPathFilled: false,
//   isActivityLog: true
//   }
//
//   componentDidMount(){
//   this.setState({
//     sources:this.props.dataSources,
//     reportData: this.props.reportData,
//     isMonthlyHidden: true,
//     isWeeklyHidden: true
//   })
//   console.log(this.state.sources)
//   }
//
//
// changeSourcesToDS = () => {
//   console.log("datasource")
//   this.setState((state) => ({
//     sources: this.props.dataSources
//   }))
// }
//
// changeSourcesToUS = () => {
//   console.log("usersource")
//   this.setState((state) => ({
//     sources: this.props.userSources
//   }))
// }
//
// renderCheckboxes = (dayOfWeek) => (
//   <div>
//     <label for={dayOfWeek} >
//       <input key={dayOfWeek} type="checkbox" name="day_of_week" value={dayOfWeek}/>{dayOfWeek}
//     </label>
//
//   </div>
// )
//
// handleDailyClick = (box) => {
//   this.setState({isMonthlyHidden: true})
//   this.setState({isWeeklyHidden: true})
//   this.setState({isDailySelected: true})
//   this.setState((state) => ({
//     error: ""
//   }))
//   this.setState({isDisabled:false})
//
// }
//
// handleWeeklyClick = () => {
//   this.setState({isWeeklyHidden: false})
//   this.setState({isMonthlyHidden: true})
//   this.setState({isDailySelected: false})
//   if(this.state.numberOfWeeks === 0){
//
//   this.setState((state) => ({
//     error: "Please select a day of the week to send report"
//   }))
//   this.setState({isDisabled:true})
//
//   }
//     console.log(this.state)
// }
//
// handleMonthlyclick = (box) => {
// {
//   this.setState({isMonthlyHidden: false})
//   this.setState({isWeeklyHidden: true})
//   this.setState({isDailySelected: false})
//   this.setState((state) => ({
//     error: ""
//   }))
//   this.setState({isDisabled:false})
//     console.log(this.state)
//   }
// }
//
// emailValidation = (e) => {
//   console.log(e)
//   var pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$"
//   //re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})),$/;
//   if(!e.target.value.match(pattern)){
//   this.setState((state) => ({
//     error: "Invalid email id please check"
//   }))
//   this.setState({isDisabled:true})
//     console.log(this.state)
//   }
//   else{
//   this.setState((state) => ({
//     error: ""
//   }))
//   this.setState({isDisabled:false})
//     console.log(this.state)
//   }
// }
//
//
// handleUserClick = (box) => {
//   {box.checked = true}
// }
//
// handleGroupClick = (box) => {
//   {box.checked = true}
// }
//
// handleResourceClick = (box) => {
//   {box.checked = true}
// }
// handleWeekChange= (e) =>  {
// console.log(this.state.numberOfWeeks)
//   if(e.target.checked){
//   this.setState({isDisabled:false})
//   this.setState({ numberOfWeeks: this.state.numberOfWeeks + 1 })
//   this.setState((state) => ({
//     error: ""
//   }))
//   console.log(this.state.error)
//
//   }
//   else{
//   this.setState({ numberOfWeeks: this.state.numberOfWeeks - 1 })
//   if( this.state.numberOfWeeks -1 === 0)
//   {
//   this.setState((state) => ({
//     error: "Please select a day of the week to send report"
//   }))
//   this.setState({isDisabled:true})
// }
//   }
//
//
//   console.log(e.target.checked)
// }
//
// nameChange = (e) =>{
//   var pattern = /^\s*$/;
//   if(e.target.value.match(pattern)){
//     // this.setState((state) => ({
//     //   error: "Please fill valid name"
//     // }))
//     this.setState({isNameFilled:false})
//   }
//   else{
//     // this.setState((state) => ({
//     //   error: ""
//     // }))
//     this.setState({isNameFilled:true})
//   }
// }
//
// pathChange = (e) =>{
//   var pattern = /^\s*$/;
//   if(!e.target.value.match(pattern)){
//     this.setState((state) => ({
//       error: ""
//     }))
//     this.setState({isPathFilled:true})
//   }
//   else{
//     this.setState((state) => ({
//       error: "Please fill valid path"
//     }))
//     this.setState({isPathFilled:false})
//   }
// }
//
//
// fillDaysOfMonths = (daysOfMonth) => {
//   //console.log("usersource")
//   for(var i =1 ; i<=31;i++){
//     daysOfMonth.push(["day_"+i,i]);
//   }
//
//   return daysOfMonth;
// }
//
// renderError = (error) => (
//   <label key={error}>{error}</label>
// )
//
// setStateOfReport = (e) =>{
//   this.setState((state) => ({
//     frequencySelected: e
//   }))
//   }
//   closer = (e) =>{
//   this.setState({isMonthlyHidden: true})
//   this.setState({isWeeklyHidden: true})
//   this.setState((state) => ({
//     error: ""
//   }))
//   console.log(this.state.isWeeklyVisible)
//   e.onClose()
// }
//
// submit = (e) => {
//   console.log(e)
//
//   if(!this.state.isWeeklyHidden || !this.state.isMonthlyHidden || this.state.isDailySelected){
//     console.log("no error");
//   }
//   else{
//     console.log(this.state.error);
//     this.setState((state) => ({
//     error: "Form Incomplete"
//   }))
//   }
// }
// isDisabled = () => {
//   if(this.state.error === ""){
//     return false
//   }
//     return true
// }
// reportTypeChange =(e) =>{
//   if(e.target.value === "activity_log"){
//     this.setState({isActivityLog: true})
//   }
//   else{
//     this.setState({isActivityLog: false})
//   }
// }
// reportTypes = [["activity_log", "Activity Log Report"], ["access_perms", "Access Permission Report"]]
// daysOfMonth=[]
// daysOfMonth = this.fillDaysOfMonths(this.daysOfMonth)
//
// daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
//
//   render() {
//
//
//     let title;
//     if(this.props.formType === 'create'){
//      title = "Create Report"
//     }
// else if (this.props.formType === 'modify'){
// title = "Modify Report";
// }
// else{
// title = "Run";
//
// }
//
// let month = `day_${this.props.reportData[8]}`;
//
//
//
//     let modalContent;
//     if(this.props.formType !== 'run_now'){
//   modalContent= (
//
//   <div>
//   <form  onSubmit={this.props.handleSubmit} className="create-report-form" id="report_form" >
//     <div className="create-report-details">
//       <div className="create-report-details-padding ">
//         <label className="form-label">Name</label>
//         <input name='name' onChange={this.nameChange} type="text" defaultValue={this.props.reportData[1]}/>
//       </div>
//       <div className="create-report-details-padding form-group ">
//         <label className="form-label">Report</label>
//         <select name="report_type" onChange={this.reportTypeChange} >
//           {this.reportTypes.map((reportType) =>
//             <option key={reportType[0]} name="{reportType[0]}" value={reportType[0]}>{reportType[1]}</option>
//           )}
//         </select>
//       </div>
//
//       <div className="create-report-details-padding ">
//         <label>For</label>
//         <label for="for1">
//           <input type="radio" onChange={this.changeSourcesToUS} name="source" id="group_id" disabled = {this.state.isActivityLog} value="group" defaultChecked={this.props.reportData[4] === "Group"}/>Group
//         </label>
//         <label for="for2">
//           <input type="radio" onChange={this.changeSourcesToUS} name="source" id="user_id" value="user"  defaultChecked={this.props.reportData[4] === "User"} />User
//         </label>
//         <label for="for3">
//           <input type="radio" onChange={this.changeSourcesToDS} name="source" id="resource_id" value="resource"   defaultChecked={this.props.reportData[4] === "File" || this.props.formType === "create"}/>File/Folder
//         </label>
//         <label>&emsp;&emsp;</label>
//         <select name="sources">
//                        {this.state.sources.map((ds) =>
//                          <option name="source_id" value={ds[0]}>{ds[1]}</option>
//                        )}
//                      </select>
//         <input name="entity_name" onChange={this.pathChange} type="text" defaultValue={this.props.reportData[5]} />
//
//       </div>
//       <div className="create-report-details-padding">
//         <label>Frequency</label>
//         <label for="freq1">
//           <input type="radio" name="frequency" onChange={this.handleDailyClick}  id="freq1" value="daily" defaultChecked={this.props.reportData[2] === "DAILY" || this.props.formType === "create"} />Daily
//         </label>
//         <label for="freq2">
//           <input type="radio" name="frequency" id="freq2" onChange={this.handleWeeklyClick}  value="weekly" defaultChecked={this.props.reportData[2] === "WEEKLY"}/>Weekly
//         </label>
//         <label for="freq3">
//           <input type="radio" name="frequency" id="freq3" onChange={this.handleMonthlyclick}  value="monthly" defaultChecked={this.props.reportData[2] === "MONTHLY"} />Monthly
//         </label>
//       </div>
//       <div className="create-report-details-padding">
//       <div className="create-report-details-padding-weekdays" hidden={this.state.isWeeklyHidden}>
//         {this.daysOfWeek.map((dayOfWeek,index) => (
//           <div>
//             <label for={dayOfWeek} >
//               <input value={dayOfWeek} type="checkbox" onChange={this.handleWeekChange} name="day_of_week"  defaultChecked={this.props.reportData[3] === index}/>{dayOfWeek}
//             </label>
//
//           </div>
//         ))}
//       </div>
//       </div>
//
//       <div className="create-report-details-padding create-report-details-padding-monthly" hidden = {this.state.isMonthlyHidden}>
//         <label>Day of the Month</label>
//         <select className = "create-report-details-monthly" name="day_of_month" defaultValue= {month}>
//           {this.daysOfMonth.map((dayOfMonth) =>(
//             <option key={dayOfMonth[0]} name="{dayOfMonth[0]}" value={dayOfMonth[0]} >{dayOfMonth[1]}</option>
//           ))}
//         </select>
//       </div>
//
//
//       <div className="create-report-details-padding">
//         <label form-label>Email to </label>
//         <input name='email_to' onChange={this.emailValidation} required type="text" defaultValue={this.props.reportData[6]} />
//       </div>
//       <div className="create-report-details-padding">
//       <label> Active</label>
//       <input type="checkbox" name="status" value="1" defaultChecked/>
//       </div>
//       <input type="hidden" name="queryType" value={this.props.formType}/>
//       <input type="hidden" name="report_id" value={this.props.reportData[0]}/>
//       <input type='hidden' value='0' name='status'/>
//       <div className="create-report-details-padding">
//       <div className="create-report-details-padding create-report-details-errors">
//         {this.state.error}
//       </div>
// </div>
// <div onClick={() => this.submit(this.props)}>
// <button disabled = {!this.state.isNameFilled || !this.state.isPathFilled || this.state.isDisabled} >Submit</button>
// </div>
//             </div>
//     </form>
//
//     </div>
//   )}
//   else{
// console.log(this.props.csvData)
//   modalContent= (
//   <div>
//   <div>
//   {this.props.csvData}
//   </div>
//
// </div>
//   )}
// let modalFooterEl
// if(this.props.formType === "run_now"){
//  modalFooterEl = (
//   <Columnizer hasGutter={true}>
//     <Button size='s' label="Mail" isPrimary={true}/>
//     <Button size='s' label="Close" isPrimary={false} onClick={() => this.closer(this.props) } />
//     <input name='email_to' onChange={this.emailValidation} required type="text" defaultValue={this.props.reportData[6]} />
//   </Columnizer>
//
// )
// }else{
//      modalFooterEl = (
//       <Columnizer hasGutter={true}>
//         <Button size='s' label="Submit" isPrimary={true} onClick={() => this.submit(this.props)}/>
//         <Button size='s' label="Close" isPrimary={false} onClick={() => this.closer(this.props) } />
//
//       </Columnizer>
//
//     )
// };
//     return (
//       <Modal title={title}
//              isVisible={this.props.isVisible}
//              isExpanded={false}
//              footerContent={modalFooterEl}
//              onClose={() => this.closer(this.props) }>{modalContent}</Modal>
//
//     );
//   }
// }
//
// export default ReportModal;
