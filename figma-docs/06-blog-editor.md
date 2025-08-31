# 06 - Blog & Visual Editor

## Visual Blog Editor (Webflow/Framer-inspired)

### Editor Interface
```jsx
<div className="visual-editor">
  {/* Top Toolbar */}
  <EditorToolbar>
    <ToolbarSection>
      <Logo>Agentwise Editor</Logo>
      <Breadcrumb>
        <BreadcrumbItem>Blog</BreadcrumbItem>
        <BreadcrumbItem>New Post</BreadcrumbItem>
      </Breadcrumb>
    </ToolbarSection>
    
    <ToolbarSection>
      <ViewToggle>
        <ToggleButton active>Edit</ToggleButton>
        <ToggleButton>Preview</ToggleButton>
        <ToggleButton>Settings</ToggleButton>
      </ViewToggle>
    </ToolbarSection>
    
    <ToolbarSection>
      <Button variant="ghost">Save Draft</Button>
      <Button variant="primary">Publish</Button>
      <SettingsMenu />
    </ToolbarSection>
  </EditorToolbar>
  
  {/* Left Panel - Components */}
  <ComponentPanel>
    <PanelHeader>
      <h3>Components</h3>
      <SearchInput placeholder="Search blocks..." />
    </PanelHeader>
    
    <ComponentCategories>
      <Category name="Basic">
        <DraggableComponent type="heading" icon="heading">
          Heading
        </DraggableComponent>
        <DraggableComponent type="paragraph" icon="text">
          Paragraph
        </DraggableComponent>
        <DraggableComponent type="image" icon="image">
          Image
        </DraggableComponent>
        <DraggableComponent type="video" icon="video">
          Video
        </DraggableComponent>
      </Category>
      
      <Category name="Layout">
        <DraggableComponent type="container" icon="box">
          Container
        </DraggableComponent>
        <DraggableComponent type="columns" icon="columns">
          Columns
        </DraggableComponent>
        <DraggableComponent type="grid" icon="grid">
          Grid
        </DraggableComponent>
      </Category>
      
      <Category name="Rich Content">
        <DraggableComponent type="code" icon="code">
          Code Block
        </DraggableComponent>
        <DraggableComponent type="quote" icon="quote">
          Quote
        </DraggableComponent>
        <DraggableComponent type="callout" icon="info">
          Callout
        </DraggableComponent>
        <DraggableComponent type="table" icon="table">
          Table
        </DraggableComponent>
      </Category>
      
      <Category name="Interactive">
        <DraggableComponent type="tabs" icon="tabs">
          Tabs
        </DraggableComponent>
        <DraggableComponent type="accordion" icon="chevron-down">
          Accordion
        </DraggableComponent>
        <DraggableComponent type="carousel" icon="images">
          Carousel
        </DraggableComponent>
      </Category>
      
      <Category name="Embeds">
        <DraggableComponent type="youtube" icon="youtube">
          YouTube
        </DraggableComponent>
        <DraggableComponent type="github" icon="github">
          GitHub Gist
        </DraggableComponent>
        <DraggableComponent type="codesandbox" icon="codesandbox">
          CodeSandbox
        </DraggableComponent>
      </Category>
    </ComponentCategories>
  </ComponentPanel>
  
  {/* Main Canvas */}
  <EditorCanvas>
    <CanvasHeader>
      <DeviceToggle>
        <DeviceButton active icon="desktop" />
        <DeviceButton icon="tablet" />
        <DeviceButton icon="smartphone" />
      </DeviceToggle>
      <ZoomControls>
        <ZoomButton icon="minus" />
        <ZoomLevel>100%</ZoomLevel>
        <ZoomButton icon="plus" />
      </ZoomControls>
    </CanvasHeader>
    
    <Canvas deviceView={deviceView} zoom={zoom}>
      <BlogPost>
        {/* Dropped Components */}
        <EditableBlock 
          type="heading" 
          selected={selectedBlock === 'heading-1'}
          onSelect={() => selectBlock('heading-1')}
        >
          <InlineEditor>
            Your Blog Title Here
          </InlineEditor>
          <BlockControls>
            <ControlButton icon="move" />
            <ControlButton icon="duplicate" />
            <ControlButton icon="delete" />
          </BlockControls>
        </EditableBlock>
        
        <EditableBlock type="metadata">
          <AuthorInfo>
            <Avatar src="/author.jpg" />
            <AuthorName contentEditable>John Doe</AuthorName>
            <PublishDate contentEditable>January 31, 2025</PublishDate>
            <ReadTime>5 min read</ReadTime>
          </AuthorInfo>
        </EditableBlock>
        
        <EditableBlock type="image">
          <ImageUpload>
            <DropZone>
              <Icon name="upload" />
              <p>Drop image here or click to upload</p>
            </DropZone>
          </ImageUpload>
        </EditableBlock>
        
        <EditableBlock type="paragraph">
          <RichTextEditor>
            Start writing your content here...
          </RichTextEditor>
        </EditableBlock>
        
        {/* Add Block Button */}
        <AddBlockButton onClick={showBlockPicker}>
          <Icon name="plus" />
          Add Block
        </AddBlockButton>
      </BlogPost>
    </Canvas>
  </EditorCanvas>
  
  {/* Right Panel - Properties */}
  <PropertiesPanel>
    <PanelTabs>
      <Tab active>Style</Tab>
      <Tab>Settings</Tab>
      <Tab>Data</Tab>
    </PanelTabs>
    
    {/* Style Tab */}
    <TabContent>
      <PropertySection title="Typography">
        <PropertyField>
          <Label>Font Family</Label>
          <Select value={selectedBlock.fontFamily}>
            <option>Inter</option>
            <option>Roboto</option>
            <option>System</option>
          </Select>
        </PropertyField>
        
        <PropertyField>
          <Label>Font Size</Label>
          <Slider min={12} max={72} value={selectedBlock.fontSize} />
        </PropertyField>
        
        <PropertyField>
          <Label>Font Weight</Label>
          <ButtonGroup>
            <Button size="sm">Light</Button>
            <Button size="sm" active>Regular</Button>
            <Button size="sm">Bold</Button>
          </ButtonGroup>
        </PropertyField>
        
        <PropertyField>
          <Label>Text Color</Label>
          <ColorPicker value={selectedBlock.color} />
        </PropertyField>
      </PropertySection>
      
      <PropertySection title="Spacing">
        <SpacingControl>
          <SpacingInput label="T" value={margin.top} />
          <SpacingInput label="R" value={margin.right} />
          <SpacingInput label="B" value={margin.bottom} />
          <SpacingInput label="L" value={margin.left} />
        </SpacingControl>
      </PropertySection>
      
      <PropertySection title="Background">
        <PropertyField>
          <Label>Background Type</Label>
          <Select>
            <option>None</option>
            <option>Color</option>
            <option>Gradient</option>
            <option>Image</option>
          </Select>
        </PropertyField>
        
        <PropertyField>
          <Label>Background Color</Label>
          <ColorPicker value={selectedBlock.backgroundColor} />
        </PropertyField>
      </PropertySection>
      
      <PropertySection title="Effects">
        <PropertyField>
          <Label>Shadow</Label>
          <Select>
            <option>None</option>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </Select>
        </PropertyField>
        
        <PropertyField>
          <Label>Border Radius</Label>
          <Slider min={0} max={50} value={selectedBlock.borderRadius} />
        </PropertyField>
      </PropertySection>
    </TabContent>
  </PropertiesPanel>
</div>
```

