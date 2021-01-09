const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const trackSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Types.ObjectId,
      required: [true],
    },
    album: {
      type: mongoose.Schema.ObjectId,
      ref: 'Albums',
      required: [true, '앨범을 선택해주세요.'],
    },
    songName: {
      type: String,
      required: [true, '제목을 선택해주세요.'],
    },
    label: {
      type: String,
      default: 'community',
    },
    ratingsQuantity: {
      type: Number,
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    producer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Users',
      required: [true, '프로듀서를 입력해주세요.'],
    },
    tracks: [
      {
        type: String,
      },
    ],

    price: {
      type: Number,
      required: [true, '가격을 입력해주세요'],
    },
    description: {
      type: String,
      trim: true,
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: '세일 가격은 원래 가격보다 낮아야 합니다.',
      },
    },

    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

trackSchema.index({ price: 1, ratingsAverage: -1 });
trackSchema.index({ slug: 1 }); // 1 ascending -1 descending order

trackSchema.virtual('trackSplitPrice').get(function () {
  return this.price / 4;
});

// Virtual populate
trackSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'products',
  localField: '_id',
});

trackSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'producer',
    select: '-__v',
  });
  next();
});

trackSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'album',
    select: '-__v',
  });
  next();
});

const Tracks = mongoose.model('Tracks', trackSchema);

module.exports = Tracks;
