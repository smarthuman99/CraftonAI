const fs = require('fs');
const path = require('path');

const filePath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\scratch\\recovered_step_6248_homepage.jsx";
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log("File contains activeIntakeModal:", content.includes("activeIntakeModal"));
  console.log("File contains modalProjectName:", content.includes("modalProjectName"));
} else {
  console.log("File does not exist in artifacts scratch!");
}
