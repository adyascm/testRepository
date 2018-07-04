
from adya.github import github_utils

def delete_repository(auth_token, resource_name, datasource_id):
    #make a github api call to delete repository
    github_client = github_utils.get_github_client(datasource_id)
    repo = github_client.get_repo(resource_name)

    print "Repository to be deleted : {}".format(repo.full_name)
    response = repo.delete()
    return response