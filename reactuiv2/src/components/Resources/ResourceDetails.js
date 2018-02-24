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

     var image = null;
     if (props.rowData.icon_link) {
         image = <Item.Image inline floated='right' size='tiny' src={props.rowData.icon_link}></Item.Image>
     } else {
         image = <Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }} >{props.rowData.resource_name.charAt(0).toUpperCase()}</Label></Item.Image>
     }
    return (
        <Item.Group>
            <Item fluid='true'>
                {image}
                <Item.Content >
                    <Item.Header >
                        {props.rowData['resource_name']}
                    </Item.Header>
                    <Item.Meta >
                    <div><Label basic>Owner: {props.rowData['resource_owner_id']}</Label></div>
                        <div><Label basic>Last Modified at {props.rowData['last_modified_time']} by {props.rowData['last_modifying_user_email']}</Label></div>
                        
                        <div style={{margin: "5px"}}>
                        <Label primary><a href={props.rowData['web_view_link']}>View</a></Label>
                        <Label primary><a href={props.rowData['web_content_link']}>Download</a></Label>
                        </div>
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
