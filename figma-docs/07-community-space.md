# 07 - Community Space (Discord-like)

## Community Hub (`/community`)

### Main Community Layout
```jsx
<div className="community-layout">
  {/* Server List Sidebar (Far Left) */}
  <ServerList>
    <ServerIcon active>
      <Logo>AW</Logo>
      <Tooltip>Agentwise Community</Tooltip>
    </ServerIcon>
    <Separator />
    <ServerIcon>
      <Icon name="plus" />
      <Tooltip>Create Space</Tooltip>
    </ServerIcon>
  </ServerList>
  
  {/* Channel Sidebar */}
  <ChannelSidebar>
    <ServerHeader>
      <ServerName>Agentwise Community</ServerName>
      <DropdownArrow />
    </ServerHeader>
    
    <ChannelList>
      {/* Announcement Channels */}
      <ChannelCategory name="📢 ANNOUNCEMENTS" collapsible>
        <Channel locked>
          <ChannelIcon>📣</ChannelIcon>
          <ChannelName>announcements</ChannelName>
          <ChannelBadge>Admin Only</ChannelBadge>
        </Channel>
        <Channel locked>
          <ChannelIcon>🚀</ChannelIcon>
          <ChannelName>releases</ChannelName>
        </Channel>
        <Channel locked>
          <ChannelIcon>📅</ChannelIcon>
          <ChannelName>events</ChannelName>
        </Channel>
      </ChannelCategory>
      
      {/* General Channels */}
      <ChannelCategory name="💬 GENERAL" collapsible>
        <Channel active>
          <ChannelIcon>💬</ChannelIcon>
          <ChannelName>general</ChannelName>
          <UnreadIndicator count={3} />
        </Channel>
        <Channel>
          <ChannelIcon>🎯</ChannelIcon>
          <ChannelName>getting-started</ChannelName>
        </Channel>
        <Channel>
          <ChannelIcon>💡</ChannelIcon>
          <ChannelName>showcase</ChannelName>
        </Channel>
      </ChannelCategory>
      
      {/* Support Channels */}
      <ChannelCategory name="🛟 SUPPORT" collapsible>
        <Channel>
          <ChannelIcon>❓</ChannelIcon>
          <ChannelName>help</ChannelName>
        </Channel>
        <Channel>
          <ChannelIcon>🐛</ChannelIcon>
          <ChannelName>bug-reports</ChannelName>
        </Channel>
        <Channel>
          <ChannelIcon>✨</ChannelIcon>
          <ChannelName>feature-requests</ChannelName>
        </Channel>
      </ChannelCategory>
      
      {/* Development Channels */}
      <ChannelCategory name="👨‍💻 DEVELOPMENT" collapsible>
        <Channel>
          <ChannelIcon>🔧</ChannelIcon>
          <ChannelName>dev-discussion</ChannelName>
        </Channel>
        <Channel>
          <ChannelIcon>🤖</ChannelIcon>
          <ChannelName>agent-development</ChannelName>
        </Channel>
        <Channel>
          <ChannelIcon>🔌</ChannelIcon>
          <ChannelName>integrations</ChannelName>
        </Channel>
      </ChannelCategory>
      
      {/* Voice Channels */}
      <ChannelCategory name="🎤 VOICE" collapsible>
        <VoiceChannel>
          <ChannelIcon>🔊</ChannelIcon>
          <ChannelName>General Voice</ChannelName>
          <VoiceUsers>
            <VoiceUser>John Doe</VoiceUser>
            <VoiceUser>Sarah Chen</VoiceUser>
          </VoiceUsers>
        </VoiceChannel>
        <VoiceChannel>
          <ChannelIcon>🎓</ChannelIcon>
          <ChannelName>Office Hours</ChannelName>
        </VoiceChannel>
      </ChannelCategory>
      
      {/* Forum Channels */}
      <ChannelCategory name="📝 FORUMS" collapsible>
        <ForumChannel>
          <ChannelIcon>📚</ChannelIcon>
          <ChannelName>tutorials</ChannelName>
          <ForumStats>23 posts</ForumStats>
        </ForumChannel>
        <ForumChannel>
          <ChannelIcon>🏆</ChannelIcon>
          <ChannelName>best-practices</ChannelName>
          <ForumStats>45 posts</ForumStats>
        </ForumChannel>
      </ForumChannel>
    </ChannelList>
    
    {/* User Panel */}
    <UserPanel>
      <UserInfo>
        <Avatar src={user.avatar} status="online" />
        <UserDetails>
          <Username>{user.username}</Username>
          <UserStatus>{user.status}</UserStatus>
        </UserDetails>
      </UserInfo>
      <UserControls>
        <ControlButton icon="mic" active />
        <ControlButton icon="headphones" active />
        <ControlButton icon="settings" />
      </UserControls>
    </UserPanel>
  </ChannelSidebar>
  
  {/* Main Chat Area */}
  <ChatArea>
    {/* Channel Header */}
    <ChannelHeader>
      <ChannelInfo>
        <ChannelTitle># general</ChannelTitle>
        <ChannelDescription>
          General discussion about Agentwise
        </ChannelDescription>
      </ChannelInfo>
      <ChannelActions>
        <ActionButton icon="bell" tooltip="Notifications" />
        <ActionButton icon="pin" tooltip="Pinned Messages" />
        <ActionButton icon="users" tooltip="Member List" />
        <ActionButton icon="search" tooltip="Search" />
      </ChannelActions>
    </ChannelHeader>
    
    {/* Messages Area */}
    <MessagesContainer>
      {/* Welcome Message */}
      <WelcomeMessage>
        <WelcomeIcon>👋</WelcomeIcon>
        <WelcomeTitle>Welcome to #general!</WelcomeTitle>
        <WelcomeText>
          This is the beginning of the #general channel.
        </WelcomeText>
      </WelcomeMessage>
      
      {/* Date Separator */}
      <DateSeparator>January 31, 2025</DateSeparator>
      
      {/* Messages */}
      <Message>
        <MessageAvatar src="/user1.jpg" />
        <MessageContent>
          <MessageHeader>
            <MessageAuthor>John Doe</MessageAuthor>
            <MessageTime>Today at 2:30 PM</MessageTime>
          </MessageHeader>
          <MessageText>
            Hey everyone! Just got started with Agentwise and it's amazing! 
            The Project Wizard saved me hours of setup time.
          </MessageText>
          <MessageReactions>
            <Reaction count={5}>👍</Reaction>
            <Reaction count={2}>🚀</Reaction>
            <Reaction count={1}>❤️</Reaction>
            <AddReaction>+</AddReaction>
          </MessageReactions>
        </MessageContent>
      </Message>
      
      {/* Message with Code Block */}
      <Message>
        <MessageAvatar src="/user2.jpg" />
        <MessageContent>
          <MessageHeader>
            <MessageAuthor>Sarah Chen</MessageAuthor>
            <RoleBadge>Moderator</RoleBadge>
            <MessageTime>Today at 2:35 PM</MessageTime>
          </MessageHeader>
          <MessageText>
            Welcome! Here's a quick tip for getting started:
          </MessageText>
          <CodeBlock language="bash">
            /create-project "my awesome app"
          </CodeBlock>
          <MessageActions>
            <ActionIcon icon="reply" tooltip="Reply" />
            <ActionIcon icon="thread" tooltip="Start Thread" />
            <ActionIcon icon="more" tooltip="More" />
          </MessageActions>
        </MessageContent>
      </Message>
      
      {/* Thread Indicator */}
      <ThreadIndicator>
        <ThreadIcon />
        <ThreadText>2 replies</ThreadText>
        <ThreadPreview>Last reply 10 minutes ago</ThreadPreview>
      </ThreadIndicator>
      
      {/* System Message */}
      <SystemMessage>
        <SystemIcon>🎉</SystemIcon>
        <SystemText>
          <strong>@newuser</strong> just joined the community! Say hello 👋
        </SystemText>
      </SystemMessage>
      
      {/* Typing Indicators */}
      <TypingIndicator>
        <TypingDots />
        <TypingText>Alex is typing...</TypingText>
      </TypingIndicator>
    </MessagesContainer>
    
    {/* Message Input */}
    <MessageInput>
      <InputContainer>
        <AttachButton icon="plus" />
        <TextInput 
          placeholder="Message #general"
          multiline
          maxRows={5}
        />
        <InputActions>
          <ActionButton icon="emoji" tooltip="Emoji" />
          <ActionButton icon="gif" tooltip="GIF" />
          <ActionButton icon="file" tooltip="Attach File" />
        </InputActions>
      </InputContainer>
      <TypingStatus>
        Press Enter to send • Shift+Enter for new line
      </TypingStatus>
    </MessageInput>
  </ChatArea>
  
  {/* Member List (Right Sidebar) */}
  <MemberList>
    <MemberCategory>
      <CategoryTitle>ADMIN — 2</CategoryTitle>
      <Member>
        <Avatar src="/admin1.jpg" status="online" />
        <MemberInfo>
          <MemberName>Phil</MemberName>
          <MemberRole>Founder</MemberRole>
        </MemberInfo>
        <Crown />
      </Member>
    </MemberCategory>
    
    <MemberCategory>
      <CategoryTitle>MODERATORS — 3</CategoryTitle>
      <Member>
        <Avatar src="/mod1.jpg" status="online" />
        <MemberInfo>
          <MemberName>Sarah Chen</MemberName>
          <MemberStatus>Helping in #support</MemberStatus>
        </MemberInfo>
        <Shield />
      </Member>
    </MemberCategory>
    
    <MemberCategory>
      <CategoryTitle>ONLINE — 127</CategoryTitle>
      <Member>
        <Avatar src="/user3.jpg" status="online" />
        <MemberInfo>
          <MemberName>Alex Developer</MemberName>
          <MemberStatus>Building cool stuff</MemberStatus>
        </MemberInfo>
      </Member>
    </MemberCategory>
    
    <MemberCategory collapsed>
      <CategoryTitle>OFFLINE — 1,234</CategoryTitle>
    </MemberCategory>
  </MemberList>
</div>
```

