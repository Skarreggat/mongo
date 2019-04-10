var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PrizeSchema = new Schema({
    name: {type: String, required: true, min: 3, max: 100}
});

// Virtual for this prize instance URL.
PrizeSchema
.virtual('url')
.get(function () {
  return '/catalog/prize/'+this._id;
});

// Export model.
module.exports = mongoose.model('Prize', PrizeSchema);
