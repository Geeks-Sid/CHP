# Chunk 13: CI/CD & DevOps

## Tasks: 71, 72, 73, 74, 75, 76, 114, 117, 118, 119, 120

### Phase 13.1: OpenAPI/Swagger (Tasks 71, 72)
- [ ] Decorate controllers - Task 71
- [ ] Expose `/docs` (auth-protected in non-dev) - Task 71
- [ ] OpenAPI CI check (fail build if drift) - Task 72

### Phase 13.2: Backend CI Pipeline (Task 73)
- [ ] Install dependencies
- [ ] Lint
- [ ] Type-check
- [ ] Unit tests
- [ ] Integration tests (DB service)
- [ ] Docker build

### Phase 13.3: Security Scanning (Task 74)
- [ ] `npm audit`
- [ ] snyk
- [ ] Block on critical vulns
- [ ] SARIF upload

### Phase 13.4: Migrations in CI (Task 75)
- [ ] Run Flyway/Liquibase migrate against ephemeral DB
- [ ] Post version

### Phase 13.5: Deploy Pipeline (Task 76)
- [ ] Image push
- [ ] Helm/k8s rollout
- [ ] Health gates
- [ ] Auto-rollback

### Phase 13.6: SBOM Generation (Task 114)
- [ ] `npm sbom`/`syft` attach to image
- [ ] Artifact retention

### Phase 13.7: Readiness Gates (Task 117)
- [ ] Do not report ready before DB migrated + seed complete

### Phase 13.8: Documentation (Tasks 118, 119)
- [ ] Cutover plan doc - Task 118
- [ ] Runbook (oncall SOP) - Task 119

### Phase 13.9: Final Acceptance (Task 120)
- [ ] Pass SLOs
- [ ] Tests ≥80% coverage
- [ ] Zero P1 security issues

## Files to Create:
```
.github/
├── workflows/
│   ├── ci.yml
│   ├── security-scan.yml
│   └── deploy.yml
├── Dockerfile
├── docker-compose.prod.yml
├── helm/
│   └── chart/
└── docs/
    ├── cutover-plan.md
    └── runbook.md
```

## Dependencies:
- Docker
- GitHub Actions / GitLab CI
- Helm (for k8s)
- snyk CLI
- syft (for SBOM)

