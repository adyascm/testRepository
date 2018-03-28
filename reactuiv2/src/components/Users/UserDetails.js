import React from 'react';


import { Item, Label, Icon, Dropdown, Header, Button } from 'semantic-ui-react'

const UserDetails = props => {

    var quickActions = [
        {
            text: '',
            value: ''
        },
        {
            text: 'Transfer ownership of all files owned by ' + props.selectedUserItem['name'],
            value: 'transfer_ownership'
        },
        {
            text: 'Remove external access to all files owned by ' + props.selectedUserItem['name'],
            value: 'remove_external_access'
        },
        {
          text: 'Remove access for ' + props.selectedUserItem['name'] + ' to any files owned by others',
          value: 'remove_all_access'
        },
        {
            text: 'Remove sharing of all files owned by ' + props.selectedUserItem['name'],
            value: 'make_all_files_private'
        },
        {
            text: 'Watch all actions of ' + props.selectedUserItem['name'],
            value: 'watch_all_action_for_user'
        }];

    var quickActionsforExtUser = [
      {
          text: '',
          value: ''
      },
      {
        text: 'Remove access for ' + props.selectedUserItem['name'] + ' to any files owned by others',
        value: 'remove_all_access'
      },
      {
          text: 'Watch all actions of ' + props.selectedUserItem['name'],
          value: 'watch_all_action_for_user'
      }

    ]


    var parentGroups = []
    for (let index = 0; index < props.selectedUserItem.parents.length; index++) {
        let parentKey = props.selectedUserItem.parents[index];
        parentGroups.push((
            <Label key={index} as='a' color='blue'>
                {props.usersTreePayload[parentKey] && props.usersTreePayload[parentKey].name}
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
                        <Dropdown placeholder='Quick Actions...' fluid selection options={actionMenu} value='' onChange={(event, data) => props.onQuickAction(data.value)} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>

    )

}

export default UserDetails;
