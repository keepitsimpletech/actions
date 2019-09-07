import * as core from "@actions/core";
import * as io from "@actions/io";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

async function getMacPorts(versionSpec: string = "2.5.4") {
  // check cache
  let toolPath: String;
  toolPath = tc.find("macports", versionSpec);

  // If not found in cache, download
  if (!toolPath) {
    // Download, install, cache
    core.debug("MacPorts not found in tool-cache");

    let filename = "MacPorts-" + versionSpec + "-10.14-Mojave.pkg";
    let downloadUrl = "https://distfiles.macports.org/MacPorts/" + filename;

    let downloadPath: string = "";
    try {
      downloadPath = await tc.downloadTool(downloadUrl);
    } catch (err) {
      core.setFailed("Could not download MacPorts: " + err);
    }
    let exitCode = await exec.exec("sudo /usr/sbin/installer", [
      "-pkg",
      downloadPath,
      "-target",
      "/"
    ]);
    if (exitCode != 0) {
      core.setFailed(`Could not install MacPorts. Exit code = ${exitCode}`);
    }
  }

  await tc.cacheDir("/opt/local", "macports", versionSpec);
  core.addPath("/opt/local/bin:/opt/local/sbin");
}

async function run() {
  try {
    await getMacPorts();

    if (core.getInput("UseHostCMake")) {
      const cmakePath = await io.which("cmake");
      await exec.exec("sudo ln", ["-s", cmakePath, "/opt/local/bin/cmake"]);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

/////// start

if (process.platform != "darwin") {
  core.setFailed("This action *only* runs on macOS");
}

run();
