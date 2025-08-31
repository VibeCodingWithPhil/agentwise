# 04 - User Dashboard

## Dashboard Overview Page (`/dashboard`)

### Layout Structure
```jsx
<div className="dashboard-layout">
  {/* Sidebar Navigation */}
  <DashboardSidebar>
    <UserProfile>
      <Avatar src={user.avatar} />
      <UserName>{user.name}</UserName>
      <UserEmail>{user.email}</UserEmail>
      <SubscriptionBadge tier={user.tier} />
    </UserProfile>
    
    <Navigation>
      <NavItem icon="home" href="/dashboard">Overview</NavItem>
      <NavItem icon="folder" href="/dashboard/projects">Projects</NavItem>
      <NavItem icon="activity" href="/dashboard/usage">Usage</NavItem>
      <NavItem icon="settings" href="/dashboard/settings">Settings</NavItem>
      <NavItem icon="billing" href="/dashboard/billing">Billing</NavItem>
      <NavItem icon="team" href="/dashboard/team">Team</NavItem>
    </Navigation>
  </DashboardSidebar>
  
  {/* Main Content */}
  <main className="dashboard-content">
    {/* Welcome Header */}
    <DashboardHeader>
      <h1>Welcome back, {user.firstName}</h1>
      <p>Here's what's happening with your projects</p>
    </DashboardHeader>
    
    {/* Quick Stats */}
    <StatsGrid>
      <StatCard>
        <StatIcon icon="projects" color="primary" />
        <StatValue>{stats.projectCount}</StatValue>
        <StatLabel>Active Projects</StatLabel>
        <StatChange value={stats.projectChange} />
      </StatCard>
      
      <StatCard>
        <StatIcon icon="tokens" color="accent" />
        <StatValue>{stats.tokensSaved}M</StatValue>
        <StatLabel>Tokens Saved</StatLabel>
        <StatChange value="99.3%" positive />
      </StatCard>
      
      <StatCard>
        <StatIcon icon="time" color="secondary" />
        <StatValue>{stats.timeSaved}h</StatValue>
        <StatLabel>Time Saved</StatLabel>
        <StatChange value="+23%" positive />
      </StatCard>
      
      <StatCard>
        <StatIcon icon="agents" color="success" />
        <StatValue>{stats.activeAgents}</StatValue>
        <StatLabel>Active Agents</StatLabel>
        <StatProgress value={75} />
      </StatCard>
    </StatsGrid>
    
    {/* Recent Activity */}
    <section className="recent-activity">
      <SectionHeader title="Recent Activity" action="/dashboard/activity" />
      <ActivityFeed>
        <ActivityItem>
          <ActivityIcon type="project-created" />
          <ActivityContent>
            <ActivityTitle>New project created</ActivityTitle>
            <ActivityDescription>E-commerce platform</ActivityDescription>
            <ActivityTime>2 hours ago</ActivityTime>
          </ActivityContent>
        </ActivityItem>
      </ActivityFeed>
    </section>
    
    {/* Quick Actions */}
    <QuickActions>
      <QuickActionCard onClick={createProject}>
        <Icon name="plus" />
        <span>New Project</span>
      </QuickActionCard>
      <QuickActionCard onClick={openTerminal}>
        <Icon name="terminal" />
        <span>Open Terminal</span>
      </QuickActionCard>
      <QuickActionCard onClick={viewDocs}>
        <Icon name="book" />
        <span>Documentation</span>
      </QuickActionCard>
    </QuickActions>
  </main>
</div>
```

## Projects Page (`/dashboard/projects`)

### Project Grid View
```jsx
<div className="projects-page">
  {/* Header with Actions */}
  <PageHeader>
    <h1>Your Projects</h1>
    <HeaderActions>
      <Button variant="primary" icon="plus">New Project</Button>
      <ViewToggle views={["grid", "list"]} active={view} />
      <SortDropdown options={["Recent", "Name", "Size"]} />
    </HeaderActions>
  </PageHeader>
  
  {/* Filter Bar */}
  <FilterBar>
    <SearchInput placeholder="Search projects..." />
    <FilterChip active>All</FilterChip>
    <FilterChip>Active</FilterChip>
    <FilterChip>Archived</FilterChip>
    <FilterChip>Shared</FilterChip>
  </FilterBar>
  
  {/* Projects Grid */}
  <ProjectsGrid>
    {projects.map(project => (
      <ProjectCard key={project.id}>
        <ProjectThumbnail>
          <img src={project.thumbnail} alt={project.name} />
          <ProjectStatus status={project.status} />
        </ProjectThumbnail>
        
        <ProjectInfo>
          <ProjectName>{project.name}</ProjectName>
          <ProjectDescription>{project.description}</ProjectDescription>
          
          <ProjectMeta>
            <MetaItem icon="git-branch">{project.branch}</MetaItem>
            <MetaItem icon="clock">{project.lastUpdated}</MetaItem>
          </ProjectMeta>
          
          <ProjectStats>
            <Stat label="Files" value={project.fileCount} />
            <Stat label="Lines" value={project.lineCount} />
            <Stat label="Agents" value={project.agentCount} />
          </ProjectStats>
        </ProjectInfo>
        
        <ProjectActions>
          <Button variant="ghost" icon="play">Open</Button>
          <Button variant="ghost" icon="settings">Settings</Button>
          <DropdownMenu>
            <MenuItem icon="archive">Archive</MenuItem>
            <MenuItem icon="share">Share</MenuItem>
            <MenuItem icon="trash" danger>Delete</MenuItem>
          </DropdownMenu>
        </ProjectActions>
      </ProjectCard>
    ))}
  </ProjectsGrid>
</div>
```