## Blog Post Templates

### Template Gallery
```jsx
<TemplateGallery>
  <GalleryHeader>
    <h2>Choose a Template</h2>
    <FilterTabs>
      <Tab>All</Tab>
      <Tab>Tutorial</Tab>
      <Tab>News</Tab>
      <Tab>Case Study</Tab>
      <Tab>Documentation</Tab>
    </FilterTabs>
  </GalleryHeader>
  
  <TemplateGrid>
    <TemplateCard>
      <TemplatePreview src="/templates/tutorial.jpg" />
      <TemplateInfo>
        <TemplateName>Tutorial Template</TemplateName>
        <TemplateDescription>
          Perfect for step-by-step guides
        </TemplateDescription>
      </TemplateInfo>
      <TemplateActions>
        <Button variant="ghost">Preview</Button>
        <Button variant="primary">Use Template</Button>
      </TemplateActions>
    </TemplateCard>
  </TemplateGrid>
</TemplateGallery>
```

## Rich Text Features

### Inline Formatting Toolbar
```jsx
<FloatingToolbar position={selectionPosition}>
  <ToolButton icon="bold" onClick={toggleBold} />
  <ToolButton icon="italic" onClick={toggleItalic} />
  <ToolButton icon="underline" onClick={toggleUnderline} />
  <ToolSeparator />
  <ToolButton icon="link" onClick={insertLink} />
  <ToolButton icon="code" onClick={toggleCode} />
  <ToolSeparator />
  <ColorPicker />
  <HighlightPicker />
</FloatingToolbar>
```

