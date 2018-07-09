
from adya.github import github_utils

def delete_repository(auth_token, resource_name, datasource_id):
    #make a github api call to delete repository
    github_client = github_utils.get_github_client(datasource_id)
    repo = github_client.get_repo(resource_name)

    print "Repository to be deleted : {}".format(repo.full_name)
    response = repo.delete()
    return response

def remove_external_collaborators(auth_token, resource_name, datasource_id, domain_id):
    github_client = github_utils.get_github_client(datasource_id)
    repo = github_client.get_repo(resource_name)

    for collaborator in repo.get_collaborators():
        #Check if the collaborator is external, if so remove the same
        collaborator_obj = collaborator.raw_data
        user_email = "{0}+{1}@users.noreply.github.com".format(collaborator_obj["id"], collaborator_obj["login"])
        collaborator_email = collaborator_obj["email"] if collaborator_obj["email"] else user_email

        if github_utils.is_external_user(domain_id, collaborator_email):
            #Collaborator is external, so deleting the collaborator
            print "External collaborator to be deleted : {}".format(collaborator_obj["name"])
            repo.remove_from_collaborators(collaborator)
        
    return repo.id

def remove_collaborator(auth_token, resource_name, datasource_id, permissions_obj):
    #Remove the collaborator from the repository
    github_client = github_utils.get_github_client(datasource_id)
    repo = github_client.get_repo(resource_name)

    for collaborator in repo.get_collaborators():
        collaborator_obj = collaborator.raw_data
        user_email = "{0}+{1}@users.noreply.github.com".format(collaborator_obj["id"], collaborator_obj["login"])
        collaborator_email = collaborator_obj["email"] if collaborator_obj["email"] else user_email

        if collaborator_email == permissions_obj["email"]:
            #Delete the collaborator
            repo.remove_from_collaborators(collaborator)
            break
    
    return repo.id

    