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
        var percent = ((datasource.processed_file_count/datasource.total_file_count)*100)
        if(datasource.total_file_count == 0)
            percent = 0;
        var statusText = "Processed " + datasource.processed_file_count + "/" + datasource.total_file_count + " files " + datasource.processed_group_count + "/" + datasource.total_group_count + " groups " + datasource.processed_user_count + "/" + datasource.total_user_count + " users"
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
                        <Button basic color='red' loading={datasource.isDeleting} onClick={deleteDatasource(datasource)}>Delete</Button>
                    </div>
                </Card.Content>
            </Card>
        );
    }
};

export default DataSourceItem;
