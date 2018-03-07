import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';
import { LOGOUT, SET_CURRENT_URL } from '../constants/actionTypes';
import AppSearch from './Search/AppSearch'
import AdyaLogo from '../AdyaLogo.png'
import { Container, Image, Menu, Icon } from 'semantic-ui-react'
import Dropdown from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';

const LoggedOutView = props => {
    if (!props.currentUser) {
        return (
            <Container>
                <Menu.Item as={Link} to="/" header>
                    <Image size='tiny' src={AdyaLogo} />
                </Menu.Item>
            </Container>
        )
    }
    return null;
}

const LoggedInView = props => {
    if (props.currentUser) {
        return (
            <Container>
                <Menu.Item as={Link} to="/" header>
                    <Image size='tiny' src={AdyaLogo} onClick={() => props.handleClick("/")} />
                </Menu.Item>

                <Menu.Menu position='left' >
                    <Menu.Item as={Link} to="/" onClick={() => props.handleClick("/")} active={props.currLocation === '/'} >Dashboard</Menu.Item>
                    <Menu.Item as={Link} to="/users" onClick={() => props.handleClick("/users")} active={props.currLocation === '/users'} >Users</Menu.Item>
                    <Menu.Item as={Link} to="/resources" onClick={() => props.handleClick("/resources")} active={props.currLocation === '/resources'} >Documents</Menu.Item>
                    <Menu.Item as={Link} to="/apps" onClick={() => props.handleClick("/apps")} active={props.currLocation === '/apps'} >Apps</Menu.Item>
                </Menu.Menu>

                <Menu.Menu position='right'>
                    <Menu.Item>
                        <AppSearch icon='search' placeholder='Search...' />
                    </Menu.Item>
                    {/* <Menu.Item icon='settings' as={Link} to="/datasources" onClick={() => props.handleClick("/datasources")} active={props.currLocation === '/datasources'} /> */}
                    <Dropdown item icon='settings'>
                        <Dropdown.Menu>  
                            <Dropdown.Item as={Link} to="/reports" onClick={() => props.handleClick("/reports")} active={props.currLocation === '/reports'} >Reports</Dropdown.Item>
                            <Dropdown.Item as={Link} to="/auditlog" onClick={() => props.handleClick("/auditlog")} active={props.currLocation === '/auditlog'} >Logs</Dropdown.Item>
                            <Dropdown.Item as={Link} to="/datasources" onClick={() => props.handleClick("/datasources")} active={props.currLocation === '/datasources'} >Manage Datasources</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Menu.Item icon position="right" onClick={props.onClickLogout} >{props.currentUser.first_name}  <Icon name='sign out' style={{ 'marginLeft': '6px'}}/></Menu.Item>
                </Menu.Menu>
            </Container>
        );
    }

    return null;
};

const mapStateToProps = state => ({
    ...state.common
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
    }

    render() {
        return (
            <Menu fixed='top' inverted>
                <LoggedOutView currentUser={this.props.currentUser} />
                <LoggedInView currentUser={this.props.currentUser} onClickLogout={this.props.onClickLogout} handleClick={this.handleClick} currLocation={this.props.currentUrl} />
            </Menu>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
