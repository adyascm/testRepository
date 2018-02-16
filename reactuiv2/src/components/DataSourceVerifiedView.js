import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { SET_DATASOURCES } from '../constants/actionTypes';
import agent from '../utils/agent';

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
    setDataSources: (datasources) =>
        dispatch({ type: SET_DATASOURCES, payload: datasources })
});

const DataSourceVerifiedView = ChildComponent => {
    class DataSourceVerifiedViewInner extends Component {
        componentWillMount(){
            //this.props.common.datasources = [];
            if (!this.props.common.datasources)
                this.props.setDataSources(agent.Setting.getDataSources());
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
