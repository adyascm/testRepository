import * as urls from '../urls.js';

const headers = {
  'Accept': 'application/json'
}

export const getDashboardInfo = ((email,authToken,dataSourceId,userSourceId,widgetInternalName) =>
  fetch(urls.getDashboardInfo(email,authToken,dataSourceId,userSourceId,widgetInternalName),
  { headers }).then(response => response.json()));