## Forum View

### Forum Thread List
```jsx
<ForumContainer>
  <ForumHeader>
    <ForumTitle>📚 Tutorials</ForumTitle>
    <ForumActions>
      <SortDropdown>
        <option>Latest Activity</option>
        <option>Most Popular</option>
        <option>Newest</option>
      </SortDropdown>
      <Button variant="primary" icon="plus">New Post</Button>
    </ForumActions>
  </ForumHeader>
  
  {/* Pinned Posts */}
  <PinnedSection>
    <SectionTitle>📌 Pinned</SectionTitle>
    <ForumPost pinned>
      <PostIcon>📌</PostIcon>
      <PostContent>
        <PostTitle>
          Getting Started Guide - Everything You Need
        </PostTitle>
        <PostMeta>
          <Author>@admin</Author>
          <Timestamp>2 days ago</Timestamp>
          <ViewCount>1.2k views</ViewCount>
        </PostMeta>
      </PostContent>
      <PostStats>
        <Stat icon="message">45</Stat>
        <Stat icon="heart">123</Stat>
      </PostStats>
    </ForumPost>
  </PinnedSection>
  
  {/* Regular Posts */}
  <ForumPosts>
    <ForumPost>
      <PostAvatar src="/user4.jpg" />
      <PostContent>
        <PostTitle>
          How to create custom agents for specific tasks
        </PostTitle>
        <PostPreview>
          I've been working on creating custom agents and found a really 
          efficient way to...
        </PostPreview>
        <PostTags>
          <Tag>agents</Tag>
          <Tag>tutorial</Tag>
          <Tag>advanced</Tag>
        </PostTags>
        <PostMeta>
          <Author>@johndoe</Author>
          <Timestamp>3 hours ago</Timestamp>
          <LastReply>
            Last reply by @sarah 10 minutes ago
          </LastReply>
        </PostMeta>
      </PostContent>
      <PostStats>
        <Stat icon="message">12</Stat>
        <Stat icon="heart">34</Stat>
        <Stat icon="bookmark">5</Stat>
      </PostStats>
    </ForumPost>
  </ForumPosts>
</ForumContainer>
```

