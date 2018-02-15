import React from 'react';
import { Button, Card, Image } from 'semantic-ui-react'

const ReportView = props => {
    const reports = props.report;

    if (reports.length > 0) {
      let reportCard = reports.map((report) => {
        return (
            <Card>
                <Card.Content>
                    <Card.Header>
                        {report.name}
                    </Card.Header>
                    <Card.Meta>
                        Created at <strong>{report.creation_time}</strong>

                    </Card.Meta>
                    <Card.Description>
                        {report.frequency}
                        {report.config.report_type}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui two buttons'>
                        <Button basic color='red' onClick={props.deleteReport(report.report_id)}>Delete</Button>
                        <Button basic color='green' onClick={props.runReport(report.report_id)}>Run Report</Button>

                    </div>
                </Card.Content>
            </Card>
        );
      })

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
    }
};

export default ReportView;
