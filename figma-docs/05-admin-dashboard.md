# 05 - Admin Dashboard

## Admin Overview Page (`/admin`)

### Main Dashboard
```jsx
<div className="admin-layout">
  {/* Admin Sidebar */}
  <AdminSidebar>
    <AdminBadge>
      <Icon name="shield" />
      <span>Admin Panel</span>
    </AdminBadge>
    
    <Navigation>
      <NavItem icon="dashboard" href="/admin">Overview</NavItem>
      <NavItem icon="users" href="/admin/users">Users</NavItem>
      <NavItem icon="analytics" href="/admin/analytics">Analytics</NavItem>
      <NavItem icon="content" href="/admin/content">Content</NavItem>
      <NavItem icon="security" href="/admin/security">Security</NavItem>
      <NavItem icon="settings" href="/admin/settings">System</NavItem>
      <NavItem icon="logs" href="/admin/logs">Audit Logs</NavItem>
    </Navigation>
  </AdminSidebar>
  
  {/* Main Content */}
  <main className="admin-content">
    {/* System Health */}
    <SystemHealthBar>
      <HealthIndicator status="healthy">
        <Icon name="check-circle" />
        All Systems Operational
      </HealthIndicator>
      <SystemMetrics>
        <Metric label="Uptime" value="99.98%" />
        <Metric label="Response Time" value="45ms" />
        <Metric label="Error Rate" value="0.02%" />
      </SystemMetrics>
    </SystemHealthBar>
    
    {/* Key Metrics Grid */}
    <MetricsGrid>
      <MetricCard trend="up">
        <MetricIcon icon="users" color="primary" />
        <MetricValue>{metrics.totalUsers}</MetricValue>
        <MetricLabel>Total Users</MetricLabel>
        <MetricChange>+12% this week</MetricChange>
      </MetricCard>
      
      <MetricCard trend="up">
        <MetricIcon icon="activity" color="success" />
        <MetricValue>{metrics.activeUsers}</MetricValue>
        <MetricLabel>Active Today</MetricLabel>
        <MetricChange>+8% from yesterday</MetricChange>
      </MetricCard>
      
      <MetricCard>
        <MetricIcon icon="folder" color="accent" />
        <MetricValue>{metrics.totalProjects}</MetricValue>
        <MetricLabel>Total Projects</MetricLabel>
        <MetricChange>+156 this week</MetricChange>
      </MetricCard>
      
      <MetricCard>
        <MetricIcon icon="dollar" color="warning" />
        <MetricValue>${metrics.revenue}</MetricValue>
        <MetricLabel>Monthly Revenue</MetricLabel>
        <MetricChange>+23% MoM</MetricChange>
      </MetricCard>
    </MetricsGrid>
    
    {/* Real-time Activity */}
    <RealTimeSection>
      <SectionHeader>
        <h2>Real-time Activity</h2>
        <LiveIndicator />
      </SectionHeader>
      <ActivityStream>
        <ActivityEvent>
          <EventTime>12:34:56</EventTime>
          <EventUser>john.doe@email.com</EventUser>
          <EventAction>Created new project</EventAction>
          <EventLocation>New York, US</EventLocation>
        </ActivityEvent>
      </ActivityStream>
    </RealTimeSection>
  </main>
</div>
```

## User Management Page (`/admin/users`)

### User Tracking & Management
```jsx
<div className="users-management">
  <PageHeader>
    <h1>User Management</h1>
    <HeaderActions>
      <Button icon="download">Export Users</Button>
      <Button icon="filter">Filters</Button>
      <Button variant="primary" icon="user-plus">Add User</Button>
    </HeaderActions>
  </PageHeader>
  
  {/* User Stats */}
  <UserStats>
    <StatCard>
      <StatLabel>Total Users</StatLabel>
      <StatValue>{userStats.total}</StatValue>
      <StatSparkline data={userStats.growth} />
    </StatCard>
    <StatCard>
      <StatLabel>New This Month</StatLabel>
      <StatValue>{userStats.newThisMonth}</StatValue>
      <StatProgress value={userStats.monthlyTarget} />
    </StatCard>
    <StatCard>
      <StatLabel>Pro Users</StatLabel>
      <StatValue>{userStats.proUsers}</StatValue>
      <StatPercentage>{userStats.proPercentage}%</StatPercentage>
    </StatCard>
  </UserStats>
  
  {/* Advanced Filters */}
  <FilterPanel>
    <FilterGroup>
      <Select label="Status">
        <option>All</option>
        <option>Active</option>
        <option>Inactive</option>
        <option>Suspended</option>
      </Select>
      <Select label="Plan">
        <option>All Plans</option>
        <option>Free</option>
        <option>Pro</option>
        <option>Enterprise</option>
      </Select>
      <DateRangePicker label="Joined Date" />
      <Input placeholder="Search by email or name" />
    </FilterGroup>
  </FilterPanel>
  
  {/* Users Table with Tracking */}
  <UsersTable>
    <TableHeader>
      <TableRow>
        <TableHead>User</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Plan</TableHead>
        <TableHead>Projects</TableHead>
        <TableHead>Last Active</TableHead>
        <TableHead>Location</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map(user => (
        <TableRow key={user.id}>
          <TableCell>
            <UserInfo>
              <Avatar src={user.avatar} />
              <div>
                <UserName>{user.name}</UserName>
                <UserEmail>{user.email}</UserEmail>
              </div>
            </UserInfo>
          </TableCell>
          <TableCell>
            <StatusBadge status={user.status} />
          </TableCell>
          <TableCell>
            <PlanBadge plan={user.plan} />
          </TableCell>
          <TableCell>{user.projectCount}</TableCell>
          <TableCell>
            <TimeAgo date={user.lastActive} />
          </TableCell>
          <TableCell>
            <Location>{user.location}</Location>
          </TableCell>
          <TableCell>
            <Actions>
              <Button size="sm" variant="ghost" onClick={() => viewUserDetails(user)}>
                View
              </Button>
              <DropdownMenu>
                <MenuItem>Edit</MenuItem>
                <MenuItem>Send Email</MenuItem>
                <MenuItem>Reset Password</MenuItem>
                <MenuItem danger>Suspend</MenuItem>
              </DropdownMenu>
            </Actions>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </UsersTable>
</div>
```

