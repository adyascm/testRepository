import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux';
import { LOGOUT, SET_CURRENT_URL } from '../constants/actionTypes';
import AppSearch from './Search/AppSearch'
import AdyaLogo from '../AdyaLogo.png'
import { Container, Image, Menu, Icon } from 'semantic-ui-react'
import Dropdown from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';

const LoggedOutView = props => {
    if (!props.currentUser) {
        return (
            <Container fluid>
                <Menu.Item header onClick={() => props.handleClick("/")} >
                    <Image size='tiny' src={AdyaLogo} />
                </Menu.Item>
            </Container>
        )
    }
    return null;
}

const LoggedInView = props => {
    if (props.currentUser) {
        // var disableAppsItem = (props["userAppAccess"] && props["userAppAccess"]["data"] && props["userAppAccess"]["data"]["totalCount"]>0)?false:true
        // var disableUserItem = (props["usersCount"] && props["usersCount"]["data"]>0)?false:true
        // var disableResourceItem = (props["filesCount"] && props["filesCount"]["data"]>0)?false:true
        return (
            <Container fluid>
                <Menu.Item header>
                    <Image size='tiny' src={AdyaLogo} onClick={() => props.handleClick("/")} />
                </Menu.Item>

                <Menu.Menu position='left' >
                    <Menu.Item onClick={() => props.handleClick("/")} active={props.currLocation === '/'} >Dashboard</Menu.Item>
                    <Menu.Item onClick={() => props.handleClick("/users")} active={props.currLocation.includes('/users')} >Users</Menu.Item>
                    <Menu.Item onClick={() => props.handleClick("/resources")} active={props.currLocation.includes('/resources')} >Documents</Menu.Item>
                    <Menu.Item onClick={() => props.handleClick("/apps")} active={props.currLocation.includes('/apps')} >Apps</Menu.Item>
                    {/* <Menu.Item as={Link} to="/policies" onClick={() => props.handleClick("/policies")} active={props.currLocation.includes('/policies')} >Policies</Menu.Item> */}
                    <Menu.Item onClick={() => props.handleClick("/reports")} active={props.currLocation === '/reports'} >Reports</Menu.Item>
                    <Menu.Item onClick={() => props.handleClick("/auditlog")} active={props.currLocation === '/auditlog'} >Logs</Menu.Item>
                </Menu.Menu>

                <Menu.Menu position='right'>
                    <Menu.Item>
                        <AppSearch icon='search' placeholder='Search...' />
                    </Menu.Item>
                    <Menu.Item icon='settings' onClick={() => props.handleClick("/datasources")} active={props.currLocation === '/datasources'} />
                    {/* <Dropdown item icon='settings'>
                        <Dropdown.Menu>  
                            <Dropdown.Item as={Link} to="/reports" onClick={() => props.handleClick("/reports")} active={props.currLocation === '/reports'} >Reports</Dropdown.Item>
                            <Dropdown.Item as={Link} to="/auditlog" onClick={() => props.handleClick("/auditlog")} active={props.currLocation === '/auditlog'} >Logs</Dropdown.Item>
                            <Dropdown.Item as={Link} to="/datasources" onClick={() => props.handleClick("/datasources")} active={props.currLocation === '/datasources'} >Manage Datasources</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown> */}
                    <Menu.Item icon position="right" onClick={props.onClickLogout} >{props.currentUser.first_name}  <Icon name='sign out' style={{ 'marginLeft': '6px'}}/></Menu.Item>
                </Menu.Menu>
            </Container>
        );
    }

    return null;
};

const mapStateToProps = state => ({
    ...state.common,
    ...state.dashboard
});

const mapDispatchToProps = dispatch => ({
    onClickLogout: () => dispatch({ type: LOGOUT }),
    onMenuItemClick: (url) => 
        dispatch({ type: SET_CURRENT_URL, url })
});

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(menuItem) {
        this.props.onMenuItemClick(menuItem)
        this.props.history.push(menuItem)

    }

    componentWillMount() {
        this.props.onMenuItemClick(window.location.pathname)
    }

    render() {
        return (
            <Menu fixed='top' inverted>
                <LoggedOutView currentUser={this.props.currentUser} handleClick={this.handleClick} />
                <LoggedInView currentUser={this.props.currentUser} onClickLogout={this.props.onClickLogout} handleClick={this.handleClick} currLocation={this.props.currentUrl} {...this.props} />
            </Menu>
        )
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
