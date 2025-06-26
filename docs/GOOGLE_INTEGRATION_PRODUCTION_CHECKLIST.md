# Google Integration Production Checklist

## ✅ **Security Requirements**

### Database Security
- [ ] **Encryption Key**: Set `ENCRYPTION_KEY` environment variable with secure 64-character hex key
- [ ] **Database Connection**: Use SSL-enabled PostgreSQL connection string
- [ ] **Credentials Storage**: All Google credentials encrypted at rest using AES-256-GCM
- [ ] **Token Rotation**: OAuth refresh tokens properly handled and updated

### Environment Variables
```bash
# Required for production
ENCRYPTION_KEY=your-64-character-hex-key-here
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### API Security
- [ ] **Rate Limiting**: Implemented on all Google integration endpoints
- [ ] **Admin Verification**: Only org admins can configure integrations
- [ ] **CORS Configuration**: Proper CORS settings for production domain
- [ ] **HTTPS Only**: All OAuth redirects use HTTPS in production

## ✅ **Google Cloud Console Setup**

### OAuth Configuration
- [ ] **Production OAuth Client**: Created for production domain
- [ ] **Authorized Origins**: `https://your-domain.com` added
- [ ] **Authorized Redirects**: `https://your-domain.com/api/integrations/google/callback`
- [ ] **Consent Screen**: Configured with company information and privacy policy
- [ ] **Scopes Verification**: Only request necessary scopes:
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`

### API Enablement
- [ ] **Google Sheets API**: Enabled
- [ ] **Google Drive API**: Enabled
- [ ] **OAuth2 API**: Enabled
- [ ] **API Quotas**: Reviewed and appropriate for expected usage

### Service Account (Optional)
- [ ] **Service Account Created**: For organization-wide integrations
- [ ] **Key Management**: JSON key securely stored and encrypted
- [ ] **Permissions**: Minimum required permissions granted
- [ ] **Key Rotation**: Process established for regular key rotation

## ✅ **Database Migration**

### Prisma Schema Applied
- [ ] **GoogleIntegration Model**: Added to schema
- [ ] **Foreign Keys**: Proper relationships with Organization model
- [ ] **Indexes**: Performance indexes on `orgId`, `email`, `authMethod`
- [ ] **Constraints**: Unique constraint on `(orgId, email, authMethod)`

### Migration Commands
```bash
# Apply the schema changes
cd packages/database
npx prisma db push

# Or create and run migration
npx prisma migrate dev --name add_google_integrations

