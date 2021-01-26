const fs = require('fs');
const Album = require('../models/albumModel');
const multer = require('multer');
const MulterAzureStorage = require('multer-azure-blob-storage')
  .MulterAzureStorage;
const sharp = require('sharp');
const ObjectID = require('mongodb').ObjectID;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { promisify } = require('util');
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const { BlobServiceClient } = require('@azure/storage-blob');

const resolveBlobName = (req, file) => {
  return new Promise((resolve, reject) => {
    const blobName = createName(req, file);
    resolve(blobName);
  });
};

const resolveMetadata = (req, file) => {
  return new Promise((resolve, reject) => {
    const metadata = resizeAlbumImage(req, file);
    resolve(metadata);
  });
};

const azureStorage = new MulterAzureStorage({
  connectionString: AZURE_STORAGE_CONNECTION_STRING,
  accessKey:
    'IBPeSA2hzVF+iHhH98BXGgmYtlWVmRW3GbWe2LrBBXeBEjpWUcdacPS8tGhPX28oO9CYQUEOilACcUTODLA1fg==',
  accountName: 'elwinadmin',
  containerName: 'albumimages',
  blobName: resolveBlobName,
  metadata: resolveMetadata,
  containerAccessLevel: 'blob',
  urlExpirationTime: 60,
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const uploadAlbumImg = multer({
  storage: azureStorage,
  fileFilter: multerFilter,
});

exports.uploadAlbumImage = uploadAlbumImg.single('image');

const createName = catchAsync(async (req, file) => {
  var blobName;
  if (req.params.id) {
    req.file.filename = `album-${req.params.id}.jpeg`;
    blobName = `album-${req.params.id}.jpeg`;
  } else {
    const objectId = new ObjectID();
    req.body._id = objectId;
    req.file.filename = `album-${objectId}.jpeg`;
    blobName = `album-${objectId}.jpeg`;
  }
  return blobName;
});

const resizeAlbumImage = catchAsync(async (req, file) => {
  if (!req.file) return;

  const buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  return buffer;
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
  /*******************************
   * Create Blob and upload images
   ********************************/
  if (req.file) {
    req.body.image = req.file.filename;
  } else {
    var objectId = new ObjectID();
    req.body._id = objectId;
  }
  const doc = await Album.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.deleteAlbums = catchAsync(async (req, res, next) => {
  const unlinkFile = promisify(fs.unlink);

  if (req.query) {
    const queryObj = { ...req.query };
    const queryLength = Object.keys(queryObj).length;
    for (var i = 0; i < queryLength; i++) {
      const doc = await Album.findByIdAndDelete(Object.values(queryObj)[i]);
      await unlinkFile(
        `public/images/album/album-${Object.values(queryObj)[i]}.jpeg`
      ).catch(function (error) {
        //do nothing
        alert('Cannot find file!');
      });
      if (!doc) {
        return next(new AppError('No data found with that ID', 404));
      }
    }
  } else {
    await unlinkFile(`public/images/album/album-${req.params.id}.jpeg`).catch(
      function (error) {
        alert('Cannot find file!');
      }
    );
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
