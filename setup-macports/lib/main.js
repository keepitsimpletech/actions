"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load tempDirectory before it gets wiped by tool-cache
let tempDirectory = process.env['RUNNER_TEMPDIRECTORY'] || '';
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const path = __importStar(require("path"));
if (!tempDirectory) {
    let baseLocation;
    if (process.platform === 'win32') {
        // On windows use the USERPROFILE env variable
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    }
    else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        }
        else {
            baseLocation = '/home';
        }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
}
function getMacPorts(versionSpec = "2.5.4") {
    return __awaiter(this, void 0, void 0, function* () {
        // check cache
        let toolPath;
        toolPath = tc.find("macports", versionSpec);
        // If not found in cache, download
        if (!toolPath) {
            // Download, install, cache
            core.debug("MacPorts not found in tool-cache");
            let filename = "MacPorts-" + versionSpec + "-10.14-Mojave.pkg";
            let downloadUrl = "https://distfiles.macports.org/MacPorts/" + filename;
            let downloadPath = "";
            try {
                downloadPath = yield tc.downloadTool(downloadUrl);
            }
            catch (err) {
                core.setFailed("Could not download MacPorts: " + err);
            }
            let tempDownloadFolder = 'temp_' + Math.floor(Math.random() * 2000000000);
            let tempDir = path.join(tempDirectory, tempDownloadFolder);
            yield io.mkdirP(tempDir);
            yield io.cp(downloadPath, path.join(tempDir, filename));
            let exitCode = yield exec.exec("sudo /usr/sbin/installer", [
                "-pkg",
                path.join(tempDir, filename),
                "-target",
                "/"
            ]);
            if (exitCode != 0) {
                core.setFailed(`Could not install MacPorts. Exit code = ${exitCode}`);
            }
        }
        yield tc.cacheDir("/opt/local", "macports", versionSpec);
        core.addPath("/opt/local/bin:/opt/local/sbin");
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield getMacPorts();
            if (core.getInput("UseHostCMake")) {
                const cmakePath = yield io.which("cmake");
                yield exec.exec("sudo ln", ["-s", cmakePath, "/opt/local/bin/cmake"]);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
/////// start
if (process.platform != "darwin") {
    core.setFailed("This action *only* runs on macOS");
}
run();
