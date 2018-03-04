import React from 'react';
import { Grid, Button, Icon, Dropdown } from 'semantic-ui-react'


const ResourcePermissions = props => {
    let permissionOptions = [
        { text: 'Can Read', value: 'reader' },
        { text: 'Can Write', value: 'writer' },
        { text: 'Owner', value: 'owner' }
    ]

    let permissions = props.rowData.permissions
    let permissionUsers = []

    if (permissions && permissions.length > 0) {
        permissionUsers = permissions.map((permission, index) => {
            if (permission["permission_id"] !== undefined)
                return (
                    <Grid.Row key={index}>
                        <Grid.Column width={2}>
                            <Button animated='vertical' basic color='red' onClick={(event) => props.onRemovePermission(event, permission)}>
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
                            <Dropdown fluid options={permissionOptions} value={permission.permission_type} onChange={(event, data) => props.onPermissionChange(event, permission, data.value)} />
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
