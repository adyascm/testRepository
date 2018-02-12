import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PieChart } from 'react-chartkick';
import { Table, Card, Loader, Segment, Dimmer, Label } from 'semantic-ui-react'
import { DASHBOARD_WIDGET_LOADED, DASHBOARD_WIDGET_LOAD_START } from '../../constants/actionTypes';
import agent from '../../utils/agent';

const mapStateToProps = state => ({
    ...state.dashboard
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: (widgetId, payload) =>
        dispatch({ type: DASHBOARD_WIDGET_LOAD_START, widgetId }),
    onLoad: (widgetId, payload) =>
        dispatch({ type: DASHBOARD_WIDGET_LOADED, widgetId, payload })
});

class ListWidget extends Component {
    componentWillMount() {
        this.props.onLoadStart(this.props.config.id);
        this.props.onLoad(this.props.config.id, agent.Dashboard.getWidgetData(this.props.config.id));
    }
    render() {

        if (this.props[this.props.config.id]) {
            if (this.props[this.props.config.id].isLoaded) {
                const data = this.props[this.props.config.id].data.rows;
                const count = this.props[this.props.config.id].data.totalCount;
                const footer = "Total " + count;
                return (
                    <Card>
                        <Card.Content>
                            <Table celled fixed singleLine>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell colSpan='2'>{this.props.config.header}</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {
                                        data.map(row => {
                                            return (
                                                <Table.Row>
                                                    <Table.Cell collapsing>{row[Object.keys(row)[0]]} </Table.Cell>
                                                    <Table.Cell collapsing textAlign='right'>{row[Object.keys(row)[1]]}</Table.Cell>
                                                </Table.Row>
                                            )
                                        }
                                        )}
                                </Table.Body>
                            </Table>

                        </Card.Content>
                        <Card.Content extra>
                            <div className='ui'>
                                <Label color='green'>{footer} </Label>
                            </div>
                        </Card.Content>
                    </Card>
                )
            }
            else {
                return (
                    <Segment>
                        <Dimmer active inverted>
                            <Loader inverted content='Loading' />
                        </Dimmer>
                        <Card>

                            <Card.Content>
                            </Card.Content>
                            <Card.Content extra>
                            </Card.Content>
                        </Card>
                    </Segment>
                )
            }
        }
        return null;
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(ListWidget);