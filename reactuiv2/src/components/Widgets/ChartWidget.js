import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { PieChart } from 'react-chartkick';
import { Card, Loader, Dimmer, Label } from 'semantic-ui-react'
import { DASHBOARD_WIDGET_LOADED, DASHBOARD_WIDGET_LOAD_START, SET_CURRENT_URL } from '../../constants/actionTypes';
import agent from '../../utils/agent';

const mapStateToProps = state => ({
    ...state.dashboard
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: (widgetId, payload) =>
        dispatch({ type: DASHBOARD_WIDGET_LOAD_START, widgetId }),
    onLoad: (widgetId, payload) =>
        dispatch({ type: DASHBOARD_WIDGET_LOADED, widgetId, payload }),
    onWidgetClick: (url) =>
        dispatch({ type: SET_CURRENT_URL, url })
});

class ChartWidget extends Component {
    componentWillMount() {
        this.props.onLoadStart(this.props.config.id);
        this.props.onLoad(this.props.config.id, agent.Dashboard.getWidgetData(this.props.config.id));
    }

    widgetClick = () => {
        this.props.onWidgetClick(this.props.config.link)
    }

    render() {
        if (this.props[this.props.config.id]) {
            if (this.props[this.props.config.id].isLoaded) {
                return (
                    <Card as={Link} to={this.props.config.link} onClick={this.widgetClick} >
                        <Card.Content>
                            <PieChart legend="bottom" donut={true} data={this.props[this.props.config.id].data.rows} />

                        </Card.Content>
                        <Card.Content extra>
                            <div className='ui'>
                                <Label color='green'>{this.props[this.props.config.id].data.totalCount}
                                  &nbsp;{this.props.config.footer}</Label>
                            </div>
                        </Card.Content>
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
export default connect(mapStateToProps, mapDispatchToProps)(ChartWidget);
