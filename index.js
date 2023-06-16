const fs = require('fs')
const { execSync } = require('child_process')

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
    execSync(cmd)
}

//getFileName("INFO: test.txt;  Content Length: 6.00 B")
//listBlobFile('https://itbcmercury.blob.core.windows.net/sfr?sp=racwdl&st=2023-06-16T06:14:22Z&se=2023-06-17T14:14:22Z&spr=https&sv=2022-11-02&sr=c&sig=nUthYG%2BMsg5ClepDemxmiMEMr9qpo5Zw2xHxjzRRL30%3D')

const blobUrl = 'https://itbcmercury.blob.core.windows.net'
const container = 'sfr'
const SAS = ''
const dest = "/mnt/mercury/"
const files = listBlobFile(blobUrl, container, SAS)
//console.log(files)
files.forEach((f) => {
    // console.log(f)
    copyBlobFile(blobUrl, container, f, SAS, dest)
})
