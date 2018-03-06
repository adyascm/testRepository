import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';
import { LOGOUT, SET_CURRENT_URL } from '../constants/actionTypes';
import AppSearch from './Search/AppSearch'
import AdyaLogo from '../AdyaLogo.png'
import { Container, Image, Menu, Icon } from 'semantic-ui-react'

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
        console.log("props header : ", props)
        return (
            <Container>
                <Menu.Item as={Link} to="/" header>
                    <Image size='tiny' src={AdyaLogo} />
                </Menu.Item>

                <Menu.Menu position='left' >
                    <Menu.Item as={Link} to="/" onClick={props.handleClick} active={props.currLocation === '/'} >Dashboard</Menu.Item>
                    <Menu.Item as={Link} to="/users" onClick={props.handleClick} active={props.currLocation === '/users'} >Users</Menu.Item>
                    <Menu.Item as={Link} to="/resources" onClick={props.handleClick} active={props.currLocation === '/resources'} >Documents</Menu.Item>
                    <Menu.Item as={Link} to="/reports" onClick={props.handleClick} active={props.currLocation === '/reports'} >Reports</Menu.Item>
                    <Menu.Item as={Link} to="/auditlog" onClick={props.handleClick} active={props.currLocation === '/auditlog'} >AuditLog</Menu.Item>
                    <Menu.Item as={Link} to="/apps" onClick={props.handleClick} active={props.currLocation === '/apps'} >Apps</Menu.Item>
                </Menu.Menu>

                <Menu.Menu position='right'>
                    <Menu.Item>
                        <AppSearch icon='search' placeholder='Search...' />
                    </Menu.Item>
                    <Menu.Item icon='settings' as={Link} to="/datasources" onClick={props.handleClick} active={props.currLocation === '/datasources'} />
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

        this.state = {
            currLocation: undefined
        }
    }

    handleClick = () => {
        this.setState({
            currLocation: window.location.pathname
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.currentUrl !== this.props.currLocation)
            this.setState({
                currLocation: nextProps.currentUrl
            })
    }

    render() {
        return (
            <Menu fixed='top' inverted>
                <LoggedOutView currentUser={this.props.currentUser} />
                <LoggedInView currentUser={this.props.currentUser} onClickLogout={this.props.onClickLogout} handleClick={this.handleClick} currLocation={window.location.pathname} />
            </Menu>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
