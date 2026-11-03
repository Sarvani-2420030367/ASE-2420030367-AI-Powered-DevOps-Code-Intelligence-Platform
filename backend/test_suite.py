import requests

BASE = 'http://127.0.0.1:8000'

def run_tests():
    # 1. Health check
    res = requests.get(f'{BASE}/health')
    print('1. Health check:', res.status_code, res.json())
    assert res.status_code == 200

    # 2. Login
    res = requests.post(f'{BASE}/api/auth/login', json={'email': 'demo@devsight.ai', 'password': 'DevSightDemo2026!'})
    print('2. Login status:', res.status_code)
    assert res.status_code == 200
    token = res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 3. Get Projects
    res = requests.get(f'{BASE}/api/projects', headers=headers)
    assert res.status_code == 200
    projects = res.json()
    print('3. Projects count:', len(projects))
    proj_id = projects[0]['id']
    print(f'   Active project: {projects[0]["name"]}, Health: {projects[0]["health_score"]}')

    # 4. Analysis details
    res = requests.get(f'{BASE}/api/projects/{proj_id}/analysis', headers=headers)
    assert res.status_code == 200
    analysis = res.json()
    print(f'4. Analysis scores -> Health: {analysis["health_score"]}, Quality: {analysis["quality_score"]}, Security: {analysis["security_score"]}, DevOps: {analysis["devops_readiness_score"]}')

    # 5. Findings
    res = requests.get(f'{BASE}/api/projects/{proj_id}/findings', headers=headers)
    assert res.status_code == 200
    findings = res.json()
    print(f'5. Findings count: {len(findings)}, Top finding: {findings[0]["title"]} ({findings[0]["severity"]})')

    # 6. File content with inline findings
    res = requests.get(f'{BASE}/api/projects/{proj_id}/repository/file-content?path=app.py', headers=headers)
    assert res.status_code == 200
    file_data = res.json()
    print(f'6. app.py lines: {file_data["lines"]}, Inline findings on file: {len(file_data["findings"])}')

    # 7. AI Chat
    res = requests.post(f'{BASE}/api/ai/chat', json={'project_id': proj_id, 'message': 'Explain the authentication flow and security risks'}, headers=headers)
    assert res.status_code == 200
    ai_data = res.json()
    print(f'7. AI Chat response length: {len(ai_data["response"])}, Sources referenced: {len(ai_data.get("sources", []))}')

    # 8. Kubernetes Generator
    res = requests.post(f'{BASE}/api/projects/{proj_id}/generate/kubernetes', json={'project_id': proj_id, 'replicas': 3, 'port': 8000}, headers=headers)
    assert res.status_code == 200
    k8s_manifests = res.json()
    print(f'8. K8s Manifests generated: {len(k8s_manifests)} {[m["filename"] for m in k8s_manifests]}')

    # 9. Docker Generator
    res = requests.post(f'{BASE}/api/projects/{proj_id}/generate/docker', json={'project_id': proj_id, 'port': 8000}, headers=headers)
    assert res.status_code == 200
    docker_manifests = res.json()
    print(f'9. Docker Manifests generated: {len(docker_manifests)} {[m["filename"] for m in docker_manifests]}')

    # 10. CI/CD Generator
    res = requests.post(f'{BASE}/api/projects/{proj_id}/generate/cicd', json={'project_id': proj_id, 'platform': 'github'}, headers=headers)
    assert res.status_code == 200
    cicd_manifest = res.json()
    print(f'10. CI/CD Manifest generated: {cicd_manifest["filename"]}')

    print('\n=======================================')
    print('   ALL 10 VERIFICATION TESTS PASSED!   ')
    print('=======================================')

if __name__ == '__main__':
    run_tests()