### Code Block Editor
```jsx
<CodeBlockEditor>
  <CodeHeader>
    <LanguageSelect value={language}>
      <option>JavaScript</option>
      <option>TypeScript</option>
      <option>Python</option>
      <option>Bash</option>
    </LanguageSelect>
    <FileName 
      contentEditable 
      placeholder="filename.js"
    />
    <CopyButton onClick={copyCode} />
  </CodeHeader>
  <CodeMirrorEditor
    value={code}
    language={language}
    theme="dark"
    lineNumbers
    autoComplete
  />
</CodeBlockEditor>
```

## Tutorial Post Creator

### Tutorial Builder
```jsx
<TutorialBuilder>
  <TutorialHeader>
    <h2>Create Tutorial</h2>
    <TutorialMeta>
      <Select label="Difficulty">
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </Select>
      <Input label="Duration" placeholder="30 minutes" />
      <TagInput label="Technologies" />
    </TutorialMeta>
  </TutorialHeader>
  
  {/* Steps Builder */}
  <StepsBuilder>
    <Step number={1}>
      <StepHeader>
        <StepNumber>Step 1</StepNumber>
        <StepTitle contentEditable>
          Install Dependencies
        </StepTitle>
      </StepHeader>
      <StepContent>
        <RichTextEditor placeholder="Explain this step..." />
        <CodeBlock language="bash">
          npm install agentwise
        </CodeBlock>
      </StepContent>
    </Step>
    
    <AddStepButton>
      <Icon name="plus" />
      Add Step
    </AddStepButton>
  </StepsBuilder>
  
  {/* YouTube Embed */}
  <VideoSection>
    <SectionTitle>Video Tutorial (Optional)</SectionTitle>
    <YouTubeEmbed>
      <Input placeholder="YouTube URL" />
      <Button>Embed Video</Button>
    </YouTubeEmbed>
  </VideoSection>
</TutorialBuilder>
```

## SEO & Publishing Settings

### SEO Panel
```jsx
<SEOPanel>
  <PanelHeader>SEO Settings</PanelHeader>
  
  <SEOPreview>
    <GooglePreview>
      <PreviewTitle>{seo.title || 'Page Title'}</PreviewTitle>
      <PreviewURL>agentwise.dev/blog/{slug}</PreviewURL>
      <PreviewDescription>
        {seo.description || 'Meta description...'}
      </PreviewDescription>
    </GooglePreview>
  </SEOPreview>
  
  <Form>
    <FormField>
      <Label>Meta Title</Label>
      <Input 
        value={seo.title} 
        maxLength={60}
        counter
      />
    </FormField>
    
    <FormField>
      <Label>Meta Description</Label>
      <Textarea 
        value={seo.description}
        maxLength={160}
        counter
      />
    </FormField>
    
    <FormField>
      <Label>URL Slug</Label>
      <SlugInput value={slug} />
    </FormField>
    
    <FormField>
      <Label>Featured Image</Label>
      <ImageUpload 
        value={seo.image}
        requirements="1200x630px recommended"
      />
    </FormField>
    
    <FormField>
      <Label>Keywords</Label>
      <TagInput value={seo.keywords} />
    </FormField>
  </Form>
</SEOPanel>
```

