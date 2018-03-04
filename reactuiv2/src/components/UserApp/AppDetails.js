import React, { Component } from 'react';


import { Item, Image, Button, Label, Icon,Grid, Container, Dropdown, Header } from 'semantic-ui-react'
import AdyaLogo from '../../AdyaLogo.png'
import { text } from 'superagent/lib/node/parsers';

const AppDetails = props => {

    var appName = props.selectedAppItem.display_text 
    var image =<Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }} 
                                        circular >{appName
                                        && appName.charAt(0)}</Label></Item.Image>
    
    let scopes = props.selectedAppItem["scopes"].split(',').map((scope,index) => {
        return (
        <Grid.Row textAlign='center' style={{ margin: '0px' }}  key={index}>
                {scope}
        </Grid.Row>  
        )
    })

    return (
        <Item.Group>

            <Item fluid='true'>
                {image}
                <Item.Content >
                    <Item.Header >
                        {appName}
                    </Item.Header>
                </Item.Content>
            </Item>
            <Item style={{marginTop: '30px'}}>
                <Item.Content >
                    <Item.Header >
                        {"Scopes"}
                    </Item.Header>
                    <Item.Content >
                        {scopes}
                    </Item.Content>
                </Item.Content>
            </Item>
        </Item.Group>

    )

}

export default AppDetails;
