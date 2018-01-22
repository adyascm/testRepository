import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { colors, spaces } from '../designTokens';

const styles = StyleSheet.create({
  tabsContainer: {
    listStyle: 'none',
    padding: 0,
    textAlign: 'center'
  },
  tab: {
    display: 'inline-block',
    textTransform: 'uppercase',
    cursor: 'pointer',
    minWidth: spaces.xl,
    paddingBottom: spaces.xs,
    borderBottom: `solid ${spaces.xxs} ${colors.primaryTint7}`,
    color: colors.textLight,
  },
  tab__active: {
    // color: colors.textLight,
    borderBottom: `solid ${spaces.xxs} ${colors.primary}`
  }
});

class TabSwitcherComponent extends Component {
  render() {
    const  columnWidthP = (100 / this.props.tabs.length) ;
    const tabStyle = {
      width: (columnWidthP+"%")

    };
    const tabs = this.props.tabs.map(tab =>
        <li key={tab.id}
          className={css(styles.tab,(this.props.activeTab === tab.id || this.props.tabs.length==1 ) ? styles.tab__active : null)}
          style={tabStyle}
          onClick={() =>{if(this.props.tabs.length !==1){
                          this.props.setActiveTab(tab.id)
                        }}}>
          <h2>{tab.label}</h2>
        </li>
    );

    return (
      <ul className={css(styles.tabsContainer)}>{tabs}</ul>
    );
  }
}

export default TabSwitcherComponent;
