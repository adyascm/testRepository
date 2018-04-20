import React from 'react';
import { Grid, Button, Icon, Dropdown, Table, Input } from 'semantic-ui-react'


let newPermission = {
    email: '',
    type: ''
}

let newPermissionType = ''

const handleEmailChange = (event) => {
    newPermission['email'] = event.target.value
}

const handleDropDownChange = (event,data) => {
    newPermissionType = data
}

const ResourcePermissions = props => {
    let permissionOptions = [
        { text: 'Can Read', value: 'reader' },
        { text: 'Can Write', value: 'writer' },
        { text: 'Owner', value: 'owner' },
        {text: 'Can Comment', value: 'commenter'}
    ]

    let permissions = props.rowData.permissions
    let permissionUsers = []


    if (permissions && permissions.length > 0) {
        permissionUsers = permissions.map((permission, index) => {
            if (permission["permission_id"] !== undefined)
                // return (
                //     <Grid.Row key={index}>
                //         <Grid.Column width={2}>
                //             <Button animated='vertical' basic color='red' onClick={(event) => props.onRemovePermission(event, permission)}>
                //                 <Button.Content hidden>Remove</Button.Content>
                //                 <Button.Content visible>
                //                     <Icon name='remove' />
                //                 </Button.Content>
                //             </Button>
                //         </Grid.Column>
                //         <Grid.Column width={10}>
                //             {permission["email"]}
                //         </Grid.Column>
                //         <Grid.Column width={4}>
                //             <Dropdown fluid options={permissionOptions} value={permission.permission_type} onChange={(event, data) => props.onPermissionChange(event, permission, data.value)} />
                //         </Grid.Column>
                //     </Grid.Row>
                // )
                return (
                    <Table.Row>
                        <Table.Cell>
                            <Button animated='vertical' basic color='red' onClick={(event) => props.onRemovePermission(event, permission)}>
                                <Button.Content hidden>Remove</Button.Content>
                                <Button.Content visible>
                                    <Icon name='remove' />
                                </Button.Content>
                            </Button>
                        </Table.Cell>
                        <Table.Cell>
                            {permission["email"]}
                        </Table.Cell>
                        <Table.Cell>
                            <Dropdown fluid selection options={permissionOptions} value={permission.permission_type} onChange={(event, data) => props.onPermissionChange(event, permission, data.value)} selectOnBlur={false} />
                        </Table.Cell>
                    </Table.Row>
                )
            else
                return ("")
        })
    }

    // return (
    //     <Grid celled='internally'>
    //         {permissionUsers}
    //     </Grid>

    // )

    return (
        <Table celled selectable striped compact='very'>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>
                        Add/Remove
                    </Table.HeaderCell>
                    <Table.HeaderCell>
                        Permission Email
                    </Table.HeaderCell>
                    <Table.HeaderCell>
                        Permission Type
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    <Table.Cell>
                        <Button animated='vertical' basic color='green' onClick={(event) => props.onAddPermission(event,newPermission,newPermissionType)}>
                            <Button.Content hidden>Add</Button.Content>
                            <Button.Content visible>
                                <Icon name='plus' />
                            </Button.Content>
                        </Button>
                    </Table.Cell>
                    <Table.Cell>
                        <Input fluid placeholder='Enter the new user email' onChange={handleEmailChange} />
                    </Table.Cell>
                    <Table.Cell>
                        <Dropdown fluid selection options={permissionOptions} onChange={(event,data) => handleDropDownChange(event,data.value)} selectOnBlur={false} />
                    </Table.Cell>
                </Table.Row>
                {permissionUsers}
            </Table.Body>
        </Table>
    )

}

export default ResourcePermissions;
