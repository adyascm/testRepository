import React, { Component } from 'react';
import { Statistic, Card } from 'semantic-ui-react'

const SimpleNumberWidget = props => {
const header = props.header;
const value = props.value;
        return (
            <Card>
                <Card.Content>
                <Statistic label={header} value={value} />
            
                </Card.Content>
                <Card.Content extra>
                    <div className='ui two buttons'>
                    </div>
                </Card.Content>
                </Card>
        )

    }

export default SimpleNumberWidget;