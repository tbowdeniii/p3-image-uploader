let listAry = new Array()

window.addEventListener('load', function () {
  window.localStorage.removeItem('files')
})

window.addEventListener('beforeunload', function () {
  window.localStorage.removeItem('categories')
  window.localStorage.removeItem('subcategories')
  window.localStorage.removeItem('content-folders')
})

api.handle('update', (event, object) => {
  console.log('checking for updates...')
})

const getFiles = () => {
  return JSON.parse(window.localStorage.getItem('files')) || []
}

const addFile = (file) => {
  let files = getFiles()
  if (!files.includes(file)) {
    files = [...getFiles(), file]
  }

  window.localStorage.setItem('files', JSON.stringify(files))

  return files
}

const removeFile = (file) => {
  const files = [...getFiles()]

  let idx = files.indexOf(file)
  files.splice(idx, 1)

  window.localStorage.setItem('files', JSON.stringify(files))

  return files
}

const resetFiles = () => {
  window.localStorage.removeItem('files')
}

const getCategories = () => {
  return JSON.parse(window.localStorage.getItem('categories')) || []
}

const addCategory = (category) => {
  const categories = [...getCategories(), category]

  window.localStorage.setItem('categories', JSON.stringify(categories))

  return categories
}

const getSubCategories = () => {
  return JSON.parse(window.localStorage.getItem('subcategories')) || []
}

const addSubCategory = (category) => {
  const categories = [...getSubCategories(), category]

  window.localStorage.setItem('subcategories', JSON.stringify(categories))

  return categories
}

const getContentFolders = () => {
  return JSON.parse(window.localStorage.getItem('content-folders')) || []
}

const addContentFolder = (category) => {
  const categories = [...getContentFolders(), category]

  window.localStorage.setItem('content-folders', JSON.stringify(categories))

  return categories
}

function removeOptions(selectElement) {
  var i,
    L = selectElement.options.length - 1
  for (i = L; i >= 0; i--) {
    selectElement.remove(i)
  }
}

// Function to handle file dialog opening and seletion

//
const openFileExplorer = (device) => {
  if (device !== undefined) {
  }

  api.send('fileDialog', 'open it').then((result) => {
    const filePaths = result

    for (let i = 0; i < filePaths.length; i++) {
      addFile(filePaths[i])
    }
    let files = getFiles()
    let listDiv = document.getElementById('file-list')

    files.forEach((element) => {
      let file = element.split('\\').slice(-1)
      let listItem = document.createElement('li')
      listItem.innerText = file
      let delSpan = document.createElement('span')
      delSpan.classList = 'del-span icon has-text-danger'
      let delIcon = document.createElement('i')
      delIcon.classList = 'fas fa-solid fa-x'
      listItem.appendChild(delSpan)
      delSpan.appendChild(delIcon)
      delSpan.addEventListener('click', function () {
        listItem.remove()
        removeFile(element)
      })
      console.log(listAry.includes(listItem.innerText))
      console.log(listAry)

      if (!listAry.includes(listItem.innerText)) {
        listDiv.appendChild(listItem)
        listAry.push(listItem.innerText)
      }
    })
  })
}

// IPC to handle the populating of category and subcategory dropdown selects

