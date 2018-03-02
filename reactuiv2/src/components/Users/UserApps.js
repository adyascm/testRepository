import React, { Component } from 'react';
import agent from '../../utils/agent'
import { Grid, Button,Icon } from 'semantic-ui-react'

import { connect } from 'react-redux';


import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';


const UserApps = props => {
        let selectedUser = props.selectedUser
        let applications =[]
        if (selectedUser && selectedUser['applications'] && selectedUser['applications'].length>0) {
            applications = selectedUser['applications'].map((application,index) => {
                if (application !== undefined) {
                    let scopes = application["scopes"].split(',').map((scope,index) => {
                       return (
                       <Grid.Row textAlign='center' style={{ margin: '0px' }}  key={index}>
                            {scope}
                        </Grid.Row>  
                       )
                    })

                    return (
                        <Grid.Row key={index}>
                            <Grid.Column verticalAlign='middle'  width={2}>
                                <Button animated='vertical' basic color='red' onClick={(event) =>
                                     props.handleClick(event,application)}>
                                    <Button.Content hidden>Remove</Button.Content>
                                    <Button.Content visible>
                                        <Icon name='remove' />
                                    </Button.Content>
                                </Button>
                            </Grid.Column>
                            <Grid.Column textAlign='center' verticalAlign='middle' width={4}>
                                {application["display_text"]}
                            </Grid.Column>
                            <Grid.Column textAlign='center' width={10}>
                                    {scopes}
                            </Grid.Column>
                        </Grid.Row>
                    )
                }
                else
                    return ""
            })
        }
        else 
            applications = [<Grid.Row key={0}><Grid.Column textAlign='center'>{"No Apps to show"}</Grid.Column></Grid.Row>]
        return (
            <Grid celled='internally'>
                {applications}
            </Grid>
    
        )
}



export default UserApps;
