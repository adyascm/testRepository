import React from 'react';
import { Button, Card, Image, Dimmer, Loader, Progress, Label, Header } from 'semantic-ui-react'
import { IntlProvider, FormattedDate } from 'react-intl'
import { Link } from 'react-router-dom'



const DataSourceItem = props => {
    const datasource = props.item;
    const deleteDatasource = (datasource) => ev => {
        ev.preventDefault();
        props.onDelete(datasource);
    };
    // const onScanButtonClick = (e) => {
    //     console.log("onclick scan called")
    //     e.preventDefault();
    //     agent.Setting.processNotifications().then(res => {
    //         console.log(res);
    //     });
    // }

    const getScanStatus = (datasource) => {
        var percent = ((datasource.processed_file_count / datasource.total_file_count) * 100)
        if (datasource.total_file_count === 0)
            percent = 0;

        if (datasource.file_scan_status > 10000 || datasource.user_scan_status > 1 || datasource.group_scan_status > 1)
            return <Progress size='small' precision='0' percent={percent} error />; //Failed

        var file_status = 1
        if (datasource.is_serviceaccount_enabled)
            file_status = datasource.total_user_count
        if ((datasource.file_scan_status >= file_status && datasource.total_file_count === datasource.processed_file_count) && (datasource.user_scan_status === 1 && datasource.total_user_count === datasource.processed_user_count) && (datasource.group_scan_status === 1 && datasource.total_group_count === datasource.processed_group_count))
            return <Progress size='small' precision={0} percent={percent} success />; //Complete
        return <Progress size='small' precision='0' percent={percent} active />; //In Progress
    }

    if (datasource) {
        var statusText = "Processed " + datasource.processed_file_count + "/" + datasource.total_file_count + " files " + datasource.processed_group_count + "/" + datasource.total_group_count + " groups " + datasource.processed_user_count + "/" + datasource.total_user_count + " users"
        var status = getScanStatus(datasource);
        var syncStatus = <Label style={{ marginLeft: "5px" }} circular color='red' key='red'>Sync Disabled</Label>;
        if (datasource.is_push_notifications_enabled)
            syncStatus = <Label style={{ marginLeft: "5px" }} circular color='green' key='green'>Syncing</Label>;
        var datasourceImage = <Image floated='left' size='small' src='/images/GSuite.png' />
        if (datasource.is_dummy_datasource)
            datasourceImage = <Image circular floated='left' size='small'><Label content='Dummy' icon='lab' /></Image>
        return (
            <Card fluid >
                <Dimmer active={datasource.isDeleting} inverted>
                    <Loader inverted content='Deleting...' />
                </Dimmer>
                <Card.Content>
                    <Header >{datasource.domain_id}</Header>
                    {datasourceImage}
                    <Card.Header textAlign='right'>
                        {datasource.display_name}
                        {syncStatus}
                    </Card.Header>
                    <Card.Meta textAlign='right'>
                        Created at: <strong><IntlProvider locale='en'  >
                            <FormattedDate
                                value={new Date(datasource.creation_time)}
                                year='numeric'
                                month='long'
                                day='2-digit'
                                hour='2-digit'
                                minute='2-digit'
                                second='2-digit'
                            />
                        </IntlProvider>
                        </strong>
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
                        {status["props"]["success"]?(<Button as={Link} to='/' basic color='green' style={{marginLeft: '5px'}} >Go To Dashboard</Button>):null}
                    </div>
                </Card.Content>
            </Card>
        );
    }
};

export default DataSourceItem;
