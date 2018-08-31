import React from 'react';
import { Grid, Button, Icon, Dropdown, Table, Input, Popup } from 'semantic-ui-react'


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
        { text: 'Can Comment', value: 'commenter'},
        { text: 'Admin', value: 'admin'}
    ]

    let permissions = props.rowData.permissions
    let permissionUsers = []
    let permMap = {
        'PUBLIC': {'risk':'10','color':'red','content':'Publicly discoverable'},
        'ANYONEWITHLINK':{'risk':'9','color':'orange','content':'Shared public link'},
        'EXT':{'risk':'8','color':'yellow','content':'Shared with users outside company'},
        'DOMAIN':{'risk':'7','color':null,'content':'Shared with everyone in the company'},
        'INT':{'risk':'6','color':null,'content':'Shared with users inside company'},
        'PVT':{'risk':'5','color':null,'content':'Shared with only owner'},
        'TRUST':{'risk':'4','color':'grey','content':'Shared with trusted domain'}
    }

    if (permissions && permissions.length > 0) {
        permissions.sort(function(a,b){
            return permMap[b['exposure_type']]['risk'] - permMap[a['exposure_type']]['risk']
        });
        permissionUsers = permissions.map((permission, index) => {
            let permColorValue = permission['exposure_type'] in permMap ? permMap[permission['exposure_type']]['color'] : null
            if (permission["permission_id"] !== undefined)
                return (
                    <Table.Row key={index}>
                        <Table.Cell compact style={{textAlign:'center'}}>
                            {permColorValue ?
                            <Popup trigger={<Icon circular inverted color={permColorValue} name='exclamation' />}
                            basic> 
                            {permMap[permission['exposure_type']]['content']}
                            </Popup>
                            : null }
                        </Table.Cell>    
                        <Table.Cell>
                            <Button animated='vertical' basic color='red' disabled={props.datasourceType == "SLACK"} onClick={(event) => props.onRemovePermission(event, permission)}>
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
                            <Dropdown fluid selection disabled={props.datasourceType != "GSUITE"} options={permissionOptions} value={permission.permission_type} onChange={(event, data) => props.onPermissionChange(event, permission, data.value)} selectOnBlur={false} />
                        </Table.Cell>
                    </Table.Row>
                )
            else
                return ("")
        })
    }

    return (
        <Table celled selectable striped compact='very'>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>
                    </Table.HeaderCell>    
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
                    </Table.Cell>
                    <Table.Cell>
                        <Button animated='vertical' basic disabled={props.datasourceType != "GSUITE"} color='green' onClick={(event) => props.onAddPermission(event,newPermission,newPermissionType)}>
                            <Button.Content hidden>Add</Button.Content>
                            <Button.Content visible>
                                <Icon name='plus' />
                            </Button.Content>
                        </Button>
                    </Table.Cell>
                    <Table.Cell>
                        <Input fluid placeholder='Enter the new user email' disabled={props.datasourceType != "GSUITE"} onChange={handleEmailChange} />
                    </Table.Cell>
                    <Table.Cell>
                        <Dropdown fluid selection options={permissionOptions} disabled={props.datasourceType != "GSUITE"} onChange={(event,data) => handleDropDownChange(event,data.value)} selectOnBlur={false} />
                    </Table.Cell>
                </Table.Row>
                {permissionUsers}
            </Table.Body>
        </Table>
    )

}

export default ResourcePermissions;