## Thread View

### Full Thread Discussion
```jsx
<ThreadView>
  <ThreadHeader>
    <BackButton icon="arrow-left" onClick={goBack}>
      Back to Forum
    </BackButton>
    <ThreadActions>
      <Button variant="ghost" icon="bookmark">Save</Button>
      <Button variant="ghost" icon="share">Share</Button>
      <MoreMenu />
    </ThreadActions>
  </ThreadHeader>
  
  {/* Original Post */}
  <OriginalPost>
    <PostAuthor>
      <Avatar src="/user4.jpg" size="lg" />
      <AuthorInfo>
        <AuthorName>John Doe</AuthorName>
        <AuthorBadge>Member</AuthorBadge>
        <PostTime>3 hours ago</PostTime>
      </AuthorInfo>
    </PostAuthor>
    
    <PostBody>
      <PostTitle>
        How to create custom agents for specific tasks
      </PostTitle>
      <PostContent>
        {/* Rich content with markdown support */}
        <p>I've been working on creating custom agents...</p>
        <CodeBlock language="javascript">
          {codeExample}
        </CodeBlock>
        <p>This approach has several benefits...</p>
      </PostContent>
      
      <PostReactions>
        <ReactionButton active count={34}>👍</ReactionButton>
        <ReactionButton count={5}>🚀</ReactionButton>
        <ReactionButton count={2}>🤔</ReactionButton>
        <AddReactionButton>+</AddReactionButton>
      </PostReactions>
    </PostBody>
  </OriginalPost>
  
  {/* Replies */}
  <Replies>
    <RepliesHeader>
      <RepliesCount>12 Replies</RepliesCount>
      <SortOptions>
        <option>Best</option>
        <option>Newest</option>
        <option>Oldest</option>
      </SortOptions>
    </RepliesHeader>
    
    <Reply>
      <ReplyAuthor>
        <Avatar src="/user5.jpg" />
        <AuthorName>Sarah Chen</AuthorName>
        <ModeratorBadge />
        <ReplyTime>2 hours ago</ReplyTime>
      </ReplyAuthor>
      <ReplyContent>
        Great tutorial! I'd also suggest checking out...
      </ReplyContent>
      <ReplyActions>
        <ActionButton icon="reply">Reply</ActionButton>
        <ActionButton icon="heart">12</ActionButton>
      </ReplyActions>
    </Reply>
  </Replies>
  
  {/* Reply Box */}
  <ReplyBox>
    <ReplyAvatar src={currentUser.avatar} />
    <ReplyEditor>
      <RichTextEditor placeholder="Write your reply..." />
      <EditorToolbar>
        <ToolButton icon="bold" />
        <ToolButton icon="italic" />
        <ToolButton icon="code" />
        <ToolButton icon="link" />
      </EditorToolbar>
    </ReplyEditor>
    <ReplyActions>
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Post Reply</Button>
    </ReplyActions>
  </ReplyBox>
</ThreadView>
```

