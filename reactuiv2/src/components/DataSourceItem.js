import React from 'react';
import { Button, Card, Image, Dimmer, Segment, Loader, Progress } from 'semantic-ui-react'
import agent from '../utils/agent';


const DataSourceItem = props => {
    const datasource = props.item;
    const deleteDatasource = (datasource) => ev => {
        ev.preventDefault();
        props.onDelete(datasource);
    };
    const onScanButtonClick = (e) => {
        console.log("onclick scan called")
        e.preventDefault();
        agent.Setting.processNotifications().then(res => {
            console.log(res);
        });
    }

    if (datasource) {
        var percent = ((datasource.proccessed_file_permission_count/datasource.file_count)*100)
        var statusText = "Processed " + datasource.proccessed_file_permission_count + " of " + datasource.file_count + " files"
        return (
            <Card fluid>
                <Dimmer active={datasource.isDeleting} inverted>
                    <Loader inverted content='Deleting...' />
                </Dimmer>
                <Card.Content>
                    <Image floated='left' size='small' src='/images/GSuite.png' />
                    <Card.Header textAlign='right'>
                        {datasource.display_name}
                    </Card.Header>
                    <Card.Meta textAlign='right'>
                        Created at: <strong>{datasource.creation_time}</strong>
                    </Card.Meta>
                    <Card.Description>
                        {statusText}
                        <Progress size='small' precision='0'  percent={percent} />
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui buttons'>
                        {/* <Button basic color='green' onClick={onScanButtonClick}>Scan</Button> */}
                        <Button basic color='red' onClick={deleteDatasource(datasource)}>Delete</Button>
                    </div>
                </Card.Content>
            </Card>
        );
    }
};

export default DataSourceItem;
