const appInsights = require('applicationinsights');
//const telemetry = appInsights.defaultClient;
const fs = require('fs')
const { execSync } = require('child_process')
const { join } = require('path')
const winston = require('winston');
const errorlog = join("/var/log/blob2share", "mercury_copy_error.log")
const applog = join("/var/log/blob2share", "mercury_copy.log")

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: errorlog, level: "warn" }),
      new winston.transports.File({ filename: applog }),
    ],
  });

function getFileName(line) {
    let file = line.split("INFO: ")[1]
    file = file.split(";")[0]
    return file
}

function listBlobFile(blobURL, container, SAS){
    const URL = `${blobURL}/${container}${SAS}`
    logger.debug(`.${URL}.`)
    const cmd = `azcopy list "${URL}"`
    const res = execSync(cmd)

    let myObject = res.toString().split("\n")
    const myArray = []
    myObject.forEach((line) => {
        if (line.length > 0) {
            const filename = getFileName(line.toString())
            myArray.push(filename)
        }
    })
    return myArray
}

function copyBlobFile(blobURL, container, file, SAS, dest){
    const URL = `${blobURL}/${container}/${file}${SAS}`
    logger.debug(URL)
    const cmd = `sudo azcopy copy "${URL}" "${dest}"`
    try {
        const res = execSync(cmd)
        logger.info(res.toString())
    }
    catch(err){
        logger.error(`Error running command - ${cmd}`)
        logger.error(err.toString())
    }
}

function removeBlobFile(blobURL, container, file, SAS, dest){
    const URL = `${blobURL}/${container}/${file}${SAS}`
    //logger.info(URL)
    const cmd = `azcopy remove "${URL}"`
    try {
        const res = execSync(cmd)
        logger.info(res.toString())
    }
    catch(err){
        logger.error(`Error running command - ${cmd}`)
        logger.error(err.toString())
    }
}

function confirmFileCopy(dest, file){
    try {
        const list = fs.readdirSync(dest)
        let blnSuccess = false
        list.forEach((item) => {
            if (item === file){
                blnSuccess = true
            }
        })
        if (blnSuccess){
            return true
        }
        else {
            return false
        }
    }
    catch {
        logger.error(`Error reading directory ${dest}`)
        throw(`Error reading directory ${dest}`)
    }
}

function main() {
    logger.info("Started");
    appInsights.defaultClient.trackEvent({name: "blob2share", properties: {customProperty: "running"}})
    //telemetry.trackEvent({name: "Started"})
    const STORAGEACCOUNT = process.env.STORAGEACCOUNT
    const blobUrl = `https://${STORAGEACCOUNT}.blob.core.windows.net`
    const container = 'sfr'
    const SAS = process.env.SAS
    const dest =  "/mnt/mercury/"
    const destdr =  "/mnt/mercurydr/"
    const files = listBlobFile(blobUrl, container, SAS)
    if (files.length === 0){
        logger.info("No files found in blob storage")
    }
    files.forEach((f) => {
        logger.info(`Found file ${f}`)
        copyBlobFile(blobUrl, container, f, SAS, dest)
        if (confirmFileCopy(dest, f)){
            logger.info(`${f} copied successfully to ${dest}`)
        }
        else {
            logger.error(`Failed copying ${f} to ${dest}`)
        }
        copyBlobFile(blobUrl, container, f, SAS, destdr)
        if (confirmFileCopy(dest, f)){
            logger.info(`${f} copied successfully to ${destdr}`)
            removeBlobFile(blobUrl, container, f, SAS, dest)
        }
        else {
            logger.error(`Failed copying ${f} to ${destdr}`)
        }

    })
    logger.info("Iteration complete");
}

if ((process.env.SAS === undefined) || (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING === undefined)) {
    logger.error("SAS and APPLICATIONINSIGHTS_CONNECTION_STRING environment variable not set")
}
else {
    appInsights.setup()
      .setSendLiveMetrics(true)
      .start()
    setInterval(() => {
        main()
    }, 60000)
}