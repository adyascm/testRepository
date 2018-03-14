import React, { Component } from 'react';
import { IntlProvider,FormattedDate } from 'react-intl'

class DateComponent extends Component {

    render() {
        return (
            <IntlProvider locale='en'>
                <FormattedDate
                    value={new Date(this.props.value)}
                    year='numeric'
                    month='long'
                    day='2-digit'
                    hour='2-digit'
                    minute = '2-digit'
                    second = '2-digit'
                />
            </IntlProvider>
        )
    }
}

export default DateComponent;