import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { border, spaces, colors } from '../designTokens';

const s = StyleSheet.create({
  activityRow: {
    borderBottom: border.base
  },
  activityTable: {
    width: '100%'
  },
  activityCell: {
    padding: spaces.s,
    margin: 0,
    
    ':last-child': {
      borderBottomWidth: 0
    }
  },
  headerRow: {
    marginBottom: spaces.s,
    backgroundColor: colors.background
  },
  headerCell: {
    textAlign: 'left'
  }
});

class Activity extends Component {
  render() {
    const log = this.props.log || [];
    const tableEls = [];
    tableEls.push(
      <thead key="head">
        <tr className={css(s.headerRow)}>
          <th className={css(s.activityCell, s.headerCell)}>Date</th>
          <th className={css(s.activityCell, s.headerCell)}>Operation</th>
          <th className={css(s.activityCell, s.headerCell)}>Datasource</th>
          {this.props.showUserColumn ? <th className={css(s.activityCell, s.headerCell)}>User</th> : null}
          {this.props.showResourceColumn ? <th className={css(s.activityCell, s.headerCell)}>Resource</th> : null }
        </tr>
      </thead>
    );

    const tableBodyEls = [];
    log.forEach((c, i) => {
      const dateEl = (
        <time>
          {new Date(c[4]).toLocaleTimeString("en-us", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </time>
      );
      
      const activityEl = (
        <tr className={css(s.activityRow)} key={i}>
          <td className={css(s.activityCell)}>{dateEl}</td>
          <td className={css(s.activityCell)}>{c[1]}</td>
          <td className={css(s.activityCell)}>{c[0]}</td>
          {this.props.showUserColumn ? <td className={css(s.activityCell)}>{c[2]}</td> : null }
          {this.props.showResourceColumn ? <td className={css(s.activityCell)}>{c[3] || c[3]}</td> : null }
      </tr>
    );
        
      tableBodyEls.push(activityEl);
    });

    tableEls.push(<tbody key="body">{tableBodyEls}</tbody>);
      
    return (<table className={css(s.activityTable)}>{tableEls}</table>);
  }
}

export default Activity;
