import React from 'react';
import { Button, Card, Image } from 'semantic-ui-react'

const ReportView = props => {
    const reports = props.report;

    var keys = Object.keys(reports)
    var reportCard = []

    if (keys.length > 0) {
      for (let index=0; index<keys.length; index++) {
        let reportDetail = reports[keys[index]]
        var card = (
          <Card>
              <Card.Content>
                  <Card.Header>
                      {reportDetail.name}
                  </Card.Header>
                  <Card.Meta>
                      Created at <strong>{reportDetail.creation_time}</strong>
                  </Card.Meta>
                  <Card.Meta>
                       Last run <strong>{reportDetail.last_trigger_time === ""?
                         'never run' : reportDetail.last_trigger_time}</strong>
                  </Card.Meta>
                  <Card.Description>
                      {reportDetail.frequency}

                  </Card.Description>
              </Card.Content>
              <Card.Content extra>
                  <div className='ui three buttons'>
                      <Button basic color='red' onClick={props.deleteReport(reportDetail.report_id)}>Delete</Button>
                      <Button basic color='green' onClick={props.runReport(reportDetail.report_id,
                           reportDetail.name, reportDetail.report_type)}>Run Report</Button>
                         <Button basic color='blue' onClick={props.modifyReport(reportDetail.report_id)}> Modify </Button>

                  </div>
              </Card.Content>
          </Card>
        )
        reportCard.push(card)
      }
    }

    if (reportCard.length > 0) {

      return (
        <Card.Group>
            {reportCard}
            <Card>
              <Card.Content>
                <Card.Description>
                  Click on Add Report to create new report
                      </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <div className='ui buttons'>
                  <Button basic color='green' onClick={props.reportForm}>Add Report</Button>
                </div>
              </Card.Content>
            </Card>
        </Card.Group>
      )

    } else {
        return (
            <Card.Group>
              <Card>
                <Card.Content>
                  <Card.Description>
                    Click on Add Report to create new report
                        </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <div className='ui buttons'>
                    <Button basic color='green' onClick={props.reportForm}>Add Report</Button>
                  </div>
                </Card.Content>
              </Card>
            </Card.Group>
        );

};

}

export default ReportView;
