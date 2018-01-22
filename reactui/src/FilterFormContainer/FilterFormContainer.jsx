import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { colors, spaces, components } from '../designTokens';
import { StyleSheet, css } from 'aphrodite/no-important';
import SearchContent from '../SearchContent';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import serializeForm from 'form-serialize';
import * as APICall from '../SearchContainer/util/APICall';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import { selectors } from '../PermissionsApp/reducer';
import PageContent from '../PageContent';
import throttle from 'lodash/throttle';
import { SET_WIDGET_REPORT as setWidgetReport } from '../PermissionsApp/actions';
import ExportCsvButton from '../ExportCsvButton';
import ReportsGrid from '../ReportsGrid';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { SET_METADATA as setMetadata, SET_FILTER_SUBMIT as setFilterSubmit, SET_FILTER_INPUT as setFilterInput} from '../PermissionsApp/actions';

 const mapStateToProps = (state) => ({
   getMetadata: () => selectors.getMetadata(state),
   getFilterSubmit: () => selectors.getFilterSubmit(state),
   getFilterInput:()=>selectors.getFilterInput(state)
 });

 const mapDispatchToProps = {
   setMetadata,
   setFilterSubmit,
   setFilterInput
 }

 const exposureOptions = [
   {value: 'Public', label: 'Public' , id:'exposure'},
   {value: 'External', label: 'External' , id:'exposure'},
   {value: 'Internal', label: 'Internal', id:'exposure'},
   {value: 'Domain', label: 'Domain', id:'exposure'},
   {value: 'Private', label: 'Private', id:'exposure'}
 ]


const styles = StyleSheet.create({
  searchForm:{
  padding: '20px',
  marginTop: '30px',
  border: `solid ${spaces.xxxs} ${colors.text}`,
  backgroundColor: '#32363f',
  minHeight: '6.666666666666666rem',
  width: '95%',
  position: 'absolute',
  zIndex:1,
  display: 'inline-flex',
  right: '5%'

},
filterSearchForm: {
  padding: '20px',
  marginTop: '30px',
  minHeight: '6.666666666666666rem',
  width: '95%',
  position: 'absolute',
  zIndex:1,
  display: 'inline-flex'
},
multioption:{
  width: '239px',
  margin:'0 20px 24px 10px',
  backgroundColor: '#32363f'

}

  });

