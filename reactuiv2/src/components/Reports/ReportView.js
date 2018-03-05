import React from 'react';
import { Button, Card, Header} from 'semantic-ui-react';
import cronstrue from 'cronstrue';
import cronQuartz from 'cron-to-quartz'
import {IntlProvider,FormattedDate} from 'react-intl'


const ReportView = props => {
    const reports = props.report;
    const locale =  'en';

    var keys = Object.keys(reports)
    var reportCard = []

    if (keys.length > 0 && !props.getReportError) {
      for (let index=0; index<keys.length; index++) {
        let reportDetail = reports[keys[index]]
        var interval ='';
        var quartzstr = '';
        if(reportDetail.frequency !== undefined){
          var quartzli = cronQuartz.getQuartz(reportDetail.frequency);

          if(quartzli[0][5] && quartzli[0][5] !== '*' && quartzli[0][5] !== '?'){
            quartzli[0][5] = quartzli[0][5] -2

          }
          for(var quartz in quartzli[0]){
             quartzstr += quartzli[0][quartz].toString()+ ' '
        }
          interval = cronstrue.toString(quartzstr)

        }

        var card = (
          <Card key={index} >
              <Card.Content>
                  <Card.Header>
                      {reportDetail.name}
                  </Card.Header>
                  <Card.Meta>
                      Created at:
                      <strong>{reportDetail.creation_time === undefined ? "" :
                      <IntlProvider locale={locale}  >
                       <FormattedDate
                        value={new Date(reportDetail.creation_time)}
                        year='numeric'
                        month='long'
                        day='2-digit'
                        hour='2-digit'
                        minute = '2-digit'
                        second = '2-digit'
                       />
                   </IntlProvider>
                 }</strong>
                  </Card.Meta>
                  <Card.Meta>
                       Last run <strong>{reportDetail.last_trigger_time === "" || reportDetail.last_trigger_time === undefined ?
                         'never run' :
                         <IntlProvider locale={locale}  >
                            <FormattedDate
                             value={new Date(reportDetail.creation_time)}
                             year='numeric'
                             month='long'
                             day='2-digit'
                             hour='2-digit'
                             minute = '2-digit'
                             second = '2-digit'
                            />
                      </IntlProvider>
                    }</strong>
                  </Card.Meta>
                  <Card.Description>
                      {interval}

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

    }
    else {
        return (
          <div>
            {  props.getReportError? <Header>
              There's something not right , we'll be back shortly..
            </Header> : null }
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
            </div>
        );
}

}

export default ReportView;