## Usage Analytics Page (`/dashboard/usage`)

### Analytics Dashboard
```jsx
<div className="usage-page">
  <PageHeader>
    <h1>Usage Analytics</h1>
    <DateRangePicker />
  </PageHeader>
  
  {/* Usage Charts */}
  <ChartsGrid>
    {/* Token Usage Chart */}
    <ChartCard span={2}>
      <ChartHeader title="Token Usage" subtitle="Over time" />
      <LineChart 
        data={tokenUsageData}
        lines={["total", "saved"]}
        gradient
      />
      <ChartLegend items={["Total Tokens", "Tokens Saved"]} />
    </ChartCard>
    
    {/* Agent Activity */}
    <ChartCard>
      <ChartHeader title="Agent Activity" />
      <BarChart 
        data={agentActivityData}
        horizontal
      />
    </ChartCard>
    
    {/* Project Distribution */}
    <ChartCard>
      <ChartHeader title="Project Types" />
      <PieChart 
        data={projectTypeData}
        donut
      />
    </ChartCard>
  </ChartsGrid>
  
  {/* Detailed Metrics */}
  <MetricsTable>
    <TableHeader>
      <TableRow>
        <TableHead>Metric</TableHead>
        <TableHead>Current Period</TableHead>
        <TableHead>Previous Period</TableHead>
        <TableHead>Change</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>API Calls</TableCell>
        <TableCell>12,456</TableCell>
        <TableCell>10,234</TableCell>
        <TableCell><Change positive>+21.7%</Change></TableCell>
      </TableRow>
      {/* More rows */}
    </TableBody>
  </MetricsTable>
</div>
```

## Settings Page (`/dashboard/settings`)

### Settings Tabs
```jsx
<div className="settings-page">
  <PageHeader>
    <h1>Settings</h1>
  </PageHeader>
  
  <TabGroup>
    <TabList>
      <Tab>Profile</Tab>
      <Tab>Preferences</Tab>
      <Tab>API Keys</Tab>
      <Tab>Security</Tab>
      <Tab>Notifications</Tab>
    </TabList>
    
    <TabPanels>
      {/* Profile Tab */}
      <TabPanel>
        <SettingsSection>
          <SectionTitle>Profile Information</SectionTitle>
          <Form>
            <FormField>
              <Label>Full Name</Label>
              <Input value={user.name} />
            </FormField>
            <FormField>
              <Label>Email</Label>
              <Input type="email" value={user.email} />
            </FormField>
            <FormField>
              <Label>Avatar</Label>
              <AvatarUpload current={user.avatar} />
            </FormField>
          </Form>
        </SettingsSection>
      </TabPanel>
      
      {/* Preferences Tab */}
      <TabPanel>
        <SettingsSection>
          <SectionTitle>Appearance</SectionTitle>
          <PreferenceGroup>
            <Preference>
              <Label>Theme</Label>
              <Select value={theme}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </Select>
            </Preference>
            <Preference>
              <Label>Editor Theme</Label>
              <Select value={editorTheme}>
                <option value="monokai">Monokai</option>
                <option value="dracula">Dracula</option>
              </Select>
            </Preference>
          </PreferenceGroup>
        </SettingsSection>
      </TabPanel>
      
      {/* API Keys Tab */}
      <TabPanel>
        <SettingsSection>
          <SectionTitle>API Keys</SectionTitle>
          <ApiKeyList>
            <ApiKeyItem>
              <KeyName>Production API Key</KeyName>
              <KeyValue masked>sk-...abc123</KeyValue>
              <KeyActions>
                <Button size="sm" variant="ghost">Regenerate</Button>
                <Button size="sm" variant="ghost" danger>Delete</Button>
              </KeyActions>
            </ApiKeyItem>
          </ApiKeyList>
          <Button icon="plus">Create New Key</Button>
        </SettingsSection>
      </TabPanel>
    </TabPanels>
  </TabGroup>
</div>
```

