import React, { Component } from 'react';
import { Grid, Button, Icon, Dropdown } from 'semantic-ui-react'


const ResourcePermissions = props => {
    const state = {
        permissionOptions: [
            { text: 'Read', value: 'Read' },
            { text: 'Write', value: 'Write' }]
    };
    
    let permissions = props.rowData.permissions
    let permissionUsers = []
    
    if (permissions && permissions.length > 0) {
        permissionUsers = permissions.map((permission,index) => {
            if (permission["permission_id"] !== undefined)
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
                            {permission["email"]}
                        </Grid.Column>
                        <Grid.Column width={4}>
                            <Dropdown fluid text={permission["permission_type"]} options={state.permissionOptions} onChange={(event,data) => props.handleChange(event,data,permission["permission_type"])} />
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
        </Grid>

    )

}

export default ResourcePermissions;