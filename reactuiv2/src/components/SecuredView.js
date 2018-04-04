import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { LOGOUT } from '../constants/actionTypes';

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
});

const SecuredView = ChildComponent => {
    class SecuredViewInner extends Component {
        render() {
            if (!this.props.common.currentUser) {
                return (
                      <Redirect to={{ pathname: "/login"}} />
                  );
            }

            return <ChildComponent {...this.props} />
        }
    }

    return connect(mapStateToProps, mapDispatchToProps)(SecuredViewInner);
}

export default SecuredView;
