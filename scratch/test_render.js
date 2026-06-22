import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ClientPortalTeaser from '../src/components/ClientPortalTeaser.jsx';
import CVQASimulator from '../src/components/CVQASimulator.jsx';

console.log("Testing ClientPortalTeaser rendering...");
try {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(ClientPortalTeaser, {
      lang: "Cn",
      selectedFabric: "FAB-02",
      selectedLeg: "matte-black",
      setActiveIntakeModal: () => {}
    })
  );
  console.log("ClientPortalTeaser rendered successfully!");
} catch (error) {
  console.error("Error rendering ClientPortalTeaser:", error);
}

console.log("\nTesting CVQASimulator rendering...");
try {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(CVQASimulator, {
      lang: "Cn",
      selectedFabric: "FAB-02",
      selectedLeg: "matte-black"
    })
  );
  console.log("CVQASimulator rendered successfully!");
} catch (error) {
  console.error("Error rendering CVQASimulator:", error);
}