api.handle('s3', (event, objects) => {
  const objectContents = objects

  // Populating Product Categories

  objectContents.forEach((element) => {
    if (element.includes('/') && element.includes('Product')) {
      let tokens = element.match(/[^\/]+\/?|\//g)
      if (tokens.length > 1 && tokens[0].includes('Product')) {
        let catToken = tokens[1]

        if (catToken != undefined) {
          catToken = catToken.split('/')[0]
          let categories = getCategories()
          if (!categories.includes(catToken)) {
            addCategory(catToken)
          }
        }
        if (tokens.length >= 3) {
          let subCatToken = tokens.slice(1, 3)

          let subCategories = getSubCategories()

          let subCatTokenStr = JSON.stringify(subCatToken)
          let subCategoriesStr = JSON.stringify(subCategories)

          if (!subCategoriesStr.includes(subCatTokenStr)) {
            addSubCategory(subCatToken)
          }
        }
      }
    }
  })

  // Populating Content Folders

  objectContents.forEach((element) => {
    if (element.includes('/') && element.includes('Content')) {
      let tokens = element.match(/[^\/]+\/?|\//g)
      if (tokens.length > 1 && tokens[0].includes('Content')) {
        let catToken = tokens[1]

        catToken = catToken.split('/')[0]
        let folders = getContentFolders()
        if (!folders.includes(catToken)) {
          addContentFolder(catToken)
        }
      }
    }
  })

  let categories = getCategories()
  categories.forEach((element) => {
    let catItem = `<option value="${element}">${element}</option>`
    const categorySelect = document.getElementById('category-select')
    categorySelect.insertAdjacentHTML('beforeend', catItem)
  })

  let contentFolders = getContentFolders()
  contentFolders.forEach((element) => {
    let catItem = `<option value="${element}">${element}</option>`
    const contentFolderSelect = document.getElementById('content-category-select')
    contentFolderSelect.insertAdjacentHTML('beforeend', catItem)
  })

  categorySelect.addEventListener('change', () => {
    const subCategorySelect = document.getElementById('subcategory-select')
    removeOptions(subCategorySelect)
    let subCatItem = `<option value="select-option">Select a subcategory</option>`
    subCategorySelect.insertAdjacentHTML('beforeend', subCatItem)
    let catVal = categorySelect.options[categorySelect.selectedIndex].value

    let subCategories = getSubCategories()
    subCategories.forEach((element) => {
      let a = element[0].split('/')[0]
      let b = element[1].split('/')[0]
      if (catVal.includes(a)) {
        let subCatItem = `<option value="${b}">${b}</option>`
        const subCategorySelect = document.getElementById('subcategory-select')
        subCategorySelect.insertAdjacentHTML('beforeend', subCatItem)
      }
    })
  })
})

const getImage = () => {
  // Updating Header text

  let header = document.getElementById('header')
  header.innerText = 'Now, copy your URLs! Then, hit the restart button.'

  // Get Width

  var desktopWidth = document.getElementById('desktop-width-input').value
  desktopWidth = Number(desktopWidth)

  // Grabbing Image Type (Product or Content)
  var imageTypeSelect = document.getElementById('image-type-select')
  var imageType = imageTypeSelect.options[imageTypeSelect.selectedIndex].value

  if (imageType == 'Product') {
    let parentFolder = 'Product Images'

    // Grabbing Category and SubCategory from select dropdown

    var categorySelect = document.getElementById('category-select')
    var selectedCat = categorySelect.options[categorySelect.selectedIndex].value
    var subCategorySelect = document.getElementById('subcategory-select')
    var selectedSubCat = subCategorySelect.options[subCategorySelect.selectedIndex].value

    // Grabbing SKU input

    var sku = document.getElementById('sku-input').value

    let files = getFiles()

    //Sending form inputs to Main Process to use in Sharp image compression and uploading to S3

    api.send(
      'executeProductSquoosh',
      desktopWidth,
      parentFolder,
      selectedCat,
      selectedSubCat,
      sku,
      files
    )

    populateProductUrlList(parentFolder, selectedCat, selectedSubCat, sku)
  }

  if (imageType == 'Content') {
    let parentFolder = 'Content Images'

    let contentFolderSelect = document.getElementById('content-category-select')
    let contentFolder = contentFolderSelect.value

    let createContentFolderInput = document.getElementById('content-folder-input')
    let createContentFolderValue = createContentFolderInput.value

    let files = getFiles()

    // If creating a new content folder
    if (createContentFolderValue != '') {
      console.log("we're creating new folder")
      api.send('executeContentSquoosh', parentFolder, createContentFolderValue, files)
      populateContentUrlList(parentFolder, createContentFolderValue)
    }
    // If NOT creating a new content folder
    else {
      api.send('executeContentSquoosh', parentFolder, contentFolder, files)
      populateContentUrlList(parentFolder, contentFolder)
    }
  }
}

const populateProductUrlList = (imageType, cat, subCat, sku) => {
  let files = getFiles()

  let listDiv = document.getElementById('file-list')
  listDiv.innerHTML = ''
  listDiv.style.fontSize = '14px'

  let cloudFrontUrl = window.envVars.cloudfrontUrl
  console.log(cloudFrontUrl)
  files.forEach((element) => {
    let file = element.split('\\').slice(-1)
    let fileName = file[0].split('.')[0]
    let listItem = document.createElement('li')
    let copSpan = document.createElement('span')
    copSpan.classList = 'cop-span icon'
    let copIcon = document.createElement('i')
    copIcon.classList = 'fas fa-solid fa-copy copy-icon'
    listItem.appendChild(copSpan)
    copSpan.appendChild(copIcon)
    let url = `${cloudFrontUrl}/${imageType}/${cat}/${subCat}/${sku}/${fileName}.webp`
    listItem.innerHTML = url
    copSpan.addEventListener('click', function () {
      let sb = document.getElementById('snackbar')
      sb.className = 'show'
      setTimeout(() => {
        sb.className = sb.className.replace('show', '')
      }, 2000)
      api.send('clipboard', url)
      console.log('clicked')
    })

    listItem.appendChild(copSpan)
    copSpan.appendChild(copIcon)
    listDiv.appendChild(listItem)
  })
}

const populateContentUrlList = (imageType, cat) => {
  let files = getFiles()

  let listDiv = document.getElementById('file-list')
  listDiv.innerHTML = ''
  listDiv.style.fontSize = '14px'

  let cloudFrontUrl = window.envVars.cloudfrontUrl
  files.forEach((element) => {
    let file = element.split('\\').slice(-1)
    let fileName = file[0].split('.')[0]
    let listItem = document.createElement('li')

    listItem.innerText = `${cloudFrontUrl}/${imageType}/${cat}/${fileName}.webp`

    let copSpan = document.createElement('span')
    copSpan.classList = 'cop-span icon'

    let copIcon = document.createElement('i')
    copIcon.classList = 'fas fa-solid fa-copy'

    listItem.appendChild(copSpan)

    copSpan.appendChild(copIcon)

    let url = `${cloudFrontUrl}/${imageType}/${cat}/${fileName}.webp`

    copSpan.addEventListener('click', function () {
      let sb = document.getElementById('snackbar')
      sb.className = 'show'
      setTimeout(() => {
        sb.className = sb.className.replace('show', '')
      }, 2000)
      api.send('clipboard', url)
      console.log('clicked')
    })

    listDiv.appendChild(listItem)
  })
}

const restart = () => {
  let fileList = document.getElementById('file-list')
  let urlList = document.getElementById('url-list')
  let sku = document.getElementById('sku-input')
  var categorySelect = document.getElementById('category-select')
  var subCategorySelect = document.getElementById('subcategory-select')
  let header = document.getElementById('header')

  header.innerText = 'Welcome! Get started by selecting a few images to upload!'
  fileList.innerHTML = ''
  urlList.innerHTML = ''
  sku.value = ''

  fileExplorerButton.classList = 'button is-info is-dark'

  squooshButton.classList = 'button is-dark'

  let listDiv = document.getElementById('file-list')

  listDiv.style.fontSize = '16px'

  resetFiles()
}

const imageTypeSelect = document.getElementById('image-type-select')
imageTypeSelect.addEventListener('change', () => {
  let contentParams = document.getElementById('content')
  let productParams = document.getElementById('product')

  let desktopWidth = document.getElementById('desktop-width-input')
  let desktopWidthLabel = document.getElementById('desktop-width-label')

  let contentInput = document.getElementById('content-input-container')

  const fileExplorerButton = document.getElementById('fileExplorerButton')

  if (imageTypeSelect.value == 'Content') {
    contentParams.style.display = 'flex'
    productParams.style.display = 'none'

    contentInput.style.display = 'none'

    fileExplorerButton.style.display = 'inline-flex'

    desktopWidthLabel.style.display = 'none'
    desktopWidth.style.display = 'none'
  } else {
    contentParams.style.display = 'none'
    productParams.style.display = 'flex'

    contentInput.style.display = 'none'

    fileExplorerButton.style.display = 'inline-flex'

    desktopWidthLabel.style.display = 'inline-flex'
    desktopWidth.style.display = 'inline-flex'
  }
})

const subCategorySelect = document.getElementById('subcategory-select')
const categorySelect = document.getElementById('category-select')

const fileExplorerButton = document.getElementById('fileExplorerButton')

fileExplorerButton.addEventListener('click', () => {
  openFileExplorer()
  setTimeout(() => {
    fileExplorerButton.classList = 'button is-dark'
    squooshButton.classList = 'button is-info is-dark'
  }, 1000)
})

const squooshButton = document.getElementById('squoosh')

squooshButton.onclick = getImage

const deleteButton = document.getElementById('delete-button')
deleteButton.onclick = restart
