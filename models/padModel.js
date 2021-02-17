const mongoose = require('mongoose');

const padSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
    required: [true],
  },
  producer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Users',
    required: [true, '프로듀서를 입력해주세요.'],
  },
  title: {
    type: String,
    required: [true, '패드명을 입력해주세요.'],
  },
  price: {
    type: Number,
    required: [true, '가격을 입력해주세요.'],
  },
  description: {
    type: String,
    trim: true,
  },
  pads: {
    type: [String],
    required: [true, '한 개 이상의 파일을 입력해주세요.'],
  },
  image: {
    type: String,
    required: [true, '이미지를 업로드 해주세요'],
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
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  youtubeLink: [
    {
      type: String,
      trim: true,
    },
  ],
  slug: String,
});

// Virtual populate
padSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'producer',
    select: '-__v',
  });
  next();
});
const Pads = mongoose.model('Pads', padSchema);

module.exports = Pads;
