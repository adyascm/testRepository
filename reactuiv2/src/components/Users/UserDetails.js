import React, { Component } from 'react';


import { Item, Image, Button, Label, Icon, Container, Dropdown } from 'semantic-ui-react'
import AdyaLogo from '../../AdyaLogo.png'

const UserDetails = props => {
    const state = {
        quickActions: [{text:'Transfer ownership of all owned files'},
        {text:'Remove external access for all owned files'},
        {text:'Remove write access for all un-owned files'},
        {text:'Make all owned files private'},
        {text:'Watch all my actions'}]
    };

    return (
        <Item.Group>

            <Item fluid='true'>
                <Item.Image size='tiny' src={AdyaLogo} />

                <Item.Content >
                    <Item.Header >
                        {props.user}
                    </Item.Header>
                    <Item.Meta>
                        Member of
                </Item.Meta>
                    <Item.Description>
                        <Container fluid={true}>

                            <Label.Group color='blue'>
                                <Label as='a'>
                                    Sales
                                    <Icon name='close' />
                                </Label>
                                <Label as='a'>
                                    Marketing
                                    <Icon name='close' />
                                </Label>
                                <Label as='a'>
                                    Engineering
                                    <Icon name='close' />
                                </Label>
                                <Label as='a'>
                                    Finance
                                    <Icon name='close' />
                                </Label>
                            </Label.Group>
                        </Container>
                    </Item.Description>
                    <Item.Extra extra>
                        <Dropdown placeholder='Quick Actions...' fluid selection options={state.quickActions} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>

    )

}

export default UserDetails;