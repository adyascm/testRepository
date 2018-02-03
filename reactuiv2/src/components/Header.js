import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';
import { LOGOUT } from '../constants/actionTypes';
import AdyaLogo from '../AdyaLogo.png'
import { Container, Input, Image, List, Menu, Segment } from 'semantic-ui-react'

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

                <Menu.Menu position='left'>
                    <Menu.Item as={Link} to="/users">Users</Menu.Item>
                    <Menu.Item as={Link} to="/resources">Resources</Menu.Item>
                    <Menu.Item as={Link} to="/reports">Reports</Menu.Item>
                </Menu.Menu>

                <Menu.Menu position='right'>
                    <Menu.Item>
                        <Input icon='search' placeholder='Search...' />
                    </Menu.Item>
                    <Menu.Item icon='settings' as={Link} to="/datasources" />
                    <Menu.Item icon='sign out' onClick={props.onClickLogout} />
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
            <div>
                <div>
                    <Menu fixed='top' inverted stackable>
                        <LoggedOutView currentUser={this.props.currentUser} />
                        <LoggedInView currentUser={this.props.currentUser} onClickLogout={this.props.onClickLogout} />
                    </Menu>
                </div>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);