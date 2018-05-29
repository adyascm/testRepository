import React from 'react';
import Mustache from 'mustache';


import { Item, Label, Icon, Dropdown, Header, Button } from 'semantic-ui-react'

const UserDetails = props => {

    // var quickActions = [
    //     {
    //         text: 'Transfer ownership of all documents owned by \"' + props.selectedUserItem['full_name'] + '\"',
    //         value: 'transfer_ownership'
    //     },
    //     {
    //         text: 'Remove access from outside the company for all documents owned by \"' + props.selectedUserItem['full_name'] + '\"',
    //         value: 'remove_external_access'
    //     },
    //     {
    //         text: 'Remove access to everyone for all documents owned by \"' + props.selectedUserItem['full_name'] + '\"',
    //         value: 'make_all_files_private'
    //     },
    //     {
    //         text: 'Remove access to \"' + props.selectedUserItem['full_name'] + '\" for any documents owned by others',
    //         value: 'remove_all_access'
    //     },
    //     {
    //         text: 'Get weekly report of all activities for \"' + props.selectedUserItem['full_name'] + '\"',
    //         value: 'watch_all_action_for_user'
    //     },
    //     {
    //         text: 'Send mail to \"' + props.selectedUserItem['full_name'] + '\" to audit documents',
    //         value: 'notify_user_for_clean_up'
    //     }];

    // var quickActionsforExtUser = [
    //     {
    //         text: 'Remove all access to \"' + props.selectedUserItem['full_name'] + '\"',
    //         value: 'remove_all_access'
    //     }

    // ]


    var parentGroups = []
    for (let index = 0; index < props.selectedUserItem.groups.length; index++) {
        let parentKey = props.selectedUserItem.groups[index];
        parentGroups.push((
            <Label key={index} as='a' color='blue'>
                {parentKey.name}
                <Icon name='close' onClick={() => props.onUserGroupAction('remove_user_from_group', parentKey)} />
            </Label>
        ))
    }
    if (parentGroups.length < 1) {
        parentGroups.push((
            <Label key="-1" color='orange'>
                None
            </Label>
        ));
    }

    var image = null;
    if (props.selectedUserItem.photo_url) {
        image = <Item.Image inline floated='right' size='mini' src={props.selectedUserItem.photo_url} circular></Item.Image>
    } else {
        image = <Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }} circular >{props.selectedUserItem.first_name && props.selectedUserItem.first_name.charAt(0)}</Label></Item.Image>
    }

    var actionMenu = []; //props.selectedUserItem.member_type === 'EXT' ? quickActionsforExtUser : quickActions
    var actionKeys = Object.keys(props.all_actions_list)
    var ds = props.datasourcesMap[props.selectedUserItem.datasource_id];
    for (var ii = 0; ii < actionKeys.length; ii++) {
        var action = props.all_actions_list[actionKeys[ii]];
        if (action.datasource_type == ds.datasource_type) {
            if (action.action_type == "QUICK_ACTION") {
                if (action.action_entity == "USER") {
                    actionMenu.push({ "text": action.description, "value": action.key });
                }
                else if (action.action_entity == "INTERNAL_USER" && props.selectedUserItem.member_type === 'INT') {
                    actionMenu.push({ "text": Mustache.render(action.description, props.selectedUserItem), "value": action.key });
                }
            }
        }
    }
    return (
        <Item.Group>
            <Item fluid='true'>
                {image}
                <Item.Content >
                    <Item.Header >
                        {props.selectedUserItem.full_name}
                    </Item.Header>
                    <Item.Meta >
                        {props.selectedUserItem.email}
                    </Item.Meta>
                    <Item.Description>
                        <Header size="tiny" floated="left">Member of </Header>
                        <Label.Group >
                            {parentGroups}
                            <Label as='a' color='green' style={{ 'paddingRight': '2px' }}>
                                <Icon name='plus' fitted={true} onClick={(event) => props.onUserGroupAction('add_user_to_group', null)} />
                            </Label>

                        </Label.Group>
                    </Item.Description>
                    <Item.Extra extra="true">
                        <Dropdown placeholder='Quick Actions...' fluid selection options={actionMenu} value='' onChange={(event, data) => props.onQuickAction(data.value)} selectOnBlur={false} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>

    )

}

export default UserDetails;
