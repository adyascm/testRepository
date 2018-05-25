import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { 
    SET_DATASOURCES, 
    GET_ALL_ACTIONS,
    FETCH_ALERTS_COUNT 
} from '../../constants/actionTypes';
import agent from '../../utils/agent';
import common from '../../utils/common'

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
    setDataSources: (datasources) =>
        dispatch({ type: SET_DATASOURCES, payload: datasources }),
    loadActions: (payload) =>
        dispatch({ type: GET_ALL_ACTIONS, payload }),
    fetchAlertsCount: (alertsCount) => 
        dispatch({ type: FETCH_ALERTS_COUNT, alertsCount })    
});

const DataSourceVerifiedView = ChildComponent => {
    class DataSourceVerifiedViewInner extends Component {
        componentWillMount() {
            if (!this.props.common.datasources)
                this.props.setDataSources(agent.Setting.getDataSources());
            if (!this.props.common.all_actions_list) {
                this.props.loadActions(agent.Actions.getAllActions())
            }
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
