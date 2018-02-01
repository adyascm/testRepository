import * as urls from '../urls.js';

const headers = {
  'Accept': 'application/json'
}

export const getDatasource = ((authToken) =>
  fetch(urls.getDatasource(authToken),
  { headers }).then(response => response.json()));

export const getUsersourceId = ((email,authToken) =>
  fetch(urls.getUsersource(email,authToken),
  { headers }).then(response => response.json()));
