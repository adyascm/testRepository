import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom'
import { Table, Card, Loader, Dimmer, Label } from 'semantic-ui-react'
import { DASHBOARD_WIDGET_LOADED, DASHBOARD_WIDGET_LOAD_START, SET_REDIRECT_PROPS } from '../../constants/actionTypes';
import agent from '../../utils/agent';

const mapStateToProps = state => ({
    ...state.dashboard
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: (widgetId, payload) =>
        dispatch({ type: DASHBOARD_WIDGET_LOAD_START, widgetId }),
    onLoad: (widgetId, payload) =>
        dispatch({ type: DASHBOARD_WIDGET_LOADED, widgetId, payload }),
    onWidgetClick: (url, states) => 
        dispatch({ type: SET_REDIRECT_PROPS, redirectUrl: url, reducerStates: states })
});

class ListWidget extends Component {
    componentWillMount() {
        this.props.onLoadStart(this.props.config.id);
        this.props.onLoad(this.props.config.id, agent.Dashboard.getWidgetData(this.props.config.id));
    }

    widgetClick = () => {
        this.props.onWidgetClick(this.props.config.link, this.props.config.states)
        this.props.history.push(this.props.config.link)
    }

    render() {

        if (this.props[this.props.config.id]) {
            if (this.props[this.props.config.id].isLoadingWidget) {
                const data = this.props[this.props.config.id].data.rows;
                const count = this.props[this.props.config.id].data.totalCount;
                const remainingCount = count - data.length
                const footer = count > 5 ? "...and " + remainingCount + " more":null;
                
                if (!count)
                    return null
                
                return (
                    <Card onClick={this.widgetClick} >
                        <Card.Content>
                            <Table celled singleline='false'>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell colSpan='2'>{this.props.config.header}</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {
                                        data.map(row => {
                                            return (
                                                <Table.Row key={row[Object.keys(row)[0]]}>
                                                    <Table.Cell width='8' style={{'wordBreak': 'break-all'}}>{row[Object.keys(row)[0]]}</Table.Cell>
                                                    <Table.Cell textAlign='right' width='3' style={{'wordBreak': 'break-all'}}>{row[Object.keys(row)[1]]}</Table.Cell>
                                                </Table.Row>
                                            )
                                        }
                                        )}
                                </Table.Body>
                            </Table>

                        </Card.Content>
                        {!footer?null:
                        <Card.Content extra>
                            <div className='ui'>
                                <Label color='green'>{footer} </Label>
                            </div>
                        </Card.Content>}
                    </Card>
                )
            }
            else {
                return (
                    <Card>
                        <Card.Content>
                            <Dimmer active inverted>
                                <Loader inverted />
                            </Dimmer>
                        </Card.Content>
                        <Card.Content extra>
                        </Card.Content>
                    </Card>
                )
            }
        }
        return null;
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ListWidget));