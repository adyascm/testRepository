import React, { Component } from 'react';


import { Item, Image, Button, Label, Icon, Container, Dropdown, Header } from 'semantic-ui-react'
import AdyaLogo from '../../AdyaLogo.png'

const UserDetails = props => {
    var quickActions= [{text:'Transfer ownership of all owned files'},
    {text:'Remove external access for all owned files'},
    {text:'Remove write access for all un-owned files'},
    {text:'Make all owned files private'},
    {text:'Watch all my actions'}];

    var parentGroups = []
    for(var index = 0; index < props.selectedUserItem.parents.length; index++)
    {
        var parentKey = props.selectedUserItem.parents[index];
        parentGroups.push((
            <Label key={index} as='a' color='blue'>
                {props.usersTreePayload[parentKey].name}
                <Icon name='close' />
            </Label>
        ))
    }
    if(parentGroups.length < 1)
    {
        parentGroups.push((
            <Label color='orange'>
                None
            </Label>
        ));
    }

    console.log("users details parents prop : ", props.selectedUserItem.parents)
    return (
        <Item.Group>

            <Item fluid='true'>
                <Item.Image size='tiny'><Label style={{fontSize: '2rem'}} circular >{props.selectedUserItem.name.charAt(0)}</Label></Item.Image>

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
                        <Dropdown placeholder='Quick Actions...' fluid selection options={quickActions} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>

    )

}

export default UserDetails;