## Publishing Workflow

### Publish Modal
```jsx
<PublishModal>
  <ModalHeader>Publish Post</ModalHeader>
  
  <PublishOptions>
    <Option>
      <Radio name="publish" value="now" defaultChecked />
      <OptionContent>
        <OptionTitle>Publish Now</OptionTitle>
        <OptionDescription>
          Make this post live immediately
        </OptionDescription>
      </OptionContent>
    </Option>
    
    <Option>
      <Radio name="publish" value="schedule" />
      <OptionContent>
        <OptionTitle>Schedule</OptionTitle>
        <DateTimePicker />
      </OptionContent>
    </Option>
    
    <Option>
      <Radio name="publish" value="draft" />
      <OptionContent>
        <OptionTitle>Save as Draft</OptionTitle>
        <OptionDescription>
          Continue editing later
        </OptionDescription>
      </OptionContent>
    </Option>
  </PublishOptions>
  
  <PublishSettings>
    <Checkbox>Send to newsletter subscribers</Checkbox>
    <Checkbox>Post to social media</Checkbox>
    <Checkbox>Enable comments</Checkbox>
  </PublishSettings>
  
  <ModalFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Publish</Button>
  </ModalFooter>
</PublishModal>
```

## Version History

### Revision System
```jsx
<RevisionHistory>
  <HistoryHeader>
    <h3>Version History</h3>
    <Button size="sm">Compare Versions</Button>
  </HistoryHeader>
  
  <RevisionList>
    <Revision>
      <RevisionInfo>
        <RevisionLabel>Current Version</RevisionLabel>
        <RevisionTime>Edited 5 minutes ago</RevisionTime>
        <RevisionAuthor>John Doe</RevisionAuthor>
      </RevisionInfo>
      <RevisionActions>
        <Button size="sm" variant="ghost">View</Button>
      </RevisionActions>
    </Revision>
    
    <Revision>
      <RevisionInfo>
        <RevisionLabel>Auto-save</RevisionLabel>
        <RevisionTime>1 hour ago</RevisionTime>
      </RevisionInfo>
      <RevisionActions>
        <Button size="sm" variant="ghost">Restore</Button>
      </RevisionActions>
    </Revision>
  </RevisionList>
</RevisionHistory>
```

## Collaboration Features

### Real-time Collaboration
```jsx
<CollaborationBar>
  <ActiveUsers>
    <Avatar src="/user1.jpg" tooltip="John (editing)" />
    <Avatar src="/user2.jpg" tooltip="Sarah (viewing)" />
    <UserCount>+2</UserCount>
  </ActiveUsers>
  
  <CollabActions>
    <Button icon="share">Share</Button>
    <Button icon="comment">Comments</Button>
  </CollabActions>
</CollaborationBar>

{/* Inline Comments */}
<InlineComment position={commentPosition}>
  <CommentThread>
    <Comment>
      <CommentAuthor>Sarah Chen</CommentAuthor>
      <CommentText>Should we add more examples here?</CommentText>
      <CommentTime>2 hours ago</CommentTime>
    </Comment>
    <CommentReply>
      <Input placeholder="Reply..." />
    </CommentReply>
  </CommentThread>
</InlineComment>
```

---

**Note**: The visual editor should provide a smooth, intuitive experience similar to Webflow/Framer with real-time preview and easy drag-and-drop functionality.