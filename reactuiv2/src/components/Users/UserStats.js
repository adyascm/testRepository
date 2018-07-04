import React from 'react';


import { Label, Menu } from 'semantic-ui-react'

const UserStats = props => {
    if (!props.userStats || props.isUserSelected)
        return null;
    var stats = []
    var statTypes = Object.keys(props.userStats)
    for (let index = 0; index < props.userStats.length; index++) {
        let stat = props.userStats[index];
        var statSubTypesKeys = Object.keys(stat.stats)
        var subTypeMenu = []
        for (let stIndex = 0; stIndex < statSubTypesKeys.length; stIndex++) {
            let statSubType = statSubTypesKeys[stIndex];
            let statNumber = stat.stats[statSubType]["count"];
            subTypeMenu.push((
                <Menu.Item as='a' style={props.statSubType === stat.stats[statSubType]["value"] ? {'backgroundColor': 'lightgray'} : null} onClick={(event) => props.handleStatsClick(event,stat.field_name,statSubType,stat.stats[statSubType]["value"])}>
                    <Label key={index} color='blue'>{statNumber}</Label>
                    <div style={props.statSubType === stat.stats[statSubType]["value"] ? {'color': 'blue'} : null} >{statSubType}</div>
                </Menu.Item>
            ))
        }
        stats.push(<Menu.Item>
            <Menu.Header>{stat.display_name}</Menu.Header>
            <Menu.Menu>
                {subTypeMenu}
            </Menu.Menu>
        </Menu.Item>);
        
    }
    return (
        <Menu vertical style={{ "textAlign": "left", 'overflow': 'auto', 'maxHeight': document.body.clientHeight / 1.25}} fluid>
            {stats}
        </Menu>
    )
}

export default UserStats;
