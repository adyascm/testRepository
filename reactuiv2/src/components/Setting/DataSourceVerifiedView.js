import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { 
    SET_DATASOURCES, 
    FETCH_ALERTS_COUNT,
    GET_ALL_CONSTANT_EVENTS
    // USERS_PAGE_LOAD_START,
    // USERS_PAGE_LOADED
} from '../../constants/actionTypes';
import agent from '../../utils/agent';
import common from '../../utils/common'

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
    setDataSources: (datasources) =>
        dispatch({ type: SET_DATASOURCES, payload: datasources }),
    // loadUsersTreeData: (payload) =>
    //     {
    //         dispatch({ type: USERS_PAGE_LOAD_START });
    //         dispatch({ type: USERS_PAGE_LOADED, payload });
    //     },
    fetchAlertsCount: (alertsCount) => 
        dispatch({ type: FETCH_ALERTS_COUNT, alertsCount }),
    loadEvents: (payload) =>
        dispatch({ type: GET_ALL_CONSTANT_EVENTS, payload })
});

const DataSourceVerifiedView = ChildComponent => {
    class DataSourceVerifiedViewInner extends Component {
        componentWillMount() {
            if (!this.props.common.datasources)
                this.props.setDataSources(agent.Setting.getDataSources());
            if (!this.props.common.all_actions_list && !this.props.common.all_activity_events) {
                this.props.loadEvents(agent.ConstantEvents.getAllEvents())
            }
            // if ((this.props.common.datasources && this.props.common.datasources.length > 0) && 
            // (!this.props.users.isLoadingUsers && !this.props.users.usersTreePayload))
            // {
            //     this.props.loadUsersTreeData(agent.Users.getUsersTree());
            // }
            if ((this.props.common.datasources && this.props.common.datasources.length > 0) &&
                (this.props.alert.alertsCount === undefined)) {
                agent.Alert.getAlertsCount().then(response => {
                    this.props.fetchAlertsCount(response)
                })
            }
            
        }
        render() {
            if (!this.props.common.datasources) {
                return null;
            }
            else if (this.props.common.datasources.length < 1) {
                return (
                    <Redirect to="/datasources" />
                );
            }
            return <ChildComponent {...this.props} />
        }
    }

    return connect(mapStateToProps, mapDispatchToProps)(DataSourceVerifiedViewInner);
}

export default DataSourceVerifiedView;
