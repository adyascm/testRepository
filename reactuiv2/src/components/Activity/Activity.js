import React, { Component } from 'react';
import { connect } from 'react-redux';
import ActivityListTable from './ActivityListTable';
import { Grid, Container } from 'semantic-ui-react'

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => ({

});

class Activity extends Component {

  constructor(props) {
    super(props);
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

    return(
        <Container fluid style={containerStyle}>
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
