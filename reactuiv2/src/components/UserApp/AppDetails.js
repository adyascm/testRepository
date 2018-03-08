import React from 'react';


import { Item, Label, Grid } from 'semantic-ui-react'

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
