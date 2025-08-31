# 09 - Newsletter System

## Newsletter Management Dashboard (`/admin/newsletter`)

### Newsletter Overview
```jsx
<div className="newsletter-dashboard">
  <PageHeader>
    <h1>Newsletter Management</h1>
    <HeaderActions>
      <Button variant="primary" icon="plus">
        Create Campaign
      </Button>
      <Button variant="ghost" icon="users">
        Manage Subscribers
      </Button>
    </HeaderActions>
  </PageHeader>
  
  {/* Newsletter Stats */}
  <StatsGrid>
    <StatCard>
      <StatIcon icon="users" color="primary" />
      <StatValue>{stats.totalSubscribers}</StatValue>
      <StatLabel>Total Subscribers</StatLabel>
      <StatChange positive>+12% this month</StatChange>
    </StatCard>
    
    <StatCard>
      <StatIcon icon="mail-open" color="success" />
      <StatValue>{stats.averageOpenRate}%</StatValue>
      <StatLabel>Avg Open Rate</StatLabel>
      <StatBenchmark>Industry avg: 21.5%</StatBenchmark>
    </StatCard>
    
    <StatCard>
      <StatIcon icon="mouse-pointer" color="accent" />
      <StatValue>{stats.clickRate}%</StatValue>
      <StatLabel>Click Rate</StatLabel>
      <StatBenchmark>Industry avg: 2.3%</StatBenchmark>
    </StatCard>
    
    <StatCard>
      <StatIcon icon="user-x" color="warning" />
      <StatValue>{stats.unsubscribeRate}%</StatValue>
      <StatLabel>Unsubscribe Rate</StatLabel>
      <StatBenchmark>Industry avg: 0.5%</StatBenchmark>
    </StatCard>
  </StatsGrid>
  
  {/* Recent Campaigns */}
  <CampaignsSection>
    <SectionHeader>
      <h2>Recent Campaigns</h2>
      <ViewAll href="/admin/newsletter/campaigns">View All</ViewAll>
    </SectionHeader>
    
    <CampaignsList>
      <CampaignCard>
        <CampaignStatus status="sent" />
        <CampaignInfo>
          <CampaignTitle>v2.3.0 Release Announcement</CampaignTitle>
          <CampaignMeta>
            Sent to 5,234 subscribers • Jan 31, 2025
          </CampaignMeta>
        </CampaignInfo>
        <CampaignMetrics>
          <Metric label="Opens" value="3,456" percentage="66%" />
          <Metric label="Clicks" value="892" percentage="17%" />
          <Metric label="Unsubscribes" value="12" percentage="0.2%" />
        </CampaignMetrics>
        <CampaignActions>
          <Button size="sm" variant="ghost">View Report</Button>
          <Button size="sm" variant="ghost">Duplicate</Button>
        </CampaignActions>
      </CampaignCard>
      
      <CampaignCard>
        <CampaignStatus status="draft" />
        <CampaignInfo>
          <CampaignTitle>Weekly Developer Tips #42</CampaignTitle>
          <CampaignMeta>
            Draft • Last edited 2 hours ago
          </CampaignMeta>
        </CampaignInfo>
        <CampaignActions>
          <Button size="sm" variant="primary">Continue Editing</Button>
          <Button size="sm" variant="ghost">Preview</Button>
        </CampaignActions>
      </CampaignCard>
      
      <CampaignCard>
        <CampaignStatus status="scheduled" />
        <CampaignInfo>
          <CampaignTitle>February Product Updates</CampaignTitle>
          <CampaignMeta>
            Scheduled for Feb 1, 2025 at 10:00 AM EST
          </CampaignMeta>
        </CampaignInfo>
        <CampaignActions>
          <Button size="sm" variant="ghost">Edit</Button>
          <Button size="sm" variant="ghost" danger>Cancel</Button>
        </CampaignActions>
      </CampaignCard>
    </CampaignsList>
  </CampaignsSection>
</div>
```

## Newsletter Editor