## Direct Messages

### DM Interface
```jsx
<DirectMessages>
  <DMSidebar>
    <DMHeader>
      <h3>Direct Messages</h3>
      <Button icon="plus" size="sm">New DM</Button>
    </DMHeader>
    
    <DMList>
      <DMItem active>
        <Avatar src="/user6.jpg" status="online" />
        <DMInfo>
          <DMName>Alex Thompson</DMName>
          <DMPreview>Thanks for the help!</DMPreview>
        </DMInfo>
        <DMTime>2m</DMTime>
        <UnreadBadge>3</UnreadBadge>
      </DMItem>
    </DMList>
  </DMSidebar>
  
  <DMConversation>
    {/* Similar to main chat but private */}
  </DMConversation>
</DirectMessages>
```

## Moderation Tools

### Admin Announcement Modal
```jsx
<AnnouncementModal>
  <ModalHeader>Create Announcement</ModalHeader>
  
  <Form>
    <FormField>
      <Label>Channel</Label>
      <Select>
        <option>#announcements</option>
        <option>#releases</option>
        <option>#events</option>
      </Select>
    </FormField>
    
    <FormField>
      <Label>Message</Label>
      <RichTextEditor />
    </FormField>
    
    <FormField>
      <Label>Mention</Label>
      <CheckboxGroup>
        <Checkbox>@everyone</Checkbox>
        <Checkbox>@here</Checkbox>
        <Checkbox>Specific role</Checkbox>
      </CheckboxGroup>
    </FormField>
    
    <FormField>
      <Label>Pin Message</Label>
      <Toggle />
    </FormField>
  </Form>
  
  <ModalFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Send Announcement</Button>
  </ModalFooter>
</AnnouncementModal>
```

### Moderation Panel
```jsx
<ModerationPanel>
  <PanelHeader>Moderation Queue</PanelHeader>
  
  <QueueItem>
    <ItemContent>
      <FlaggedMessage>
        <Author>@suspicioususer</Author>
        <Content>[Flagged content]</Content>
        <Reason>Profanity detected</Reason>
      </FlaggedMessage>
    </ItemContent>
    <ModActions>
      <Button size="sm" variant="ghost">Approve</Button>
      <Button size="sm" variant="danger">Remove</Button>
      <Button size="sm" variant="warning">Warn User</Button>
    </ModActions>
  </QueueItem>
</ModerationPanel>
```

## Bot Detection System

### Backend Implementation
```typescript
// Bot detection logic
interface BotDetection {
  checkUser(userId: string): BotCheckResult
  analyzePattern(activity: UserActivity): boolean
  rateLimit(ip: string): RateLimitStatus
}

// Profanity filter
interface ProfanityFilter {
  check(message: string): FilterResult
  sanitize(content: string): string
  reportViolation(userId: string, content: string): void
}
```

## Real-time Features

### WebSocket Events
```typescript
// Real-time chat
socket.on('message:new', (message) => {
  addMessageToChannel(message)
})

socket.on('user:typing', (data) => {
  showTypingIndicator(data.userId, data.channelId)
})

socket.on('user:status', (status) => {
  updateUserStatus(status.userId, status.status)
})

socket.on('reaction:add', (reaction) => {
  addReactionToMessage(reaction)
})
```

---

**Note**: Community space should be fully real-time with WebSocket connections, support rich media, and include comprehensive moderation tools.