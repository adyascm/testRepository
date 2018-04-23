import React from 'react';


import { Item, Label, Icon, Dropdown, Header, Button } from 'semantic-ui-react'

const UserDetails = props => {

    var quickActions = [
        {
            text: 'Transfer ownership of all documents owned by \"' + props.selectedUserItem['name'] + '\"',
            value: 'transfer_ownership'
        },
        {
            text: 'Remove access from outside the company for all documents owned by \"' + props.selectedUserItem['name'] + '\"',
            value: 'remove_external_access'
        },
        {
            text: 'Remove access to everyone for all documents owned by \"' + props.selectedUserItem['name'] + '\"',
            value: 'make_all_files_private'
        },
        {
          text: 'Remove access to \"' + props.selectedUserItem['name'] + '\" for any documents owned by others',
          value: 'remove_all_access'
        },
        {
            text: 'Get weekly report of all activities for \"' + props.selectedUserItem['name'] + '\"',
            value: 'watch_all_action_for_user'
        },
        {
            text: 'Send mail to \"' + props.selectedUserItem['name'] + '\" to audit documents',
            value: 'notify_user_for_clean_up'   
        }];

    var quickActionsforExtUser = [
      {
        text: 'Remove all access to \"' + props.selectedUserItem['name'] + '\"',
        value: 'remove_all_access'
      }

    ]


    var parentGroups = []
    for (let index = 0; index < props.selectedUserItem.parents.length; index++) {
        let parentKey = props.selectedUserItem.parents[index];
        parentGroups.push((
            <Label key={index} as='a' color='blue'>
                {props.usersTreePayload && props.usersTreePayload[parentKey] && props.usersTreePayload[parentKey].name}
                <Icon name='close' onClick= {() => props.onUserGroupAction('remove_user_from_group', parentKey)}/>
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
        image = <Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }} circular >{props.selectedUserItem.name && props.selectedUserItem.name.charAt(0)}</Label></Item.Image>
    }

    var actionMenu = props.selectedUserItem.member_type === 'EXT' ? quickActionsforExtUser : quickActions
    return (
        <Item.Group>
            <Item fluid='true'>
                {image}
                <Item.Content >
                    <Item.Header >
                        {props.selectedUserItem.name}
                    </Item.Header>
                    <Item.Meta >
                        {props.selectedUserItem.key}
                    </Item.Meta>
                    <Item.Description>
                        <Header size="tiny" floated="left">Member of </Header>
                        <Label.Group >
                            {parentGroups}
                              <Label as='a' color='green' style={{'paddingRight': '2px'}}>
                                <Icon name='plus' fitted={true} onClick = {(event) => props.onUserGroupAction('add_user_to_group', null)}/>
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
