const mongoose = require('mongoose');

const patchSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Types.ObjectId,
      required: [true],
    },
    title: {
      type: String,
      required: [true],
    },
    patches: {
      type: [String],
    },
    image: {
      type: String,
    },
    producer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Users',
      required: [true, '프로듀서를 입력해주세요.'],
    },
    category: {
      type: String,
      required: [true, 'You must choose one of patch List'],
    },
    singlePrice: {
      type: Number,
    },
    price: {
      type: Number,
      required: [true, 'A track must have a price'],
    },
    description: {
      type: String,
      trim: true,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: '세일 가격은 원래 가격보다 낮아야 합니다.',
      },
    },
    youtubeLink: {
      type: [String],
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
patchSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'producer',
    select: '-__v',
  });
  next();
});
const Patch = mongoose.model('Patch', patchSchema);

module.exports = Patch;
