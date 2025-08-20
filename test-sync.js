const { ProjectRegistrySync } = require('./dist/project-registry/ProjectRegistrySync');

async function testSync() {
  console.log('Testing ProjectRegistrySync...');
  
  const sync = new ProjectRegistrySync();
  
  try {
    const result = await sync.syncRegistry();
    console.log('Sync completed successfully!');
    console.log('Results:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

testSync();