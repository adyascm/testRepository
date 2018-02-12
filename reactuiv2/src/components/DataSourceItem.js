import React from 'react';
import { Button, Card, Image, Dimmer, Segment, Loader } from 'semantic-ui-react'

import agent from '../utils/agent';

const DataSourceItem = props => {
    const datasource = props.item;
    const deleteDatasource = (datasource) => ev => {
        ev.preventDefault();
        props.onDelete(datasource);
    };
    if (datasource) {
        return (
            <Card>
                <Dimmer active={datasource.isDeleting} inverted>
                    <Loader inverted content='Deleting...' />
                </Dimmer>
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
                        <Button basic color='red' onClick={deleteDatasource(datasource)}>Delete</Button>
                    </div>
                </Card.Content>
            </Card>
        );
    }
};

export default DataSourceItem;
