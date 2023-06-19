const fs = require('fs')
const { execSync } = require('child_process')
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

// if (confirmFileCopy("z:\\", "sas.txt")) {
//     console.log("success")
// }
// else {
//     console.log("fail")
// }

function getFileName(line) {
    let file = line.split("INFO: ")[1]
    file = file.split(";")[0]
    //console.log(file)
    return file
}

function listBlobFile(blobURL, container, SAS){
    const URL = `${blobURL}/${container}${SAS}`
    console.log(`.${URL}.`)
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

const STORAGEACCOUNT = process.env.STORAGEACCOUNT
const blobUrl = `https://${STORAGEACCOUNT}.blob.core.windows.net`
const container = 'sfr'
const SAS = process.env.SAS
const files = listBlobFile(blobUrl, container, SAS)
if (files.length === 0){
    console.log("No files found in blob storage")
}
files.forEach((f) => {
    console.log(`Found file ${f}`)
})