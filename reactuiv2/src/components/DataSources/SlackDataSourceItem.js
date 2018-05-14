import React from 'react';
import { Button, Card, Image, Dimmer, Loader, Progress, Label, Header, Container, Divider } from 'semantic-ui-react'
import { IntlProvider, FormattedDate } from 'react-intl'
import { Link } from 'react-router-dom'
import common from '../../utils/common'



const SlackDataSourceItem = props => {
    const datasource = props.item;
    const deleteDatasource = (datasource) => ev => {
        ev.preventDefault();
        props.onDelete(datasource);
    };
    const addNewDatasource = () => ev => {
        ev.preventDefault();
        props.onAdd();
    };
    const onPollChanges = (datasource) => ev => {
        ev.preventDefault();
        props.onPollChanges(datasource);
    };

    if (datasource && datasource.datasource_id) {
        var percent = ((datasource.processed_file_count / datasource.total_file_count) * 100)
        if (datasource.total_file_count === 0)
            percent = 0;
        var statusText = "Scan is in progress. Please wait for it to complete."
        var statusCount = "Processed " + datasource.processed_file_count + "/" + datasource.total_file_count + " files/folders " + datasource.processed_group_count + "/" + datasource.total_group_count + " groups " + datasource.processed_user_count + "/" + datasource.total_user_count + " users"
        var pollIcon = null;
        var status = common.DataSourceUtils.getScanStatus(datasource);
        var progressBar = (<Progress size='small' precision='0' percent={percent} active />);
        if (status == 'error') {
            statusText = "Scan has failed. Please delete and try again."
            progressBar = (<Progress size='small' precision='0' percent={percent} error />);
        }
        else if (status == 'success') {
            statusText = "Scan is complete."
            progressBar = (<Progress size='small' precision='0' percent={percent} success />);
            pollIcon = <Button style={{ margin: "5px" }} circular basic icon='refresh' onClick={onPollChanges(datasource)} />;
        }


        var datasourceImage = <Image floated='left' size='small' src='/images/GSuite.png' />
        if (datasource.is_dummy_datasource)
            datasourceImage = <Image circular floated='left' size='small'><Label content='Sample' icon='lab' /></Image>
        return (
            <Card >
                <Dimmer active={datasource.isDeleting} inverted>
                    <Loader inverted content='Deleting...' />
                </Dimmer>
                <Card.Content>
                    <Header >{datasource.domain_id}</Header>
                    {datasourceImage}
                    <Card.Header textAlign='right'>
                        {datasource.display_name}
                        {/* {syncStatus} */}
                        {pollIcon}
                    </Card.Header>
                    <Card.Meta textAlign='right'>
                        Created on: <strong><IntlProvider locale='en'  >
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
                        {statusCount}
                        {progressBar}
                        {statusText}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui buttons'>
                        {/* <Button basic color='green' onClick={onScanButtonClick}>Scan</Button> */}
                        <Button basic color='red' loading={datasource.isDeleting} onClick={deleteDatasource(datasource)}>Delete</Button>
                        {status == 'success' ? (<Button basic color='green' style={{ marginLeft: '5px' }} onClick={() => props.handleClick()} >Go To Dashboard</Button>) : null}
                    </div>
                </Card.Content>
            </Card>
        );
    }
    else {
        var header = (<Header>Adya for Slack </Header>);
        var detail = (<Container>
            Learn more about Adya for slack <a target='_blank' href='https://www.adya.io/resources/'>here.</a>
        </Container>)
        var buttonText = "Connect";

        return (
            <Card>
                <Card.Content>
                    {header}
                    <Card.Description>
                        <Image floated='left' size='mini' src='/images/slack_logo128x128.png' />

                        {detail}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui buttons'>
                        <Button basic color='green' onClick={addNewDatasource()} loading={props.inProgress ? true : false}>Connect</Button>
                    </div>
                </Card.Content>
            </Card>
        )
    }
};

export default SlackDataSourceItem;
