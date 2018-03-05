import React from 'react';
import { Item, Label, Dropdown } from 'semantic-ui-react'

const ResourceDetails = props => {
    var quickActions = [
        {
            text: '',
            value: ''
        },
        {
            text: 'Transfer ownership',
            value: 'change_owner'
        },
        {
            text: 'Remove external access',
            value: 'remove_external_access_to_resource'
        },
        {
            text: 'Make this private',
            value: 'make_resource_private'
        },
        {
            text: 'Watch all actions',
            value: 'watch_all_action_for_resource'
        }];
    var image = null;
    if (props.rowData.icon_link) {
        image = <Item.Image inline floated='right' size='mini' src={props.rowData.icon_link}></Item.Image>
    } else {
        image = <Item.Image floated='right' size='mini' ><Label style={{ fontSize: '2rem' }} >{props.rowData.resource_name.charAt(0).toUpperCase()}</Label></Item.Image>
    }
    return (
        <Item.Group>
            <Item fluid='true'>
                {image}
                <Item.Content >
                    <Item.Header >
                        {props.rowData['resource_name']}
                    </Item.Header>
                    <Item.Meta >
                        <div><Label basic>Owner: {props.rowData['resource_owner_id']}</Label></div>
                        <div><Label basic>Last Modified at {props.rowData['last_modified_time']} by {props.rowData['last_modifying_user_email']}</Label></div>

                        <div style={{ margin: "5px" }}>
                            <Label primary="true"><a href={props.rowData['web_view_link']} target="_blank">View</a></Label>
                            <Label primary="true"><a href={props.rowData['web_content_link']} target="_blank">Download</a></Label>
                        </div>
                    </Item.Meta>
                    <Item.Extra extra="true">
                        <Dropdown placeholder='Quick Actions...' selection fluid options={quickActions} value='' onChange={(event, data) => props.onQuickAction(data.value)} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>
    )
}

export default ResourceDetails;
