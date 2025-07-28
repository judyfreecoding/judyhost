const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const ExifReader = require('exifreader')

const app = express()
const PORT = 3001

// 配置你的本机照片目录路径
const PHOTOS_DIR = 'C:/Users/Judy/Desktop/屏幕背景' // 修改为你的照片目录
// 或者使用相对路径：const PHOTOS_DIR = './local-photos'

app.use(cors())
app.use('/photos', express.static(PHOTOS_DIR))

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

// 解析EXIF数据获取拍摄信息
const getPhotoExifData = (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath)
    const tags = ExifReader.load(buffer)
    
    let dateTime = null
    let location = '未知地点'
    
    // 获取拍摄时间
    if (tags.DateTime) {
      dateTime = tags.DateTime.description
    } else if (tags.DateTimeOriginal) {
      dateTime = tags.DateTimeOriginal.description
    } else if (tags.DateTimeDigitized) {
      dateTime = tags.DateTimeDigitized.description
    }
    
    // 格式化日期
    if (dateTime) {
      const date = new Date(dateTime.replace(/:/g, '-').replace(/ /, 'T'))
      if (!isNaN(date.getTime())) {
        dateTime = date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
    
    // 获取GPS位置信息
    if (tags.GPSLatitude && tags.GPSLongitude) {
      const lat = tags.GPSLatitude.description
      const lng = tags.GPSLongitude.description
      location = `${lat}, ${lng}`
      
      // 如果有城市信息
      if (tags.GPSProcessingMethod) {
        location = tags.GPSProcessingMethod.description
      }
    }
    
    // 获取相机信息
    let cameraInfo = ''
    if (tags.Make && tags.Model) {
      cameraInfo = `${tags.Make.description} ${tags.Model.description}`
    }
    
    return {
      dateTime: dateTime || '未知时间',
      location: location,
      cameraInfo: cameraInfo
    }
  } catch (error) {
    console.log('读取EXIF失败:', error.message)
    return {
      dateTime: '未知时间',
      location: '未知地点',
      cameraInfo: ''
    }
  }
}

// 获取照片列表API
app.get('/api/photos', (req, res) => {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) {
      return res.status(404).json({ error: '照片目录不存在' })
    }

    const files = fs.readdirSync(PHOTOS_DIR)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return IMAGE_EXTENSIONS.includes(ext)
    })

    const photos = imageFiles.map(filename => {
      const filePath = path.join(PHOTOS_DIR, filename)
      const stats = fs.statSync(filePath)
      const exifData = getPhotoExifData(filePath)
      
      return {
        filename: filename,
        originalName: path.parse(filename).name,
        extension: path.extname(filename),
        size: stats.size,
        modifiedDate: stats.mtime.toISOString().split('T')[0],
        url: `/photos/${encodeURIComponent(filename)}`,
        exif: exifData
      }
    })

    // 按修改时间排序，最新的在前
    photos.sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate))

    res.json(photos)
  } catch (error) {
    console.error('读取照片目录失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取单张照片信息
app.get('/api/photos/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename)
    const filePath = path.join(PHOTOS_DIR, filename)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '照片不存在' })
    }

    const stats = fs.statSync(filePath)
    const photoInfo = {
      filename: filename,
      originalName: path.parse(filename).name,
      extension: path.extname(filename),
      size: stats.size,
      modifiedDate: stats.mtime.toISOString().split('T')[0],
      createdDate: stats.birthtime.toISOString().split('T')[0],
      url: `/photos/${encodeURIComponent(filename)}`
    }

    res.json(photoInfo)
  } catch (error) {
    console.error('获取照片信息失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

app.listen(PORT, () => {
  console.log(`照片服务器运行在 http://localhost:${PORT}`)
  console.log(`照片目录: ${PHOTOS_DIR}`)
})
