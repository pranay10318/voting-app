module.exports = {
  apps: [
      {
          name: "voting-app",
          script: "npm",
          args: "run start",
          watch: false,
          instances: "max", // enables cluster mode, and allows load balancing across all cores.
          env: {
              NODE_ENV: "development"
          },
          env_production: {
              NODE_ENV: "production"
          },
          out_file: "logs/out.log" // pm2 restarts whenever watch is true and changes in cur dir
      }
  ]
}