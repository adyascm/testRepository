import React, { Component } from 'react';
import { Grid, Button, Icon, Dropdown } from 'semantic-ui-react'


const ResourcePermissions = props => {
    const state = {
        permissionOptions: [{ text: 'Read' },
        { text: 'Write' }],
        quickActions: [{text:'Transfer ownership'},
        {text:'Remove external access'},
        {text:'Remove write access'},
        {text:'Make this private'},
        {text:'Watch all actions on this file'}]
    };
    
    let permissions = props.rowData.permissions
    let permissionUsers = []
    
    if (permissions !== undefined && permissions.length > 0) {
        permissionUsers = permissions.map((permission,index) => {
            if (permission["permissionId"] !== undefined)
                return (
                    <Grid.Row key={index}>
                        <Grid.Column width={2}>
                            <Button animated='vertical' basic color='red'>
                                <Button.Content hidden>Remove</Button.Content>
                                <Button.Content visible>
                                    <Icon name='remove' />
                                </Button.Content>
                            </Button>
                        </Grid.Column>
                        <Grid.Column width={10}>
                            {permission["pemrissionEmail"]}
                        </Grid.Column>
                        <Grid.Column width={4}>
                            <Dropdown fluid text={permission["permissionType"] === "W"?"Write":"Read"} options={state.permissionOptions} />
                        </Grid.Column>
                    </Grid.Row>
                )
            else 
                return ("")
        })
    }
    
    return (
        <Grid celled='internally'>
            {permissionUsers}
            <Grid.Row>
                <Grid.Column width={16}>
                    <Dropdown placeholder='Quick Actions...' fluid selection options={state.quickActions} />
                </Grid.Column >
            </Grid.Row>
        </Grid>

    )

}

export default ResourcePermissions;