import React, { Component } from 'react';
import { Table, Icon, Segment, Card, Label } from 'semantic-ui-react'

const ListWidget = props => {
const header = props.header;
const rows = props.rows;
const cols = props.cols;
const footer = props.footer;
        return (
            <Card>
                <Card.Content>
                    <Table celled fixed singleLine>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell colSpan='2'>{header}</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {rows.map(row => {
                                return (
                                    <Table.Row>
                                        <Table.Cell collapsing>{row[cols[0]]} </Table.Cell>
                                        <Table.Cell collapsing textAlign='right'>{row[cols[1]]}</Table.Cell>
                                    </Table.Row>
                                )
                            }
                            )}
                        </Table.Body>
                    </Table>

                </Card.Content>
                <Card.Content extra>
                    <div className='ui'>
                        <Label color='green'>{footer} </Label>
                    </div>
                </Card.Content>
            </Card>
        )

    }

export default ListWidget;