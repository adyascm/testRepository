import React, { Component } from 'react';
import { connect } from 'react-redux';
import agent from '../../utils/agent';

import { Checkbox, Menu, Input, Button } from 'semantic-ui-react'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import GroupSearch from '../Search/GroupSearch';
import {DEFAULT_FILTER_BY_DATE_FOR_ACTIVITY_EVENTS, ACTIVITIES_PAGE_LOAD_START, ACTIVITIES_PAGE_LOADED, ACTIVITIES_FILTER_CHANGE, ACTIVITIES_PAGINATION_DATA, ACTIVITIES_CHART_LOADED} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.activity,
    ...state.common,
    filterActor:state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
    onLoadActivities: (payload) => dispatch({ type: ACTIVITIES_PAGE_LOADED, payload }),
    changeFilter: (property, value) => dispatch({ type: ACTIVITIES_FILTER_CHANGE, property, value }),
    setPaginationData: (pageNumber, pageLimit) => dispatch({ type: ACTIVITIES_PAGINATION_DATA, pageNumber, pageLimit }),
    onChartLoad: (payload) => dispatch({ type: ACTIVITIES_CHART_LOADED, payload }),
    onLoadStart: () => dispatch({ type: ACTIVITIES_PAGE_LOAD_START }),
});

class ActivityFilters extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectAllEventTypes: true,
            selectedEventTypes: {},
            selectedConnectors: {},
            currentDate: moment(),
        }
    }

    componentWillMount() {
        this.props.onLoadStart();
        let selectedEventTypes = this.state.selectedEventTypes
        let selectedConnectors = this.state.selectedConnectors
        let currentFilterActor = ''
        this.props.datasources.map((ds) => {
            selectedConnectors[ds.datasource_type] = true
        })
        for (let event of this.props.unique_activity_events) {
            selectedEventTypes[event] = true
        }
        let currentDate = moment().subtract(DEFAULT_FILTER_BY_DATE_FOR_ACTIVITY_EVENTS, "days")
        this.setState({
            selectedEventTypes,
            selectedConnectors,
            currentDate:currentDate,
        })
        this.fetchActivityList({selectedEventTypes,selectedConnectors, currentDate, currentFilterActor})
    }

    handleEventTypeSelection = (data) => {
        let selectedEventTypes = this.state.selectedEventTypes
        selectedEventTypes[data.label] = data.label in selectedEventTypes ? !selectedEventTypes[data.label] : true
        this.setState({
            selectedEventTypes: selectedEventTypes,
        })
        if (!selectedEventTypes[data.label]) {
            this.setState({
                selectAllEventTypes: false
            })
        }
    }

    handleConnectorSelection = (event, data) => {
        let selectedConnectors = this.state.selectedConnectors
        selectedConnectors[data.label] = data.label in selectedConnectors ? !selectedConnectors[data.label] : true
        this.setState({
            selectedConnectors: selectedConnectors
        })
    }

    handleAllEventTypeSelection = () => {
        let selectAllEventTypes = !this.state.selectAllEventTypes
        let selectedEventTypes = this.state.selectedEventTypes
        for (let event of this.props.unique_activity_events) {
            selectedEventTypes[event] = selectAllEventTypes
        }
        this.setState({
            selectAllEventTypes: selectAllEventTypes,
            selectedEventTypes: selectedEventTypes,
        })
    }

    handleDateChange = (date) => {
        this.setState({
            currentDate: date ? date : ''
        })
    }


    fetchActivityList = (payload) => {
        let currentSelectedConnectors, currentSelectAllEventTypes, currentDateObj, currentFilterActor 
        currentSelectAllEventTypes = currentSelectAllEventTypes = currentDateObj = currentFilterActor = undefined
        if(payload){
            currentSelectAllEventTypes = payload.selectedEventTypes
            currentSelectedConnectors = payload.selectedConnectors
            currentDateObj = payload.currentDate
            currentFilterActor = payload.currentFilterActor
        }else{
            currentSelectAllEventTypes = this.state.selectedEventTypes
            currentSelectedConnectors = this.state.selectedConnectors
            currentDateObj = this.state.currentDate
            currentFilterActor = this.props.filterActor ? this.props.filterActor.email : ''
        }
        this.props.setPaginationData(0, this.props.pageLimit)
        this.props.changeFilter('filterEventType', currentSelectAllEventTypes)
        this.props.changeFilter('filterConnectorType', currentSelectedConnectors)
        this.props.changeFilter('filterActor',currentFilterActor)
        let selectedDate = currentDateObj ? currentDateObj.format('YYYY-MM-DD HH:mm:ss') : ''
        this.props.changeFilter('filterByDate', selectedDate)
        let selectedConnectors = []
        let selectedEventTypes = []
        for (let k in this.state.selectedEventTypes) {
            if (this.state.selectedEventTypes[k]) {
                selectedEventTypes.push(k)
            }
        }
        for (let k in this.state.selectedConnectors) {
            if (this.state.selectedConnectors[k]) {
                selectedConnectors.push(k)
            }
        }
        
        let putFilters = {
            'domain_id': this.props.currentUser['domain_id'], 'timestamp': selectedDate, 'actor': currentFilterActor,
            'connector_type': selectedConnectors, 'event_type': selectedEventTypes, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit,
            'sortColumn': '', 'sortOrder': 'desc'
        }  

        this.props.onLoadActivities(agent.Activity.getAllActivites(putFilters));
        this.props.onChartLoad(agent.Dashboard.getWidgetData({'widget_id': 'activitiesByEventType', 'event_filters': putFilters}));
    }

    render() {
        let filter_events = this.props.unique_activity_events.map((filter_event) => {
            return(
                <Menu.Item>
                    <Checkbox label={filter_event} onChange={(event, data) => this.handleEventTypeSelection(data)} checked={this.state.selectedEventTypes[filter_event]} />
                </Menu.Item>
            )
        })
        let connectors = this.props.datasources.map((ds) => {
            return (
                <Menu.Item>
                    <Checkbox label={ds.datasource_type} onChange={(event, data) => this.handleConnectorSelection(event, data)} checked={this.state.selectedConnectors[ds.datasource_type]} />
                </Menu.Item>
            )
        })

        return (
            <div>
                <Menu vertical style={{ "textAlign": "left", 'overflow': 'auto', 'maxHeight': document.body.clientHeight / 1.25 }} fluid>
                    <Menu.Item>
                        <Menu.Header>Date Since</Menu.Header>
                        <Menu.Menu>
                            <Menu.Item>
                                <Input fluid placeholder='Filter by Date...'>
                                    <DatePicker
                                        onChange={this.handleDateChange}
                                        dateFormat="YYYY-MM-DD"
                                        selected={this.state.currentDate}
                                    />
                                </Input>
                            </Menu.Item>
                        </Menu.Menu>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.Header>Email</Menu.Header>
                        <Menu.Menu>
                            <Menu.Item>
                                <GroupSearch />
                            </Menu.Item>    
                        </Menu.Menu>
                    </Menu.Item>

                    <Menu.Item>
                        <Menu.Header>Connector</Menu.Header>
                        <Menu.Menu>
                            {connectors}
                        </Menu.Menu>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.Header>Event Types</Menu.Header>
                        <Menu.Menu> 
                            <Menu.Item>
                                <Checkbox onChange={this.handleAllEventTypeSelection} checked={this.state.selectAllEventTypes} label='Select All' />
                            </Menu.Item>
                            {filter_events}
                        </Menu.Menu>
                    </Menu.Item>
                </Menu>
                <Button size="mini" style={{ width: '80px', float: 'right' }} onClick={(event, data) => { this.fetchActivityList() }}>
                    Submit
                </Button>
            </div>
        )
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(ActivityFilters);