import React, { Component } from 'react';
import { Item, Image, Button, Label, Icon, Container, Dropdown, Header } from 'semantic-ui-react'

const ResourceDetails = props => {
    var quickActions = [
    {text:'Transfer ownership',
     value:'Transfer ownership'},
    {text:'Remove external access',
     value:'Remove external access'},
    {text:'Remove write access',
     value:'Remove write access'},
    {text:'Make this private',
     value:'Make this private'},
    {text:'Watch all actions',
     value:'Watch all actions'}];

    console.log("resource details row data : ", props.rowData)

    return (
        <Item.Group>
            <Item fluid='true'>
                <Item.Image size='tiny'><Label style={{fontSize: '2rem'}} circular >{props.rowData['resourceName'][0].toUpperCase()}</Label></Item.Image>
                <Item.Content >
                    <Item.Header >
                        {props.rowData['resourceName']}
                    </Item.Header>
                    <Item.Meta >
                        {props.rowData['lastModifiedTime']}
                    </Item.Meta>
                    <Item.Extra extra>
                        <Dropdown placeholder='Quick Actions...' fluid selection options={quickActions} onChange={(event,data) => props.handleChange(event,data)} />
                    </Item.Extra>
                </Item.Content>
            </Item>
        </Item.Group>
    )
}

export default ResourceDetails;
