import React, { Component } from 'react';
import { connect } from 'react-redux';


import { Checkbox, Menu, Input } from 'semantic-ui-react'
import DatePicker from 'react-datepicker'

const mapStateToProps = state => ({
    ...state.activity,
    ...state.common
});

const mapDispatchToProps = dispatch => ({

});
class ActivityFilters extends Component {
    render() {
        // if (!props.userStats || props.isUserSelected)
        //     return null;
        // var stats = []
        // var statTypes = Object.keys(props.userStats)
        // for (let index = 0; index < props.userStats.length; index++) {
        //     let stat = props.userStats[index];
        //     var statSubTypesKeys = Object.keys(stat.stats)
        //     var subTypeMenu = []
        //     for (let stIndex = 0; stIndex < statSubTypesKeys.length; stIndex++) {
        //         let statSubType = statSubTypesKeys[stIndex];
        //         let statNumber = stat.stats[statSubType]["count"];
        //         subTypeMenu.push((
        //             <Menu.Item as='a' style={props.statSubType === stat.stats[statSubType]["value"] ? { 'backgroundColor': 'lightgray' } : null} onClick={(event) => props.handleStatsClick(event, stat.field_name, statSubType, stat.stats[statSubType]["value"])}>
        //                 <Label key={index} color='blue'>{statNumber}</Label>
        //                 <div style={props.statSubType === stat.stats[statSubType]["value"] ? { 'color': 'blue' } : null} >{statSubType}</div>
        //             </Menu.Item>
        //         ))
        //     }
        //     stats.push(<Menu.Item>
        //         <Menu.Header>{stat.display_name}</Menu.Header>
        //         <Menu.Menu>
        //             {subTypeMenu}
        //         </Menu.Menu>
        //     </Menu.Item>);

        // }
        let filter_events = this.props.all_activity_events.map(event => {
            return(
                <Menu.Item>
                    <Checkbox label={event[0]} />
                </Menu.Item>    
            )
        })
        return (
            <Menu vertical style={{ "textAlign": "left", 'overflow': 'auto', 'maxHeight': document.body.clientHeight / 1.25 }} fluid>
                <Menu.Item>
                    <Menu.Header>Date Since</Menu.Header>
                    <Menu.Menu>
                        <Menu.Item>
                        <Input fluid placeholder='Filter by Date...'>
                                            <DatePicker
                                                dateFormat="LLL"
                                            />
                                        </Input>
                        </Menu.Item>
                    </Menu.Menu>
                </Menu.Item>
                <Menu.Item>
                    <Menu.Header>Connector</Menu.Header>
                    <Menu.Menu>
                        <Menu.Item>
                            <Checkbox label='GSUITE' />
                        </Menu.Item>
                        <Menu.Item>
                            <Checkbox label='SLACK' />
                        </Menu.Item>
                    </Menu.Menu>
                </Menu.Item>
                <Menu.Item>
                    <Menu.Header>Event Types</Menu.Header>
                    <Menu.Menu>
                        <Menu.Item>
                            <Checkbox label='Select All' />
                        </Menu.Item>
                        {filter_events}
                    </Menu.Menu>
                </Menu.Item>
            </Menu>
        )
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(ActivityFilters);