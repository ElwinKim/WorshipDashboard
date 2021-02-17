const fs = require('fs');
const fsExtra = require('fs-extra');
const Album = require('../models/albumModel');
const User = require('../models/userModel');
const Patch = require('../models/patchModel');
const multer = require('multer');
const unzipper = require('unzipper');
const ObjectID = require('mongodb').ObjectID;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { promisify } = require('util');
const sharp = require('sharp');
const MulterAzureStorage = require('multer-azure-blob-storage')
  .MulterAzureStorage;
const { BlobServiceClient } = require('@azure/storage-blob');
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_ACCOUNT_ACCESS_KEY =
  process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;

var container; // global variable for container name
var objectId; // global variable ObjectID for mongoDB

exports.generateId = async (req, res, next) => {
  if (req.params.id) {
    console.log('Update patch');
    objectId = req.params.id;
    next();
  } else {
    console.log('Create new Patch');
    objectId = new ObjectID();
    console.log(objectId);
    next();
  }
};

const deleteBlob = async (req, file) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );

  container = 'patchaudio';
  const containerClient = blobServiceClient.getContainerClient(container);
  for await (const blob of containerClient.listBlobsFlat()) {
    if (blob.name.startsWith(req.params.id)) {
      console.log(blob.name);
      await containerClient.deleteBlob(blob.name);
      console.log('deleting blobs');
    }
  }
};

// Multer Azure storage get only function. So it returns container name
const getContainer = async (req, file) => {
  if (file.mimetype.startsWith('image')) {
    container = 'patchimages';
  } else {
    if (req.params.id) {
      deleteBlob(req, file);
    } else {
      container = 'patchaudio';
    }
  }
  return container;
};

// Return blob name
const resolveBlobName = (req, file) => {
  return new Promise((resolve, reject) => {
    const blobName = generateBlobName(req, file);
    resolve(blobName);
  });
};

//Each file name will store to tracks array
const generateBlobName = (req, file) => {
  if (file.mimetype.startsWith('image')) {
    return `${objectId}-patch.jpeg`;
  } else {
    return `${objectId}-${file.originalname}`;
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

const uploadPatchFiles = multer({
  storage: azureStorage,
});

exports.uploadPatch = uploadPatchFiles.fields([
  {
    name: 'patch',
    maxCount: 1,
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
exports.getProForPatch = catchAsync(async (req, res, next) => {
  var renderPath = 'product/patch-post';
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
    title: 'Get All Pro for patch',
    length: length,
    query: query,
    albums,
    producer,
  });
});

exports.getAllPatchesToAdmin = catchAsync(async (req, res, next) => {
  const allData = await Patch.find();
  const features = new APIFeatures(Patch, req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const page = req.query.page;
  let length = allData.length;
  const patches = await features.query;

  const searchFeature = new APIFeatures(Patch, req.query).search();
  const searchPatch = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchPatch.length;
  } else {
    query = '';
  }
  res.status(200).render('product/patches', {
    title: 'Patch',
    length: length,
    page: page,
    query: query,
    patches,
  });
});

exports.getPatchToAdmin = catchAsync(async (req, res, next) => {
  let query = Patch.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No patch found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.createNewPatch = catchAsync(async (req, res, next) => {
  req.body._id = objectId;
  req.body.patch = req.files['patch'][0]['blobName'];
  req.body.image = req.files['image'][0]['blobName'];

  const doc = await Patch.create(req.body);

  res.status(200).json({
    status: 'success',
    patch: doc,
  });
});

/****************
 * Delete Patchs
 ****************/

exports.deletePatches = catchAsync(async (req, res, next) => {
  if (req.query) {
    const queryObj = { ...req.query };
    const queryLength = Object.keys(queryObj).length;
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    for (var i = 0; i < queryLength; i++) {
      const doc = await Patch.findByIdAndDelete(Object.values(queryObj)[i]);

      container = 'patchimages';
      var containerClient = blobServiceClient.getContainerClient(container);
      await containerClient.deleteBlob(
        `${Object.values(queryObj)[i]}-patch.jpeg`
      );

      container = 'patchaudio';
      containerClient = blobServiceClient.getContainerClient(container);
      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.name.startsWith(`${Object.values(queryObj)[i]}`)) {
          await containerClient.deleteBlob(blob.name);
          console.log('deleting blobs...');
        }
      }
    }
  } else {
    const doc = await Patch.findByIdAndDelete(req.params.id);

    container = 'patchimages';
    var containerClient = blobServiceClient.getContainerClient(container);
    await containerClient.deleteBlob(`${req.params.id}-patch.jpeg`);

    container = 'patchaudio';
    containerClient = blobServiceClient.getContainerClient(container);
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.startsWith(req.params.id)) {
        await containerClient.deleteBlob(blob.name);
        console.log('deleting blobs...');
      }
    }
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updatePatch = catchAsync(async (req, res, next) => {
  if (req.files['image']) {
    req.body.image = req.files['image'][0]['blobName'];
  } else {
    delete req.body.image;
  }
  if (req.files['patch']) {
    req.body.patch = req.files['patch'][0]['blobName'];
  } else {
    delete req.body.patch;
  }

  if (parseInt(req.body.priceDiscount) >= parseInt(req.body.price)) {
    return next(new AppError('세일 가격은 원래 가격보다 낮아야 합니다.', 404));
  }

  const doc = await Patch.findByIdAndUpdate(req.params.id, req.body);

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

// Renderer for Patch-post page to create new Patch document
exports.patchPostPageRenderer = catchAsync(async (req, res, next) => {
  res.status(200).render('product/patch-post', {
    title: 'Create New Patch',
  });
});
// Renderer for Patch-edit page to edit Patch document
exports.PatchEditPageRenderer = catchAsync(async (req, res, next) => {
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

  const doc = await Patch.findById(req.params.id);

  if (!doc) {
    return next(new AppError('No patch found with that ID', 404));
  }

  res.status(200).render('product/patch-edit', {
    title: 'Edit a Patch',
    patch: doc,
    length: length,
    query: query,
    albums,
    producer,
  });
});

/*******************************
 *  Patch Handler for Client-side
 *******************************/

// exports.getAllPatchs = factory.getAll(Patch);
// exports.getPatch = factory.getOne(Patch, { path: 'reviews' });
// exports.createPatch = factory.createOne(Patch);
// exports.updatePatch = factory.updateOne(Patch);
// exports.deletePatch = factory.deleteOne(Patch);

// exports.getPatchstats = catchAsync(async (req, res) => {
//   const stats = await Patch.aggregate([
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
