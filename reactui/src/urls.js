const env = process.env.REACT_APP_ADYA_ENV || 'dev';

const DEV_URL = 'https://dev-api.adya.io'
const STAGING_URL = 'https://staging-api.adya.io'
const PROD_URL = 'https://prod-api.adya.io'

let envurl;
switch (env) {
  case 'dev':
    envurl = DEV_URL
    break;
  case 'staging':
    envurl = STAGING_URL
    break;
  case 'prod':
    envurl = PROD_URL
    break;
  default:
    envurl = DEV_URL
}

export const geturl = `${envurl}/get-api/${env}/v1`;
export const posturl = `${envurl}/post-api/${env}/v1`;
export const puturl = `${envurl}/put-api/${env}/v1`;
export const login = () => `${envurl}/login-api/${env}/v1/login`;
export const signup = () => `${envurl}/signup-api/${env}/v1/signup`;
//export const getScanStatus = () => geturl + `/dev/v1/scan@scanadya.io?authToken=29fde6a8-162c-4715-85af-cba1f9f9e6f3&env=dev&createAccount=`;
export const getScanTime = (email,authToken) => geturl +`/get_gdrive_scan_status/${email}?authToken=${authToken}`;
export const getUGTFlatList = (email, authToken) => geturl+`/get_usergroup_list/${email}?authToken=${authToken}`;
export const users = (parentEmail, parentId, usersourceId, authToken) => geturl+`/get_users/${parentEmail}?parent_id=${parentId}&usersource_id=${usersourceId}&authToken=${authToken}`;
export const topLevelUsers = (email, authToken) => geturl+`/get_usersources/${email}?authToken=${authToken}`;
export const topLevelDataSources = (email, authToken) => geturl+`/get_datasources/${email}?authToken=${authToken}`;
export const resources = (email, parentId, datasourceId, authToken) =>
  geturl+`/get_child_resources_with_user_perms/${email}?parent_id=${parentId}&datasource_id=${datasourceId}&authToken=${authToken}`;
export const userActivityLog = (email, userId, authToken, columnNames) => posturl;
export const fileActivityLog = (email, resourceId, authToken, columnNames) => posturl;
export const addDatasource = (email, authToken) => envurl + `/google_auth_url/${env}/v1/${email}?authToken=${authToken}&env=${env}`;
export const serviceaccounturl = (email,authToken)=> geturl+`/get_all_user_data/${email}?authToken=${authToken}`;

export const deleteAccount= (email, datasourceId, datasourceType, authToken)=> geturl+`/delete_entity/${email}?datasource_id=${datasourceId}&datasource_type=${datasourceType}&authToken=${authToken}`;
export const deleteDataSource= (email, datasourceId, authToken)=> geturl+`/delete_entity/${email}?datasource_id=${datasourceId}&authToken=${authToken}`;
export const googleAuthurl= (email, authToken)=> envurl + `/google_auth_url/${env}/v1/${email}?authToken=${authToken}`;
export const resourceFlatList = (email, users, authToken, columnNames)=> posturl;

export const userGroupListForFileId = (email,datasourceId,resourceId,authToken, columnNames) => posturl;
export const getDatasource = (email,authToken) => geturl + `/get_datasources/${email}?authToken=${authToken}`;

export const getDashboardInfo = (email,authToken,dataSourceId,userSourceId,widgetInternalName) =>
geturl + `/get_widget_summary/${email}?authToken=${authToken}&usersource_id=${userSourceId}&datasource_id=
${dataSourceId}&widget_internal_name=${widgetInternalName}`;
export const getUsersource = (email,authToken) => geturl + `/get_usersources/${email}?authToken=${authToken}`;
export const emailForgotPassword = envurl+`/email_forgot_password/${env}/v1`;
// export const changePassword = (email,authToken) => puturl;

export const userGroupemailNameMap = (email,authToken) => geturl +`/getuser_group_email_map/${email}?authToken=${authToken}`;
export const userSouceDataSourceIdMap = (email,authToken) => geturl +`/get_us_ds_id_map/${email}?authToken=${authToken}`;
export const enhanceAccessDocurl ="https://docs.google.com/document/u/2/d/e/2PACX-1vTNhkPWsNbZePnTxHhxeJhaL__gNJzN0pqWfH_q8CnIfwiXtUMoHT-8gOeuUaoEFYMTl45TT8ZnuSP5/pub"
export const getDefaultHeaders = (auth = {}) =>  {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (auth.jwt) {
    headers['Authorization'] = `Bearer ${auth.jwt}`
  }

  return new Headers(headers);
};
