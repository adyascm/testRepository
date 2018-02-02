import React, { Component } from 'react';
import '../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import {
  HOME_PAGE_LOADED,
  HOME_PAGE_UNLOADED
} from '../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.home,
    appName: state.common.appName,
    currentUser: state.common.currentUser
  });
  
  const mapDispatchToProps = dispatch => ({
    onLoad: (tab, pager, payload) =>
      dispatch({ type: HOME_PAGE_LOADED, tab, pager, payload }),
    onUnload: () =>
      dispatch({  type: HOME_PAGE_UNLOADED })
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