### Campaign Creator
```jsx
<div className="campaign-editor">
  <EditorHeader>
    <Breadcrumb>
      <BreadcrumbItem>Newsletter</BreadcrumbItem>
      <BreadcrumbItem>New Campaign</BreadcrumbItem>
    </Breadcrumb>
    <HeaderActions>
      <Button variant="ghost">Save Draft</Button>
      <Button variant="ghost">Preview</Button>
      <Button variant="ghost">Send Test</Button>
      <Button variant="primary">Schedule Send</Button>
    </HeaderActions>
  </EditorHeader>
  
  <EditorLayout>
    {/* Settings Panel */}
    <SettingsPanel>
      <PanelSection>
        <SectionTitle>Campaign Details</SectionTitle>
        <FormField>
          <Label>Campaign Name</Label>
          <Input 
            placeholder="Internal name for this campaign"
            value={campaign.name}
          />
        </FormField>
        
        <FormField>
          <Label>Subject Line</Label>
          <Input 
            placeholder="Email subject line"
            value={campaign.subject}
          />
          <SubjectPreview>
            <PreviewIcon>📧</PreviewIcon>
            <PreviewText>{campaign.subject || 'Subject preview'}</PreviewText>
          </SubjectPreview>
        </FormField>
        
        <FormField>
          <Label>Preview Text</Label>
          <Input 
            placeholder="Text that appears after subject"
            value={campaign.previewText}
          />
        </FormField>
        
        <FormField>
          <Label>From Name</Label>
          <Input value={campaign.fromName} />
        </FormField>
        
        <FormField>
          <Label>Reply-To Email</Label>
          <Input type="email" value={campaign.replyTo} />
        </FormField>
      </PanelSection>
      
      <PanelSection>
        <SectionTitle>Audience</SectionTitle>
        <FormField>
          <Label>Send To</Label>
          <Select value={campaign.audience}>
            <option>All Subscribers</option>
            <option>Pro Users</option>
            <option>Free Users</option>
            <option>New Subscribers (Last 30 days)</option>
            <option>Custom Segment</option>
          </Select>
        </FormField>
        
        <AudiencePreview>
          <PreviewCount>5,234</PreviewCount>
          <PreviewLabel>recipients</PreviewLabel>
        </AudiencePreview>
        
        <FormField>
          <Label>Exclude</Label>
          <TagInput 
            placeholder="Add tags to exclude"
            value={campaign.excludeTags}
          />
        </FormField>
      </PanelSection>
      
      <PanelSection>
        <SectionTitle>Schedule</SectionTitle>
        <FormField>
          <RadioGroup value={campaign.sendTime}>
            <Radio value="now">Send immediately</Radio>
            <Radio value="schedule">Schedule for later</Radio>
          </RadioGroup>
        </FormField>
        
        {campaign.sendTime === 'schedule' && (
          <>
            <FormField>
              <Label>Date</Label>
              <DatePicker value={campaign.scheduleDate} />
            </FormField>
            <FormField>
              <Label>Time</Label>
              <TimePicker value={campaign.scheduleTime} />
            </FormField>
            <FormField>
              <Label>Timezone</Label>
              <Select value={campaign.timezone}>
                <option>Eastern Time (EST)</option>
                <option>Pacific Time (PST)</option>
                <option>UTC</option>
              </Select>
            </FormField>
          </>
        )}
      </PanelSection>
    </SettingsPanel>
    
    {/* Email Template Editor */}
    <TemplateEditor>
      <EditorToolbar>
        <ToolGroup>
          <ToolButton icon="text" tooltip="Text Block" />
          <ToolButton icon="image" tooltip="Image" />
          <ToolButton icon="button" tooltip="Button" />
          <ToolButton icon="divider" tooltip="Divider" />
        </ToolGroup>
        <ToolGroup>
          <ToolButton icon="code" tooltip="HTML" />
          <ToolButton icon="merge" tooltip="Merge Tags" />
        </ToolGroup>
      </EditorToolbar>
      
      <EmailCanvas>
        <EmailTemplate>
          {/* Email Header */}
          <EmailHeader>
            <Logo src="/logo.png" alt="Agentwise" />
          </EmailHeader>
          
          {/* Email Content Blocks */}
          <ContentBlock type="heading">
            <EditableText>
              🚀 Agentwise v2.3.0 is Here!
            </EditableText>
          </ContentBlock>
          
          <ContentBlock type="text">
            <EditableText>
              Hi {{subscriber.firstName}},
              
              We're excited to announce the release of Agentwise v2.3.0 
              with major improvements including streamlined installation, 
              enhanced documentation, and new features!
            </EditableText>
          </ContentBlock>
          
          <ContentBlock type="button">
            <EmailButton href="https://agentwise.dev">
              Read Release Notes
            </EmailButton>
          </ContentBlock>
          
          <ContentBlock type="image">
            <ImageUpload>
              <DropZone>
                <Icon name="upload" />
                <p>Drop image or click to upload</p>
              </DropZone>
            </ImageUpload>
          </ContentBlock>
          
          <ContentBlock type="divider">
            <Divider />
          </ContentBlock>
          
          {/* Email Footer */}
          <EmailFooter>
            <FooterLinks>
              <FooterLink href="{{unsubscribe_url}}">
                Unsubscribe
              </FooterLink>
              <FooterLink href="{{preferences_url}}">
                Update Preferences
              </FooterLink>
              <FooterLink href="https://agentwise.dev">
                Visit Website
              </FooterLink>
            </FooterLinks>
            <FooterText>
              © 2025 Agentwise. All rights reserved.
              <br />
              You're receiving this because you subscribed to our newsletter.
            </FooterText>
          </EmailFooter>
        </EmailTemplate>
      </EmailCanvas>
    </TemplateEditor>
  </EditorLayout>
</div>
```

