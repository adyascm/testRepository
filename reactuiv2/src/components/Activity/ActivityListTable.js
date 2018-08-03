import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Loader, Dimmer, Button, Table, Input, Icon} from 'semantic-ui-react';
import agent from '../../utils/agent';
import { IntlProvider, FormattedRelative } from 'react-intl';
import DatePicker from 'react-datepicker'



import {
  ACTIVITIES_PAGE_LOAD_START,
  ACTIVITIES_PAGE_LOADED,
  ACTIVITIES_SET_ROW_DATA,
  ACTIVITIES_PAGINATION_DATA,
  ACTIVITIES_FILTER_CHANGE
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
  ...state.common,
  ...state.activity
});

const mapDispatchToProps = dispatch => ({
  onLoadStart: () => dispatch({ type: ACTIVITIES_PAGE_LOAD_START }),
  onLoad: (payload) => dispatch({ type: ACTIVITIES_PAGE_LOADED, payload }),
  setRowData: (payload) => dispatch({ type: ACTIVITIES_SET_ROW_DATA, payload }),
  changeFilter: (property, value) => dispatch({ type: ACTIVITIES_FILTER_CHANGE, property, value }),
  setPaginationData: (pageNumber, pageLimit) => dispatch({ type: ACTIVITIES_PAGINATION_DATA, pageNumber, pageLimit }),
});

class ActivityListTable extends Component {
  constructor(props){
    super(props);

    this.state = {
        columnHeaders: [
          "Timestamp",
          "Connector",
          "Actor",
          "Event Type"
        ],
        currentDate: '',
        domain_id: this.props.currentUser['domain_id'],
        filterConnectorType: "",
        filterEventType: "",
        filteractor: "",
        columnHeaderDataNameMap:{
            "Timestamp": "timestamp",
            "Connector": "connector_type",
            "Actor": "actor",
            "Event Type": "event_type"
        }
    }
  }

  componentWillMount() {
      this.props.onLoadStart()
      this.props.onLoad(agent.Activity.getAllActivites({'domain_id': this.state.domain_id, 'timestamp': this.props.filterByDate, 'actor': this.props.filteractor,
                   'connector_type':this.props.filterConnectorType, 'event_type': this.props.filterEventType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit}))
  }

  componentWillUnmount() {
      this.props.setPaginationData(0, 100)
  }

