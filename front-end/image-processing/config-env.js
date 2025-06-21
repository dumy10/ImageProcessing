// Load environment variables from .env file
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
const result = dotenv.config();

if (result.error) {
  console.error("Error loading .env file:", result.error);
}

const environment = process.env.ENVIRONMENT || "development";

// Create development environment.ts file with values
const developmentEnvironmentContent = `export const environment = {
  production: ${environment === "production" ? true : false},
  apiUrl: '${process.env.API_URL || "https://api.yourdevelopment.com/Images"}',
  apiKey: '${process.env.API_KEY || "YOUR_API_KEY_HERE"}'
};
`;

// Create production environment.prod.ts file with values
const productionEnvironmentContent = `export const environment = {
  production: ${environment === "production" ? true : false},
  apiUrl: '${
    process.env.PROD_API_URL || "https://api.yourproduction.com/Images"
  }',
  apiKey: '${process.env.API_KEY || "YOUR_API_KEY_HERE"}'
};
`;

// Make sure directory exists
const envDir = path.join(__dirname, "src", "environments");
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// File paths for environment files
const devEnvFilePath = path.join(envDir, "environment.ts");
const prodEnvFilePath = path.join(envDir, "environment.prod.ts");

// Check if development environment file exists and delete it
if (fs.existsSync(devEnvFilePath)) {
  fs.unlinkSync(devEnvFilePath);
  console.log("Deleted existing development environment file.");
}

// Write the development file
fs.writeFileSync(devEnvFilePath, developmentEnvironmentContent);
console.log("Development environment file generated successfully.");

// Check if production environment file exists and delete it
if (fs.existsSync(prodEnvFilePath)) {
  fs.unlinkSync(prodEnvFilePath);
  console.log("Deleted existing production environment file.");
}

// Write the production file
fs.writeFileSync(prodEnvFilePath, productionEnvironmentContent);
console.log("Production environment file generated successfully.");
