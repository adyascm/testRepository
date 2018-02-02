import React from 'react';
import { Button, Card, Image } from 'semantic-ui-react'

const DataSourceItem = props => {
    const datasource = props.item;
    if (datasource) {
        return (
            <Card>
                <Card.Content>
                    <Image floated='right' size='mini' src='/assets/images/avatar/large/steve.jpg' />
                    <Card.Header>
                        {datasource.display_name}
                    </Card.Header>
                    <Card.Meta>
                        Created at <strong>{datasource.creation_time}</strong>

                    </Card.Meta>
                    <Card.Description>
                        {datasource.datasource_type}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui two buttons'>
                        <Button basic color='green'>Scan</Button>
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

export default DataSourceItem;
