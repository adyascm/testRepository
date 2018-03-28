import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input, Label } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    USERS_OWNED_RESOURCES_LOAD_START,
    USERS_OWNED_RESOURCES_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: USERS_OWNED_RESOURCES_LOAD_START }),
    onLoad: (payload) => dispatch({ type: USERS_OWNED_RESOURCES_LOADED, payload })
});

class UserOwnedResources extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Resource",
                "Exposure",
                ""
            ]
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem && !this.props.selectedUserItem.ownedResources) {
            // this.props.setPaginationData(0,100)
            this.props.onLoadStart()
            this.props.onLoad(agent.Resources.getResourcesTree({ 'userEmails': [this.props.selectedUserItem["key"]], 'pageNumber': 0, 'pageSize': 100, 'ownerEmailId': this.props.selectedUserItem["key"] }))    
        }
    }

    render() {
        let tableHeaders = this.state.columnHeaders.map(headerName => {
            return (
                <Table.HeaderCell>{headerName}</Table.HeaderCell>
            )
        })

        const openLink = (link) => function (ev) {
            var win = window.open(link, '_blank');
            if (win) {
                //Browser has allowed it to be opened
                win.focus();
            }
        }

        let tableRowData = null
        
        if (this.props.selectedUserItem.ownedResources)
            tableRowData = this.props.selectedUserItem.ownedResources.map(rowData => {
                if (this.props.selectedUserItem["key"] === rowData["resource_owner_id"])
                    return (
                        <Table.Row>
                            <Table.Cell width='8'>{rowData["resource_name"]}</Table.Cell>
                            <Table.Cell>{rowData["exposure_type"]}</Table.Cell>
                            <Table.Cell textAlign='center'><Label as='a' color='blue' active onClick={openLink(rowData["web_view_link"])}>View</Label></Table.Cell>
                        </Table.Row>
                    )
                return null
            })

        if (this.props.isLoading)
            return (
                <div style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        
        if (this.props.selectedUserItem.ownedResources && this.props.selectedUserItem.ownedResources.length)
            return (
                <div style={{'maxWidth': '100%'}}>
                    <div>
                        <Table celled selectable striped compact="very">
                            <Table.Header>
                                <Table.Row>
                                    {tableHeaders}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {tableRowData}
                            </Table.Body>
                        </Table>
                    </div>
                </div>
            )
        else 
            return (
                <div style={{ marginLeft: '30%' }}>
                    User is not the owner for any resource
                </div>
            )      
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserOwnedResources);