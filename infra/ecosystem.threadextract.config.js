module.exports = {
  apps: [
    {
      name: "threadextract-web-uat",
      script: "pnpm",
      args: "start",
      cwd: "/home/ec2-user/threadextract/uat",
      env: {
        PORT: 3130,
        NODE_ENV: "production",
      },
    },
    {
      name: "threadextract-web-prod",
      script: "pnpm",
      args: "start",
      cwd: "/home/ec2-user/threadextract/prod",
      env: {
        PORT: 3131,
        NODE_ENV: "production",
      },
    },
  ],
};