class SearchFormContent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      fileTypes: [],
      showCustomInput2: false,
      showCustomInput3: false,
      createdDateFrom: moment(),
      createdDateTo: moment(),
      modifiedDateFrom: moment(),
      modifiedDateTo: moment(),
      store: {},
      parsedQuery : "",
      filterInput: {},
      removeSelected: true,
			disabled: false,
			crazy: false,
			stayOpen: false,
			exposurevalue: [],
      fileTypevalue : [],
			rtl: false,
      columnNames: ["users_email", "resource_name", "rd_type", "rd_size", "rd_owner_user_id", "rd_exposure", "resource_path"]
      // submitted: false,
      // metadata: []
    }
    this.modifiedDateChangedFrom = this.modifiedDateChangedFrom.bind(this);
    this.modifiedDateChangedTo = this.modifiedDateChangedTo.bind(this);
    this.createdDateChangedFrom = this.createdDateChangedFrom.bind(this);
    this.createdDateChangedTo = this.createdDateChangedTo.bind(this);
    this.storeValue= this.storeValue.bind(this);
    this.submit = this.submit.bind(this);
    // this.showSearchForm = this.showSearchForm.bind(this);

  }

  componentDidMount(){
    var filteTypeSet = []
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    this.showSearchForm()
    APICall.getFileType(email, authToken).then((fileTypes) => {
      fileTypes.map(elem => {
        var fileTypeMap = {}
        fileTypeMap['label']=elem
        if(elem == "octet-stream"){
          fileTypeMap['value']= "binary"
        }
        else {
          fileTypeMap['value']=elem
        }
        filteTypeSet.push(fileTypeMap)
      })
      this.setState({
        fileTypes: filteTypeSet
      })
    })
  }


  registerResourceTreeApi = api => {
    this.resourceTreeApi = api;
    }
  refreshAllTrees = throttle(() => {
    this.resourceTreeApi && this.resourceTreeApi.refreshView()
  }, 300);

  customInputBoxCreateTime = (e) => {
    var current_time=new Date().getTime()
    if(e.target.value === "custom3") {
      this.setState({
        showCustomInput3: true
      })
    }
    else{
      this.setState({
        showCustomInput3: false
      })
    }
    var mapping = this.state.store
    var valueof = ""
    mapping["created-time"] = e.target.value
    this.dateConversion(e.target.name, mapping, current_time)
    this.convertOfJsonToString(mapping, valueof)
  }

  customInputBoxModifiedTime = (e) => {
    var current_time=new Date().getTime()
     if (e.target.value === "custom2") {
      this.setState({
        showCustomInput2: true
      })
    }
    else{
      this.setState({
        showCustomInput2: false
      })
    }
    var mapping = this.state.store
    var valueof = ""
    mapping["modified-time"] = e.target.value
    this.dateConversion(e.target.name, mapping, current_time)
    this.convertOfJsonToString(mapping, valueof)
  }

  modifiedDateChangedFrom(d){
      this.setState({modifiedDateFrom: d})
      this.convertMomentToISOString(d, "Modified-date-from")

    }

  modifiedDateChangedTo(d){
      this.setState({modifiedDateTo: d})
      this.convertMomentToISOString(d, "Modified-date-to")
    }

  createdDateChangedFrom(d){
      this.setState({createdDateFrom: d})
      this.convertMomentToISOString(d, "Created-date-from")

    }
  createdDateChangedTo(d){
      this.setState({createdDateTo: d})
      this.convertMomentToISOString(d, "Created-date-to")

    }

  convertMomentToISOString(d, key){
    var map = this.state.store
    var valueof = ""
    var timeExtract = d["_d"]
    var fromTime = (timeExtract.toISOString().replace("T"," ").replace("Z","")).split(" ")
    fromTime = fromTime[0]
    map[key] = fromTime
    this.convertOfJsonToString(map, valueof)

  }
  reset = (e) => {
     this.setState({
       store: {},
       parsedQuery: "",
       fileTypevalue:[],
       exposurevalue:[]
     })
     var formkeys = ["title", "type", "size-from", "size-to", "owner", "accessible-by",
                      "read", "write", "Creation-time-from", "Creation-time-to",
                      "Modified-time-from", "Modified-time-to", "created-time", "modified-time", "exposure"]
       for(var i in formkeys){
         var key = formkeys[i];
         var elem = document.getElementById(key);
         if (elem!==null) {
               if(elem.type === "checkbox"){
                 elem.checked = false;
               }
               else {
                  elem.value = "" ;
                  this.setState({
                    showCustomInput2 : false,
                    showCustomInput3: false
                  })
               }

            }
       }
     e.preventDefault()
  }

  parseFunc = (queryString, formValues) => {
    var titleVal = ""
    var result = {}
    var finalinput = {}
    if(queryString.length === 0){
       finalinput = formValues
    }
    else{
      var words = queryString.split(" ")
      for(var i=0;i<words.length;i++){
        var item = words[i];
        if ( item.indexOf(":") > -1 ){
          var pair = item.split(":");
          result[pair[0]]= pair[1];
        }
        else{
          if(titleVal.length>0){
            titleVal=titleVal.concat(" "+item)
          }
          else{
            titleVal=titleVal.concat(item)
          }

        }

      }
      if(titleVal.length>0 && "title" in result){
        result["title"] = result["title"].concat(" "+titleVal)
      }
      else if (titleVal.length>0) {
        result["title"] = titleVal
      }
      var formValuescopy = formValues;
      for (var key in result){
        formValuescopy[key] = result[key];
      }
      finalinput = formValuescopy;

    }
    for(var fieldName in finalinput){
      if(finalinput[fieldName] === ""){
        delete finalinput[fieldName]
    }
  }

    return finalinput
  }

  submit = (e) => {
    var queryString = '';
    var current_time=new Date().getTime()
    // queryString = document.getElementById("search_text").value
    const formValues = serializeForm(e.target, { hash: true })
    var finalinput = this.parseFunc(queryString, formValues)
    var mapping = this.state.store
    Object.assign(finalinput,mapping)
    if(this.state.fileTypevalue){
      finalinput.type = this.state.fileTypevalue
    }
    if(this.state.exposurevalue){
      finalinput.exposure = this.state.exposurevalue
    }
    finalinput.email = this.props.auth.profile.email
    finalinput.authtoken = this.props.auth.profile.authToken
    finalinput.event_type = "get_metadata_filter"
    finalinput.column_names = this.state.columnNames
    console.log("finalinput : ", finalinput)
    this.props.setFilterInput(finalinput)
    APICall.getFilteredMetadata(finalinput).then(response => {
        this.props.setMetadata(response)
        this.props.setFilterSubmit(true)
    })

    this.setState({
      showSearchBar: false,
      // filterInput: finalinput
      // filerSearchData: result

    })
      e.preventDefault()

  }

  showSearchForm(e) {
    this.setState({
      showSearchBar: !this.state.showSearchBar
    })

    var input={}
    var finalresult = this.props.getFilterInput()
    console.log("showSearchForm : finalresult ", finalresult)
    input = Object.assign({}, finalresult)
    if(!("exposure" in input)){
      if(this.props.widgetName === 'EXT_DOCS' || this.props.widgetName === "EXT_USERS")
      {
        input["exposure"] = "External"
      }
     }
    var formkeys = ["title", "type", "size-from", "size-to", "owner", "accessible-by",
                     "read", "write", "Creation-time-from", "created-time", "modified-time","Creation-time-to",
                     "Modified-time-from", "Modified-time-to", "exposure"]
      for(var i in formkeys){
        var key = formkeys[i];
        if(key in input){
           var val =   input[key]
           if(key === "type"){
             this.setState({
               fileTypevalue: val
             })
           }
           else if(key === "exposure") {
             this.setState({
               exposurevalue: val
             })
           }
           else{
             var elem = document.getElementById(key);
             console.log("showSearchForm : elem ", elem)
             if (elem!==null) {
               if(elem.type === "checkbox"){
                 elem.checked = true;
               }
               elem.value = val;
            }
           }

        }
        else{
          try{
            var elem = document.getElementById(key)
            if(elem.value!=null){
              elem.value = ""
            }
          }
          catch (e) {
          }

        }
      }
  }

  storeValue = (e) => {
    var valueof="";
    var mapping = {}
    var current_time=new Date().getTime();
    mapping = this.state.store;
    mapping[e.target.name]= e.target.value
    if("write" in  mapping && mapping["write"] !== ""){
      var check = document.getElementById("write")

      if(check.checked === true){
        mapping["write"]= "W"
      }
      else {
        mapping["write"]= ""
      }
    }

    if("read" in  mapping && mapping["read"] !== ""){
      var check = document.getElementById("read")

      if(check.checked === true){
        mapping["read"]= "R"
      }
      else {
        mapping["read"]= ""
      }
    }

   this.dateConversion(e.target.name, mapping, current_time)
   this.convertOfJsonToString(mapping, valueof)
  }

  convertOfJsonToString(mapping, valueof){
    for(var x in mapping)
    {
     if(mapping[x] === ""){
       continue
     }
      if(valueof.length>0){
          valueof = valueof + " ";
      }
      valueof = valueof + x +":"+mapping[x];

    }

    this.setState({
      store: mapping,
      parsedQuery: valueof

    })
    // this.props.setParsedQuery(valueof)
    // this.props.setFilterInput(mapping)
  }

  getMaxTimeRange(event, key, current_time){
      var date = new Date(current_time);
      var toTime = (date.toISOString().replace("T"," ").replace("Z","")).split(" ")
      toTime = toTime[0]
      var val = event[key]
      if(val){
        if(val === "custom2"){
          var timeExtract = this.state.modifiedDateTo["_d"]
          toTime = (timeExtract.toISOString().replace("T"," ").replace("Z","")).split(" ")
          toTime = toTime[0]
        }
        else if (val === "custom3") {
          var timeExtract = this.state.createdDateTo["_d"]
          toTime = (timeExtract.toISOString().replace("T"," ").replace("Z","")).split(" ")
          toTime = toTime[0]
        }
      }

    return  toTime

    }

  getMinTimeRange(event, key, current_time){
      var fromTime = null
      var val = event[key]
      if(val){
        if(val === "custom2" ){
          var timeExtract = this.state.modifiedDateFrom
          fromTime = (timeExtract.toISOString().replace("T"," ").replace("Z","")).split(" ")
          fromTime = fromTime[0]
        }
        else if (val=== "custom3") {
          var timeExtract = this.state.createdDateFrom["_d"]
          fromTime = (timeExtract.toISOString().replace("T"," ").replace("Z","")).split(" ")
          fromTime = fromTime[0]
        }
        else{
          var date = new Date();
          date.setDate(date.getDate()-val);
          fromTime = (date.toISOString().replace("T"," ").replace("Z","")).split(" ")
          fromTime = fromTime[0]
        }
      }

    return fromTime

    }

    dateConversion(keyName, mapping, current_time){
      if(keyName === "modified-time"){
        var minModifiedTime = this.getMinTimeRange(mapping, "modified-time", current_time)
        var maxModifiedTime = this.getMaxTimeRange(mapping, "modified-time", current_time)
        mapping["Modified-date-from"] = minModifiedTime
        mapping["Modified-date-to"] = maxModifiedTime
        delete mapping["modified-time"]

      }
      else if (keyName=== "created-time") {
        var minCreatedTime = this.getMinTimeRange(mapping, "created-time", current_time)
        var maxCreatedTime = this.getMaxTimeRange(mapping, "created-time", current_time)
        mapping["Created-date-from"] = minCreatedTime
        mapping["Created-date-to"] = maxCreatedTime
        delete mapping["created-time"]
      }
    }

  handleSelectChangeForFiletype = (value) => {

        var valueof = ""
        var mapping = this.state.store
        mapping["type"] = value
        for(var x in mapping)
        {
         if(mapping[x] === ""){
           continue
         }
          if(valueof.length>0){
              valueof = valueof + " ";
          }
          valueof = valueof + x +":"+mapping[x];

        }

        this.setState({
          store: mapping,
          parsedQuery: valueof,
          fileTypevalue: value
        })

    	}

   handleSelectChangeForExposure = (value) => {
        var mapping = this.state.store
        var valueof = ""
        mapping["exposure"] = value
        for(var x in mapping)
        {
         if(mapping[x] === ""){
           continue
         }
          if(valueof.length>0){
              valueof = valueof + " ";
          }
          valueof = valueof + x +":"+mapping[x];

        }

        this.setState({
          store: mapping,
          parsedQuery: valueof,
          exposurevalue: value
        })

      	}


