import React, { Component } from 'react';
import { connect } from 'react-redux';
import ActivityListTable from './ActivityListTable';
import { Grid, Container, Card } from 'semantic-ui-react';
import ChartWidget from '../Widgets/ChartWidget';
import agent from '../../utils/agent';
import ActivityFilters from './ActivityFilters';


const mapStateToProps = state => ({
    ...state.activity,
    ...state.common
});

const mapDispatchToProps = dispatch => ({

});

class Activity extends Component {

  render() {
    let containerStyle = {
      height: "100%",
      textAlign: "left"
    };

    var gridWidth = 16;
    if (this.props.rowData){
         gridWidth = 4
    }

    let filter = this.props.filterList !== undefined? this.props.filterList : {}
    filter['domain_id'] = this.props.currentUser['domain_id']
    return(
        <Container fluid style={containerStyle}>
        {/* <LineChart min={0} max={maxLimit} thousands="," label="Events" legend="bottom"  data={this.props[this.props.config.id].data} /> */}
        <Grid divided='vertically' stretched >
          <Grid.Row stretched>
          <Grid.Column width={3}>
                            <ActivityFilters />
                        </Grid.Column>
                        <Grid.Column width={13}>
              <ActivityListTable />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
  )

  }

}

export default connect(mapStateToProps, mapDispatchToProps)(Activity);
