'use strict'
const Jimp = require('jimp')
const tf = require('@tensorflow/tfjs')
const cv = require('opencv4nodejs')

async function loadImage (path, grayscale) {
  let image = await cv.imreadAsync(path)
  if (grayscale) image = await image.bgrToGrayAsync()

  return image
}

async function loadImageToTensor (path, grayscale, targetSize) {
  const image = await Jimp.read(path)

  if (grayscale) image.grayscale()
  if (targetSize) image.resize(targetSize.width, targetSize.height)

  const p = []

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    p.push(this.bitmap.data[idx + 0])
    p.push(this.bitmap.data[idx + 1])
    p.push(this.bitmap.data[idx + 2])
  })

  return tf.tensor3d(p, [image.bitmap.width, image.bitmap.height, 3])
}

async function saveImageTensor (path, tensor) {
  const [width, height] = tensor.shape
  const newTensorArray = Array.from(tensor.dataSync())
  let i = 0

  return new Promise(function (resolve, reject) {
    // eslint-disable-next-line no-new
    new Jimp(width, height, function (err, image) {
      if (err) return reject(err)
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        this.bitmap.data[idx + 0] = newTensorArray[i++]
        this.bitmap.data[idx + 1] = newTensorArray[i++]
        this.bitmap.data[idx + 2] = newTensorArray[i++]
        this.bitmap.data[idx + 3] = 255
      })

      image.write(path)
      return resolve(null)
    })
  })
}

module.exports = { loadImageToTensor, loadImage, saveImageTensor }