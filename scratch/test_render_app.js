import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Intercept React.useState before importing App
// const originalUseState = React.useState;
// React.useState = function(initialValue) {
//   if (initialValue === "Overview") {
//     console.log("[useState Intercept] Overriding default marketingTab to 'BespokeFurniture'");
//     return originalUseState("BespokeFurniture");
//   }
//   return originalUseState(initialValue);
// };

// Mock browser globals on global and globalThis BEFORE dynamic import
const windowMock = {
  supabase: {},
  location: {
    href: 'http://localhost/',
    pathname: '/',
    search: '',
    hash: ''
  },
  navigator: {
    userAgent: 'node'
  }
};

global.window = windowMock;
globalThis.window = windowMock;

const localStorageMock = {
  getItem: (key) => {
    if (key === 'supabase_url') return 'https://test.supabase.co';
    if (key === 'supabase_key') return 'test_key';
    return null;
  },
  setItem: () => {},
  removeItem: () => {}
};

global.localStorage = localStorageMock;
globalThis.localStorage = localStorageMock;

const documentMock = {
  documentElement: {
    style: {
      setProperty: () => {}
    }
  },
  title: 'Test',
  createElement: () => ({
    style: {}
  })
};

global.document = documentMock;
globalThis.document = documentMock;

async function run() {
  console.log("Loading App dynamically...");
  const App = (await import('../src/app.jsx')).default;

  console.log("Testing full App component rendering with BespokeFurniture tab...");

  try {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(App, {})
    );
    console.log("App component rendered successfully!");
    console.log("HTML length:", html.length);
    console.log("HTML snippet:", html.substring(0, 500));
  } catch (error) {
    console.error("CRASH rendering App:", error);
  }
}

run();
