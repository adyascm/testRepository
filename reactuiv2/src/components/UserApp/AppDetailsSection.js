import React, { Component } from 'react';
import { Tab, Segment, Icon, Grid,Button } from 'semantic-ui-react';
import AppDetails from './AppDetails';
import agent from '../../utils/agent'
import { connect } from 'react-redux';
import {
    APPS_ITEM_SELECTED,
    APP_USERS_LOAD_START,
    APP_USERS_LOADED,
    UPDATE_APPS_DELETE_FLAG,
    APPS_ACTION_LOAD,
    APPS_ACTION_CANCEL
} from '../../constants/actionTypes';
import { Loader, Dimmer } from 'semantic-ui-react'


const mapStateToProps = state => ({
    ...state.apps,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({type:APPS_ITEM_SELECTED,payload}),
    appUsersLoadStart: () => dispatch({type:APP_USERS_LOAD_START}),
    appUsersLoaded: (payload) => dispatch({type:APP_USERS_LOADED,payload}),
    setAppsDeleteFlag: (payload) => dispatch({ type: UPDATE_APPS_DELETE_FLAG, payload }),
    removeUserFromApp: (payload, userEmail, clientId) => dispatch({ type: APPS_ACTION_LOAD, actionType: payload, email: userEmail, clientId: clientId })
})

class AppDetailsSection extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            deleteUser: undefined
        }
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleAppAccessRevokeClick = this.handleAppAccessRevokeClick.bind(this)
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleAppAccessRevokeClick(event,app,userEmail) {
        this.props.removeUserFromApp("remove_user_from_app", userEmail, app.client_id)
    }

    componentWillMount() {
        if (this.props.selectedAppItem && this.props.selectedAppItem.client_id) {
            this.props.appUsersLoadStart()
            this.props.appUsersLoaded(agent.Apps.getappusers(this.props.selectedAppItem.client_id, this.props.selectedAppItem.datasource_id))
        }
    }

    componentWillReceiveProps(nextProps) {
        var oldClientId = this.props.selectedAppItem != null ? this.props.selectedAppItem.client_id : null;
        var newClientId = nextProps.selectedAppItem != null ? nextProps.selectedAppItem.client_id : null;
        if (nextProps.appDeleted !== this.props.appDeleted || oldClientId != newClientId) {
            nextProps.appUsersLoadStart()
            nextProps.appUsersLoaded(agent.Apps.getappusers(this.props.selectedAppItem.client_id, this.props.selectedAppItem.datasource_id))
        }
    }

    render() {
        if (!this.props.selectedAppItem)
            return null;
        else {
            if(this.props.isLoadingAppUsers)
            {
                return (
                    <div className="ag-theme-fresh" style={{ height: '100px' }}>
                        <Dimmer active inverted>
                            <Loader inverted content='Loading' />
                        </Dimmer>
                    </div>
                )
            }
            let appUsers = []
            let ds = this.props.datasourcesMap[this.props.selectedAppItem.datasource_id];
            if (this.props.appUsers && this.props.appUsers.length > 0) {
                let app =this.props.selectedAppItem
                appUsers = this.props.appUsers.map((user,index) => {
                    return (
                        <Grid.Row key={index}>
                            <Grid.Column width={2}>
                                <Button animated='vertical' disabled={ds.datasource_type != "GSUITE"}
                                        basic color='red'
                                        onClick={(event) => this.handleAppAccessRevokeClick(event,app,user.email)}>
                                    <Button.Content hidden>Remove</Button.Content>
                                    <Button.Content visible>
                                        <Icon name='remove' />
                                    </Button.Content>
                                </Button>
                            </Grid.Column>
                            <Grid.Column width={10}>
                                {user.email}
                            </Grid.Column>
                        </Grid.Row>
                    )
            })
            }

            let panes = [
                { menuItem: 'Users', render: () => <Tab.Pane attached={false}>
                                                    <Grid celled='internally'>{appUsers}
                                                    </Grid> </Tab.Pane> }
              ]
            return (
                <Segment>
                        <Icon name='close' onClick={this.closeDetailsSection} />
                        <AppDetails selectedAppItem={this.props.selectedAppItem} appUsers={this.props.appUsers} />
                        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps,mapDispatchToProps)(AppDetailsSection);