## Subscriber Management

### Subscribers List
```jsx
<div className="subscribers-page">
  <PageHeader>
    <h1>Newsletter Subscribers</h1>
    <HeaderActions>
      <Button icon="download">Export</Button>
      <Button icon="upload">Import</Button>
      <Button variant="primary" icon="plus">Add Subscriber</Button>
    </HeaderActions>
  </PageHeader>
  
  {/* Filters */}
  <FilterBar>
    <SearchInput placeholder="Search by email or name..." />
    <Select label="Status">
      <option>All</option>
      <option>Active</option>
      <option>Unsubscribed</option>
      <option>Bounced</option>
    </Select>
    <Select label="Tags">
      <option>All Tags</option>
      <option>Pro Users</option>
      <option>Free Users</option>
      <option>Beta Testers</option>
    </Select>
    <DateRangePicker label="Subscribed Date" />
  </FilterBar>
  
  {/* Subscribers Table */}
  <SubscribersTable>
    <TableHeader>
      <TableRow>
        <TableHead>
          <Checkbox />
        </TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Tags</TableHead>
        <TableHead>Subscribed</TableHead>
        <TableHead>Engagement</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    
    <TableBody>
      {subscribers.map(subscriber => (
        <TableRow key={subscriber.id}>
          <TableCell>
            <Checkbox />
          </TableCell>
          <TableCell>
            <Email>{subscriber.email}</Email>
          </TableCell>
          <TableCell>{subscriber.name}</TableCell>
          <TableCell>
            <StatusBadge status={subscriber.status} />
          </TableCell>
          <TableCell>
            <TagList>
              {subscriber.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </TagList>
          </TableCell>
          <TableCell>
            <TimeAgo date={subscriber.subscribedAt} />
          </TableCell>
          <TableCell>
            <EngagementScore score={subscriber.engagement}>
              {subscriber.engagement}%
            </EngagementScore>
          </TableCell>
          <TableCell>
            <Actions>
              <Button size="sm" variant="ghost">Edit</Button>
              <DropdownMenu>
                <MenuItem>View History</MenuItem>
                <MenuItem>Add Tags</MenuItem>
                <MenuItem>Send Email</MenuItem>
                <MenuItem danger>Unsubscribe</MenuItem>
              </DropdownMenu>
            </Actions>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </SubscribersTable>
  
  {/* Bulk Actions */}
  <BulkActions show={selectedCount > 0}>
    <SelectedCount>{selectedCount} selected</SelectedCount>
    <BulkActionButtons>
      <Button variant="ghost">Add Tags</Button>
      <Button variant="ghost">Remove Tags</Button>
      <Button variant="ghost">Export</Button>
      <Button variant="ghost" danger>Unsubscribe</Button>
    </BulkActionButtons>
  </BulkActions>
</div>
```

## User-Facing Subscribe/Unsubscribe

### Newsletter Subscribe Widget
```jsx
<NewsletterWidget>
  <WidgetHeader>
    <Icon name="mail" />
    <h3>Stay Updated</h3>
  </WidgetHeader>
  <WidgetContent>
    <p>Get the latest Agentwise updates and tips delivered to your inbox</p>
    <SubscribeForm onSubmit={handleSubscribe}>
      <EmailInput 
        type="email"
        placeholder="Enter your email"
        value={email}
        required
      />
      <SubscribeButton type="submit">
        Subscribe
        <ArrowRight />
      </SubscribeButton>
    </SubscribeForm>
    <PrivacyNote>
      We respect your privacy. Unsubscribe at any time.
    </PrivacyNote>
  </WidgetContent>
</NewsletterWidget>
```

