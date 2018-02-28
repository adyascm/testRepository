import React, { Component } from 'react';


import { Item, Image, Button, Label, Icon, Container, Dropdown, Header } from 'semantic-ui-react'
import AdyaLogo from '../../AdyaLogo.png'

const UserDetails = props => {

    var quickActions = [
        {
            key: 'transfer_ownership',
            text: 'Transfer ownership of all owned files',
            value: 'Transfer ownership of all owned files'
        },
        {
            key: 'remove_external_access',
            text: 'Remove external access for all owned files',
            value: 'Remove external access for all owned files'
        },
        {
            key: 'removeWriteAccess',
            text: 'Remove write access for all un-owned files',
            value: 'Remove write access for all un-owned files'
        },
        {
            key: 'make_all_files_private',
            text: 'Make all owned files private',
            value: 'Make all owned files private'
        },
        {
            key: 'watchAllActions',
            text: 'Watch all my actions',
            value: 'Watch all my actions'
        }];

    var parentGroups = []
    for (var index = 0; index < props.selectedUserItem.parents.length; index++) {
        var parentKey = props.selectedUserItem.parents[index];
        parentGroups.push((
            <Label key={index} as='a' color='blue'>
                {props.usersTreePayload[parentKey] && props.usersTreePayload[parentKey].name}
                <Icon name='close' />
            </Label>
        ))
    }
    if (parentGroups.length < 1) {
        parentGroups.push((
            <Label color='orange'>
                None
            </Label>
        ));
    }

    var image = null;
    if (props.selectedUserItem.photo_url) {
        image = <Item.Image inline floated='right' size='mini' src={props.selectedUserItem.photo_url} circular></Item.Image>
    } else {
        image = <Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }} circular >{props.selectedUserItem.name.charAt(0)}</Label></Item.Image>
    }
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
                        </Label.Group>
                    </Item.Description>
                    <Item.Extra extra>
                        <Dropdown placeholder='Quick Actions...' fluid selection options={quickActions} onChange={(event, data) => props.handleChange(event, data)} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>

    )

}

export default UserDetails;
