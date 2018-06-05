import React from 'react';
import { Item, Label, Dropdown } from 'semantic-ui-react'
import { IntlProvider, FormattedRelative } from 'react-intl';
import Mustache from 'mustache';

const openLink = (link) => function (ev) {
    var win = window.open(link, '_blank');
    if (win) {
        //Browser has allowed it to be opened
        win.focus();
    }
}
const ResourceDetails = props => {

    // var quickActions = [
    //     {
    //         text: 'Transfer ownership of \"' + props.rowData['resource_name'] + '\"',
    //         value: 'change_owner'
    //     },
    //     {
    //         text: 'Remove access from outside the company for \"' + props.rowData['resource_name'] + '\"',
    //         value: 'remove_external_access_to_resource'
    //     },
    //     {
    //         text: 'Remove access to everyone (except owner) for \"' + props.rowData['resource_name'] + '\"',
    //         value: 'make_resource_private'
    //     }];
    var quickActions = [];
    var all_actions_list = props.all_actions_list
    var ds = props.datasourcesMap[props.rowData.datasource_id];
    for (var ii = 0; ii < all_actions_list.length; ii++) {
        var action = all_actions_list[ii];
        if (action.datasource_type == ds.datasource_type) {
            if (action.action_type == "QUICK_ACTION") {
                if (action.action_entity == "DOCUMENT") {
                    quickActions.push({ "text": Mustache.render(action.description, props.rowData), "value": action.key });
                }
            }
        }
    }
    var image = null;
    if (props.rowData.icon_link) {
        image = <Item.Image inline floated='right' size='mini' src={props.rowData.icon_link} circular></Item.Image>
    } else {
        image = <Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }} circular>{props.rowData.resource_name.charAt(0).toUpperCase()}</Label></Item.Image>
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
                        <div style={{ marginBottom: '10px' }}>Owned by {props.rowData['resource_owner_id']}</div>
                        <div style={{ marginBottom: '10px' }}>Last modified <IntlProvider locale='en'><FormattedRelative value={props.rowData['last_modified_time']} /></IntlProvider > by {props.rowData['last_modifying_user_email']}</div>

                        <div style={{ marginBottom: "10px" }}>
                            <Label as='a' color='blue' active onClick={openLink(props.rowData['web_view_link'])}>View</Label>
                            {props.rowData['web_content_link'] ?
                                <Label as='a' color='orange' active onClick={openLink(props.rowData['web_content_link'])}>Download</Label>
                                : null
                            }
                        </div>
                    </Item.Meta>
                    <Item.Extra extra="true">
                        <Dropdown placeholder='Quick Actions...' selection fluid options={quickActions} value='' onChange={(event, data) => props.onQuickAction(data.value)} selectOnBlur={false} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>
    )
}

export default ResourceDetails;
