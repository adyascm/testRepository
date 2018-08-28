import React, { Component } from 'react';
import { connect } from 'react-redux';
import agent from '../../utils/agent';

import { Checkbox, Menu, Input, Button } from 'semantic-ui-react'
import DatePicker from 'react-datepicker'
import {ACTIVITIES_PAGE_LOADED, ACTIVITIES_FILTER_CHANGE, ACTIVITIES_PAGINATION_DATA} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.activity,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onLoadActivities: (payload) => dispatch({ type: ACTIVITIES_PAGE_LOADED, payload }),
    changeFilter: (property, value) => dispatch({ type: ACTIVITIES_FILTER_CHANGE, property, value}),
    setPaginationData: (pageNumber, pageLimit) => dispatch({ type: ACTIVITIES_PAGINATION_DATA, pageNumber, pageLimit }),
});

class ActivityFilters extends Component {
    constructor(props){
        super(props);
        this.state = {
            selectAllEventTypes:true,
            selectedEventTypes:{},
            selectedConnectors:{
                "GSUITE": true,
                "SLACK": true
            },
            currentDate:"",
            filteractor:""
        }
    }

    componentWillMount() {
        let selectedEventTypes = this.state.selectedEventTypes
        for (let event of this.props.all_activity_events) {
            selectedEventTypes[event[0]] = true
        }
        this.fetchActivityList()
        this.setState({
            selectedEventTypes: selectedEventTypes
        })
    }

    handleEventTypeSelection = (data) => {
        let selectedEventTypes = this.state.selectedEventTypes
        selectedEventTypes[data.label] =  data.label in selectedEventTypes ? !selectedEventTypes[data.label] : true
        this.setState({
            selectedEventTypes:selectedEventTypes,
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
            selectedConnectors:selectedConnectors
        })   
    }

    handleAllEventTypeSelection = () => {
        let selectAllEventTypes = !this.state.selectAllEventTypes
        let selectedEventTypes = this.state.selectedEventTypes
        for(let event of this.props.all_activity_events){
            selectedEventTypes[event[0]] = selectAllEventTypes
        }
        this.setState({
            selectAllEventTypes: selectAllEventTypes,
            selectedEventTypes:selectedEventTypes,
        })
    }

    handleDateChange = (date) => {
        let selectedDate = date ? date.format('YYYY-MM-DD HH:MM:SS') : ''
        this.setState({
            currentDate: date ? date : ''
        })
        this.props.changeFilter("filterByDate", selectedDate)
    }

    clearFilterData = (stateKey) => {
        let stateValue = undefined
        if (stateKey === 'filterConnectorType'){
            stateValue = {}
            this.setState({
                selectedConnectors:{},
            })
        }
        else if (stateKey === 'filterEventType'){
            stateValue = {}
            this.setState({
                selectedEventTypes:{}
            })
        }
        else if (stateKey === 'filterByDate') {
            stateValue = ''
            this.setState({
                currentDate: ''
            })
        }
        else if (stateKey === 'filteractor') {
            stateValue = ''
            this.setState({
                filteractor: ''
            })
        }
        if(stateKey){
            this.props.changeFilter(stateKey,stateValue)
        }
    }


    fetchActivityList = () => {
        this.props.setPaginationData(0, this.props.pageLimit)
        this.props.changeFilter('filterEventType', this.state.selectedEventTypes)
        this.props.changeFilter('filterConnectorType', this.state.selectedConnectors)

        let selectedConnectors = []
        let selectedEventTypes = []
        for(let k in this.state.selectedEventTypes){
            if(this.state.selectedEventTypes[k]){
                selectedEventTypes.push(k)
            }
        }
        for(let k in this.state.selectedConnectors){
            if(this.state.selectedConnectors[k]){
                selectedConnectors.push(k)
            }
        }
        
        this.props.onLoadActivities(agent.Activity.getAllActivites({
            'domain_id': this.props.currentUser['domain_id'], 'timestamp': this.state.currentDate ? this.state.currentDate.format('YYYY-MM-DD HH:MM:SS'): '', 'actor': this.props.filteractor,
            'connector_type': selectedConnectors, 'event_type': selectedEventTypes, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit
        }));
    }

    render() {
        
        let filter_events = this.props.all_activity_events.map((filter_event) => {
            return(
                <Menu.Item>
                    <Checkbox label={filter_event[0]} onChange={(event, data) => this.handleEventTypeSelection(data)} checked={this.state.selectedEventTypes[filter_event[0]]} />
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
                                                dateFormat="LLL"
                                                selected={this.state.currentDate}
                                                />
                                            </Input>
                            </Menu.Item>
                        </Menu.Menu>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.Header>Connector</Menu.Header>
                        <Menu.Menu>
                            <Menu.Item>
                                <Checkbox label='GSUITE' onChange={(event, data) => this.handleConnectorSelection(event, data)} checked={this.state.selectedConnectors['GSUITE']} />
                            </Menu.Item>
                            <Menu.Item>
                            <Checkbox label='SLACK' onChange={(event, data) => this.handleConnectorSelection(event, data)} checked={this.state.selectedConnectors['SLACK']} />
                            </Menu.Item>
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
                <Button size="mini" style={{ width: '80px', float: 'right' }} onClick={(event, data) => {this.fetchActivityList()}}>
                    Submit
                </Button>
            </div>
        )
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(ActivityFilters);