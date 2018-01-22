import React, {Component} from 'react';
import {Pie} from 'react-chartjs-2';
import 'chart.piecelabel.js';
import {colors} from '../designTokens';
import { StyleSheet, css } from 'aphrodite/no-important';

class PieChart extends Component {
  constructor(props){
    super(props);
    this.state = {
      dataset: {
        datasets: [
          {
            label: 'Test PieChart',
            data: [],
            backgroundColor: []
          }
        ]
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    var data = nextProps.data;
    var color = nextProps.color;
    var mode = nextProps.mode;

    this.setState({
      dataset: {
        datasets: [
          {
            label: 'Test PieChart',
            data: data,
            backgroundColor: color,
            borderColor: colors.backgroundDark
          }
        ]
      }
    })
  }

  render() {
    return(
      <div>
        <Pie
          width={140}
          height={50}
        	data={this.state.dataset}
        	options={{
            pieceLabel: {
              render: 'percentage',
              fontColor: colors.linkLightHover,
              fontStyle: 'bold',
              fontSize: 14
            },
            tooltips: {
              callbacks: {
                label: function(tooltipItem,data) {
                  const fileShareModes = {
                    '#2E3D4C': 'Public',
                    '#445A76': 'External',
                    '#6FA2D9': 'Domain',
                  }
                  var dataset = data.datasets[tooltipItem.datasetIndex];
                  return dataset.data[tooltipItem.index]+'% '+fileShareModes[dataset.backgroundColor[tooltipItem.index]];
                }
              }
            }
          }}
        />
      </div>
    );
  }
}

export default PieChart;