  componentWillReceiveProps(nextProps) {
      if (nextProps !== this.props) {
          if (nextProps.filterConnectorType !== this.props.filterConnectorType || nextProps.filterEventType !== this.props.filterEventType ||
              nextProps.pageNumber !== this.props.pageNumber || nextProps.filteractor !== this.props.filteractor || nextProps.filterByDate !== this.props.filterByDate) {
                nextProps.onLoadStart()
                nextProps.onLoad(agent.Activity.getAllActivites({'domain_id': this.state.domain_id, 'timestamp': nextProps.filterByDate, 'actor': nextProps.filteractor,
                             'connector_type':nextProps.filterConnectorType, 'event_type': nextProps.filterEventType, 'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit}))

          }
      }
  }

  handleClick = (event, rowData) => {
      event.preventDefault()
      this.props.setRowData(rowData)
  }

  handleDateChange = (date) => {
      let selectedDate = date ? date.format('YYYY-MM-DD HH:MM:SS') : ''
      this.setState({
          currentDate: date ? date : ''
      })
      this.props.changeFilter("filterByDate", selectedDate)
  }

  clearFilterData = (stateKey) => {
      if (stateKey === 'filterConnectorType')
          this.setState({
              filterConnectorType: ''
          })
      else if (stateKey === 'filterEventType')
          this.setState({
              filterEventType: ''
          })
      else if (stateKey === 'filterByDate') {
        this.setState({
            filterByDate: ''
        })
      }
      else if (stateKey === 'filteractor') {
        this.setState({
            filteractor: ''
        })

      }
      if (this.props[stateKey] !== '')
          this.props.changeFilter(stateKey, '')
  }

  handleEventTypeChange = (event) => {
      this.setState({
          filterEventType: event.target.value
      })
  }

  handleConnectorTypeChange = (event) => {
      this.setState({
          filterConnectorType: event.target.value
      })
  }

  handleActorChange = (event) => {
      this.setState({
          filteractor: event.target.value
      })
  }

  handleColumnSort = (mappedColumnName) => {
      if (this.state.columnNameClicked !== mappedColumnName) {
          this.props.onLoadStart()

          this.props.onLoad(agent.Activity.getAllActivites({'domain_id': this.state.domain_id, 'timestamp': this.props.filterByDate, 'actor': this.props.filteractor,
                         'connector_type':this.props.filterConnectorType, 'event_type': this.props.filterEventType,
                         'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit, 'sortColumn': mappedColumnName, 'sortType': 'asc'
          }))
          this.setState({
              columnNameClicked: mappedColumnName,
              sortOrder: 'ascending'
          })
      }
      else {
          this.props.onLoadStart()

          this.props.onLoad(agent.Activity.getAllActivites({'domain_id': this.state.domain_id, 'timestamp': this.props.filterByDate, 'actor': this.props.filteractor,
                         'connector_type':this.props.filterConnectorType, 'event_type': this.props.filterEventType, 'pageNumber': this.props.pageNumber,
                         'pageSize': this.props.pageLimit, 'sortColumn': mappedColumnName, 'sortType': this.state.sortOrder === 'ascending' ? 'desc' : 'asc'}))
          this.setState({
              sortOrder: this.state.sortOrder === 'ascending' ? 'descending' : 'ascending'
          })
      }
  }

  handleKeyPress = (event, filterType, filterValue) => {
      if (event.key === 'Enter') {
          this.props.changeFilter(filterType, filterValue);
      }
  }

  handleNextClick = () => {
      this.props.setPaginationData(this.props.pageNumber + 1, this.props.pageLimit)
  }

  handlePreviousClick = () => {
      this.props.setPaginationData(this.props.pageNumber - 1, this.props.pageLimit)
  }


  render(){
    let tableHeaders = this.state.columnHeaders.map(headerName => {
        let mappedColumnName = this.state.columnHeaderDataNameMap[headerName]
        return (
            <Table.HeaderCell key={headerName}
                sorted={this.state.columnNameClicked === mappedColumnName ? this.state.sortOrder : null}
                onClick={() => this.handleColumnSort(mappedColumnName)} >
                {headerName}
            </Table.HeaderCell>
        )
    })

    let tableRowData = null
    let activitiesData = null

    if (this.props.activitySearchPayload)
        activitiesData = this.props.activitySearchPayload
    else if (this.props.activitiesDataPayload)
        activitiesData = this.props.activitiesDataPayload

    if (activitiesData)
        tableRowData = activitiesData.map(rowData => {
            return (
                <Table.Row key={rowData['_id']} onClick={(event) => this.handleClick(event, rowData)} style={this.props.rowData === rowData ? { 'backgroundColor': '#2185d0' } : null}>
                    <Table.Cell width='3'><IntlProvider locale='en'><FormattedRelative value={rowData["timestamp"]} /></IntlProvider ></Table.Cell>
                    <Table.Cell width='3'>{rowData["connector_type"]}</Table.Cell>
                    <Table.Cell width='3'>{rowData["actor"]}</Table.Cell>
                    <Table.Cell width='3'>{rowData["event_type"]}</Table.Cell>
                </Table.Row>
            )
        })

      let dimmer = (
          <Dimmer active inverted>
              <Loader inverted content='Loading' />
          </Dimmer>
      )

      if (this.props.isLoadingActivities || activitiesData) {
          let filterMetadata = {'timestamp': this.props.filterByDate, 'actor': this.props.filteractor,
                       'connector_type':this.props.filterConnectorType, 'event_type': this.props.filterEventType}
          return(
            <div>
                <div ref="table" style={{ 'minHeight': document.body.clientHeight / 1.25, 'maxHeight': document.body.clientHeight / 1.25, 'overflow': 'auto', 'cursor': 'pointer' }}>
                    <Table celled selectable striped compact='very' sortable>
                        <Table.Header style={{ 'position': 'sticky', 'top': '50px', 'width': '100%' }}>
                            <Table.Row>
                                {tableHeaders}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                        <Table.Row>
                            <Table.Cell width='3'>
                                <Input fluid placeholder='Filter by Date...'>
                                    <DatePicker
                                        selected={this.state.currentDate}
                                        onChange={this.handleDateChange}
                                        dateFormat="LLL"
                                    />
                                </Input>
                            </Table.Cell>
                            <Table.Cell width='2'>
                                <Input fluid placeholder='Filter by type...' icon={this.state.filterConnectorType.length > 0 ? <Icon name='close' link onClick={() => this.clearFilterData('filterConnectorType')} /> : false} value={this.state.filterConnectorType} onChange={this.handleConnectorTypeChange} onKeyPress={(event) => this.handleKeyPress(event, "filterConnectorType", this.state.filterConnectorType)} />
                            </Table.Cell>
                            <Table.Cell width='2'>
                                <Input fluid placeholder='Filter by type...' icon={this.state.filteractor.length > 0 ? <Icon name='close' link onClick={() => this.clearFilterData('filteractor')} /> : false} value={this.state.filteractor} onChange={this.handleActorChange} onKeyPress={(event) => this.handleKeyPress(event, "filteractor", this.state.filteractor)} />
                            </Table.Cell>
                            <Table.Cell width='3'>
                                <Input fluid placeholder='Filter by folder...' icon={this.state.filterEventType.length > 0 ? <Icon name='close' link onClick={() => this.clearFilterData('filterEventType')} /> : false} value={this.state.filterEventType} onChange={this.handleEventTypeChange} onKeyPress={(event) => this.handleKeyPress(event, "filterEventType", this.state.filterEventType)} />
                            </Table.Cell>
                        </Table.Row>
                        {tableRowData}
                        </Table.Body>
                    </Table>
                    {this.props.isLoadingActivities ? dimmer : null}
                </div>
                <div style={{ marginTop: '10px' }} >
                    <div style={{float: 'right'}}>
                        {this.props.pageNumber > 0 ? (<Button color='green' size="mini" style={{ width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
                        {(!tableRowData || tableRowData.length < this.props.pageLimit) ? null : (<Button color='green' size="mini" style={{ width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                    </div>
                </div>
            </div>
          )
      }
    else {
      return (
          <div style={{ textAlign: 'center' }}>
              No Activities to display for domain
          </div>
      )
    }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ActivityListTable);
