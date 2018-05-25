import React from 'react';


import { Label, Menu } from 'semantic-ui-react'

const UserStats = props => {
    if (!props.userStats || props.isUserSelected)
        return null;
    var stats = []
    var statTypes = Object.keys(props.userStats)
    for (let index = 0; index < statTypes.length; index++) {
        let statType = statTypes[index];
        let statSubTypes = props.userStats[statTypes[index]];
        var statSubTypesKeys = Object.keys(statSubTypes)
        var subTypeMenu = []
        for (let stIndex = 0; stIndex < statSubTypesKeys.length; stIndex++) {
            let statSubType = statSubTypesKeys[stIndex];
            let statNumber = statSubTypes[statSubType];
            subTypeMenu.push((
                <Menu.Item as='a' onClick={(event) => props.handleStatsClick(event,statType,statSubType)}>
                    <Label key={index} color='blue'>{statNumber}</Label>
                    {statSubType}
                </Menu.Item>
            ))
        }
        stats.push(<Menu.Item>
            <Menu.Header>{statType}</Menu.Header>
            <Menu.Menu>
                {subTypeMenu}
            </Menu.Menu>
        </Menu.Item>);
        
    }
    return (
        <Menu vertical style={{ "textAlign": "left", 'overflow': 'auto', 'maxHeight': document.body.clientHeight / 1.05}} fluid>
            {stats}
        </Menu>
    )
}

export default UserStats;
