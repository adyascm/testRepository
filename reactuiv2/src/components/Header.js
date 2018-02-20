import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';
import { LOGOUT } from '../constants/actionTypes';
import AppSearch from './AppSearch'
import AdyaLogo from '../AdyaLogo.png'
import { Container, Input, Image, List, Menu, Segment, Icon } from 'semantic-ui-react'

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
                    <Image size='tiny' src={AdyaLogo} />
                </Menu.Item>

                <Menu.Menu position='left' >
                    <Menu.Item as={Link} to="/">Dashboard</Menu.Item>
                    <Menu.Item as={Link} to="/users">Users</Menu.Item>
                    <Menu.Item as={Link} to="/resources">Resources</Menu.Item>
                    <Menu.Item as={Link} to="/reports">Reports</Menu.Item>
                </Menu.Menu>

                <Menu.Menu position='right'>
                    <Menu.Item>
                        <AppSearch icon='search' placeholder='Search...' />
                    </Menu.Item>
                    <Menu.Item icon='settings' as={Link} to="/datasources" />
                    <Menu.Item icon labelPosition="right" onClick={props.onClickLogout} >{props.currentUser.first_name}  <Icon name='sign out' style={{ 'margin-left': '6px'}}/></Menu.Item>
                </Menu.Menu>
            </Container>
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
            <Menu fixed='top' inverted>
                <LoggedOutView currentUser={this.props.currentUser} />
                <LoggedInView currentUser={this.props.currentUser} onClickLogout={this.props.onClickLogout} />
            </Menu>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);