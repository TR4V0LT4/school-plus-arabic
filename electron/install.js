const { exec } = require("child_process");
const path = require("path");

const installDependencies = () => {
  exec("npm install", { cwd: path.join(__dirname, "../") }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(stdout);
    console.error(stderr);
  });
};

installDependencies();
