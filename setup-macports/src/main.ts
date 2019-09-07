// Load tempDirectory before it gets wiped by tool-cache
let tempDirectory = process.env["RUNNER_TEMPDIRECTORY"] || "";

import * as core from "@actions/core";
import * as io from "@actions/io";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as path from "path";

if (!tempDirectory) {
  let baseLocation;
  if (process.platform === "win32") {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env["USERPROFILE"] || "C:\\";
  } else {
    if (process.platform === "darwin") {
      baseLocation = "/Users";
    } else {
      baseLocation = "/home";
    }
  }
  tempDirectory = path.join(baseLocation, "actions", "temp");
}

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

    let tempDownloadFolder: string =
      "temp_" + Math.floor(Math.random() * 2000000000);
    let tempDir: string = path.join(tempDirectory, tempDownloadFolder);
    await io.mkdirP(tempDir);
    await io.cp(downloadPath, path.join(tempDir, filename));

    let exitCode = await exec.exec("sudo /usr/sbin/installer", [
      "-pkg",
      path.join(tempDir, filename),
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
