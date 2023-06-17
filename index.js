const appInsights = require('applicationinsights');
const fs = require('fs')
const util = require('util')
const { execSync } = require('child_process')
const { join } = require('path')

function getFileName(line) {
    let file = line.split("INFO: ")[1]
    file = file.split(";")[0]
    //console.log(file)
    return file
}

function listBlobFile(blobURL, container, SAS){
    const URL = `${blobURL}/${container}${SAS}`
    //console.log(`.${URL}.`)
    const cmd = `azcopy list "${URL}"`
    const res = execSync(cmd)
    //console.log(res.toString())

    let myObject = res.toString().split("\n")
    //console.log(typeof(res))
    const myArray = []
    myObject.forEach((line) => {
        //console.log((line))
        //console.log("line end")
        if (line.length > 0) {
            const filename = getFileName(line.toString())
            myArray.push(filename)
        }
    })
    return myArray
}

function copyBlobFile(blobURL, container, file, SAS, dest){
    const URL = `${blobURL}/${container}/${file}${SAS}`
    //console.log(URL)
    const cmd = `azcopy copy "${URL}" "${dest}"`
    try {
        const res = execSync(cmd)
        console.log(res.toString())
    }
    catch(err){
        console.error(`Error running command - ${cmd}`)
        console.error(err.toString())
    }
}

function removeBlobFile(blobURL, container, file, SAS, dest){
    const URL = `${blobURL}/${container}/${file}${SAS}`
    //console.log(URL)
    const cmd = `azcopy remove "${URL}"`
    try {
        const res = execSync(cmd)
        console.log(res.toString())
    }
    catch(err){
        console.error(`Error running command - ${cmd}`)
        console.error(err.toString())
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
        throw(`Error reading directory ${dest}`)
    }
}

function sleep (duration) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), (duration * 1000));
    })
}

async function main(delay) {
    console.log(`Date now is ${Date()}`);
    const blobUrl = 'https://itbcmercury.blob.core.windows.net'
    const container = 'sfr'
    const SAS = process.env.SAS
    const dest =  '\\\\dell-lat\\mercury' //"/mnt/mercury/"
    const files = listBlobFile(blobUrl, container, SAS)
    if (files.length === 0){
        console.log("No files found in blob storage")
    }
    files.forEach((f) => {
        console.log(`Found file ${f}`)
        copyBlobFile(blobUrl, container, f, SAS, dest)
        if (confirmFileCopy(dest, f)){
            console.log(`${f} copied successfully to ${dest}`)
            removeBlobFile(blobUrl, container, f, SAS, dest)
        }
        else {
            console.error(`Failed copying ${f} to ${dest}`)
        }
    })
    await sleep(delay);
    console.log(`Date now is ${Date()}`);
}

async function run(iteration, delay){
    while (iteration > 0) {
        await main(delay);
        iteration--
    }
}


if ((process.env.SAS === undefined) || (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING === undefined)) {
    console.log("Please set SAS and APPLICATIONINSIGHTS_CONNECTION_STRING environment variable")
}
else {
    appInsights.setup().start()

    // const logFile = fs.createWriteStream(join(__dirname, "blob2share.access.log"), { flags: 'a' })
    // const errorFile = fs.createWriteStream(join(__dirname, "blob2share.error.log"), { flags: 'a' })
    //   // Or 'w' to truncate the file every time the process starts.
    // const logStdout = process.stdout
    // const logStderr = process.stderr;
    
    // console.log = function () {
    //   logFile.write(util.format.apply(null, arguments) + '\n');
    //   logStdout.write(util.format.apply(null, arguments) + '\n');
    // }

    // console.error = function () {
    //     logFile.write(util.format.apply(null, arguments) + '\n');
    //     logStderr.write(util.format.apply(null, arguments) + '\n');
    // }

    run(1, 30)
}