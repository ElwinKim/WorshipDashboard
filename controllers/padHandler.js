const fs = require('fs');
const fsExtra = require('fs-extra');
const Album = require('../models/albumModel');
const User = require('../models/userModel');
const Pad = require('../models/padModel');
const multer = require('multer');
const unzipper = require('unzipper');
const extract = require('extract-zip');
const ObjectID = require('mongodb').ObjectID;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { promisify } = require('util');
const sharp = require('sharp');
const { BlobServiceClient } = require('@azure/storage-blob');
const MulterAzureStorage = require('multer-azure-blob-storage')
  .MulterAzureStorage;
const formidable = require('formidable');

// Set Azure blob storage connection variables.
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_ACCOUNT_ACCESS_KEY =
  process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;

var container; // global variable for container name
var objectId; // global variable ObjectID for mongoDB

exports.generateIdAndNewCon = exports.generateId = async (req, res, next) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  // if Client upload files, when update tracks
  if (req.params.id) {
    objectId = req.params.id;
    var form = formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      if (files['pads[]'] && files['pads[]'].size !== 0) {
        container = 'pad-' + objectId;
        const containerClient = blobServiceClient.getContainerClient(container);
        for await (const blob of containerClient.listBlobsFlat()) {
          await containerClient.deleteBlob(blob.name);
          console.log('deleting blobs');
        }
      }
    });
    next();
  } else {
    console.log('Create new Pads');
    objectId = new ObjectID();
    container = 'pad-' + objectId;
    const containerClient = blobServiceClient.getContainerClient(container);
    await containerClient.create();
    await containerClient.setAccessPolicy('blob');
    next();
  }
};

// Multer Azure storage get only function. So it returns container name
const getContainer = async (req, file) => {
  if (file.mimetype.startsWith('image')) {
    container = 'padimages';
    return container;
  } else {
    container = `pad-${objectId}`;
    return container;
  }
};

// Return blob name
const resolveBlobName = (req, file) => {
  return new Promise((resolve, reject) => {
    const blobName = generateBlobName(req, file);
    resolve(blobName);
  });
};

let pads = []; // global variable for track names
//Each file name will store to tracks array
const generateBlobName = (req, file) => {
  console.log('uploading...');
  if (file.mimetype.startsWith('image')) {
    return `pad-${objectId}.jpeg`;
  } else {
    pads.push(file.originalname);
    return file.originalname;
  }
};

// Multer Azure Storage access form
const azureStorage = new MulterAzureStorage({
  connectionString: AZURE_STORAGE_CONNECTION_STRING,
  accessKey: AZURE_STORAGE_ACCOUNT_ACCESS_KEY,
  accountName: AZURE_STORAGE_ACCOUNT_NAME,
  containerName: getContainer,
  blobName: resolveBlobName,
  containerAccessLevel: 'blob',
  urlExpirationTime: 60,
});

const uploadPads = multer({
  storage: azureStorage,
});

exports.uploadPad = uploadPads.fields([
  {
    name: 'pads[]',
    maxCount: 25,
  },
  {
    name: 'image',
    maxCount: 1,
  },
]);

/*********************
 *  Handlers for Admin
 *********************/

// Controllers
exports.getProForPad = catchAsync(async (req, res, next) => {
  var renderPath = 'product/pad-post';
  // To find All album data
  const allData = await Album.find();
  const features = new APIFeatures(Album, req.query)
    .search()
    .filter()
    .sort()
    .limitFields();

  let length = allData.length;
  const albums = await features.query;

  // To find album when admin user search
  const searchFeature = new APIFeatures(Album, req.query).search();
  const searchAlbum = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchAlbum.length;
  } else {
    query = '';
  }

  // To Find producer role from user database
  const userFeatures = new APIFeatures(User.find(), { role: 'pro' })
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const producer = await userFeatures.query;

  res.status(200).render(renderPath, {
    title: 'Get All Pro for pad',
    length: length,
    query: query,
    albums,
    producer,
  });
});

exports.getAllPadsToAdmin = catchAsync(async (req, res, next) => {
  const allData = await Pad.find();
  const features = new APIFeatures(Pad, req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const page = req.query.page;
  let length = allData.length;
  const pads = await features.query;

  const searchFeature = new APIFeatures(Pad, req.query).search();
  const searchPatch = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchPatch.length;
  } else {
    query = '';
  }
  res.status(200).render('product/pads', {
    title: 'Pad',
    length: length,
    page: page,
    query: query,
    pads,
  });
});

