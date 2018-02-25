import React from 'react';
import { Button, Card, Image, Dimmer, Segment, Loader, Progress, Label } from 'semantic-ui-react'
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

    const getScanStatus = (datasource) => {
        var percent = ((datasource.processed_file_count / datasource.total_file_count) * 100)
        if (datasource.total_file_count == 0)
            percent = 0;

        if (datasource.file_scan_status > 10000 || datasource.user_scan_status > 1 || datasource.group_scan_status > 1)
            return <Progress size='small' precision='0' percent={percent} error />; //Failed

        if ((datasource.file_scan_status > 0 && datasource.total_file_count == datasource.processed_file_count) && (datasource.user_scan_status == 1 && datasource.total_user_count == datasource.processed_user_count) && (datasource.group_scan_status == 1 && datasource.total_group_count == datasource.processed_group_count))
            return <Progress size='small' precision='0' percent={percent} success />; //Complete
        return <Progress size='small' precision='0' percent={percent} active />; //In Progress
    }

    if (datasource) {
        console.log("datasource payload : ", datasource.creation_time.split('T').join(' '))
        var statusText = "Processed " + datasource.processed_file_count + "/" + datasource.total_file_count + " files " + datasource.processed_group_count + "/" + datasource.total_group_count + " groups " + datasource.processed_user_count + "/" + datasource.total_user_count + " users"
        var status = getScanStatus(datasource);
        var syncStatus = <Label style={{ marginLeft: "5px" }} circular color='red' key='red'>Sync Disabled</Label>;
        if (datasource.is_push_notifications_enabled)
            syncStatus = <Label style={{ marginLeft: "5px" }} circular color='green' key='green'>Syncing</Label>;
        return (
            <Card fluid >
                <Dimmer active={datasource.isDeleting} inverted>
                    <Loader inverted content='Deleting...' />
                </Dimmer>
                <Card.Content>
                    <Image floated='left' size='small' src='/images/GSuite.png' />
                    <Card.Header textAlign='right'>
                        {datasource.display_name}
                        {syncStatus}
                    </Card.Header>
                    <Card.Meta textAlign='right'>
                        Created at: <strong>{datasource.creation_time.split('T').join(' ')}</strong>
                    </Card.Meta>
                    <Card.Description>
                        {statusText}
                        {status}
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
