#!/usr/bin/env node
import * as blessed from 'blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Test Dashboard'
});

const box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Dashboard is working!\nPress q to quit.',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    }
  }
});

screen.append(box);

screen.key(['escape', 'q', 'C-c'], () => {
  process.exit(0);
});

screen.render();

console.log('Dashboard started. Press q to quit.');