render(){

  const { crazy, disabled, stayOpen, fileTypevalue, exposurevalue} = this.state;
  const exposure = exposureOptions;

  const ModifiedCustomInputBox = (
    <div className="date-picker">
      <div>
      <DatePicker selected={this.state.modifiedDateFrom}
                  onChange = {this.modifiedDateChangedFrom}
                  // onChange={this.modifiedDateChangedFrom}
                />
    </div>
    <div>
    <DatePicker selected={this.state.modifiedDateTo}
                onChange={this.modifiedDateChangedTo} />
  </div>
    </div>
  )

 const createdCustomInputBox = (
   <div className="date-picker">
     <div>
     <DatePicker selected={this.state.createdDateFrom}
                 onChange={this.createdDateChangedFrom}/>
   </div>
   <div>
   <DatePicker selected={this.state.createdDateTo}
               onChange={this.createdDateChangedTo} />
 </div>
   </div>

 )


const formContent = (
<form onSubmit={this.submit}
  className={this.props.showSearchBar && this.props.filterclick ===true ? css(styles.filterSearchForm)
    : this.props.showSearchBar?css(styles.searchForm) : 'hidden'}>
   <div className="ver-box">
     <div className="hor-box">
       <div className="div-label">
         <div className="label-class"><label>Title</label></div>
         <div className="input-class-fullbox">
           <input placeholder="Enter a term that matches part of the File name" name='title' id="title"
           type="text" onBlur={this.storeValue} /></div>
       </div>
       <div className="div-label">
         <div className="label-class"><label>Type</label></div>
           <Select className={css(styles.multioption)}
                   ref="type"
                   disabled={disabled}
                   multi
                   joinValues
                   onChange={this.handleSelectChangeForFiletype}
                   options={this.state.fileTypes}
                   placeholder="Select File Type"
                   removeSelected={this.state.removeSelected}
                   rtl={this.state.rtl}
                   simpleValue
                   value={fileTypevalue}
                 />

         <div className="label-class"><label>Size</label></div>
         <div className="file-size-wrapper">
            <div className="file-size">

              <input name="size-from" onBlur={this.storeValue} type="text" id="size-from" />
                <label>&#62; KB</label>
            </div>
            <div className="file-size">

              <input name="size-to" onBlur={this.storeValue} type="text" id="size-to" />
              <label>&#60; KB</label>
            </div>
         </div>
         <div className="label-class"><label>Owner</label></div>
         <div className="input-class">
           <input onBlur={this.storeValue} placeholder="e.g- abc@gmail.com" name="owner" type="text" id="owner" /></div>
       </div>
       <div className="div-label">
         <div className="label-class"><label>Accessible By</label></div>
         <div className="input-class">
           <input onBlur={this.storeValue} placeholder="e.g- abc@gmail.com" name="accessible-by" type="text" id="accessible-by" />
         </div>

         <div className="label-class-perms"><label>Permission</label></div>
         <div className="label-class-checkbox"><label>R</label></div>
         <div className="input-class-checkbox"><input onClick={this.storeValue} name="read" type="checkbox" id="read" value="R" /></div>
         <div className="label-class-checkbox"><label>W</label></div>
         <div className="input-class-checkbox"><input onClick={this.storeValue} name="write" type="checkbox" id="write" value="W" /></div>

        </div>
     </div>
     <div className="div-label">
       <div className="label-class"><label>Date Created</label></div>
        <div className="input-class">
          <select name="created-time" onChange={this.customInputBoxCreateTime} key="create_custom" id="created-time">
            <option name="created-time" value="">Any time</option>
            <option name="created-time" value="0">Today</option>
            <option name="created-time" value="1">Yesterday</option>
            <option name="created-time" value="7">Last 7 days</option>
            <option name="created-time" value="30">Last 30 days</option>
            <option name="created-time" value="90">Last 90 days</option>
            <option name="created-time" value="custom3" ref="create_custom" id="3">Custom...</option>
          </select>
          {this.state.showCustomInput3=== true?
          createdCustomInputBox : null}
        </div>
        <div className="label-class"><label>Date Modified</label></div>
         <div className="input-class">
           <select name="modified-time" onChange={this.customInputBoxModifiedTime} key="modified-custom" id="modified-time">
             <option  value="">Any time</option>
             <option  value="0">Today</option>
             <option  value="1">Yesterday</option>
             <option  value="7">Last 7 days</option>
             <option  value="30">Last 30 days</option>
             <option  value="90">Last 90 days</option>
             <option  value="custom2" ref="modify_custom" id="2">Custom...</option>
           </select>
           {this.state.showCustomInput2=== true?
           ModifiedCustomInputBox : null}
         </div>
     </div>
     <div className="div-label">
       <div className="label-class"><label>Exposure</label></div>
         <Select className={css(styles.multioption)}
               id="exposure"
               disabled={disabled}
               multi
               onChange={this.handleSelectChangeForExposure}
               options={exposureOptions}
               placeholder="Select Exposure Type"
               removeSelected={this.state.removeSelected}
               rtl={this.state.rtl}
               simpleValue
               value={exposurevalue}
             />

     </div>
     <div className="submission">
     <div className="reset">
       <button onClick={this.reset}>Reset</button>
     </div>
     <div className="submit">
       <button type="submit">Submit</button>
     </div>
   </div>
 </div>
</form>

)
return(
  <div>
    {formContent}
    {/* <PageContent isOneBlock={true}>
      <SearchContent
        ref="SearchContent"
        getSearchMetadata={this.state.metadata}
        submit={this.state.submitted}
        registerResourceTreeApi={this.registerResourceTreeApi}
        refreshAllTrees={this.refreshAllTrees}
        onBtExport={this.onBtExport}
      />
  </PageContent> */}
   </div>

)

}
}

export default connect(mapStateToProps,mapDispatchToProps)(SearchFormContent);
