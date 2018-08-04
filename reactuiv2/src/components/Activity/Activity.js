import React, { Component } from 'react';
import { connect } from 'react-redux';
import ActivityListTable from './ActivityListTable';
import { Grid, Container, Card } from 'semantic-ui-react';
import ChartWidget from '../Widgets/ChartWidget';
import agent from '../../utils/agent';


const mapStateToProps = state => ({
    ...state.activity,
    ...state.common
});

const mapDispatchToProps = dispatch => ({

});

class Activity extends Component {

  constructor(props) {
    super(props);
    this.activityWidgets = [
      { id: "activitiesByEventType", header: "", footer: "$ in Total Annual Cost", renderType: "ChartWidget", link: "/apps", states: {apps: {sortColumnName: 'annual_cost', sortOrder: 'desc'}}},
    ];
  }

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
        { <Card.Group itemsPerRow='1'>
        {
            this.activityWidgets.map(config => {
              if(config.renderType === "ChartWidget")
              {
                return (
                  <ChartWidget key={config["id"]} config={config} filters={filter}/>
                )
              }
            })
          }
        </Card.Group> }
        <Grid divided='vertically' stretched >
          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              <ActivityListTable />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
  )

  }

}

export default connect(mapStateToProps, mapDispatchToProps)(Activity);
