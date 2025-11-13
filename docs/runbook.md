# Runbook: Hospital Management System Backend

## Overview

This runbook provides step-by-step procedures for common operational tasks, troubleshooting, and incident response for the Hospital Management System backend.

## Table of Contents

1. [Service Overview](#service-overview)
2. [Health Checks](#health-checks)
3. [Common Operations](#common-operations)
4. [Troubleshooting](#troubleshooting)
5. [Incident Response](#incident-response)
6. [Maintenance Procedures](#maintenance-procedures)

## Service Overview

### Architecture
- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL 15
- **Cache**: Redis (optional)
- **Deployment**: Kubernetes
- **Container Registry**: GHCR

### Key Endpoints
- Health: `GET /api/v1/health`
- Readiness: `GET /api/v1/ready`
- API Docs: `GET /api/docs`
- API: `GET /api/v1/*`

### Service Dependencies
- PostgreSQL database
- Redis (for caching/rate limiting)
- S3/MinIO (for document storage)

## Health Checks

### Liveness Probe
```bash
curl http://localhost:3000/api/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Readiness Probe
```bash
curl http://localhost:3000/api/v1/ready
```

**Expected Response:**
```json
{
  "status": "ready",
  "database": "connected",
  "migrations": "up to date",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Not Ready Response:**
```json
{
  "status": "not ready",
  "database": "disconnected",
  "migrations": "pending",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Common Operations

### View Logs

#### Kubernetes
```bash
# All pods
kubectl logs -l app.kubernetes.io/name=hospital-backend -f

# Specific pod
kubectl logs <pod-name> -f

# Previous container (if restarted)
kubectl logs <pod-name> --previous
```

#### Docker Compose
```bash
docker-compose logs -f backend
```

### Check Pod Status
```bash
kubectl get pods -l app.kubernetes.io/name=hospital-backend
```

### Restart Service
```bash
# Kubernetes
kubectl rollout restart deployment/hospital-backend

# Docker Compose
docker-compose restart backend
```

### Scale Service
```bash
# Kubernetes
kubectl scale deployment hospital-backend --replicas=5

# Check HPA
kubectl get hpa hospital-backend
```

### Access Pod Shell
```bash
kubectl exec -it <pod-name> -- /bin/sh
```

## Troubleshooting

### Service Not Starting

#### Symptoms
- Pods in CrashLoopBackOff
- Health checks failing
- No logs appearing

#### Diagnosis
```bash
# Check pod status
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name> --previous

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

#### Common Causes
1. **Database Connection Failure**
   - Check database credentials in secrets
   - Verify database is accessible
   - Check network policies

2. **Missing Environment Variables**
   - Verify all required env vars are set
   - Check ConfigMap/Secrets

3. **Port Conflicts**
   - Verify port 3000 is not in use
   - Check service configuration

### Database Connection Issues

#### Symptoms
- Readiness probe failing
- Database errors in logs
- Timeout errors

#### Diagnosis
```bash
# Test database connection from pod
kubectl exec -it <pod-name> -- \
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT 1"

# Check database service
kubectl get svc postgres

# Check database logs
kubectl logs <postgres-pod>
```

#### Solutions
1. **Verify Credentials**
   ```bash
   kubectl get secret hospital-secrets -o yaml
   ```

2. **Check Network Policies**
   ```bash
   kubectl get networkpolicies
   ```

3. **Test Connection Manually**
   ```bash
   psql -h $PGHOST -U $PGUSER -d $PGDATABASE
   ```

### High Error Rate

#### Symptoms
- Error rate > 1%
- 5xx errors in logs
- User complaints

#### Diagnosis
```bash
# Check error logs
kubectl logs -l app.kubernetes.io/name=hospital-backend | grep -i error

# Check metrics
# Access Prometheus/Grafana dashboard

# Check recent deployments
kubectl get deployments hospital-backend -o yaml
```

#### Common Causes
1. **Database Performance**
   - Check slow queries
   - Verify connection pool settings
   - Check database CPU/memory

2. **Memory Leaks**
   - Check pod memory usage
   - Review heap dumps
   - Check for memory leaks in code

3. **External Service Issues**
   - Check S3/MinIO connectivity
   - Verify Redis connection
   - Check third-party API status

### Slow Response Times

#### Symptoms
- p95 latency > 500ms
- Timeout errors
- User complaints

#### Diagnosis
```bash
# Check pod resource usage
kubectl top pods -l app.kubernetes.io/name=hospital-backend

# Check database performance
# Access database monitoring dashboard

# Check slow query log
kubectl exec -it <postgres-pod> -- \
  psql -U $PGUSER -d $PGDATABASE -c \
  "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

#### Solutions
1. **Scale Horizontally**
   ```bash
   kubectl scale deployment hospital-backend --replicas=10
   ```

2. **Optimize Database Queries**
   - Add indexes
   - Review query plans
   - Optimize slow queries

3. **Increase Resources**
   ```bash
   kubectl set resources deployment hospital-backend \
     --requests=cpu=1000m,memory=2Gi \
     --limits=cpu=2000m,memory=4Gi
   ```

## Incident Response

### Severity Levels

#### P0 - Critical
- Service completely down
- Data loss or corruption
- Security breach

**Response Time**: Immediate
**Escalation**: On-call + Engineering Manager

#### P1 - High
- Major feature broken
- Performance degradation affecting users
- Partial service outage

**Response Time**: 15 minutes
**Escalation**: On-call engineer

#### P2 - Medium
- Minor feature issues
- Non-critical errors
- Performance issues (non-user-facing)

**Response Time**: 1 hour
**Escalation**: Next business day

#### P3 - Low
- Cosmetic issues
- Documentation updates
- Feature requests

**Response Time**: Next business day

### Incident Response Process

1. **Acknowledge**
   - Confirm incident in PagerDuty/Slack
   - Assess severity
   - Notify team

2. **Investigate**
   - Check monitoring dashboards
   - Review logs
   - Identify root cause

3. **Mitigate**
   - Apply immediate fix if possible
   - Rollback if necessary
   - Document actions taken

4. **Resolve**
   - Verify fix
   - Monitor for stability
   - Update status

5. **Post-Mortem**
   - Schedule within 48 hours
   - Document root cause
   - Create action items

### Rollback Procedure

```bash
# 1. Check current version
kubectl get deployment hospital-backend -o jsonpath='{.spec.template.spec.containers[0].image}'

# 2. Rollback to previous version
helm rollback hospital-backend

# Or manual rollback
kubectl set image deployment/hospital-backend \
  hospital-backend=ghcr.io/org/hospital-backend:previous-version

# 3. Verify rollback
kubectl rollout status deployment/hospital-backend

# 4. Check health
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/ready
```

## Maintenance Procedures

### Database Migrations

```bash
# 1. Backup database
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE > backup-$(date +%Y%m%d).sql

# 2. Apply migrations
flyway migrate -url=jdbc:postgresql://$PGHOST:$PGPORT/$PGDATABASE \
  -user=$PGUSER -password=$PGPASSWORD

# 3. Verify migration
flyway info -url=jdbc:postgresql://$PGHOST:$PGPORT/$PGDATABASE \
  -user=$PGUSER -password=$PGPASSWORD
```

### Update Application

```bash
# 1. Build new image
docker build -t hospital-backend:new-version ./backend

# 2. Test in staging
kubectl set image deployment/hospital-backend-staging \
  hospital-backend=hospital-backend:new-version

# 3. Deploy to production (canary)
kubectl set image deployment/hospital-backend \
  hospital-backend=hospital-backend:new-version

# 4. Monitor
kubectl rollout status deployment/hospital-backend
```

### Database Backup

```bash
# Automated backup (cron job)
0 2 * * * pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE | \
  gzip > /backups/hospital-$(date +\%Y\%m\%d).sql.gz

# Manual backup
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore Database

```bash
# 1. Stop application
kubectl scale deployment hospital-backend --replicas=0

# 2. Restore backup
psql -h $PGHOST -U $PGUSER -d $PGDATABASE < backup-YYYYMMDD-HHMMSS.sql

# 3. Verify data
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT COUNT(*) FROM users;"

# 4. Restart application
kubectl scale deployment hospital-backend --replicas=3
```

## Monitoring & Alerts

### Key Metrics
- Request rate
- Error rate (4xx, 5xx)
- Response time (p50, p95, p99)
- Database connection pool usage
- Memory/CPU usage
- Database query performance

### Alert Thresholds
- Error rate > 1% for 5 minutes
- Response time p95 > 1s for 10 minutes
- Health check failures > 3
- Database connection failures
- Memory usage > 90%
- CPU usage > 80% for 15 minutes

### Dashboards
- **Grafana**: [URL]
- **Prometheus**: [URL]
- **Logs**: [URL]

## Useful Commands

```bash
# Get all resources
kubectl get all -l app.kubernetes.io/name=hospital-backend

# Describe deployment
kubectl describe deployment hospital-backend

# View events
kubectl get events --sort-by='.lastTimestamp'

# Port forward for local access
kubectl port-forward svc/hospital-backend 3000:3000

# Check resource usage
kubectl top pods -l app.kubernetes.io/name=hospital-backend

# View secrets (base64 encoded)
kubectl get secret hospital-secrets -o yaml
```

## Emergency Contacts

- **On-Call Engineer**: [Contact]
- **Database Admin**: [Contact]
- **DevOps Lead**: [Contact]
- **Engineering Manager**: [Contact]

## References

- [Cutover Plan](./cutover-plan.md)
- [API Documentation](../backend/README.md)
- [Architecture Documentation](../extended_tdd.md)

