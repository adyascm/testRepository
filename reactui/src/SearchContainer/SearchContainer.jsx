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
import * as APICall from './util/APICall';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import { selectors } from '../PermissionsApp/reducer';
import PageContent from '../PageContent';
import throttle from 'lodash/throttle';
import { SET_WIDGET_REPORT as setWidgetReport} from '../PermissionsApp/actions';
import ExportCsvButton from '../ExportCsvButton';
// import 'bootstrap-select';
import Select from 'react-select';
import 'react-select/dist/react-select.css';


const mapStateToProps = (state,{auth}) => ({
  getProfile: () => authSelectors.getProfile(state.auth),
  getTopLevelResources: (email) => selectors.getTopLevelResources(state, email),
  profile: authSelectors.getProfile(auth),
  getWidgetReport: () => selectors.getWidgetReport(state),
  getActiveResourceListType: () => selectors.getActiveResourceListType(state)
});

const mapDispatchToProps = {
  setWidgetReport
}

const styles = StyleSheet.create({
  pageHeader: {
    display: 'flex',
    padding: `0 ${spaces.m}`,
    height: `3em`,
    backgroundColor: colors.background,
    justifyContent: 'space-around',
    //width:'90%',
  },
  pageHeaderSection: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    margin: 0,
  },
  PageHeaderSearch: {
    border: '1px solid #1f232c',
    width: '100%',
    marginTop: '6px',
    marginBottom: '6px',
    backgroundColor: '#32363f',
    position: 'relative',
    display: 'flex',

  },

  searchForm:{
  padding: '20px',
  marginTop: '30px',
  border: `solid ${spaces.xxxs} ${colors.text}`,
  backgroundColor: '#32363f',
  minHeight: '6.666666666666666rem',
  width: '95%',
  position: 'absolute',
  zIndex:1,
  display: 'inline-flex'

},
  pageHeaderSection_Right: {
    justifyContent: 'flex-end'
  },
  multioption:{
    width: '239px',
    margin:'0 20px 24px 10px',

  }
});

const exposureOptions = [
  {value: 'Public', label: 'Public' , id:'exposure'},
  {value: 'External', label: 'External' , id:'exposure'},
  {value: 'Internal', label: 'Internal', id:'exposure'},
  {value: 'Domain', label: 'Domain', id:'exposure'},
  {value: 'Private', label: 'Private', id:'exposure'}
]


class SearchContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSearchBar: false,
      createdDateFrom: moment(),
      createdDateTo: moment(),
      modifiedDateFrom: moment(),
      modifiedDateTo: moment(),
      showCustomInput2: false,
      showCustomInput3: false,
      filerSearchData: {},
      metadata: [],
      manageDatasource:[],
      leftGridWidth: 0,
      store: {},
      editInputBox: false,
      parsedQuery : "",
      fileTypes: [],
      submitted: false,
      searchCsvData: [],
      finalinput: {},
      removeSelected: true,
			disabled: false,
			crazy: false,
			stayOpen: false,
			exposurevalue: [],
      fileTypevalue : [],
			rtl: false,
      columnNames: ['resource_name', 'resource_path', 'rd_type', 'rd_owner_user_id', 'rd_size', 'rd_creation_datetime', 'rd_last_modified_datetime']
    }
    this.showSearchForm = this.showSearchForm.bind(this);
    this.closeSearchFormBox = this.closeSearchFormBox.bind(this);
    this.modifiedDateChangedFrom = this.modifiedDateChangedFrom.bind(this);
    this.modifiedDateChangedTo = this.modifiedDateChangedTo.bind(this);
    this.createdDateChangedFrom = this.createdDateChangedFrom.bind(this);
    this.createdDateChangedTo = this.createdDateChangedTo.bind(this);
    this.submit = this.submit.bind(this);
    this.storeValue= this.storeValue.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.getProfile()) {
      let datasource = [];
      let arry = this.props.getTopLevelResources(this.props.getProfile().email);
      if(arry) {
        arry.map((data)=> {
          datasource.push({
            'text': data[1],
            'external':false,
          })
          return datasource;
        });
        this.setState({
          manageDatasource:datasource
        })
      } else {
        this.setState({
          manageDatasource:datasource
        })
      }

    }
  }

  showSearchForm(e) {
    this.setState({
      showSearchBar: !this.state.showSearchBar
    })
    var finalresult = this.state.store
    var formkeys = ["title", "type", "size-from", "size-to", "owner", "accessible-by",
                     "read", "write", "Creation-time-from", "Creation-time-to",
                     "Modified-time-from", "Modified-time-to", "exposure"]
      for(var i in formkeys){
        var key = formkeys[i];
        if(key in finalresult){
          var val =   finalresult[key]
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

  closeSearchFormBox(e) {
    var finalresult = this.parseFunc(e.target.value,{})
    this.setState({
      showSearchBar: false,
      editInputBox: true,
      parsedQuery: e.target.value,
      store: finalresult
    })

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

  storeValue = (e) => {
    var valueof="";
    var mapping = {}
    var current_time=new Date().getTime()
    mapping = this.state.store
    mapping[e.target.name]= e.target.value
    console.log("mapping ", mapping)
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

  handleKeyPress = (e) => {

    if (e.key === 'Enter') {
      this.submit(e)
    }
  }


  submit = (e) => {
    console.log("E : ", e)
    this.setState({
      finalinput: {}
    })
    var queryString;
    var current_time=new Date().getTime()
    queryString = document.getElementById("search_text").value
    const formValues = serializeForm(e.target, { hash: true })
    console.log("formValues ", formValues)
    var finalinput = this.parseFunc(queryString, formValues)
    if(this.state.fileTypevalue){
      finalinput.type = this.state.fileTypevalue
    }
    if(this.state.exposurevalue){
      finalinput.exposure = this.state.exposurevalue
    }
    finalinput.email = this.props.profile.email
    finalinput.authtoken = this.props.profile.authToken
    finalinput.event_type = "get_metadata_filter"
    finalinput.column_names = this.state.columnNames
    console.log("finalinput ", finalinput)
    APICall.getFilteredMetadata(finalinput).then(response => {
        this.setState({
          metadata: response,
          submitted: true,
          finalinput: finalinput
        })
    })

    this.setState({
      showSearchBar: false,
      // filerSearchData: result

    })
      e.preventDefault()


  }

  componentDidMount(){
    var filteTypeSet = []
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
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
    //console.log("Grid api : ", api.exportDataAsCsv);
    this.resourceTreeApi = api;
    }
  refreshAllTrees = throttle(() => {
    this.resourceTreeApi && this.resourceTreeApi.refreshView()
  }, 300);

  handleClick = (e) => {
    if(e.target.className.indexOf("columnizer") != -1){
      this.setState({
        showSearchBar:false,
      })
    }

  }
  componentWillMount() {
    document.addEventListener('click', this.handleClick, false);
    if (this.props.getWidgetReport() === true)
      this.props.setWidgetReport(false);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick, false);
  }
  onBtExport = (api) => {
    //console.log("registerResourceTreeApi", registerResourceTreeApi())
    // this.resourceTreeApi.exportDataAsCsv();
    var report_input = this.state.finalinput
    report_input["display_names"] = {
      'resource_name': "File Name",
      'resource_path': "File Path",
      'rd_type': "File Type",
      'rd_owner_user_id': "Owner",
      'rd_size': "Size (KB)",
      'rd_creation_datetime': "Creation Date",
      'rd_last_modified_datetime': "Modified Date"
    }
    report_input["event_type"] = "generate_csv_report"
    report_input["flag"] = "filter_report"
    APICall.getCsvReportUrl(report_input).then(response => {
        window.location.assign(response)
    })
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


  render() {

    const { crazy, disabled, stayOpen, fileTypevalue, exposurevalue} = this.state;
    const exposure = exposureOptions;

    let exportdivSearch = (this.state.metadata != 0)?
    <ExportCsvButton onBtExport={this.onBtExport} getActiveResourceListType={this.props.getActiveResourceListType}/>: ''

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

      <form onSubmit={this.submit}className={this.state.showSearchBar? css(styles.searchForm): 'hidden'}>
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
                        id="type"
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
                  <option name="created-time" value="custom3" ref="create_custom" id="custom-created-date">Custom...</option>
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
                   <option  value="custom2" ref="modify_custom" id="custom-modified-date">Custom...</option>
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
             <button type="submit" >Submit</button>
           </div>
         </div>
       </div>
    </form>

    )

    return (
      <div>
        <div className={css(styles.pageHeader)}>
          <div className={css(styles.PageHeaderSearch)}>
            <div className="PageHeaderSearchBox">
            <input className="Search_text_box"
              type="text"
              placeholder='Search'
              // onBlur = {this.submit}
              id = "search_text"
              onKeyPress={this.handleKeyPress}
              onChange = {this.closeSearchFormBox}
              value = {this.state.parsedQuery}
              // onClick = {this.closeSearchFormBox}
            />
            <div className="PageHeaderSearchArrow" onClick={this.showSearchForm} title="show search options"></div>
              {
                this.state.showSearchBar ? formContent: formContent
              }
          </div>
          <div className="search_icon" onClick={this.submit}></div>
          </div>
        </div>
        <PageContent isOneBlock={true}>
          <SearchContent
            ref="SearchContent"
            getSearchMetadata={this.state.metadata}
            submit={this.state.submitted}
            registerResourceTreeApi={this.registerResourceTreeApi}
            refreshAllTrees={this.refreshAllTrees}
            onBtExport={this.onBtExport}
            columnNames = {this.state.columnNames}
          />
      </PageContent>
      {/*<button style={{border: '2px solid #d88733', color: '#d88733'}} onClick={this.onBtExport.bind(this)}>Export to CSV</button>*/}
      {/*<ExportCsvButton onBtExport={this.onBtExport.bind(this)}/>*/}
      {/*<ExportCsvButton onBtExport={this.onBtExport} getActiveResourceListType={this.props.getActiveResourceListType}/>*/}
      {exportdivSearch}

    </div>
    );
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(SearchContainer);
