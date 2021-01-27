const fs = require('fs');
const Album = require('../models/albumModel');
const multer = require('multer');
const sharp = require('sharp');
const ObjectID = require('mongodb').ObjectID;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { promisify } = require('util');
const { BlobServiceClient } = require('@azure/storage-blob');
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const uploadAlbumImg = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadAlbumImage = uploadAlbumImg.single('image');

exports.resizeAlbumImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  if (req.params.id) {
    req.file.filename = `album-${req.params.id}.jpeg`;
  } else {
    const objectId = new ObjectID();
    req.body._id = objectId;
    req.file.filename = `album-${objectId}.jpeg`;
  }

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer()
    .then((data) => {
      req.file.buffer = data;
    });

  next();
});

/*********************
 *  Handlers for Admin
 *********************/

// Controllers
exports.getAllAlbumsToAdmin = catchAsync(async (req, res, next) => {
  const allData = await Album.find();
  const features = new APIFeatures(Album, req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const page = req.query.page;
  let length = allData.length;
  const albums = await features.query;

  const searchFeature = new APIFeatures(Album, req.query).search();
  const searchAlbum = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchAlbum.length;
  } else {
    query = '';
  }
  res.status(200).render('product/album', {
    title: 'Album',
    length: length,
    page: page,
    query: query,
    albums,
  });
});

exports.getAlbumToAdmin = catchAsync(async (req, res, next) => {
  let query = Album.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No track found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.createNewAlbum = catchAsync(async (req, res, next) => {
  if (req.file) {
    req.body.image = req.file.filename;
  } else {
    var objectId = new ObjectID();
    req.body._id = objectId;
  }
  const containerName = 'albumimages';
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blobName = req.file.filename;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  console.log('\nUploading to Azure storage as blob:\n\t', blobName);
  const data = req.file.buffer;
  const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
  console.log('Blob was uploaded successfully.');
  const doc = await Album.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.deleteAlbums = catchAsync(async (req, res, next) => {
  const containerName = 'albumimages';
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);

  if (req.query) {
    const queryObj = { ...req.query };
    const queryLength = Object.keys(queryObj).length;
    for (var i = 0; i < queryLength; i++) {
      const doc = await Album.findByIdAndDelete(Object.values(queryObj)[i]);
      const blobName = `album-${Object.values(queryObj)[i]}.jpeg`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete().catch(function (error) {
        //do nothing
        alert(`Cannot find file! \n error: ${error}`);
      });
      if (!doc) {
        return next(new AppError('No data found with that ID', 404));
      }
    }
  } else {
    const blobName = `album-${req.params.id}.jpeg`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete().catch(function (error) {
      alert(`Cannot find file! \n error: ${error}`);
    });
    const doc = await Album.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No data found with that ID', 404));
    }
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateAlbum = catchAsync(async (req, res, next) => {
  if (req.file) {
    req.body.image = req.file.filename;
    const containerName = 'albumimages';
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blobName = req.file.filename;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log('\nUpdating to Azure storage as blob:\n\t', blobName);
    const data = req.file.buffer;
    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    console.log('Blob was updated successfully.');
  }

  const doc = await Album.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError('No Document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

// Renderer for album-post page to create new album document
exports.albumPostPageRenderer = catchAsync(async (req, res, next) => {
  res.status(200).render('product/album-post', {
    title: 'Create New Album',
  });
});

/*******************************
 *  Album Handler for Client-side
 *******************************/

// exports.getAllAlbums = factory.getAll(Album);
// exports.getAlbum = factory.getOne(Album, { path: 'reviews' });
// exports.createAlbum = factory.createOne(Album);
// exports.updateAlbum = factory.updateOne(Album);
// exports.deleteAlbum = factory.deleteOne(Album);

// exports.getAlbumstats = catchAsync(async (req, res) => {
//   const stats = await Album.aggregate([
//     {
//       $match: { ratingsAverage: { $gte: 4.5 } },
//     },
//     {
//       $group: {
//         _id: { $toUpper: '$songName' },
//         numAlbums: { $sum: 1 },
//         numRatings: { $sum: '$ratingsQuantity' },
//         avgRating: { $avg: '$ratingsAverage' },
//         avgPrice: { $avg: '$price' },
//         minPrice: { $min: '$price' },
//         maxPrice: { $max: '$price' },
//       },
//     },
//     {
//       $sort: { avgPrice: 1 },
//     },
//   ]);
//   res.status(200).json({
//     status: 'Success',
//     data: {
//       stats,
//     },
//   });
// });
