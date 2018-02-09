import React, {Component} from 'react';

import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';


class ResourcesTree extends Component {
    constructor(props) {
        super(props);
        this.state = {
            columnDefs: [
              {
                  headerName: "Resource",
                  field: "group",
                  cellRenderer: "agGroupCellRenderer"
              },
              {
                  headerName: "Owner",
                  field: "owner"
              }
          ],
          rowData: [
              {
                  group: "Folder A",
                  owner: "amit@adya.io",
                  permission: "write",
                  participants: [
                      {
                          group: "A.1",
                          owner: "amit@adya.io",
                  permission: "write",
                      },
                      {
                          group: "A.2",
                          owner: "tinkesh@adya.io",
                  permission: "read",
                      },
                      {
                          group: "A.3",
                          owner: "rashmi@adya.io",
                  permission: "write",
                      }
                  ]
              },
              {
                  group: "Folder B",
                  owner: "deepak@adya.io",
                  permission: "read",
                  participants: [
                      {
                          group: "B.1",
                          owner: "amit@adya.io",
                  permission: "read",
                      },
                      {
                          group: "B.2",
                          owner: "tinkesh@adya.io",
                  permission: "read",
                      },
                      {
                          group: "B.3",
                          owner: "amit@adya.io",
                  permission: "write",
                      },
                      {
                          group: "B.4",
                          owner: "abhra@adya.io",
                  permission: "write",
                      },
                      {
                          group: "B.5",
                          owner: "amit@adya.io",
                  permission: "write",
                      }
                  ]
              },
              {
                  group: "Folder C",
                  owner: "amit@adya.io",
                  permission: "write",
                  participants: [
                      {
                          group: "C.1",
                          owner: "amit@adya.io",
                  permission: "write",
                      },
                      {
                          group: "C.2",
                          owner: "deepak@adya.io",
                  permission: "read",
                      }
                  ]
              }
          ],
          getNodeChildDetails: function getNodeChildDetails(rowItem) {
              if (rowItem.participants) {
                  return {
                      group: true,
                      expanded: false,
                      children: rowItem.participants,
                      key: rowItem.group
                  };
              } else {
                  return null;
              }
          }
        };
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
    
        params.api.sizeColumnsToFit();
      }

    render() {
        return (
            <div className="ag-theme-fresh">
              <AgGridReact
                id="myGrid" domLayout="autoHeight"
                rowSelection='single' suppressCellSelection='true'
                columnDefs={this.state.columnDefs}
                rowData={this.state.rowData}
                getNodeChildDetails={this.state.getNodeChildDetails}
                onGridReady={this.onGridReady.bind(this)}
              />
            </div>
        )
    }
}

export default ResourcesTree;