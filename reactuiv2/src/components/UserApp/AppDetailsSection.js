import React, { Component } from 'react';
import { Tab, Segment, Icon, Grid, Button, Item, Label, Image, Table } from 'semantic-ui-react';
import agent from '../../utils/agent'
import { connect } from 'react-redux';
import { IntlProvider, FormattedDate } from 'react-intl'
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
    closingDetailsSection: (payload) => dispatch({ type: APPS_ITEM_SELECTED, payload }),
    appUsersLoadStart: () => dispatch({ type: APP_USERS_LOAD_START }),
    appUsersLoaded: (appId, payload) => dispatch({ type: APP_USERS_LOADED, appId: appId, payload: payload }),
    setAppsDeleteFlag: (payload) => dispatch({ type: UPDATE_APPS_DELETE_FLAG, payload }),
    removeUserFromApp: (payload, userEmail, appId, datasourceId) => dispatch({ type: APPS_ACTION_LOAD, actionType: payload, email: userEmail, appId: appId, datasourceId: datasourceId })
})

class AppDetailsSection extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            deleteUser: undefined,
            columnHeaders: [
                "",
                "Source",
                "User",
                "Last Login"
            ],
            columnHeaderDataNameMap :{
                'Source':'source',
                'User': 'user',
                'Last Login':'last_login'
            },
            sortColumnName: 'last_login',
            sortOrder: 'asc'
        }
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleAppAccessRevokeClick = this.handleAppAccessRevokeClick.bind(this)
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleAppAccessRevokeClick(event, app, userEmail, datasource_id) {
        this.props.removeUserFromApp("remove_user_from_app", userEmail, app.id, datasource_id)
    }

    componentWillMount() {
        if (this.props.selectedAppItem && this.props.selectedAppItem.id) {
            this.props.appUsersLoadStart()
            this.props.appUsersLoaded(this.props.selectedAppItem.id, agent.Apps.getappusers(this.props.selectedAppItem.id, this.props.selectedAppItem.domain_id, this.state.sortColumnName, this.state.sortOrder))
        }
    }

    componentWillReceiveProps(nextProps) {
        var oldAppId = this.props.selectedAppItem != null ? this.props.selectedAppItem.id : null;
        var newAppId = nextProps.selectedAppItem != null ? nextProps.selectedAppItem.id : null;
        if (nextProps.appDeleted !== this.props.appDeleted || oldAppId != newAppId) {
            nextProps.appUsersLoadStart()
            nextProps.appUsersLoaded(nextProps.selectedAppItem.id, agent.Apps.getappusers(nextProps.selectedAppItem.id, nextProps.selectedAppItem.domain_id, this.state.sortColumnName, this.state.sortOrder))
        }
    }

    handleColumnSort = (mappedColumnName) => {
        let payload = null
        if (this.state.sortColumnName !== mappedColumnName) {
            this.props.appUsersLoadStart()
            this.props.appUsersLoaded(this.props.selectedAppItem.id, agent.Apps.getappusers(this.props.selectedAppItem.id, this.props.selectedAppItem.domain_id, mappedColumnName, 'asc'))
            this.setState({
                sortColumnName: mappedColumnName,
                sortOrder: 'asc',
            })
        }
        else {
            let sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
            this.props.appUsersLoadStart()
            this.props.appUsersLoaded(this.props.selectedAppItem.id, agent.Apps.getappusers(this.props.selectedAppItem.id, this.props.selectedAppItem.domain_id, mappedColumnName, sortOrder))
            this.setState({
                sortOrder: sortOrder
            })
        }
    }

    render() {
        if (!this.props.selectedAppItem)
            return null;
        else {
            if (this.props.isLoadingAppUsers) {
                return (
                    <div className="ag-theme-fresh" style={{ height: '100px' }}>
                        <Dimmer active inverted>
                            <Loader inverted content='Loading' />
                        </Dimmer>
                    </div>
                )
            }
            let appUsers = []

            if (this.props.appUsers && this.props.appUsers.length > 0) {
                let app = this.props.selectedAppItem
                let ninety_days_ago = new Date(Date.now() - 77760e5) // 7776000000 ms = 90 days
                appUsers = this.props.appUsers.map((user, index) => {
                    let ds = this.props.datasourcesMap[user.datasource_id];
                    let is_inactive = null
                    let formattedTime = null
                    if (user.last_login_time){
                        is_inactive = new Date(user.last_login_time) < ninety_days_ago 
                        formattedTime = (
                            <IntlProvider locale={'en'} >
                                <FormattedDate
                                    value={(new Date(user.last_login_time))}
                                    year='numeric'
                                    month='long'
                                    day='2-digit'
                                    hour='2-digit'
                                    minute = '2-digit'
                                    second = '2-digit'
                                />
                            </IntlProvider> )
                    }
                        
                    return (
                        <Table.Row key={index} textAlign="center" verticalAlign="middle">
                        <Table.Cell collapsing textAlign="center">
                        <Button animated='vertical' disabled={ds.datasource_type != "GSUITE"}
                                basic color='red'
                                onClick={(event) => this.handleAppAccessRevokeClick(event, app, user.email, user.datasource_id)}>
                                <Button.Content hidden>Remove</Button.Content>
                                <Button.Content visible>
                                    <Icon name='remove' />
                                </Button.Content>
                            </Button>
                        </Table.Cell>
                        <Table.Cell>
                            <Image src={ds.logo} centered size="mini"/>
                        </Table.Cell>
                        <Table.Cell>
                            {user.email}
                        </Table.Cell>
                        <Table.Cell>
                            {formattedTime}
                            {is_inactive ? <span><b> (Inactive) </b></span> : null}
                        </Table.Cell>
                        </Table.Row>
                    )
                })
            }
            var appName = this.props.selectedAppItem.display_text
            var image = this.props.selectedAppItem.image_url ? <Item.Image floated='right' size='mini' src={this.props.selectedAppItem.image_url} /> : <Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }}
                circular >{appName && appName.charAt(0)}</Label></Item.Image>
            let scopes = []
            if (this.props.selectedAppItem.scopes)
                scopes = this.props.selectedAppItem.scopes.split(',').map((scope, index) => {
                    return (
                        <Grid.Row textAlign='center' style={{ margin: '0px' }} key={index}>
                            {scope}
                        </Grid.Row>
                    )
                });

            let appHeader = this.state.columnHeaders.map(headerName => {
                let mappedColumnName = this.state.columnHeaderDataNameMap[headerName]
                let isSortable = (['Last Login'].indexOf(headerName) >=0)  
                let headerCellStyle = !isSortable ? {pointerEvents:"none"}:{pointerEvents:'auto'}
                return (<Table.HeaderCell style={headerCellStyle} textAlign="center" key={headerName} sorted={this.state.sortColumnName === mappedColumnName ? (this.state.sortOrder === 'asc' ? 'ascending':'descending') : null} onClick={ isSortable ? () => this.handleColumnSort(mappedColumnName) : null}> { headerName }</Table.HeaderCell>)
            })   
            let tableHeader = 
                    (<Table.Header style={{ 'position': 'sticky', 'top': '50px', 'width': '100%' }}>
                        <Table.Row>{appHeader}</Table.Row>
                    </Table.Header>)
            let panes = [
                {
                    menuItem: 'Users', render: () => <Tab.Pane attached={false}>
                        {this.props.appUsers && this.props.appUsers.length > 0 ?
                            <Table sortable selectable striped celled compact='very'>
                                {tableHeader}
                            <Table.Body>
                                {appUsers}
                            </Table.Body>
                        </Table> : null }
                        </Tab.Pane>
                },
                {
                    menuItem: 'Scopes', render: () => <Tab.Pane attached={false}>
                        <Grid celled='internally'>{scopes}
                        </Grid> </Tab.Pane>
                }
            ]
            return (
                <Segment>
                    <div style={{ 'float': 'right', 'cursor': 'pointer'}} >
                        <Icon name='close' onClick={this.closeDetailsSection} />
                    </div>
                    <Item.Group>

                        <Item fluid='true'>
                            {image}
                            <Item.Content >
                                <Item.Header >
                                    {appName}
                                </Item.Header>
                            </Item.Content>
                        </Item>
                    </Item.Group>
                    <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps, mapDispatchToProps)(AppDetailsSection);