### Unsubscribe Page (`/unsubscribe`)
```jsx
<UnsubscribePage>
  <Container>
    <UnsubscribeCard className="glass">
      <Icon name="mail-x" size="lg" />
      <h1>Unsubscribe from Newsletter</h1>
      
      {!unsubscribed ? (
        <>
          <p>
            We're sorry to see you go. You can unsubscribe from all emails 
            or update your preferences below.
          </p>
          
          <EmailDisplay>{email}</EmailDisplay>
          
          <UnsubscribeOptions>
            <Option>
              <Radio name="unsubscribe" value="all" defaultChecked />
              <OptionContent>
                <OptionTitle>Unsubscribe from all emails</OptionTitle>
                <OptionDescription>
                  You won't receive any more emails from us
                </OptionDescription>
              </OptionContent>
            </Option>
            
            <Option>
              <Radio name="unsubscribe" value="preferences" />
              <OptionContent>
                <OptionTitle>Update email preferences</OptionTitle>
                <OptionDescription>
                  Choose which types of emails you want to receive
                </OptionDescription>
              </OptionContent>
            </Option>
          </UnsubscribeOptions>
          
          {showPreferences && (
            <PreferencesSection>
              <PreferenceGroup>
                <Checkbox defaultChecked>Product Updates</Checkbox>
                <Checkbox defaultChecked>Weekly Tips</Checkbox>
                <Checkbox>Promotional Offers</Checkbox>
                <Checkbox defaultChecked>Security Alerts</Checkbox>
              </PreferenceGroup>
              
              <FrequencySelect>
                <Label>Email Frequency</Label>
                <Select>
                  <option>As they happen</option>
                  <option>Daily digest</option>
                  <option>Weekly digest</option>
                  <option>Monthly summary</option>
                </Select>
              </FrequencySelect>
            </PreferencesSection>
          )}
          
          <FeedbackSection>
            <Label>Why are you unsubscribing? (Optional)</Label>
            <Select>
              <option>Select a reason</option>
              <option>Too many emails</option>
              <option>Content not relevant</option>
              <option>No longer using Agentwise</option>
              <option>Other</option>
            </Select>
            <Textarea 
              placeholder="Additional feedback (optional)"
              rows={3}
            />
          </FeedbackSection>
          
          <Actions>
            <Button variant="ghost" onClick={goBack}>
              Keep Subscription
            </Button>
            <Button variant="primary" onClick={handleUnsubscribe}>
              {unsubscribeType === 'all' ? 'Unsubscribe' : 'Update Preferences'}
            </Button>
          </Actions>
        </>
      ) : (
        <SuccessMessage>
          <Icon name="check-circle" />
          <h2>You've been unsubscribed</h2>
          <p>You won't receive any more emails from us.</p>
          <Button variant="ghost" onClick={handleResubscribe}>
            Changed your mind? Re-subscribe
          </Button>
        </SuccessMessage>
      )}
    </UnsubscribeCard>
  </Container>
</UnsubscribePage>
```

## Supabase Schema

### Newsletter Tables
```sql
-- Subscribers table
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- active, unsubscribed, bounced
  tags TEXT[],
  preferences JSONB DEFAULT '{}',
  engagement_score INTEGER DEFAULT 0,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  unsubscribe_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  from_name VARCHAR(100),
  reply_to VARCHAR(255),
  content JSONB NOT NULL,
  audience_filter JSONB,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, sent
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  stats JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email events tracking
CREATE TABLE newsletter_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES newsletter_campaigns(id),
  subscriber_id UUID REFERENCES newsletter_subscribers(id),
  event_type VARCHAR(50), -- sent, opened, clicked, bounced, unsubscribed
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unsubscribe tokens for secure unsubscribe links
CREATE TABLE unsubscribe_tokens (
  token VARCHAR(255) PRIMARY KEY,
  subscriber_id UUID REFERENCES newsletter_subscribers(id),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);
```

## Email Service Integration

### SendGrid/Resend Integration
```typescript
// Email service integration
class NewsletterService {
  async sendCampaign(campaignId: string) {
    const campaign = await getCampaign(campaignId)
    const subscribers = await getTargetAudience(campaign.audience_filter)
    
    for (const batch of chunk(subscribers, 1000)) {
      await sendBatch(batch, campaign)
    }
  }
  
  async trackEvent(event: EmailEvent) {
    await supabase.from('newsletter_events').insert(event)
    await updateEngagementScore(event.subscriber_id)
  }
}
```

---

**Note**: Newsletter system should include comprehensive tracking, easy opt-out, and respect user preferences with GDPR compliance.