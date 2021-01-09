const mongoose = require('mongoose');
const validator = require('validator');
const mongoosePaginate = require('mongoose-paginate');

const albumSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
    required: [true],
  },
  artist: {
    type: String,
    required: [true, '아티스트를 입력해주세요.'],
    trim: true,
  },
  title: {
    type: String,
    required: [true, '제목을 입력해주세요.'],
    trim: true,
  },
  image: {
    type: String,
  },
  songList: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// albumSchema.pre('save', function (next) {
//   this.slug = slugify(this.title, { lower: true });
//   next();
// });
// albumSchema.post('save', function (doc, next) {
//   setTimeout(function () {
//     console.log(doc._id);
//     // Kick off the second post hook
//     next();
//   }, 1000);
// });
albumSchema.plugin(mongoosePaginate);

const Albums = mongoose.model('Albums', albumSchema);

module.exports = Albums;