## User Detail View (Modal/Page)
```jsx
<UserDetailModal>
  <ModalHeader>
    <Avatar size="lg" src={user.avatar} />
    <UserTitle>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </UserTitle>
    <UserStatus status={user.status} />
  </ModalHeader>
  
  <TabGroup>
    <TabList>
      <Tab>Overview</Tab>
      <Tab>Activity</Tab>
      <Tab>Projects</Tab>
      <Tab>Billing</Tab>
      <Tab>Security</Tab>
    </TabList>
    
    <TabPanels>
      {/* Overview Tab */}
      <TabPanel>
        <InfoGrid>
          <InfoItem label="User ID" value={user.id} />
          <InfoItem label="Joined" value={user.joinedDate} />
          <InfoItem label="Plan" value={user.plan} />
          <InfoItem label="Total Spent" value={`$${user.totalSpent}`} />
          <InfoItem label="IP Address" value={user.lastIP} />
          <InfoItem label="Device" value={user.device} />
        </InfoGrid>
        
        {/* Activity Timeline */}
        <Timeline>
          <TimelineItem>
            <TimelineDate>Today, 2:30 PM</TimelineDate>
            <TimelineContent>Created project "E-commerce"</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineDate>Yesterday, 4:15 PM</TimelineDate>
            <TimelineContent>Upgraded to Pro plan</TimelineContent>
          </TimelineItem>
        </Timeline>
      </TabPanel>
      
      {/* Activity Tab */}
      <TabPanel>
        <ActivityChart data={user.activityData} />
        <ActivityLog entries={user.activityLog} />
      </TabPanel>
    </TabPanels>
  </TabGroup>
</UserDetailModal>
```

## Analytics Page (`/admin/analytics`)

### Comprehensive Analytics
```jsx
<div className="analytics-page">
  <PageHeader>
    <h1>System Analytics</h1>
    <DateRangePicker />
  </PageHeader>
  
  {/* KPI Dashboard */}
  <KPIGrid>
    <KPICard>
      <KPITitle>Daily Active Users</KPITitle>
      <KPIValue>{kpis.dau}</KPIValue>
      <KPIChart type="area" data={kpis.dauTrend} />
    </KPICard>
    
    <KPICard>
      <KPITitle>Conversion Rate</KPITitle>
      <KPIValue>{kpis.conversionRate}%</KPIValue>
      <KPIChart type="line" data={kpis.conversionTrend} />
    </KPICard>
    
    <KPICard>
      <KPITitle>Churn Rate</KPITitle>
      <KPIValue>{kpis.churnRate}%</KPIValue>
      <KPIChart type="bar" data={kpis.churnTrend} />
    </KPICard>
  </KPIGrid>
  
  {/* User Behavior */}
  <BehaviorSection>
    <SectionTitle>User Behavior Analysis</SectionTitle>
    <BehaviorMetrics>
      <HeatMap data={behaviorData.heatmap} />
      <UserFlow data={behaviorData.userFlow} />
      <RetentionCohort data={behaviorData.retention} />
    </BehaviorMetrics>
  </BehaviorSection>
  
  {/* Geographic Distribution */}
  <GeoSection>
    <SectionTitle>User Distribution</SectionTitle>
    <WorldMap data={geoData} />
    <CountryList data={topCountries} />
  </GeoSection>
</div>
```

## Security & Monitoring (`/admin/security`)