# Generate client
npx prisma generate
```

## ✅ **Feature Testing**

### OAuth Flow Testing
- [ ] **Admin OAuth**: Admin can connect Google account
- [ ] **OAuth Callback**: Proper handling of success/error cases
- [ ] **Token Refresh**: Automatic token refresh when expired
- [ ] **User Info Retrieval**: Correct user information stored

### Service Account Testing
- [ ] **Credential Upload**: JSON credentials properly validated
- [ ] **Connection Test**: Service account authentication verified
- [ ] **Permission Test**: Service account can create/access sheets

### Export Functionality
- [ ] **Data Export**: CSV/Excel data exports to Google Sheets
- [ ] **File Creation**: Spreadsheets created with proper metadata
- [ ] **Sharing**: Files shared with organization members (if configured)
- [ ] **Error Handling**: Graceful handling of Google API errors

### Access Control
- [ ] **Admin Only Config**: Only admins can configure integrations
- [ ] **Member Usage**: All org members can use admin-configured integrations
- [ ] **Permission Checks**: Proper org membership validation

## ✅ **Monitoring & Observability**

### Audit Logging
- [ ] **Integration Creation**: Logged with admin info
- [ ] **Export Activities**: Tracked with user and file details
- [ ] **Token Refresh**: Success/failure logged
- [ ] **Usage Statistics**: Regular usage metrics available

### Error Handling
- [ ] **Google API Errors**: Proper error messages and logging
- [ ] **Token Expiry**: Graceful handling of expired tokens
- [ ] **Rate Limits**: Google API rate limit handling
- [ ] **Network Errors**: Retry logic for transient failures

### Performance Monitoring
- [ ] **Database Queries**: Optimized queries with proper indexes
- [ ] **API Response Times**: Monitoring for slow responses
- [ ] **Memory Usage**: Service monitoring for memory leaks
- [ ] **Google API Quotas**: Monitoring quota usage

## ✅ **Compliance & Privacy**

### Data Protection
- [ ] **Encryption**: All sensitive data encrypted at rest
- [ ] **Access Logs**: Comprehensive audit trail
- [ ] **Data Retention**: Policy for deleting old integrations
- [ ] **User Consent**: Clear consent flow for Google access

### GDPR Compliance
- [ ] **Data Processing**: Legitimate interest/consent documented
- [ ] **Data Deletion**: Process for removing user integrations
- [ ] **Data Export**: User can export their integration data
- [ ] **Privacy Policy**: Updated to include Google integration

## ✅ **Production Deployment**

### Environment Configuration
- [ ] **All Environment Variables**: Set in production environment
- [ ] **Database Connection**: Production database configured
- [ ] **SSL Certificates**: Valid SSL for HTTPS
- [ ] **CDN Configuration**: If using CDN, proper routing for API calls

### CI/CD Pipeline
- [ ] **Integration Tests**: E2E tests for Google integration
- [ ] **Security Scans**: No secrets in repository
- [ ] **Build Process**: Environment variables properly injected
- [ ] **Rollback Plan**: Process for reverting if issues arise

### Launch Preparation
- [ ] **Documentation**: Admin setup guide updated
- [ ] **Support Training**: Team trained on troubleshooting
- [ ] **Backup Plan**: Fallback if Google services unavailable
- [ ] **Communication**: Users notified of new feature

## ✅ **Post-Launch Monitoring**

### First 24 Hours
- [ ] **Error Rates**: Monitor for increased errors
- [ ] **Performance**: API response times normal
- [ ] **User Feedback**: Support tickets reviewed
- [ ] **Google Quotas**: API usage within limits

### First Week
- [ ] **Usage Patterns**: Analyze integration usage
- [ ] **Performance Optimization**: Identify bottlenecks
- [ ] **Bug Reports**: Address any reported issues
- [ ] **Documentation Updates**: Update based on user feedback

### Ongoing Maintenance
- [ ] **Monthly Token Cleanup**: Remove expired/unused tokens
- [ ] **Security Reviews**: Regular security assessment
- [ ] **API Updates**: Monitor Google API changes
- [ ] **Performance Tuning**: Optimize based on usage patterns

## 🚨 **Emergency Procedures**

### Google API Issues
- [ ] **Service Monitoring**: Monitor Google API status
- [ ] **Fallback Options**: Manual export alternatives
- [ ] **User Communication**: Status page updates
- [ ] **Issue Escalation**: Process for contacting Google support

### Security Incidents
- [ ] **Token Revocation**: Process for revoking compromised tokens
- [ ] **Access Audit**: Review all integration access
- [ ] **Incident Response**: Security incident procedures
- [ ] **Recovery Plan**: Steps to restore secure operations

### Data Recovery
- [ ] **Database Backup**: Regular encrypted backups
- [ ] **Integration Restore**: Process for restoring lost integrations
- [ ] **User Communication**: Notification procedures
- [ ] **Testing**: Verify restored functionality

## 📋 **Pre-Launch Verification**

Run through this final checklist before enabling Google integration in production:

1. [ ] All environment variables set and verified
2. [ ] Database migration applied successfully
3. [ ] Google Cloud Console properly configured
4. [ ] OAuth flow tested end-to-end
5. [ ] Service account setup tested (if using)
6. [ ] Export functionality verified
7. [ ] Admin access controls working
8. [ ] Rate limiting functional
9. [ ] Audit logging active
10. [ ] Error handling tested
11. [ ] Documentation updated
12. [ ] Monitoring configured
13. [ ] Team trained
14. [ ] Rollback plan ready
15. [ ] User communication prepared

## 📞 **Emergency Contacts**

- **Google Cloud Support**: [Your support case link]
- **Database Admin**: [Contact info]
- **Security Team**: [Contact info]
- **Product Owner**: [Contact info]

---

**Last Updated**: [Date]
**Approved By**: [Team Lead]
**Review Date**: [Next review date] 