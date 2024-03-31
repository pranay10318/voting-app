// module.exports = {
//     apps: [{
//       name: "voting-app",
//       script: "src/index.ts",
//       instances: "max",
//       autorestart: true,
//       watch: false,
//       max_memory_restart: "1G",
//       env: {
//         NODE_ENV: "production"
//       },
//       env_production: {
//         NODE_ENV: "production"
//       }
//     }]
//   };
  

module.exports = {
  apps: [
      {
          name: "voting-app",
          script: "npm",
          automation: false,
          args: "run start:prod",
          watch: true,
          instances: "2",
          env: {
              NODE_ENV: "development"
          },
          env_production: {
              NODE_ENV: "production"
          }
      }
  ]
}