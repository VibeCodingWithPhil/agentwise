---
description: Rollback to previous deployment
allowed-tools: Bash, Read
---

# Rollback Deployment

Rollback the active project to the previous deployment version.

Steps:
1. Get active project from registry
2. Navigate to workspace/[project-name]/
3. Check for rollback script in .deploy/scripts/rollback.sh
4. Execute rollback procedure:
   - Revert to previous Docker image/build
   - Restore previous environment configuration
   - Switch traffic back to previous version
   - Clear caches if necessary
5. Run health checks on rolled-back version
6. Update deployment logs

The rollback will:
- Restore the previous working version
- Maintain data integrity
- Preserve user sessions where possible
- Log the rollback event

After rollback:
- Investigate the failure cause
- Fix issues in development environment
- Test thoroughly before redeploying

Emergency rollback can also be triggered automatically if health checks fail after deployment.