## Team Management Page (`/dashboard/team`)

### Team Overview
```jsx
<div className="team-page">
  <PageHeader>
    <h1>Team Management</h1>
    <Button variant="primary" icon="user-plus">Invite Member</Button>
  </PageHeader>
  
  {/* Team Members */}
  <TeamGrid>
    {members.map(member => (
      <MemberCard key={member.id}>
        <MemberAvatar src={member.avatar} />
        <MemberInfo>
          <MemberName>{member.name}</MemberName>
          <MemberEmail>{member.email}</MemberEmail>
          <MemberRole>{member.role}</MemberRole>
        </MemberInfo>
        <MemberStatus status={member.status} />
        <MemberActions>
          <DropdownMenu>
            <MenuItem>Change Role</MenuItem>
            <MenuItem>View Activity</MenuItem>
            <MenuItem danger>Remove</MenuItem>
          </DropdownMenu>
        </MemberActions>
      </MemberCard>
    ))}
  </TeamGrid>
  
  {/* Permissions Matrix */}
  <PermissionsSection>
    <SectionTitle>Role Permissions</SectionTitle>
    <PermissionsMatrix>
      <MatrixHeader>
        <Role>Admin</Role>
        <Role>Developer</Role>
        <Role>Viewer</Role>
      </MatrixHeader>
      <MatrixBody>
        <Permission name="Create Projects" roles={["admin", "developer"]} />
        <Permission name="Delete Projects" roles={["admin"]} />
        <Permission name="View Analytics" roles={["admin", "developer", "viewer"]} />
      </MatrixBody>
    </PermissionsMatrix>
  </PermissionsSection>
</div>
```

## Billing Page (`/dashboard/billing`)

### Subscription Management
```jsx
<div className="billing-page">
  <PageHeader>
    <h1>Billing & Subscription</h1>
  </PageHeader>
  
  {/* Current Plan */}
  <CurrentPlan>
    <PlanCard featured>
      <PlanName>Pro Plan</PlanName>
      <PlanPrice>$99/month</PlanPrice>
      <PlanFeatures>
        <Feature>Unlimited Projects</Feature>
        <Feature>Priority Support</Feature>
        <Feature>Custom Integrations</Feature>
      </PlanFeatures>
      <Button variant="secondary">Change Plan</Button>
    </PlanCard>
  </CurrentPlan>
  
  {/* Usage Overview */}
  <UsageOverview>
    <UsageBar 
      label="API Calls"
      current={45000}
      limit={100000}
      percentage={45}
    />
    <UsageBar 
      label="Storage"
      current={12}
      limit={50}
      unit="GB"
      percentage={24}
    />
  </UsageOverview>
  
  {/* Invoice History */}
  <InvoiceSection>
    <SectionTitle>Invoice History</SectionTitle>
    <InvoiceTable>
      <InvoiceRow>
        <InvoiceDate>Jan 1, 2025</InvoiceDate>
        <InvoiceAmount>$99.00</InvoiceAmount>
        <InvoiceStatus status="paid" />
        <InvoiceAction>
          <Button size="sm" variant="ghost">Download</Button>
        </InvoiceAction>
      </InvoiceRow>
    </InvoiceTable>
  </InvoiceSection>
</div>
```

## Responsive Behavior

### Mobile Dashboard
- Collapsed sidebar with hamburger menu
- Stack cards vertically
- Simplified charts for mobile
- Touch-friendly interactions
- Swipe gestures for navigation

### Tablet
- Collapsible sidebar
- 2-column grid for cards
- Medium-sized charts
- Touch-optimized controls

## Real-time Features

### WebSocket Integration
```typescript
// Real-time updates
const updates = useWebSocket('/api/ws/dashboard')

// Live activity feed
updates.on('activity', (activity) => {
  updateActivityFeed(activity)
})

// Live stats
updates.on('stats', (stats) => {
  updateDashboardStats(stats)
})
```

### Notifications
```jsx
<NotificationCenter>
  <NotificationBell count={unreadCount} />
  <NotificationDropdown>
    <Notification type="success">
      Project build completed
    </Notification>
    <Notification type="warning">
      API limit approaching
    </Notification>
  </NotificationDropdown>
</NotificationCenter>
```

---

**Note**: Dashboard should provide instant insights, be highly responsive, and update in real-time.