exports.getPadToAdmin = catchAsync(async (req, res, next) => {
  let query = Pad.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No pad found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.createNewPad = catchAsync(async (req, res, next) => {
  req.body.image = req.files['image'][0]['blobName'];
  req.body.pads = pads;
  req.body._id = objectId;
  const doc = await Pad.create(req.body);

  pads = [];
  res.status(200).json({
    status: 'success',
    pad: doc,
  });
});

/****************
 * Delete Patchs
 ****************/

exports.deletePads = catchAsync(async (req, res, next) => {
  if (req.query) {
    const queryObj = { ...req.query };
    const queryLength = Object.keys(queryObj).length;
    for (var i = 0; i < queryLength; i++) {
      const doc = await Pad.findByIdAndDelete(Object.values(queryObj)[i]);
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONNECTION_STRING
      );
      container = 'pad-' + Object.values(queryObj)[i];
      var containerClient = blobServiceClient.getContainerClient(container);
      await containerClient.delete();
      container = 'padimages';
      containerClient = blobServiceClient.getContainerClient(container);
      await containerClient.deleteBlob(
        `pad-${Object.values(queryObj)[i]}.jpeg`
      );
    }
  } else {
    const doc = await Pad.findByIdAndDelete(req.params.id);

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    container = 'pad-' + req.params.id;
    var containerClient = blobServiceClient.getContainerClient(container);
    await containerClient.delete();
    container = 'padimages';
    containerClient = blobServiceClient.getContainerClient(container);
    await containerClient.deleteBlob(`pad-${req.params.id}.jpeg`);
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updatePad = catchAsync(async (req, res, next) => {
  if (req.files['image']) {
    req.body.image = req.files['image'][0]['blobName'];
  } else {
    delete req.body.image;
  }
  if (req.files['pads[]']) {
    req.body.pads = pads;
  } else {
    delete req.body.pads;
  }

  if (parseInt(req.body.priceDiscount) >= parseInt(req.body.price)) {
    return next(new AppError('세일 가격은 원래 가격보다 낮아야 합니다.', 404));
  }

  const doc = await Pad.findByIdAndUpdate(req.params.id, req.body);

  if (!doc) {
    return next(new AppError('No Document found with that ID', 404));
  }
  pads = [];
  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

// Renderer for Pad-post page to create new Pad document
exports.padPostPageRenderer = catchAsync(async (req, res, next) => {
  res.status(200).render('product/pad-post', {
    title: 'Create New Pad',
  });
});
// Renderer for Pad-edit page to edit Pad document
exports.padEditPageRenderer = catchAsync(async (req, res, next) => {
  // To find All album data
  const allData = await Album.find();
  const features = new APIFeatures(Album, req.query)
    .search()
    .filter()
    .sort()
    .limitFields();

  let length = allData.length;
  const albums = await features.query;

  // To find album when admin user search
  const searchFeature = new APIFeatures(Album, req.query).search();
  const searchAlbum = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchAlbum.length;
  } else {
    query = '';
  }

  // To Find producer role from user database
  const userFeatures = new APIFeatures(User.find(), { role: 'pro' })
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const producer = await userFeatures.query;

  const doc = await Pad.findById(req.params.id);

  if (!doc) {
    return next(new AppError('No pad found with that ID', 404));
  }

  res.status(200).render('product/pad-edit', {
    title: 'Edit a Pad',
    pad: doc,
    length: length,
    query: query,
    albums,
    producer,
  });
});

/*******************************
 *  Pad Handler for Client-side
 *******************************/

// exports.getAllPatchs = factory.getAll(Pad);
// exports.getPatch = factory.getOne(Pad, { path: 'reviews' });
// exports.createPatch = factory.createOne(Pad);
// exports.updatePatch = factory.updateOne(Pad);
// exports.deletePatch = factory.deleteOne(Pad);

// exports.getPatchstats = catchAsync(async (req, res) => {
//   const stats = await Pad.aggregate([
//     {
//       $match: { ratingsAverage: { $gte: 4.5 } },
//     },
//     {
//       $group: {
//         _id: { $toUpper: '$songName' },
//         numPatchs: { $sum: 1 },
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
