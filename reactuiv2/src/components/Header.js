import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux';
import { LOGOUT, SET_REDIRECT_PROPS, RESET_ALERTS_COUNT } from '../constants/actionTypes';
import AdyaLogo from '../AdyaLogo.png'
import { Container, Image, Menu, Icon, Label } from 'semantic-ui-react'
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
                    <Menu.Item onClick={() => props.handleClick("/policies")} active={props.currLocation.includes('/policies')} >Policies</Menu.Item>
                    <Menu.Item onClick={() => props.handleClick("/reports")} active={props.currLocation === '/reports'} >Reports</Menu.Item>
                    {/* <Menu.Item onClick={() => props.handleClick("/activities")} active={props.currLocation.includes('/activities')} >Activity</Menu.Item> */}
                    {/* <Menu.Item onClick={() => props.handleClick("/auditlog")} active={props.currLocation === '/auditlog'} >Logs</Menu.Item> */}
                </Menu.Menu>

                <Menu.Menu position='right'>
                <Menu.Item >
                {props.currentUser.first_name} ({props.currentUser.email})
                </Menu.Item>
                    <Menu.Item onClick={() => props.handleClick("/alerts")} active={props.currLocation === '/alerts'}>
                        <Icon name='bell' />
                        {!props.openAlertsCount ? null : <Label color='red' floating>{props.openAlertsCount}</Label>}
                        {/* {!props.openAlertsCount ? null : (<span style={{'marginLeft': '-12px', 'position': 'relative', 'top': '-5px', 'color': 'red'}}>{props.openAlertsCount}</span>)} */}
                    </Menu.Item>
                    <Menu.Item icon='settings' onClick={() => props.handleClick("/datasources")} active={props.currLocation === '/datasources'} />
                    <Menu.Item icon position="right" onClick={props.onClickLogout} ><Icon name='sign out' style={{ 'marginLeft': '6px'}}/></Menu.Item>
                </Menu.Menu>
            </Container>
        );
    }

    return null;
};

const mapStateToProps = state => ({
    ...state.common,
    ...state.dashboard,
    openAlertsCount: state.alert.alertsCount
});

const mapDispatchToProps = dispatch => ({
    onClickLogout: () => dispatch({ type: LOGOUT }),
    onMenuItemClick: (url) =>
        dispatch({ type: SET_REDIRECT_PROPS, redirectUrl: url }),
    resetAlertsCount: () =>
        dispatch({ type: RESET_ALERTS_COUNT })
});

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(menuItem) {
        this.props.onMenuItemClick(menuItem)
        this.props.history.push(menuItem)

        if (menuItem === '/alerts')
            this.props.resetAlertsCount()
    }

    componentWillMount() {
        this.props.onMenuItemClick(window.location.pathname)
    }

    render() {
        return (
            <Menu fixed='top' inverted>
                <LoggedOutView currentUser={this.props.currentUser} handleClick={this.handleClick} />
                <LoggedInView currentUser={this.props.currentUser} onClickLogout={this.props.onClickLogout} handleClick={this.handleClick} currLocation={this.props.currentUrl} openAlertsCount={this.props.openAlertsCount} {...this.props} />
            </Menu>
        )
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
