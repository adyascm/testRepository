import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';
import { LOGOUT } from '../constants/actionTypes';

const LoggedOutView = props => {
    if (!props.currentUser) {
        return (
            <div></div>
        )
    }
    return null;
}

const LoggedInView = props => {
    if (props.currentUser) {
        return (
            <div>
            <ul className="nav navbar-nav pull-xs-left">
                <li className="nav-item">
                    <Link to="/users" className="nav-link">
                        <i className="ion-gear-a"></i>&nbsp;Users
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/resources" className="nav-link">
                        <i className="ion-gear-a"></i>&nbsp;Resources
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/reports" className="nav-link">
                        <i className="ion-gear-a"></i>&nbsp;Reports
                    </Link>
                </li>
            </ul>
            <ul className="nav navbar-nav pull-xs-right">
                <li className="nav-item">
                    <Link to="/datasources" className="nav-link">
                        <i className="ion-gear-a"></i>&nbsp;Settings
                    </Link>
                </li>
                <li className="nav-item">
                    <Link
                        to={`/@${props.currentUser.email}`}
                        className="nav-link">
                        Hello {props.currentUser.first_name}!
                    </Link>
                </li>
                <li className="nav-item">
                    <button
                        className="btn btn-outline-danger"
                        onClick={props.onClickLogout}>
                        Logout.
                    </button>
                </li>
            </ul>
            </div>
        );
    }

    return null;
};

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => ({
    onClickLogout: () => dispatch({ type: LOGOUT })
});

class Header extends React.Component {
    render() {
        return (
            <nav className="navbar navbar-light">
                <div className="container">
                    <Link to="/" className="navbar-brand">
                        {this.props.appName}
                    </Link>
                    <LoggedOutView currentUser={this.props.currentUser} />
                    <LoggedInView currentUser={this.props.currentUser} onClickLogout={this.props.onClickLogout} />
                </div>
            </nav>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);