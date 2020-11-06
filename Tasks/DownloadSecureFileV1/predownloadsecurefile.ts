import path = require('path');
import secureFilesCommon = require('azure-pipelines-tasks-securefiles-common/securefiles-common');
import tl = require('azure-pipelines-task-lib/task');

async function run() {
    let secureFileId: string;
    let secureFileHelpers: secureFilesCommon.SecureFileHelpers;

    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        let retryCount = parseInt(tl.getInput('retryCount'));
        let socketTimeout = parseInt(tl.getInput('socketTimeout'));
        if (isNaN(retryCount) || retryCount < 0) {
            retryCount = 8;
        }

        if (isNaN(socketTimeout) || socketTimeout < 0) {
            socketTimeout = undefined;
        }

        // download decrypted contents
        secureFileId = tl.getInput('secureFile', true);
        secureFileHelpers = new secureFilesCommon.SecureFileHelpers(retryCount, socketTimeout);
        let secureFilePath: string;
        let retries = 0;
        while (!secureFilePath && retries <= retryCount)
        {
            try {
                secureFilePath = await secureFileHelpers.downloadSecureFile(secureFileId);
            }
            catch (ex) {
                console.log(`Received exception ${ex}`);
                console.log('Retrying');
                if (retries >= retryCount) {
                    throw(ex);
                }
            }
            retries++;
        }

        if (tl.exist(secureFilePath)) {
            // set the secure file output variable.
            tl.setVariable('secureFilePath', secureFilePath);
        }
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();