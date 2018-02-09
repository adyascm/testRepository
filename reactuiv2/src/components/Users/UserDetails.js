import React, { Component } from 'react';


import { Item, Image, Button, Label, Icon, Container, Dropdown } from 'semantic-ui-react'
import AdyaLogo from '../../AdyaLogo.png'

const UserDetails = props => {
    const state = {
        quickActions: [{text:'Transfer ownership of all owned files'},
                       {text:'Remove external access for all owned files'},
                       {text:'Remove write access for all un-owned files'},
                       {text:'Make all owned files private'},
                       {text:'Watch all my actions'}],
        parents: props.parents
    };

    let labels = state.parents.map((parent,index) => {
        return (
            <Label key={index} as='a'>
                {parent}
                <Icon name='close' />
            </Label>
        )
    })
    console.log("users details parents prop : ", props.parents)
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
                                {labels}
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