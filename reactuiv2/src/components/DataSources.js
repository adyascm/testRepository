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

class DataSources extends Component {
    componentWillMount(){
      this.props
    }
    render() {
      return(
        <div>
          <h1 >This is the datasources config view</h1>
          <div className="container page">
                        <div className="row">

                            <div className="col-md-6 offset-md-3 col-xs-12">

                                <button
                                    className="btn btn-lg btn-primary pull-xs-center"
                                    
                                    disabled={this.props.inProgress}>
                                    Click here to connect Google Drive
                                </button>
                            </div>

                        </div>
                    </div>
                    </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DataSources);