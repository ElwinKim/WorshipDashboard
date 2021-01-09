const mongoose = require('mongoose');
const Tracks = require('./trackModel');
const Pads = require('./padModel');
const Patches = require('./patchModel');

const reviewSchema = new mongoose.Schema({
  products: {
    type: mongoose.Schema.ObjectId,
    refPath: 'track',
    required: [true, '리뷰는 반드시 상품을 포함해야합니다.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'Users',
    required: [true, '리뷰는 반드시 사용자를 입력해야합니다.'],
  },
  review: {
    type: String,
    required: [true, '리뷰를 입력해주세요.'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.index({ products: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (
  productsId,
  productModel
) {
  const stats = await this.aggregate([
    {
      $match: { products: productsId, productModel: productModel },
    },
    {
      $group: {
        _id: '$products',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    if (productModel === 'Tracks') {
      await Tracks.findByIdAndUpdate(productsId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    }
    if (productModel === 'Pad') {
      await Pads.findByIdAndUpdate(productsId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    }
    if (productModel === 'Patch') {
      await Patches.findByIdAndUpdate(productsId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    }
  } else {
    if (productModel === 'Tracks') {
      await Tracks.findByIdAndUpdate(productsId, {
        ratingsQuantity: 0,
        ratingsAverage: 0,
      });
    }
    if (productModel === 'Pad') {
      await Pads.findByIdAndUpdate(productsId, {
        ratingsQuantity: 0,
        ratingsAverage: 0,
      });
    }
    if (productModel === 'Patch') {
      await Patches.findByIdAndUpdate(productsId, {
        ratingsQuantity: 0,
        ratingsAverage: 0,
      });
    }
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.products, this.productModel);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOne/, async function () {
  //this.r = await this.findOne(); doesn't work here, query has already executed
  await this.r.constructor.calcAverageRatings(
    this.r.products,
    this.r.productModel
  );
});

const Review = mongoose.model('Reviews', reviewSchema);

module.exports = Review;
