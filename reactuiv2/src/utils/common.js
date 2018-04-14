
const DataSourceUtils = {
    getScanStatus: (datasource) => {
        var status = 'active';//In Progress  
        if (datasource.file_scan_status > 10000 || datasource.user_scan_status > 1 || datasource.group_scan_status > 1)
            status = 'error' //Failed
        else {
            var file_status = 1
            if (datasource.is_serviceaccount_enabled)
                file_status = datasource.total_user_count
            if ((datasource.file_scan_status >= file_status && datasource.total_file_count <= datasource.processed_file_count) && (datasource.user_scan_status === 1 && datasource.total_user_count === datasource.processed_user_count) && (datasource.group_scan_status === 1 && datasource.total_group_count === datasource.processed_group_count))
                status = 'success' //Complete
        }
        return status;
    }
}

export default { DataSourceUtils };