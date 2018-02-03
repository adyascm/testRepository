import React, { Component } from 'react';
import { Segment, Card, Label } from 'semantic-ui-react'
import { PieChart } from 'react-chartkick';

const ChartWidget = props => {
const header = props.header;
const rows = props.rows;
const cols = props.cols;
const footer = props.footer;
        return (
            <Card>
                <Card.Content>
                <PieChart legend="bottom" donut={true} data={rows} />

                </Card.Content>
                <Card.Content extra>
                    <div className='ui'>
                        <Label color='green'>{footer} </Label>
                    </div>
                </Card.Content>
            </Card>
        )

    }

export default ChartWidget;