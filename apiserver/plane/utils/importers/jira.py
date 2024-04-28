import requests
import re
from requests.auth import HTTPBasicAuth
from sentry_sdk import capture_exception
from urllib.parse import urlparse, urljoin
from plane.utils import logger


def is_allowed_hostname(hostname):
    allowed_domains = [
        "atl-paas.net",
        "atlassian.com",
        "atlassian.net",
        "jira.com",
    ]
    parsed_uri = urlparse(f"https://{hostname}")
    domain = parsed_uri.netloc.split(":")[0]  # Ensures no port is included
    base_domain = ".".join(domain.split(".")[-2:])
    return base_domain in allowed_domains


def is_valid_project_key(project_key):
    if project_key:
        project_key = project_key.strip().upper()
        # Adjust the regular expression as needed based on your specific requirements.
        if len(project_key) > 30:
            return False
        # Check the validity of the key as well
        pattern = re.compile(r"^[A-Z0-9]{1,10}$")
        return pattern.match(project_key) is not None
    else:
        False


def generate_valid_project_key(project_key):
    return project_key.strip().upper()


def generate_url(hostname, path):
    return urljoin(f"http://{hostname}", path)


def jira_project_issue_summary(email, api_token, project_key, hostname):
    try:
        if not is_valid_project_key(project_key):
            return {"error": "Invalid project key"}

        # auth = HTTPBasicAuth(email, api_token)
        logger.info('----------------------jira444--------------------------')
        headers = {"Accept": "application/json",
                   "Authorization": "Basic bm90aWZ5VXNlcjoxMjM0NTY="
                   }

        # make the project key upper case
        project_key = generate_valid_project_key(project_key)

        # issues
        issue_url = generate_url(
            hostname,
            f"/rest/api/2/search?jql=project={project_key} ",
        )

        issue_response = requests.request(
            "GET", issue_url, headers=headers
        ).json()["total"]

        # modules
        module_url = generate_url(
            hostname,
            f"/rest/api/2/search?jql=project={project_key} ",
        )
        module_response = requests.request(
            "GET", module_url, headers=headers
        ).json()["total"]

        # status
        status_url = generate_url(
            hostname, f"/rest/api/2/project/${project_key}/statuses"
        )
        status_response = requests.request(
            "GET", status_url, headers=headers
        ).json()

        # # labels
        # labels_url = generate_url(
        #     hostname, f"/rest/api/2/label/?jql=project={project_key}"
        # )
        # labels_response = requests.request(
        #     "GET", labels_url, headers=headers
        # ).json()["total"]
        #
        # # users
        # users_url = generate_url(
        #     hostname, f"/rest/api/2/users/search?jql=project={project_key}"
        # )
        # users_response = requests.request(
        #     "GET", users_url, headers=headers
        # ).json()

        return {
            "issues": issue_response,
            "modules": module_response,
            # "labels": labels_response,
            "states": len(status_response),
            # "users": (
            #     [
            #         user
            #         for user in users_response
            #         if user.get("accountType") == "atlassian"
            #     ]
            # ),
        }
    except Exception as e:
        capture_exception(e)
        return {
            "error": "Something went wrong could not fetch information from jira"
        }
