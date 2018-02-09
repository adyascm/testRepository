import React from 'react';
import { Button, Card, Image } from 'semantic-ui-react'

const ReportView = props => {
    const report = props.report;
    if (report) {
        return (
            <Card>
                <Card.Content>
                    <Image floated='right' size='mini' src='/assets/images/avatar/large/steve.jpg' />
                    <Card.Header>
                        {report.name}
                    </Card.Header>
                    <Card.Meta>
                        Created at <strong>{report.creation_time}</strong>

                    </Card.Meta>
                    <Card.Description>
                        {report.config}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui two buttons'>
                        <Button basic color='red'>Delete</Button>
                    </div>
                </Card.Content>
            </Card>
        );
    } else {
        return (
            <div>Loading Tags...</div>
        );
    }
};

export default ReportView;
