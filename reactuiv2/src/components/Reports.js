import React, { Component } from 'react';
import '../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import {
  REPORTS_PAGE_LOADED,
  REPORTS_PAGE_UNLOADED
} from '../constants/actionTypes';

const mapStateToProps = state => ({
    appName: state.common.appName,
    currentUser: state.common.currentUser
  });
  
  const mapDispatchToProps = dispatch => ({
    onLoad: (tab, pager, payload) =>
      dispatch({ type: REPORTS_PAGE_LOADED, tab, pager, payload }),
    onUnload: () =>
      dispatch({  type: REPORTS_PAGE_UNLOADED })
  });

class Reports extends Component {
  
    render() {
      if (this.props.currentUser){
        return(
          <h1 >This is the reports view and configuration view</h1>
        )
      }
      else{
        return (
          <Redirect to="/login" />
      );
      }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Reports);