### Security Dashboard
```jsx
<div className="security-page">
  <PageHeader>
    <h1>Security & Monitoring</h1>
    <AlertBadge count={alerts.critical} />
  </PageHeader>
  
  {/* Security Alerts */}
  <AlertsSection>
    <SectionTitle>Active Alerts</SectionTitle>
    <AlertsList>
      <Alert severity="critical">
        <AlertIcon />
        <AlertContent>
          <AlertTitle>Suspicious login attempts detected</AlertTitle>
          <AlertDescription>
            5 failed login attempts from IP 192.168.1.1
          </AlertDescription>
          <AlertTime>5 minutes ago</AlertTime>
        </AlertContent>
        <AlertActions>
          <Button size="sm">Investigate</Button>
          <Button size="sm" variant="ghost">Dismiss</Button>
        </AlertActions>
      </Alert>
    </AlertsList>
  </AlertsSection>
  
  {/* Bot Detection */}
  <BotDetection>
    <SectionTitle>Bot Detection</SectionTitle>
    <BotStats>
      <Stat label="Blocked Today" value={botStats.blockedToday} />
      <Stat label="Detection Rate" value={`${botStats.detectionRate}%`} />
    </BotStats>
    <BotList>
      <BotEntry>
        <IP>192.168.1.1</IP>
        <UserAgent>Mozilla/5.0 (bot)</UserAgent>
        <Actions>Blocked</Actions>
      </BotEntry>
    </BotList>
  </BotDetection>
  
  {/* Profanity Filter Logs */}
  <ProfanitySection>
    <SectionTitle>Content Moderation</SectionTitle>
    <ModerationStats>
      <Stat label="Flagged Today" value={modStats.flaggedToday} />
      <Stat label="Auto-removed" value={modStats.autoRemoved} />
    </ModerationStats>
  </ProfanitySection>
</div>
```

## Audit Logs (`/admin/logs`)

### Comprehensive Logging
```jsx
<div className="audit-logs">
  <PageHeader>
    <h1>Audit Logs</h1>
    <Button icon="download">Export Logs</Button>
  </PageHeader>
  
  {/* Log Filters */}
  <LogFilters>
    <Select label="Action Type">
      <option>All Actions</option>
      <option>User Actions</option>
      <option>System Events</option>
      <option>Security Events</option>
    </Select>
    <Select label="Severity">
      <option>All</option>
      <option>Info</option>
      <option>Warning</option>
      <option>Error</option>
      <option>Critical</option>
    </Select>
    <DateTimePicker label="Date Range" />
  </LogFilters>
  
  {/* Logs Table */}
  <LogsTable>
    <LogEntry>
      <LogTime>2025-01-31 14:23:45</LogTime>
      <LogSeverity level="info">INFO</LogSeverity>
      <LogUser>admin@agentwise.dev</LogUser>
      <LogAction>Updated user permissions</LogAction>
      <LogDetails>
        <pre>{JSON.stringify(logDetails, null, 2)}</pre>
      </LogDetails>
    </LogEntry>
  </LogsTable>
</div>
```

## Announcement System

### Create Announcement Modal
```jsx
<AnnouncementModal>
  <ModalHeader>Create Announcement</ModalHeader>
  
  <Form>
    <FormField>
      <Label>Title</Label>
      <Input placeholder="Announcement title" />
    </FormField>
    
    <FormField>
      <Label>Content</Label>
      <RichTextEditor placeholder="Write your announcement..." />
    </FormField>
    
    <FormField>
      <Label>Target Audience</Label>
      <Select>
        <option>All Users</option>
        <option>Pro Users</option>
        <option>Free Users</option>
        <option>Specific Segment</option>
      </Select>
    </FormField>
    
    <FormField>
      <Label>Display Type</Label>
      <RadioGroup>
        <Radio value="banner">Banner</Radio>
        <Radio value="modal">Modal</Radio>
        <Radio value="notification">Notification</Radio>
      </RadioGroup>
    </FormField>
    
    <FormField>
      <Label>Schedule</Label>
      <DateTimePicker />
    </FormField>
  </Form>
  
  <ModalFooter>
    <Button variant="ghost">Save Draft</Button>
    <Button variant="primary">Publish</Button>
  </ModalFooter>
</AnnouncementModal>
```

## Database Queries (Supabase)

### User Tracking Queries
```sql
-- Active users tracking
SELECT 
  COUNT(DISTINCT user_id) as active_users,
  DATE(created_at) as date
FROM user_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);

-- User behavior tracking
SELECT 
  user_id,
  action_type,
  metadata,
  created_at
FROM user_events
WHERE user_id = ?
ORDER BY created_at DESC;

-- Geographic distribution
SELECT 
  country,
  city,
  COUNT(*) as user_count
FROM user_profiles
GROUP BY country, city
ORDER BY user_count DESC;
```

## Real-time Monitoring

### WebSocket Implementation
```typescript
// Real-time admin updates
const adminSocket = io('/admin', {
  auth: { token: adminToken }
})

adminSocket.on('user:login', (data) => {
  updateActiveUsers(data)
})

adminSocket.on('alert:security', (alert) => {
  showSecurityAlert(alert)
})

adminSocket.on('metrics:update', (metrics) => {
  updateDashboardMetrics(metrics)
})
```

---

**Note**: Admin dashboard requires strict authentication and role-based access control. All actions should be logged for audit purposes.