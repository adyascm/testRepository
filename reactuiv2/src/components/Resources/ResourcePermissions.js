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
    const onGridReady = (params) => {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;

        params.api.sizeColumnsToFit();
    }
    return (
        <Grid celled='internally'>
            <Grid.Row>
                <Grid.Column width={2}>
                    <Button animated='vertical' basic color='red'>
                        <Button.Content hidden>Remove</Button.Content>
                        <Button.Content visible>
                            <Icon name='remove' />
                        </Button.Content>
                    </Button>
                </Grid.Column>
                <Grid.Column width={10}>
                    amit@adya.io
      </Grid.Column>
                <Grid.Column width={4}>
                    <Dropdown fluid text='Read' options={state.permissionOptions} />
                </Grid.Column>
            </Grid.Row>

            <Grid.Row>
                <Grid.Column width={2}>
                    <Button animated='vertical'  basic color='red'>
                        <Button.Content hidden>Remove</Button.Content>
                        <Button.Content visible>
                            <Icon name='remove' />
                        </Button.Content>
                    </Button>
                </Grid.Column>
                <Grid.Column width={10}>
                    tinkesh@adya.io
      </Grid.Column>
                <Grid.Column width={4}>
                    <Dropdown fluid text="Write" options={state.permissionOptions} />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
            <Grid.Column width={16}>
            <Dropdown placeholder='Quick Actions...' fluid selection options={state.quickActions} />
            </Grid.Column >
            </Grid.Row>
        </Grid>

    )

}

export default ResourcePermissions;